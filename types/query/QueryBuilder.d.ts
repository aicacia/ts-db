import type { CollectionAdapter, CollectionInterface } from "../collection/Collection.js";
import type { FieldPath } from "../field.js";
import type { UnsubscribeFn } from "../types.js";
import type { CTE, CTEComparisonOperator, CTEFilter } from "./cte.js";
import type { QueryExecutor, QueryJoinDescriptor } from "./executor.js";
export interface QueryBuilderInterface<T> {
    subscribe(onUpdate: (values: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    where(filter: CTEFilter<T>): this;
    compare(field: FieldPath<T>, operator: CTEComparisonOperator, value: unknown): this;
    equal(field: FieldPath<T>, value: unknown): this;
    notEqual(field: FieldPath<T>, value: unknown): this;
    greaterThan(field: FieldPath<T>, value: unknown): this;
    lessThan(field: FieldPath<T>, value: unknown): this;
    greaterThanOrEqual(field: FieldPath<T>, value: unknown): this;
    lessThanOrEqual(field: FieldPath<T>, value: unknown): this;
    in(field: FieldPath<T>, value: unknown): this;
    contains(field: FieldPath<T>, value: unknown): this;
    containsIgnoreCase(field: FieldPath<T>, value: unknown): this;
    fuzzyContains(field: FieldPath<T>, value: unknown): this;
    includes(field: FieldPath<T>, value: unknown): this;
    and(...filters: CTEFilter<T>[]): this;
    or(...filters: CTEFilter<T>[]): this;
    orderBy(field: FieldPath<T>, direction?: "asc" | "desc"): this;
    limit(n: number): this;
    offset(n: number): this;
    paginate(page: number, pageSize?: number): this;
    source(source: T[]): this;
    toCTE(): CTE<T>;
    join<U>(collection: CollectionInterface<U>, leftField: FieldPath<T>, rightField?: FieldPath<U>, type?: "inner" | "left"): this;
}
export interface QueryBuilderOptions<T> {
    source?: T[];
    executor?: QueryExecutor<T>;
    adapter?: CollectionAdapter<T>;
}
export declare class QueryBuilder<T> implements QueryBuilderInterface<T> {
    protected _cte: CTE<T>;
    protected _source: T[];
    protected _executor: QueryExecutor<T>;
    protected _adapter?: CollectionAdapter<T>;
    protected _joins: QueryJoinDescriptor[];
    constructor(sourceOrOptions?: T[] | QueryBuilderOptions<T>);
    where(filter: CTEFilter<T>): this;
    compare(field: FieldPath<T>, operator: CTEComparisonOperator, value: unknown): this;
    equal(field: FieldPath<T>, value: unknown): this;
    notEqual(field: FieldPath<T>, value: unknown): this;
    greaterThan(field: FieldPath<T>, value: unknown): this;
    lessThan(field: FieldPath<T>, value: unknown): this;
    greaterThanOrEqual(field: FieldPath<T>, value: unknown): this;
    lessThanOrEqual(field: FieldPath<T>, value: unknown): this;
    in(field: FieldPath<T>, value: unknown): this;
    contains(field: FieldPath<T>, value: unknown): this;
    containsIgnoreCase(field: FieldPath<T>, value: unknown): this;
    fuzzyContains(field: FieldPath<T>, value: unknown): this;
    includes(field: FieldPath<T>, value: unknown): this;
    and(...filters: CTEFilter<T>[]): this;
    or(...filters: CTEFilter<T>[]): this;
    orderBy(field: FieldPath<T>, direction?: "asc" | "desc"): this;
    limit(n: number): this;
    offset(n: number): this;
    paginate(page: number, pageSize?: number): this;
    toCTE(): CTE<T>;
    source(source: T[]): this;
    join<U>(collection: CollectionInterface<U>, leftField: FieldPath<T>, rightField?: FieldPath<U>, type?: "inner" | "left"): this;
    subscribe(onUpdate: (values: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
}
//# sourceMappingURL=QueryBuilder.d.ts.map