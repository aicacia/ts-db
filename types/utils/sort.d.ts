import type { CTEOrderBy } from "../query/cte.js";
/** Compare two values for sorting.
 * Null/undefined values sort last.
 */
export declare function compareValues(a: unknown, b: unknown): number;
/**
 * Create a comparator function for sorting documents by multiple fields.
 */
export declare function createItemSortFunction<T>(orderBy: CTEOrderBy<T>[]): (a: T, b: T) => number;
//# sourceMappingURL=sort.d.ts.map