import type { AdapterStatus, SourceAdapter, UnsubscribeFn } from "./types.js";
import { safeInvoke, toError } from "./utils.js";

export type LiveTransportMethod = "polling" | "sse" | "websocket" | "none";

export type HttpOperation = "list" | "create" | "update" | "delete";

export interface HttpSourceAdapterLiveConfig {
	method: LiveTransportMethod;
	pollInterval?: number;
	retryDelay?: number;
	maxRetries?: number;
	ssePath?: string;
	websocketUrl?: string;
}

export interface HttpSourceAdapterConfig {
	baseUrl: string;
	collectionPath: string;
	keyField?: string;
	itemPath?: string;
	usePutForUpdate?: boolean;
	requestInit?: RequestInit;
	headers?: Record<string, string>;
	queryParams?: Record<string, string | number | boolean>;
	live?: HttpSourceAdapterLiveConfig;
	fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
	eventSourceConstructor?: typeof EventSource;
	webSocketConstructor?: typeof WebSocket;
	requestFactory?: (
		op: HttpOperation,
		config: HttpSourceAdapterConfig,
		payload?: unknown,
		id?: string,
		query?: unknown,
	) => RequestInit;
}

const defaultLiveConfig: Required<
	Pick<
		HttpSourceAdapterLiveConfig,
		"method" | "pollInterval" | "retryDelay" | "maxRetries"
	>
> = {
	method: "polling",
	pollInterval: 5000,
	retryDelay: 2000,
	maxRetries: 3,
};

type ResolvedHttpSourceAdapterLiveConfig = Required<
	Pick<
		HttpSourceAdapterLiveConfig,
		"method" | "pollInterval" | "retryDelay" | "maxRetries"
	>
> &
	Pick<HttpSourceAdapterLiveConfig, "ssePath" | "websocketUrl">;

export interface ResolvedHttpSourceAdapterConfig
	extends Omit<
		HttpSourceAdapterConfig,
		"requestInit" | "headers" | "queryParams" | "live"
	> {
	keyField: string;
	itemPath: string;
	usePutForUpdate: boolean;
	requestInit: RequestInit;
	headers: Record<string, string>;
	queryParams: Record<string, string | number | boolean>;
	live: ResolvedHttpSourceAdapterLiveConfig;
}

const defaultConfig: Omit<
	ResolvedHttpSourceAdapterConfig,
	"baseUrl" | "collectionPath"
> = {
	keyField: "id",
	itemPath: "{collection}/{id}",
	usePutForUpdate: false,
	requestInit: { method: "GET", headers: {} },
	headers: {},
	queryParams: {},
	live: defaultLiveConfig,
};

interface SubscriptionEntry<T> {
	onUpdate: (docs: T[]) => void;
	onError: (error: Error) => void;
}

