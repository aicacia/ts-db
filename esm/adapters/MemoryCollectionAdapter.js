var _MemoryCollectionAdapter_instances, _MemoryCollectionAdapter_docs, _MemoryCollectionAdapter_status, _MemoryCollectionAdapter_subscribers, _MemoryCollectionAdapter_keyOf, _MemoryCollectionAdapter_notifySubscribers, _MemoryCollectionAdapter_setDocs;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "tslib";
export class MemoryCollectionAdapter {
    constructor(options = {}) {
        _MemoryCollectionAdapter_instances.add(this);
        _MemoryCollectionAdapter_docs.set(this, void 0);
        _MemoryCollectionAdapter_status.set(this, { state: "idle" });
        _MemoryCollectionAdapter_subscribers.set(this, new Set());
        _MemoryCollectionAdapter_keyOf.set(this, void 0);
        __classPrivateFieldSet(this, _MemoryCollectionAdapter_keyOf, options.keyOf, "f");
        __classPrivateFieldSet(this, _MemoryCollectionAdapter_docs, options.initialDocs ?? [], "f");
    }
    subscribe(onUpdate, onError, _query) {
        const subscriber = { onUpdate, onError };
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_subscribers, "f").add(subscriber);
        try {
            onUpdate(__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").slice());
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
        return () => {
            __classPrivateFieldGet(this, _MemoryCollectionAdapter_subscribers, "f").delete(subscriber);
        };
    }
    async create(doc) {
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").push(doc);
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_setDocs).call(this);
    }
    async update(id, changes) {
        const index = __classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").findIndex((doc) => __classPrivateFieldGet(this, _MemoryCollectionAdapter_keyOf, "f").call(this, doc) === id);
        if (index === -1) {
            throw new Error("Unable to update document without a current value");
        }
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f")[index] = { ...__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f")[index], ...changes };
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_setDocs).call(this);
    }
    async delete(id) {
        const index = __classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").findIndex((doc) => __classPrivateFieldGet(this, _MemoryCollectionAdapter_keyOf, "f").call(this, doc) === id);
        if (index === -1) {
            throw new Error("Unable to delete document without a current value");
        }
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").splice(index, 1);
        __classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_setDocs).call(this);
    }
    getStatus() {
        return { ...__classPrivateFieldGet(this, _MemoryCollectionAdapter_status, "f") };
    }
}
_MemoryCollectionAdapter_docs = new WeakMap(), _MemoryCollectionAdapter_status = new WeakMap(), _MemoryCollectionAdapter_subscribers = new WeakMap(), _MemoryCollectionAdapter_keyOf = new WeakMap(), _MemoryCollectionAdapter_instances = new WeakSet(), _MemoryCollectionAdapter_notifySubscribers = function _MemoryCollectionAdapter_notifySubscribers() {
    for (const { onUpdate, onError } of __classPrivateFieldGet(this, _MemoryCollectionAdapter_subscribers, "f")) {
        try {
            onUpdate(__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").slice());
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }
}, _MemoryCollectionAdapter_setDocs = function _MemoryCollectionAdapter_setDocs() {
    __classPrivateFieldSet(this, _MemoryCollectionAdapter_status, { state: "syncing" }, "f");
    __classPrivateFieldSet(this, _MemoryCollectionAdapter_status, { state: "idle", lastSyncAt: Date.now() }, "f");
    __classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_notifySubscribers).call(this);
};
//# sourceMappingURL=MemoryCollectionAdapter.js.map