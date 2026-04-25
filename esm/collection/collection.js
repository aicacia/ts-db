import { createQueryService, } from "../query/querySubscriptionService.js";
/**
 * Collection manages document subscriptions using a dual-layer pattern:
 * 1. Per-CTE adapter subscriptions (_cteSubscriptions) - one per unique query
 * 2. Query-level subscriptions (_querySubscriptions, _callbacks) - tracks user subscriptions
 *
 * This allows multiple user subscriptions to the same query to share a single adapter subscription,
 * improving efficiency and reducing redundant filtering operations.
 */
export class Collection {
    constructor(config) {
        this.id = config.id;
        this._source = config.source;
        this._keyOf = config.keyOf;
        this._keyField = config.keyField;
        const injectedQueryService = config.queryService ?? config.querySubscriptionService;
        this._queryService =
            injectedQueryService ??
                createQueryService({
                    source: this._source,
                });
    }
    async create(doc) {
        await this._source.create(doc);
    }
    async update(id, changes) {
        await this._source.update(id, changes);
    }
    async delete(id) {
        await this._source.delete(id);
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
export function createCollection(config) {
    return new Collection(config);
}
//# sourceMappingURL=collection.js.map