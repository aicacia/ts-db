import type { CTE, CTEFilter } from "./cte.js";
export { assertNever } from "./utils.js";
export interface CTEContext<T> {
    results: Record<string, T[]>;
}
export declare function createCTEContext<T>(): CTEContext<T>;
export declare function applyNestedCTEs<T>(cte: CTE<T>, docs: T[], context: CTEContext<T>): void;
export declare function applyFilter<T>(filter: CTEFilter<T>, doc: T, context?: CTEContext<T>): boolean;
export declare function applyFiltersWithContext<T>(docs: T[], cte: CTE<T>, context: CTEContext<T>): T[];
export declare function applyFilters<T>(docs: T[], cte: CTE<T>): T[];
//# sourceMappingURL=filters.d.ts.map