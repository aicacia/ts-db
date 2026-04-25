"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyOrderBy = applyOrderBy;
exports.applyPagination = applyPagination;
const index_js_1 = require("../utils/index.js");
function applyOrderBy(docs, orderBy) {
    const sorted = [...docs];
    return sorted.sort((0, index_js_1.createItemSortFunction)(orderBy));
}
function applyPagination(docs, offset, limit) {
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