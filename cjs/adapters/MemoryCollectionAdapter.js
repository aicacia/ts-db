"use strict";
var _MemoryCollectionAdapter_instances, _MemoryCollectionAdapter_docs, _MemoryCollectionAdapter_status, _MemoryCollectionAdapter_subscribers, _MemoryCollectionAdapter_keyOf, _MemoryCollectionAdapter_notifySubscribers, _MemoryCollectionAdapter_setDocs;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCollectionAdapter = void 0;
const tslib_1 = require("tslib");
class MemoryCollectionAdapter {
    constructor(options = {}) {
        var _a;
        _MemoryCollectionAdapter_instances.add(this);
        _MemoryCollectionAdapter_docs.set(this, void 0);
        _MemoryCollectionAdapter_status.set(this, { state: "idle" });
        _MemoryCollectionAdapter_subscribers.set(this, new Set());
        _MemoryCollectionAdapter_keyOf.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _MemoryCollectionAdapter_keyOf, options.keyOf, "f");
        tslib_1.__classPrivateFieldSet(this, _MemoryCollectionAdapter_docs, (_a = options.initialDocs) !== null && _a !== void 0 ? _a : [], "f");
    }
    subscribe(onUpdate, onError, _query) {
        const subscriber = { onUpdate, onError };
        tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_subscribers, "f").add(subscriber);
        try {
            onUpdate(tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").slice());
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
        return () => {
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_subscribers, "f").delete(subscriber);
        };
    }
    create(doc) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").push(doc);
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_setDocs).call(this);
        });
    }
    update(id, changes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const index = tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").findIndex((doc) => tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_keyOf, "f").call(this, doc) === id);
            if (index === -1) {
                throw new Error("Unable to update document without a current value");
            }
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f")[index] = Object.assign(Object.assign({}, tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f")[index]), changes);
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_setDocs).call(this);
        });
    }
    delete(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const index = tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").findIndex((doc) => tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_keyOf, "f").call(this, doc) === id);
            if (index === -1) {
                throw new Error("Unable to delete document without a current value");
            }
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").splice(index, 1);
            tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_setDocs).call(this);
        });
    }
    getStatus() {
        return Object.assign({}, tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_status, "f"));
    }
}
exports.MemoryCollectionAdapter = MemoryCollectionAdapter;
_MemoryCollectionAdapter_docs = new WeakMap(), _MemoryCollectionAdapter_status = new WeakMap(), _MemoryCollectionAdapter_subscribers = new WeakMap(), _MemoryCollectionAdapter_keyOf = new WeakMap(), _MemoryCollectionAdapter_instances = new WeakSet(), _MemoryCollectionAdapter_notifySubscribers = function _MemoryCollectionAdapter_notifySubscribers() {
    for (const { onUpdate, onError } of tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_subscribers, "f")) {
        try {
            onUpdate(tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_docs, "f").slice());
        }
        catch (error) {
            onError(error instanceof Error ? error : new Error(String(error)));
        }
    }
}, _MemoryCollectionAdapter_setDocs = function _MemoryCollectionAdapter_setDocs() {
    tslib_1.__classPrivateFieldSet(this, _MemoryCollectionAdapter_status, { state: "syncing" }, "f");
    tslib_1.__classPrivateFieldSet(this, _MemoryCollectionAdapter_status, { state: "idle", lastSyncAt: Date.now() }, "f");
    tslib_1.__classPrivateFieldGet(this, _MemoryCollectionAdapter_instances, "m", _MemoryCollectionAdapter_notifySubscribers).call(this);
};
//# sourceMappingURL=MemoryCollectionAdapter.js.map