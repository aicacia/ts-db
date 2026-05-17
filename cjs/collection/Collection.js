"use strict";
var _Collection_id, _Collection_source, _Collection_keyOf;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
exports.createCollection = createCollection;
const tslib_1 = require("tslib");
const cte_js_1 = require("../query/cte.js");
const QueryBuilder_js_1 = require("../query/QueryBuilder.js");
class Collection {
    constructor(config) {
        this.config = config;
        _Collection_id.set(this, void 0);
        _Collection_source.set(this, void 0);
        _Collection_keyOf.set(this, void 0);
        const sourceOptions = config.sourceOptions === undefined
            ? { keyOf: config.keyOf }
            : config.sourceOptions;
        tslib_1.__classPrivateFieldSet(this, _Collection_id, config.id, "f");
        tslib_1.__classPrivateFieldSet(this, _Collection_keyOf, config.keyOf, "f");
        tslib_1.__classPrivateFieldSet(this, _Collection_source, new config.sourceType(sourceOptions), "f");
    }
    get id() {
        return tslib_1.__classPrivateFieldGet(this, _Collection_id, "f");
    }
    create(doc) {
        return tslib_1.__classPrivateFieldGet(this, _Collection_source, "f").create(doc);
    }
    update(id, changes) {
        return tslib_1.__classPrivateFieldGet(this, _Collection_source, "f").update(id, changes);
    }
    delete(id) {
        return tslib_1.__classPrivateFieldGet(this, _Collection_source, "f").delete(id);
    }
    query() {
        return new QueryBuilder_js_1.QueryBuilder({ adapter: tslib_1.__classPrivateFieldGet(this, _Collection_source, "f") });
    }
    subscribe(onUpdate, onError = () => { }) {
        return tslib_1.__classPrivateFieldGet(this, _Collection_source, "f").subscribe(onUpdate, onError, (0, cte_js_1.createCTE)());
    }
    getStatus() {
        return tslib_1.__classPrivateFieldGet(this, _Collection_source, "f").getStatus();
    }
    getKeyOf() {
        return tslib_1.__classPrivateFieldGet(this, _Collection_keyOf, "f");
    }
    getSource() {
        return tslib_1.__classPrivateFieldGet(this, _Collection_source, "f");
    }
}
exports.Collection = Collection;
_Collection_id = new WeakMap(), _Collection_source = new WeakMap(), _Collection_keyOf = new WeakMap();
function createCollection(config) {
    return new Collection(config);
}
//# sourceMappingURL=Collection.js.map