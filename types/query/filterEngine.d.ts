import type { CTE } from "./cte.js";
export { applyFilter } from "./filters.js";
export { applyOrderBy, applyPagination } from "./order.js";
export declare function applyCTE<T>(cte: CTE<T>, docs: T[]): T[];
//# sourceMappingURL=filterEngine.d.ts.map