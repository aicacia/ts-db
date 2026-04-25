"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpSourceAdapter = void 0;
const tslib_1 = require("tslib");
const subscriptions_js_1 = require("../utils/subscriptions.js");
const index_js_1 = require("../utils/index.js");
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
class HttpSourceAdapter {
    constructor(config) {
        var _a, _b, _c, _d;
        this._subscriptions = [];
        this._status = { state: "idle" };
        this._cachedDocs = [];
        this._pollTimer = null;
        this._eventSource = null;
        this._webSocket = null;
        this._isFetching = false;
        this._pollRetries = 0;
        this._config = Object.assign(Object.assign(Object.assign({}, defaultConfig), config), { requestInit: Object.assign(Object.assign({}, defaultConfig.requestInit), ((_a = config.requestInit) !== null && _a !== void 0 ? _a : {})), headers: Object.assign(Object.assign({}, defaultConfig.headers), ((_b = config.headers) !== null && _b !== void 0 ? _b : {})), queryParams: Object.assign(Object.assign({}, defaultConfig.queryParams), ((_c = config.queryParams) !== null && _c !== void 0 ? _c : {})), live: Object.assign(Object.assign({}, defaultLiveConfig), ((_d = config.live) !== null && _d !== void 0 ? _d : {})) });
    }
    subscribe(onUpdate, onError, query) {
        const entry = { onUpdate, onError };
        this._subscriptions.push(entry);
        if (this._subscriptions.length === 1) {
            this._startLiveTransport(query);
        }
        const error = (0, subscriptions_js_1.notifySubscribers)([entry], this._cachedDocs);
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
    create(doc) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._sendRequest("create", doc);
            yield this._fetchAndNotify();
        });
    }
    update(id, changes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._sendRequest("update", changes, id);
            yield this._fetchAndNotify();
        });
    }
    delete(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._sendRequest("delete", undefined, id);
            yield this._fetchAndNotify();
        });
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
        this._pollTimer = setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this._fetchAndNotify(query);
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
        }), delay);
    }
    _startSSE() {
        var _a;
        const EventSourceConstructor = (_a = this._config.eventSourceConstructor) !== null && _a !== void 0 ? _a : (typeof EventSource !== "undefined" ? EventSource : undefined);
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
        var _a;
        const WebSocketConstructor = (_a = this._config.webSocketConstructor) !== null && _a !== void 0 ? _a : (typeof WebSocket !== "undefined" ? WebSocket : undefined);
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
    _fetchAndNotify(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._isFetching) {
                return;
            }
            this._isFetching = true;
            this._updateStatus("syncing");
            try {
                const docs = yield this._fetchList(query);
                this._cachedDocs = docs;
                this._notifySubscribers(docs);
                this._updateStatus("idle");
                this._status.lastSyncAt = Date.now();
            }
            catch (error) {
                this._updateStatus("error", (0, index_js_1.toError)(error));
                throw error;
            }
            finally {
                this._isFetching = false;
            }
        });
    }
    _fetchList(query) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const url = this._resolveUrl("list");
            const init = this._buildRequestInit("list", undefined, undefined, query);
            const response = yield this._sendFetch(url, init);
            if (!response.ok) {
                throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
            }
            return yield response.json();
        });
    }
    _sendRequest(op, payload, id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const url = this._resolveUrl(op, id);
            const init = this._buildRequestInit(op, payload, id);
            const response = yield this._sendFetch(url, init);
            if (!response.ok) {
                throw new Error(`HTTP ${op} request failed: ${response.status} ${response.statusText}`);
            }
        });
    }
    _buildRequestInit(op, payload, id, query) {
        var _a;
        if (this._config.requestFactory) {
            return this._config.requestFactory(op, this._config, payload, id, query);
        }
        const headers = Object.assign(Object.assign({}, this._config.headers), ((_a = this._config.requestInit.headers) !== null && _a !== void 0 ? _a : {}));
        const init = Object.assign(Object.assign({}, this._config.requestInit), { headers });
        switch (op) {
            case "list":
                return init;
            case "create":
                return Object.assign(Object.assign({}, init), { method: "POST", body: JSON.stringify(payload) });
            case "update":
                return Object.assign(Object.assign({}, init), { method: this._config.usePutForUpdate ? "PUT" : "PATCH", body: JSON.stringify(payload) });
            case "delete":
                return Object.assign(Object.assign({}, init), { method: "DELETE" });
        }
    }
    _sendFetch(input, init) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._config.fetcher) {
                return yield this._config.fetcher(input, init);
            }
            return yield fetch(input, init);
        });
    }
    _resolveUrl(op, id, isLive) {
        const base = this._config.baseUrl.replace(/\/+$/, "");
        const collection = this._config.collectionPath.replace(/^\/+|\/+$/g, "");
        const itemPath = this._config.itemPath
            .replace("{collection}", collection)
            .replace("{id}", id !== null && id !== void 0 ? id : "");
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
        const error = (0, subscriptions_js_1.notifySubscribers)(this._subscriptions, docs);
        if (error) {
            throw error;
        }
    }
    _notifyError(error) {
        const normalized = (0, index_js_1.toError)(error);
        this._updateStatus("error", normalized);
        (0, subscriptions_js_1.notifySubscriberErrors)(this._subscriptions, normalized);
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
exports.HttpSourceAdapter = HttpSourceAdapter;
//# sourceMappingURL=httpAdapter.js.map