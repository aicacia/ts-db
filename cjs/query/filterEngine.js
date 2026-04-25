"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPagination = exports.applyOrderBy = exports.applyFilter = void 0;
exports.applyCTE = applyCTE;
const filters_js_1 = require("./filters.js");
const order_js_1 = require("./order.js");
var filters_js_2 = require("./filters.js");
Object.defineProperty(exports, "applyFilter", { enumerable: true, get: function () { return filters_js_2.applyFilter; } });
var order_js_2 = require("./order.js");
Object.defineProperty(exports, "applyOrderBy", { enumerable: true, get: function () { return order_js_2.applyOrderBy; } });
Object.defineProperty(exports, "applyPagination", { enumerable: true, get: function () { return order_js_2.applyPagination; } });
function applyCTE(cte, docs) {
    let results = docs;
    const context = (0, filters_js_1.createCTEContext)();
    (0, filters_js_1.applyNestedCTEs)(cte, docs, context);
    results = (0, filters_js_1.applyFiltersWithContext)(results, cte, context);
    if (cte.orderBy && cte.orderBy.length > 0) {
        results = (0, order_js_1.applyOrderBy)(results, cte.orderBy);
    }
    results = (0, order_js_1.applyPagination)(results, cte.offset, cte.limit);
    return results;
}
//# sourceMappingURL=filterEngine.js.map