import { createCTEContext, applyNestedCTEs, applyFiltersWithContext, } from "./filters.js";
import { applyOrderBy, applyPagination } from "./order.js";
export { applyFilter } from "./filters.js";
export { applyOrderBy, applyPagination } from "./order.js";
export function applyCTE(cte, docs) {
    let results = docs;
    const context = createCTEContext();
    applyNestedCTEs(cte, docs, context);
    results = applyFiltersWithContext(results, cte, context);
    if (cte.orderBy && cte.orderBy.length > 0) {
        results = applyOrderBy(results, cte.orderBy);
    }
    results = applyPagination(results, cte.offset, cte.limit);
    return results;
}
//# sourceMappingURL=filterEngine.js.map