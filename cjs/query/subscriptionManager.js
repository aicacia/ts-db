"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionManager = void 0;
exports.createSubscriptionManager = createSubscriptionManager;
const index_js_1 = require("../utils/index.js");
class SubscriptionManager {
    constructor() {
        this._entries = new Map();
    }
    _copySubscribers(entry) {
        return Array.from(entry.subscribers.values());
    }
    _dispatchSubscriberError(subscribers, error) {
        let handlerFailure;
        let missingErrorHandler = false;
        for (const subscriber of subscribers) {
            if (subscriber.onError) {
                try {
                    subscriber.onError(error);
                }
                catch (hErr) {
                    handlerFailure = hErr;
                }
            }
            else {
                missingErrorHandler = true;
            }
        }
        if (missingErrorHandler) {
            throw error;
        }
        if (handlerFailure !== undefined && subscribers.length === 1) {
            throw (0, index_js_1.toError)(handlerFailure);
        }
    }
    subscribe(opts) {
        const id = opts.id;
        let entry = this._entries.get(id);
        if (!entry) {
            entry = {
                adapter: undefined,
                adapterUnsubscribe: undefined,
                subscribers: new Set(),
                lastResults: null,
            };
            this._entries.set(id, entry);
        }
        const subscriber = {
            onUpdate: opts.onUpdate,
            onError: opts.onError,
        };
        // Add subscriber before adapter.subscribe so synchronous adapter pushes
        // will reach this subscriber immediately.
        entry.subscribers.add(subscriber);
        const hadAdapterBefore = Boolean(entry.adapter);
        if (!entry.adapter) {
            const adapter = opts.adapterFactory();
            entry.adapter = adapter;
            const internalUpdate = (rows) => {
                entry.lastResults = rows;
                const subs = this._copySubscribers(entry);
                let firstUpdateError;
                for (const s of subs) {
                    try {
                        s.onUpdate(rows);
                    }
                    catch (uErr) {
                        if (!firstUpdateError) {
                            firstUpdateError = (0, index_js_1.toError)(uErr);
                        }
                    }
                }
                if (firstUpdateError) {
                    this._dispatchSubscriberError(subs, firstUpdateError);
                }
            };
            const internalError = (err) => {
                const subs = this._copySubscribers(entry);
                this._dispatchSubscriberError(subs, (0, index_js_1.toError)(err));
            };
            // Start adapter subscription
            entry.adapterUnsubscribe = adapter.subscribe(internalUpdate, internalError);
        }
        const justCreatedAdapter = !hadAdapterBefore && Boolean(entry.adapter);
        // If we already have cached results (from a previous adapter subscription), send them immediately
        if (entry.lastResults !== null && !justCreatedAdapter) {
            try {
                opts.onUpdate(entry.lastResults);
            }
            catch (err) {
                const normalized = (0, index_js_1.toError)(err);
                if (opts.onError) {
                    try {
                        opts.onError(normalized);
                    }
                    catch (e) {
                        // If only one subscriber, mimic previous behaviour and throw
                        if (entry.subscribers.size === 1) {
                            throw (0, index_js_1.toError)(e);
                        }
                    }
                }
                else {
                    // No error handler provided -> throw
                    throw normalized;
                }
            }
        }
        // Return unsubscribe
        return () => {
            const current = this._entries.get(id);
            if (!current) {
                return;
            }
            current.subscribers.delete(subscriber);
            if (current.subscribers.size === 0) {
                // teardown adapter subscription
                if (current.adapterUnsubscribe) {
                    try {
                        current.adapterUnsubscribe();
                    }
                    catch (e) {
                        // ignore adapter unsubscribe errors
                    }
                }
                this._entries.delete(id);
            }
        };
    }
    getSnapshot(id) {
        const entry = this._entries.get(id);
        if (!entry) {
            return null;
        }
        if (entry.lastResults !== null) {
            return entry.lastResults;
        }
        if (!entry.adapter) {
            return null;
        }
        const snapshotProvider = entry.adapter.getSnapshot;
        if (!snapshotProvider) {
            return null;
        }
        try {
            return snapshotProvider.call(entry.adapter);
        }
        catch (_a) {
            return null;
        }
    }
}
exports.SubscriptionManager = SubscriptionManager;
function createSubscriptionManager() {
    return new SubscriptionManager();
}
//# sourceMappingURL=subscriptionManager.js.map