import type { FieldPath, UnsubscribeFn } from "../types/index.js";
import type { ICollection } from "../collection/index.js";
import { type CTE, type CTEComparisonOperator, type CTEFilter } from "./cte.js";
import { type JoinResult } from "./joins.js";
/**
 * Order direction
 */
export type OrderDirection = "asc" | "desc";
export type JoinType = "inner" | "left";
export interface JoinConfig<Left> {
    collection: ICollection<unknown>;
    leftField: FieldPath<Left>;
    rightField: FieldPath<unknown>;
    type: JoinType;
}
/**
 * Query builder interface
 */
export interface IQueryBuilder<T> {
    /**
     * Add a filter condition to the CTE
     */
    where(filter: CTEFilter<T>): IQueryBuilder<T>;
    /**
     * Add a comparison filter with full operator control.
     */
    compare(field: FieldPath<T>, operator: CTEComparisonOperator, value: unknown): IQueryBuilder<T>;
    /**
     * Add equality filter.
     */
    equal(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add not-equal filter.
     */
    notEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add greater-than filter.
     */
    greaterThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add less-than filter.
     */
    lessThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add greater-than-or-equal filter.
     */
    greaterThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add less-than-or-equal filter.
     */
    lessThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add inclusion filter.
     */
    in(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add contains filter.
     */
    contains(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add case-insensitive contains filter.
     */
    containsIgnoreCase(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add fuzzy contains filter.
     */
    fuzzyContains(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add includes filter.
     */
    includes(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    /**
     * Add logical AND filter over provided filters.
     */
    and(...filters: CTEFilter<T>[]): IQueryBuilder<T>;
    /**
     * Add logical OR filter over provided filters.
     */
    or(...filters: CTEFilter<T>[]): IQueryBuilder<T>;
    /**
     * Join another collection to the root query.
     *
     * The left-side field is required. The right-side field is optional when
     * the joined collection exposes a `keyField`.
     */
    join<Right>(rightCollection: ICollection<Right>, leftField: FieldPath<T>, rightField?: FieldPath<Right>, type?: JoinType): IQueryBuilder<T & JoinResult<Right>>;
    /**
     * Order results by field
     *
     * Supports both top-level fields and nested paths using dot notation.
     *
     * @param field - Field name or nested path (e.g., 'name' or 'user.profile.name')
     * @param direction - Sort direction ('asc' or 'desc', default: 'asc')
     *
     * @example
     * ```typescript
     * collection.query().orderBy('name', 'asc')
     * collection.query().orderBy('user.profile.age', 'desc')
     * ```
     */
    orderBy(field: FieldPath<T>, direction?: OrderDirection): IQueryBuilder<T>;
    /**
     * Limit number of results
     */
    limit(n: number): IQueryBuilder<T>;
    /**
     * Skip first n results
     */
    offset(n: number): IQueryBuilder<T>;
    /**
     * Paginate results by page number and page size
     *
     * @param page - Page number (0-indexed)
     * @param pageSize - Number of results per page (default: 10)
     * @returns Query builder with offset and limit applied
     */
    paginate(page: number, pageSize?: number): IQueryBuilder<T>;
    /**
     * Define a reusable CTE subquery
     */
    with(name: string, fn: (q: IQueryBuilder<T>) => IQueryBuilder<T>): IQueryBuilder<T>;
    /**
     * Subscribe to query results
     *
     * Establishes a subscription to documents matching the query. The subscription
     * begins immediately and will emit results as they change. Errors thrown in the
     * onUpdate callback are caught and passed to onError if provided.
     *
     * @param onUpdate - Called with documents matching the query.
     *                   Errors thrown here are caught and sent to onError.
     * @param onError - Optional callback for errors. Called with adapter errors,
     *                  filter evaluation errors, or subscriber callback errors.
     *                  Non-recoverable: unsubscribe is recommended.
     *                  To retry, create a new subscription.
     * @returns Unsubscribe function to clean up subscription and stop receiving updates
     */
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    /**
     * Export query as JSON-serializable CTE
     */
    toCTE(): CTE<T>;
    /**
     * Compile CTE to executable filter function
     */
    compileToFunction(): (docs: T[]) => T[];
}
/**
 * Query compiler - compiles CTE to executable result
 */
export type QueryCompiler<T> = (cte: CTE<T>) => QuerySubscriptionResult<T>;
/**
 * Query result subscription callback
 */
export interface QuerySubscriptionCallback<T> {
    onUpdate: (docs: T[]) => void;
    onError: (error: Error) => void;
}
/**
 * Query subscription result function
 */
export type QuerySubscriptionResult<T> = (callbacks: QuerySubscriptionCallback<T>) => UnsubscribeFn;
/**
 * QueryBuilder - fluent API for building JSON-serializable CTEs that can be compiled
 */
export declare class QueryBuilder<T> implements IQueryBuilder<T> {
    protected _cte: CTE<T>;
    protected _joins: JoinConfig<T>[];
    constructor();
    protected createSubBuilder(): QueryBuilder<T>;
    where(filter: CTEFilter<T>): IQueryBuilder<T>;
    compare(field: FieldPath<T>, operator: CTEComparisonOperator, value: unknown): IQueryBuilder<T>;
    equal(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    notEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    greaterThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    lessThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    greaterThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    lessThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    in(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    contains(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    containsIgnoreCase(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    fuzzyContains(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    includes(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;
    and(...filters: CTEFilter<T>[]): IQueryBuilder<T>;
    or(...filters: CTEFilter<T>[]): IQueryBuilder<T>;
    join<Right>(rightCollection: ICollection<Right>, leftField: FieldPath<T>, rightField?: FieldPath<Right>, type?: JoinType): IQueryBuilder<T & JoinResult<Right>>;
    orderBy(field: FieldPath<T>, direction?: OrderDirection): IQueryBuilder<T>;
    limit(n: number): IQueryBuilder<T>;
    offset(n: number): IQueryBuilder<T>;
    paginate(page: number, pageSize?: number): IQueryBuilder<T>;
    with(name: string, fn: (q: IQueryBuilder<T>) => IQueryBuilder<T>): IQueryBuilder<T>;
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    toCTE(): CTE<T>;
    compileToFunction(): (docs: T[]) => T[];
}
export declare class RuntimeQueryBuilder<T> extends QueryBuilder<T> {
    private _compile;
    constructor(compile: QueryCompiler<T>);
    protected createSubBuilder(): QueryBuilder<T>;
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
}
export declare function createQueryBuilder<T>(compile?: QueryCompiler<T>): QueryBuilder<T>;
//# sourceMappingURL=queryBuilder.d.ts.map