"use strict";
var _Singleton_source;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Singleton = void 0;
exports.createSingleton = createSingleton;
const tslib_1 = require("tslib");
class Singleton {
    constructor(config) {
        this.config = config;
        _Singleton_source.set(this, void 0);
        const sourceOptions = config.sourceOptions === undefined ? {} : config.sourceOptions;
        tslib_1.__classPrivateFieldSet(this, _Singleton_source, new config.sourceType(sourceOptions), "f");
    }
    subscribe(onUpdate, onError = () => { }) {
        return tslib_1.__classPrivateFieldGet(this, _Singleton_source, "f").subscribe(onUpdate, onError);
    }
    set(doc) {
        return tslib_1.__classPrivateFieldGet(this, _Singleton_source, "f").set(doc);
    }
    update(changes) {
        return tslib_1.__classPrivateFieldGet(this, _Singleton_source, "f").update(changes);
    }
    getStatus() {
        return tslib_1.__classPrivateFieldGet(this, _Singleton_source, "f").getStatus();
    }
    getSource() {
        return tslib_1.__classPrivateFieldGet(this, _Singleton_source, "f");
    }
}
exports.Singleton = Singleton;
_Singleton_source = new WeakMap();
function createSingleton(config) {
    return new Singleton(config);
}
//# sourceMappingURL=Singleton.js.map