/** HTTP-backed source adapter for collection persistence and live updates. */
export class HttpSourceAdapter<T extends Record<string, unknown>>
	implements SourceAdapter<T>
{
	private _config: ResolvedHttpSourceAdapterConfig;
	private _subscriptions: SubscriptionEntry<T>[] = [];
	private _status: AdapterStatus = { state: "idle" };
	private _cachedDocs: T[] = [];
	private _pollTimer: ReturnType<typeof setTimeout> | null = null;
	private _eventSource: EventSource | null = null;
	private _webSocket: WebSocket | null = null;
	private _isFetching = false;
	private _pollRetries = 0;

	constructor(config: HttpSourceAdapterConfig) {
		this._config = {
			...defaultConfig,
			...config,
			requestInit: {
				...defaultConfig.requestInit,
				...(config.requestInit ?? {}),
			},
			headers: {
				...defaultConfig.headers,
				...(config.headers ?? {}),
			},
			queryParams: {
				...defaultConfig.queryParams,
				...(config.queryParams ?? {}),
			},
			live: {
				...defaultLiveConfig,
				...(config.live ?? {}),
			},
		};
	}

	subscribe(
		onUpdate: (docs: T[]) => void,
		onError: (error: Error) => void,
		query?: unknown,
	): UnsubscribeFn {
		const entry: SubscriptionEntry<T> = { onUpdate, onError };
		this._subscriptions.push(entry);

		if (this._subscriptions.length === 1) {
			this._startLiveTransport(query);
		}

		const error = safeInvoke(onUpdate, this._cachedDocs, onError);
		if (error) {
			throw error;
		}

		return () => {
			const index = this._subscriptions.indexOf(entry);
			if (index >= 0) {
				this._subscriptions.splice(index, 1);
			}
			if (this._subscriptions.length === 0) {
				this._stopLiveTransport();
			}
		};
	}

	async create(doc: T): Promise<void> {
		await this._sendRequest("create", doc);
		await this._fetchAndNotify();
	}

	async update(id: string, changes: Partial<T>): Promise<void> {
		await this._sendRequest("update", changes, id);
		await this._fetchAndNotify();
	}

	async delete(id: string): Promise<void> {
		await this._sendRequest("delete", undefined, id);
		await this._fetchAndNotify();
	}

	getStatus(): AdapterStatus {
		return this._status;
	}

	private _startLiveTransport(query?: unknown): void {
		this._fetchAndNotify(query).catch((error) => this._notifyError(error));

		const method = this._config.live.method;
		switch (method) {
			case "polling":
				this._startPolling(query);
				break;
			case "sse":
				this._startSSE();
				break;
			case "websocket":
				this._startWebSocket();
				break;
			case "none":
				break;
			default:
				break;
		}
	}

	private _stopLiveTransport(): void {
		if (this._pollTimer !== null) {
			clearTimeout(this._pollTimer);
			this._pollTimer = null;
		}

		if (this._eventSource) {
			this._eventSource.close();
			this._eventSource = null;
		}

		if (this._webSocket) {
			this._webSocket.close();
			this._webSocket = null;
		}
	}

	private _startPolling(query?: unknown): void {
		this._schedulePoll(0, query);
	}

	private _schedulePoll(delay: number, query?: unknown): void {
		if (this._pollTimer !== null) {
			clearTimeout(this._pollTimer);
		}

		this._pollTimer = setTimeout(async () => {
			try {
				await this._fetchAndNotify(query);
				this._pollRetries = 0;
				this._schedulePoll(this._config.live.pollInterval, query);
			} catch (error) {
				this._pollRetries += 1;
				this._notifyError(error);
				if (this._pollRetries < this._config.live.maxRetries) {
					this._schedulePoll(this._config.live.retryDelay, query);
				}
			}
		}, delay);
	}

	private _startSSE(): void {
		const EventSourceConstructor =
			this._config.eventSourceConstructor ??
			(typeof EventSource !== "undefined" ? EventSource : undefined);
		if (!EventSourceConstructor) {
			this._notifyError(
				new Error("EventSource is not available in this environment"),
			);
			return;
		}

		const url = this._resolveUrl("list", undefined, true);
		this._eventSource = new EventSourceConstructor(url);

		this._eventSource.onmessage = (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data) as T[];
				this._cachedDocs = data;
				this._notifySubscribers(data);
				this._updateStatus("idle");
			} catch (error) {
				this._notifyError(error);
			}
		};

		this._eventSource.onerror = () => {
			this._notifyError(new Error("SSE connection error"));
		};
	}

	private _startWebSocket(): void {
		const WebSocketConstructor =
			this._config.webSocketConstructor ??
			(typeof WebSocket !== "undefined" ? WebSocket : undefined);
		if (!WebSocketConstructor) {
			this._notifyError(
				new Error("WebSocket is not available in this environment"),
			);
			return;
		}

		const url = this._config.live.websocketUrl;
		if (!url) {
			this._notifyError(
				new Error("websocketUrl is required for websocket live transport"),
			);
			return;
		}

		this._webSocket = new WebSocketConstructor(url);

		this._webSocket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data) as T[];
				this._cachedDocs = data;
				this._notifySubscribers(data);
				this._updateStatus("idle");
			} catch (error) {
				this._notifyError(error);
			}
		};

		this._webSocket.onerror = () => {
			this._notifyError(new Error("WebSocket connection error"));
		};
	}

	private async _fetchAndNotify(query?: unknown): Promise<void> {
		if (this._isFetching) {
			return;
		}

		this._isFetching = true;
		this._updateStatus("syncing");

		try {
			const docs = await this._fetchList(query);
			this._cachedDocs = docs;
			this._notifySubscribers(docs);
			this._updateStatus("idle");
			this._status.lastSyncAt = Date.now();
		} catch (error) {
			this._updateStatus("error", toError(error));
			throw error;
		} finally {
			this._isFetching = false;
		}
	}

	private async _fetchList(query?: unknown): Promise<T[]> {
		const url = this._resolveUrl("list");
		const init = this._buildRequestInit("list", undefined, undefined, query);
		const response = await this._sendFetch(url, init);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch documents: ${response.status} ${response.statusText}`,
			);
		}
		return await response.json();
	}

	private async _sendRequest(
		op: HttpOperation,
		payload?: unknown,
		id?: string,
	): Promise<void> {
		const url = this._resolveUrl(op, id);
		const init = this._buildRequestInit(op, payload, id);
		const response = await this._sendFetch(url, init);
		if (!response.ok) {
			throw new Error(
				`HTTP ${op} request failed: ${response.status} ${response.statusText}`,
			);
		}
	}

	private _buildRequestInit(
		op: HttpOperation,
		payload?: unknown,
		id?: string,
		query?: unknown,
	): RequestInit {
		if (this._config.requestFactory) {
			return this._config.requestFactory(op, this._config, payload, id, query);
		}

		const headers = {
			...this._config.headers,
			...((this._config.requestInit.headers as Record<string, string>) ?? {}),
		};

		const init: RequestInit = {
			...this._config.requestInit,
			headers,
		};

		switch (op) {
			case "list":
				return init;
			case "create":
				return { ...init, method: "POST", body: JSON.stringify(payload) };
			case "update":
				return {
					...init,
					method: this._config.usePutForUpdate ? "PUT" : "PATCH",
					body: JSON.stringify(payload),
				};
			case "delete":
				return { ...init, method: "DELETE" };
		}
	}

	private async _sendFetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		if (this._config.fetcher) {
			return await this._config.fetcher(input, init);
		}
		return await fetch(input, init);
	}

	private _resolveUrl(
		op: HttpOperation,
		id?: string,
		isLive?: boolean,
	): string {
		const base = this._config.baseUrl.replace(/\/+$/, "");
		const collection = this._config.collectionPath.replace(/^\/+|\/+$/g, "");
		const itemPath = this._config.itemPath
			.replace("{collection}", collection)
			.replace("{id}", id ?? "");

		let path = collection;
		if (op === "create" || op === "list") {
			path = collection;
		} else if (id) {
			path = itemPath;
		}

		const url = `${base}/${path}`;
		if (op === "list" && Object.keys(this._config.queryParams).length > 0) {
			const query = new URLSearchParams();
			for (const [key, value] of Object.entries(this._config.queryParams)) {
				query.append(key, String(value));
			}
			return `${url}?${query.toString()}`;
		}

		if (
			isLive &&
			this._config.live.method === "sse" &&
			this._config.live.ssePath
		) {
			return `${base}/${this._config.live.ssePath.replace(/^\/+/, "")}`;
		}

		return url;
	}

	private _notifySubscribers(docs: T[]): void {
		for (const entry of this._subscriptions) {
			const error = safeInvoke(entry.onUpdate, docs, entry.onError);
			if (error) {
				throw error;
			}
		}
	}

	private _notifyError(error: unknown): void {
		const normalized = toError(error);
		this._updateStatus("error", normalized);
		for (const entry of this._subscriptions) {
			safeInvoke(entry.onError, normalized, undefined, true);
		}
	}

	private _updateStatus(state: AdapterStatus["state"], error?: Error): void {
		this._status = {
			state,
			lastSyncAt:
				state === "idle" || state === "syncing"
					? Date.now()
					: this._status.lastSyncAt,
			error,
		};
	}
}
