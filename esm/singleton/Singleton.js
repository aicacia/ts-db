var _Singleton_source;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "tslib";
export class Singleton {
    constructor(config) {
        this.config = config;
        _Singleton_source.set(this, void 0);
        const sourceOptions = config.sourceOptions === undefined ? {} : config.sourceOptions;
        __classPrivateFieldSet(this, _Singleton_source, new config.sourceType(sourceOptions), "f");
    }
    subscribe(onUpdate, onError = () => { }) {
        return __classPrivateFieldGet(this, _Singleton_source, "f").subscribe(onUpdate, onError);
    }
    set(doc) {
        return __classPrivateFieldGet(this, _Singleton_source, "f").set(doc);
    }
    update(changes) {
        return __classPrivateFieldGet(this, _Singleton_source, "f").update(changes);
    }
    getStatus() {
        return __classPrivateFieldGet(this, _Singleton_source, "f").getStatus();
    }
    getSource() {
        return __classPrivateFieldGet(this, _Singleton_source, "f");
    }
}
_Singleton_source = new WeakMap();
export function createSingleton(config) {
    return new Singleton(config);
}
//# sourceMappingURL=Singleton.js.map