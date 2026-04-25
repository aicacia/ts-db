import { createItemSortFunction } from "../utils/index.js";
export function applyOrderBy(docs, orderBy) {
    const sorted = [...docs];
    return sorted.sort(createItemSortFunction(orderBy));
}
export function applyPagination(docs, offset, limit) {
    let results = docs;
    if (offset !== undefined && offset > 0) {
        results = results.slice(offset);
    }
    if (limit !== undefined && limit > 0) {
        results = results.slice(0, limit);
    }
    return results;
}
//# sourceMappingURL=order.js.map