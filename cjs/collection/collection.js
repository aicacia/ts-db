"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
exports.createCollection = createCollection;
const tslib_1 = require("tslib");
const querySubscriptionService_js_1 = require("../query/querySubscriptionService.js");
/**
 * Collection manages document subscriptions using a dual-layer pattern:
 * 1. Per-CTE adapter subscriptions (_cteSubscriptions) - one per unique query
 * 2. Query-level subscriptions (_querySubscriptions, _callbacks) - tracks user subscriptions
 *
 * This allows multiple user subscriptions to the same query to share a single adapter subscription,
 * improving efficiency and reducing redundant filtering operations.
 */
class Collection {
    constructor(config) {
        var _a;
        this.id = config.id;
        this._source = config.source;
        this._keyOf = config.keyOf;
        this._keyField = config.keyField;
        const injectedQueryService = (_a = config.queryService) !== null && _a !== void 0 ? _a : config.querySubscriptionService;
        this._queryService =
            injectedQueryService !== null && injectedQueryService !== void 0 ? injectedQueryService : (0, querySubscriptionService_js_1.createQueryService)({
                source: this._source,
            });
    }
    create(doc) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._source.create(doc);
        });
    }
    update(id, changes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._source.update(id, changes);
        });
    }
    delete(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._source.delete(id);
        });
    }
    query() {
        return this._queryService.createQueryBuilder();
    }
    subscribe(onUpdate, onError) {
        return this.query().subscribe(onUpdate, onError);
    }
    getStatus() {
        return this._source.getStatus();
    }
    getKeyOf() {
        return this._keyOf;
    }
    getKeyField() {
        return this._keyField;
    }
}
exports.Collection = Collection;
function createCollection(config) {
    return new Collection(config);
}
//# sourceMappingURL=collection.js.map