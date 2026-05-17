"use strict";
var _MemorySingletonAdapter_instances, _MemorySingletonAdapter_value, _MemorySingletonAdapter_status, _MemorySingletonAdapter_subscribers, _MemorySingletonAdapter_notifySubscribers, _MemorySingletonAdapter_setValue;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySingletonAdapter = void 0;
const tslib_1 = require("tslib");
class MemorySingletonAdapter {
    constructor(options = {}) {
        _MemorySingletonAdapter_instances.add(this);
        _MemorySingletonAdapter_value.set(this, void 0);
        _MemorySingletonAdapter_status.set(this, { state: "idle" });
        _MemorySingletonAdapter_subscribers.set(this, new Set());
        tslib_1.__classPrivateFieldSet(this, _MemorySingletonAdapter_value, options.initialValue, "f");
    }
    subscribe(onUpdate, onError) {
        const subscriber = { onUpdate, onError };
        tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_subscribers, "f").add(subscriber);
        try {
            onUpdate(tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f"));
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
        return () => {
            tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_subscribers, "f").delete(subscriber);
        };
    }
    set(doc) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_instances, "m", _MemorySingletonAdapter_setValue).call(this, doc);
        });
    }
    update(changes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f") === undefined) {
                throw new Error("Unable to update singleton without a current value");
            }
            tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_instances, "m", _MemorySingletonAdapter_setValue).call(this, Object.assign(Object.assign({}, tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f")), changes));
        });
    }
    getStatus() {
        return Object.assign({}, tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_status, "f"));
    }
}
exports.MemorySingletonAdapter = MemorySingletonAdapter;
_MemorySingletonAdapter_value = new WeakMap(), _MemorySingletonAdapter_status = new WeakMap(), _MemorySingletonAdapter_subscribers = new WeakMap(), _MemorySingletonAdapter_instances = new WeakSet(), _MemorySingletonAdapter_notifySubscribers = function _MemorySingletonAdapter_notifySubscribers() {
    for (const { onUpdate, onError } of tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_subscribers, "f")) {
        try {
            onUpdate(tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_value, "f"));
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }
}, _MemorySingletonAdapter_setValue = function _MemorySingletonAdapter_setValue(value) {
    tslib_1.__classPrivateFieldSet(this, _MemorySingletonAdapter_status, { state: "syncing" }, "f");
    tslib_1.__classPrivateFieldSet(this, _MemorySingletonAdapter_value, value, "f");
    tslib_1.__classPrivateFieldSet(this, _MemorySingletonAdapter_status, { state: "idle", lastSyncAt: Date.now() }, "f");
    tslib_1.__classPrivateFieldGet(this, _MemorySingletonAdapter_instances, "m", _MemorySingletonAdapter_notifySubscribers).call(this);
};
//# sourceMappingURL=MemorySingletonAdapter.js.map