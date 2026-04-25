import type { AdapterStatus, SourceAdapter, UnsubscribeFn } from "../types/index.js";
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
    requestFactory?: (op: HttpOperation, config: HttpSourceAdapterConfig, payload?: unknown, id?: string, query?: unknown) => RequestInit;
}
type ResolvedHttpSourceAdapterLiveConfig = Required<Pick<HttpSourceAdapterLiveConfig, "method" | "pollInterval" | "retryDelay" | "maxRetries">> & Pick<HttpSourceAdapterLiveConfig, "ssePath" | "websocketUrl">;
export interface ResolvedHttpSourceAdapterConfig extends Omit<HttpSourceAdapterConfig, "requestInit" | "headers" | "queryParams" | "live"> {
    keyField: string;
    itemPath: string;
    usePutForUpdate: boolean;
    requestInit: RequestInit;
    headers: Record<string, string>;
    queryParams: Record<string, string | number | boolean>;
    live: ResolvedHttpSourceAdapterLiveConfig;
}
/** HTTP-backed source adapter for collection persistence and live updates. */
export declare class HttpSourceAdapter<T extends Record<string, unknown>> implements SourceAdapter<T> {
    private _config;
    private _subscriptions;
    private _status;
    private _cachedDocs;
    private _pollTimer;
    private _eventSource;
    private _webSocket;
    private _isFetching;
    private _pollRetries;
    constructor(config: HttpSourceAdapterConfig);
    subscribe(onUpdate: (docs: T[]) => void, onError: (error: Error) => void, query?: unknown): UnsubscribeFn;
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    getStatus(): AdapterStatus;
    private _startLiveTransport;
    private _stopLiveTransport;
    private _startPolling;
    private _schedulePoll;
    private _startSSE;
    private _startWebSocket;
    private _fetchAndNotify;
    private _fetchList;
    private _sendRequest;
    private _buildRequestInit;
    private _sendFetch;
    private _resolveUrl;
    private _notifySubscribers;
    private _notifyError;
    private _updateStatus;
}
export {};
//# sourceMappingURL=httpAdapter.d.ts.map