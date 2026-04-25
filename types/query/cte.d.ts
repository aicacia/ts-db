import type { FieldPath } from "../types/index.js";
export interface CTE<T> {
    version: "1.0";
    name?: string;
    columns?: string[];
    filters?: CTEFilter<T>[];
    orderBy?: CTEOrderBy<T>[];
    limit?: number;
    offset?: number;
    joins?: CTEJoin[];
    ctes?: Record<string, CTE<T>>;
}
export interface CTEJoin {
    collectionId: string;
    leftField: string;
    rightField?: string;
    type: "inner" | "left";
}
export type CTEFilter<T> = CTEComparisonFilter<T> | CTELogicalFilter<T> | CTEReferenceFilter<T>;
export interface CTEComparisonFilter<T> {
    type: "comparison";
    operator: CTEComparisonOperator;
    field: FieldPath<T>;
    value: unknown;
}
export interface CTEReferenceFilter<T> {
    type: "reference";
    operator: "in" | "notIn";
    cteName: string;
    field?: FieldPath<T>;
}
export type CTEComparisonOperator = "equal" | "notEqual" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "in" | "contains" | "containsIgnoreCase" | "fuzzyContains" | "includes";
export interface CTELogicalFilter<T> {
    type: "logical";
    operator: "and" | "or";
    filters: CTEFilter<T>[];
}
export interface CTEOrderBy<T> {
    field: FieldPath<T>;
    direction: "asc" | "desc";
}
export declare function createCTE<T>(): CTE<T>;
/**
 * Build a deterministic identity for a CTE so equivalent query objects share subscriptions.
 */
export declare function getCTEIdentity<T>(cte: CTE<T>): string;
export declare function compare<T>(field: FieldPath<T>, operator: CTEComparisonOperator, value: unknown): CTEComparisonFilter<T>;
export declare function equal<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function notEqual<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function greaterThan<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function lessThan<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function greaterThanOrEqual<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function lessThanOrEqual<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function inOperator<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function contains<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function containsIgnoreCase<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function fuzzyContains<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function includes<T>(field: FieldPath<T>, value: unknown): CTEComparisonFilter<T>;
export declare function inCTE<T>(cteName: string, field?: FieldPath<T>): CTEReferenceFilter<T>;
export declare function notInCTE<T>(cteName: string, field?: FieldPath<T>): CTEReferenceFilter<T>;
export declare function and<T>(...filters: CTEFilter<T>[]): CTELogicalFilter<T>;
export declare function or<T>(...filters: CTEFilter<T>[]): CTELogicalFilter<T>;
//# sourceMappingURL=cte.d.ts.map