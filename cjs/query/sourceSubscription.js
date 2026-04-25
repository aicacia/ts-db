"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourceSubscription = createSourceSubscription;
const subscriptions_js_1 = require("../utils/subscriptions.js");
const index_js_1 = require("../utils/index.js");
function createQueryKey(query) {
    if (query === undefined) {
        return "__default__";
    }
    try {
        return `query:${JSON.stringify(query)}`;
    }
    catch (_a) {
        return `query:${String(query)}`;
    }
}
function createSourceSubscription(source) {
    const entries = new Map();
    function notifyListeners(entry, docs) {
        (0, subscriptions_js_1.notifySubscribersSwallow)(entry.listeners, docs);
    }
    function notifyError(entry, error) {
        (0, subscriptions_js_1.notifySubscriberErrors)(entry.listeners, error);
    }
    function ensureSourceSubscription(query) {
        const key = createQueryKey(query);
        let entry = entries.get(key);
        if (entry) {
            return entry;
        }
        entry = {
            sourceUnsubscribe: () => {
                /* noop */
            },
            listeners: new Set(),
            currentDocs: [],
            hasSnapshot: false,
        };
        entry.sourceUnsubscribe = source.subscribe((docs) => {
            entry.currentDocs = [...docs];
            entry.hasSnapshot = true;
            notifyListeners(entry, entry.currentDocs);
        }, (error) => {
            notifyError(entry, error);
        }, query);
        entries.set(key, entry);
        return entry;
    }
    return {
        subscribe(onUpdate, onError, query) {
            const entry = ensureSourceSubscription(query);
            let receivedSnapshot = false;
            const wrappedListener = {
                onUpdate(docs) {
                    receivedSnapshot = true;
                    onUpdate(docs);
                },
                onError(error) {
                    onError(error);
                },
            };
            entry.listeners.add(wrappedListener);
            if (entry.hasSnapshot && !receivedSnapshot) {
                try {
                    wrappedListener.onUpdate([...entry.currentDocs]);
                }
                catch (err) {
                    wrappedListener.onError((0, index_js_1.toError)(err));
                }
            }
            return () => {
                entry.listeners.delete(wrappedListener);
                if (entry.listeners.size === 0) {
                    try {
                        entry.sourceUnsubscribe();
                    }
                    catch (_a) {
                        // ignore unsubscribe errors
                    }
                    entries.delete(createQueryKey(query));
                }
            };
        },
        getSnapshot(query) {
            const entry = entries.get(createQueryKey(query));
            return entry ? [...entry.currentDocs] : [];
        },
    };
}
//# sourceMappingURL=sourceSubscription.js.map