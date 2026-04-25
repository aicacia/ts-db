import type { AdapterStatus, SourceAdapter, UnsubscribeFn, FieldPath } from "../types/index.js";
import type { IQueryBuilder } from "../query/queryBuilder.js";
import { type QueryService, type QuerySubscriptionService } from "../query/querySubscriptionService.js";
export interface CollectionConfig<T> {
    id: string;
    source: SourceAdapter<T>;
    keyOf: (doc: T) => string;
    keyField?: FieldPath<T>;
    queryService?: QueryService<T>;
    querySubscriptionService?: QuerySubscriptionService<T>;
}
export interface ICollection<T> {
    readonly id: string;
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    query(): IQueryBuilder<T>;
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    getStatus(): AdapterStatus;
    getKeyOf(): (doc: T) => string;
    getKeyField(): FieldPath<T> | undefined;
}
/**
 * Collection manages document subscriptions using a dual-layer pattern:
 * 1. Per-CTE adapter subscriptions (_cteSubscriptions) - one per unique query
 * 2. Query-level subscriptions (_querySubscriptions, _callbacks) - tracks user subscriptions
 *
 * This allows multiple user subscriptions to the same query to share a single adapter subscription,
 * improving efficiency and reducing redundant filtering operations.
 */
export declare class Collection<T> implements ICollection<T> {
    readonly id: string;
    private _source;
    private _queryService;
    private _keyOf;
    private _keyField;
    constructor(config: CollectionConfig<T>);
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    query(): IQueryBuilder<T>;
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    getStatus(): AdapterStatus;
    getKeyOf(): (doc: T) => string;
    getKeyField(): FieldPath<T> | undefined;
}
export declare function createCollection<T>(config: CollectionConfig<T>): ICollection<T>;
//# sourceMappingURL=collection.d.ts.map