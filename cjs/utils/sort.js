"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareValues = compareValues;
exports.createItemSortFunction = createItemSortFunction;
const field_js_1 = require("./field.js");
/** Compare two values for sorting.
 * Null/undefined values sort last.
 */
function compareValues(a, b) {
    if (a === null || a === undefined)
        return 1;
    if (b === null || b === undefined)
        return -1;
    if (a === b)
        return 0;
    const aType = typeof a;
    const bType = typeof b;
    if (aType !== bType) {
        return aType < bType ? -1 : 1;
    }
    if (aType === "string" ||
        aType === "number" ||
        aType === "bigint" ||
        aType === "boolean") {
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    }
    const aString = String(a);
    const bString = String(b);
    if (aString < bString)
        return -1;
    if (aString > bString)
        return 1;
    return 0;
}
/**
 * Create a comparator function for sorting documents by multiple fields.
 */
function createItemSortFunction(orderBy) {
    return (a, b) => {
        for (const order of orderBy) {
            const aVal = (0, field_js_1.getFieldValue)(a, order.field);
            const bVal = (0, field_js_1.getFieldValue)(b, order.field);
            const comparison = compareValues(aVal, bVal);
            if (comparison !== 0) {
                return order.direction === "asc" ? comparison : -comparison;
            }
        }
        return 0;
    };
}
//# sourceMappingURL=sort.js.map