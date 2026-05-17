var _Collection_id, _Collection_source, _Collection_keyOf;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "tslib";
import { createCTE } from "../query/cte.js";
import { QueryBuilder } from "../query/QueryBuilder.js";
export class Collection {
    constructor(config) {
        this.config = config;
        _Collection_id.set(this, void 0);
        _Collection_source.set(this, void 0);
        _Collection_keyOf.set(this, void 0);
        const sourceOptions = config.sourceOptions === undefined
            ? { keyOf: config.keyOf }
            : config.sourceOptions;
        __classPrivateFieldSet(this, _Collection_id, config.id, "f");
        __classPrivateFieldSet(this, _Collection_keyOf, config.keyOf, "f");
        __classPrivateFieldSet(this, _Collection_source, new config.sourceType(sourceOptions), "f");
    }
    get id() {
        return __classPrivateFieldGet(this, _Collection_id, "f");
    }
    create(doc) {
        return __classPrivateFieldGet(this, _Collection_source, "f").create(doc);
    }
    update(id, changes) {
        return __classPrivateFieldGet(this, _Collection_source, "f").update(id, changes);
    }
    delete(id) {
        return __classPrivateFieldGet(this, _Collection_source, "f").delete(id);
    }
    query() {
        return new QueryBuilder({ adapter: __classPrivateFieldGet(this, _Collection_source, "f") });
    }
    subscribe(onUpdate, onError = () => { }) {
        return __classPrivateFieldGet(this, _Collection_source, "f").subscribe(onUpdate, onError, createCTE());
    }
    getStatus() {
        return __classPrivateFieldGet(this, _Collection_source, "f").getStatus();
    }
    getKeyOf() {
        return __classPrivateFieldGet(this, _Collection_keyOf, "f");
    }
    getSource() {
        return __classPrivateFieldGet(this, _Collection_source, "f");
    }
}
_Collection_id = new WeakMap(), _Collection_source = new WeakMap(), _Collection_keyOf = new WeakMap();
export function createCollection(config) {
    return new Collection(config);
}
//# sourceMappingURL=Collection.js.map