var _MemorySingletonAdapter_instances, _MemorySingletonAdapter_value, _MemorySingletonAdapter_status, _MemorySingletonAdapter_subscribers, _MemorySingletonAdapter_notifySubscribers, _MemorySingletonAdapter_setValue;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "tslib";
export class MemorySingletonAdapter {
    constructor(options = {}) {
        _MemorySingletonAdapter_instances.add(this);
        _MemorySingletonAdapter_value.set(this, void 0);
        _MemorySingletonAdapter_status.set(this, { state: "idle" });
        _MemorySingletonAdapter_subscribers.set(this, new Set());
        __classPrivateFieldSet(this, _MemorySingletonAdapter_value, options.initialValue, "f");
    }
    subscribe(onUpdate, onError) {
        const subscriber = { onUpdate, onError };
        __classPrivateFieldGet(this, _MemorySingletonAdapter_subscribers, "f").add(subscriber);
        try {
            onUpdate(__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f"));
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
        return () => {
            __classPrivateFieldGet(this, _MemorySingletonAdapter_subscribers, "f").delete(subscriber);
        };
    }
    async set(doc) {
        __classPrivateFieldGet(this, _MemorySingletonAdapter_instances, "m", _MemorySingletonAdapter_setValue).call(this, doc);
    }
    async update(changes) {
        if (__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f") === undefined) {
            throw new Error("Unable to update singleton without a current value");
        }
        __classPrivateFieldGet(this, _MemorySingletonAdapter_instances, "m", _MemorySingletonAdapter_setValue).call(this, { ...__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f"), ...changes });
    }
    getStatus() {
        return { ...__classPrivateFieldGet(this, _MemorySingletonAdapter_status, "f") };
    }
}
_MemorySingletonAdapter_value = new WeakMap(), _MemorySingletonAdapter_status = new WeakMap(), _MemorySingletonAdapter_subscribers = new WeakMap(), _MemorySingletonAdapter_instances = new WeakSet(), _MemorySingletonAdapter_notifySubscribers = function _MemorySingletonAdapter_notifySubscribers() {
    for (const { onUpdate, onError } of __classPrivateFieldGet(this, _MemorySingletonAdapter_subscribers, "f")) {
        try {
            onUpdate(__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f"));
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }
}, _MemorySingletonAdapter_setValue = function _MemorySingletonAdapter_setValue(value) {
    __classPrivateFieldSet(this, _MemorySingletonAdapter_status, { state: "syncing" }, "f");
    __classPrivateFieldSet(this, _MemorySingletonAdapter_value, value, "f");
    __classPrivateFieldSet(this, _MemorySingletonAdapter_status, { state: "idle", lastSyncAt: Date.now() }, "f");
    __classPrivateFieldGet(this, _MemorySingletonAdapter_instances, "m", _MemorySingletonAdapter_notifySubscribers).call(this);
};
//# sourceMappingURL=MemorySingletonAdapter.js.map