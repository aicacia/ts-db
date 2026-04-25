import { notifySubscribers, notifySubscriberErrors, } from "../utils/subscriptions.js";
import { toError } from "../utils/index.js";
const defaultLiveConfig = {
    method: "polling",
    pollInterval: 5000,
    retryDelay: 2000,
    maxRetries: 3,
};
const defaultConfig = {
    keyField: "id",
    itemPath: "{collection}/{id}",
    usePutForUpdate: false,
    requestInit: { method: "GET", headers: {} },
    headers: {},
    queryParams: {},
    live: defaultLiveConfig,
};
/** HTTP-backed source adapter for collection persistence and live updates. */
export class HttpSourceAdapter {
    constructor(config) {
        this._subscriptions = [];
        this._status = { state: "idle" };
        this._cachedDocs = [];
        this._pollTimer = null;
        this._eventSource = null;
        this._webSocket = null;
        this._isFetching = false;
        this._pollRetries = 0;
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
    subscribe(onUpdate, onError, query) {
        const entry = { onUpdate, onError };
        this._subscriptions.push(entry);
        if (this._subscriptions.length === 1) {
            this._startLiveTransport(query);
        }
        const error = notifySubscribers([entry], this._cachedDocs);
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
    async create(doc) {
        await this._sendRequest("create", doc);
        await this._fetchAndNotify();
    }
    async update(id, changes) {
        await this._sendRequest("update", changes, id);
        await this._fetchAndNotify();
    }
    async delete(id) {
        await this._sendRequest("delete", undefined, id);
        await this._fetchAndNotify();
    }
    getStatus() {
        return this._status;
    }
    _startLiveTransport(query) {
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
    _stopLiveTransport() {
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
    _startPolling(query) {
        this._schedulePoll(0, query);
    }
    _schedulePoll(delay, query) {
        if (this._pollTimer !== null) {
            clearTimeout(this._pollTimer);
        }
        this._pollTimer = setTimeout(async () => {
            try {
                await this._fetchAndNotify(query);
                this._pollRetries = 0;
                this._schedulePoll(this._config.live.pollInterval, query);
            }
            catch (error) {
                this._pollRetries += 1;
                this._notifyError(error);
                if (this._pollRetries < this._config.live.maxRetries) {
                    this._schedulePoll(this._config.live.retryDelay, query);
                }
            }
        }, delay);
    }
    _startSSE() {
        const EventSourceConstructor = this._config.eventSourceConstructor ??
            (typeof EventSource !== "undefined" ? EventSource : undefined);
        if (!EventSourceConstructor) {
            this._notifyError(new Error("EventSource is not available in this environment"));
            return;
        }
        const url = this._resolveUrl("list", undefined, true);
        this._eventSource = new EventSourceConstructor(url);
        this._eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this._cachedDocs = data;
                this._notifySubscribers(data);
                this._updateStatus("idle");
            }
            catch (error) {
                this._notifyError(error);
            }
        };
        this._eventSource.onerror = () => {
            this._notifyError(new Error("SSE connection error"));
        };
    }
    _startWebSocket() {
        const WebSocketConstructor = this._config.webSocketConstructor ??
            (typeof WebSocket !== "undefined" ? WebSocket : undefined);
        if (!WebSocketConstructor) {
            this._notifyError(new Error("WebSocket is not available in this environment"));
            return;
        }
        const url = this._config.live.websocketUrl;
        if (!url) {
            this._notifyError(new Error("websocketUrl is required for websocket live transport"));
            return;
        }
        this._webSocket = new WebSocketConstructor(url);
        this._webSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this._cachedDocs = data;
                this._notifySubscribers(data);
                this._updateStatus("idle");
            }
            catch (error) {
                this._notifyError(error);
            }
        };
        this._webSocket.onerror = () => {
            this._notifyError(new Error("WebSocket connection error"));
        };
    }
    async _fetchAndNotify(query) {
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
        }
        catch (error) {
            this._updateStatus("error", toError(error));
            throw error;
        }
        finally {
            this._isFetching = false;
        }
    }
    async _fetchList(query) {
        const url = this._resolveUrl("list");
        const init = this._buildRequestInit("list", undefined, undefined, query);
        const response = await this._sendFetch(url, init);
        if (!response.ok) {
            throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    async _sendRequest(op, payload, id) {
        const url = this._resolveUrl(op, id);
        const init = this._buildRequestInit(op, payload, id);
        const response = await this._sendFetch(url, init);
        if (!response.ok) {
            throw new Error(`HTTP ${op} request failed: ${response.status} ${response.statusText}`);
        }
    }
    _buildRequestInit(op, payload, id, query) {
        if (this._config.requestFactory) {
            return this._config.requestFactory(op, this._config, payload, id, query);
        }
        const headers = {
            ...this._config.headers,
            ...(this._config.requestInit.headers ?? {}),
        };
        const init = {
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
    async _sendFetch(input, init) {
        if (this._config.fetcher) {
            return await this._config.fetcher(input, init);
        }
        return await fetch(input, init);
    }
    _resolveUrl(op, id, isLive) {
        const base = this._config.baseUrl.replace(/\/+$/, "");
        const collection = this._config.collectionPath.replace(/^\/+|\/+$/g, "");
        const itemPath = this._config.itemPath
            .replace("{collection}", collection)
            .replace("{id}", id ?? "");
        let path = collection;
        if (op === "create" || op === "list") {
            path = collection;
        }
        else if (id) {
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
        if (isLive &&
            this._config.live.method === "sse" &&
            this._config.live.ssePath) {
            return `${base}/${this._config.live.ssePath.replace(/^\/+/, "")}`;
        }
        return url;
    }
    _notifySubscribers(docs) {
        const error = notifySubscribers(this._subscriptions, docs);
        if (error) {
            throw error;
        }
    }
    _notifyError(error) {
        const normalized = toError(error);
        this._updateStatus("error", normalized);
        notifySubscriberErrors(this._subscriptions, normalized);
    }
    _updateStatus(state, error) {
        this._status = {
            state,
            lastSyncAt: state === "idle" || state === "syncing"
                ? Date.now()
                : this._status.lastSyncAt,
            error,
        };
    }
}
//# sourceMappingURL=httpAdapter.js.map