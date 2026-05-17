"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareValues = compareValues;
exports.compareOrderValues = compareOrderValues;
exports.stableSortWithTieBreaker = stableSortWithTieBreaker;
exports.createComparator = createComparator;
const field_js_1 = require("../field.js");
function compareValues(a, b) {
    if (a === b)
        return 0;
    if (a === undefined || a === null) {
        return b === undefined || b === null ? 0 : -1;
    }
    if (b === undefined || b === null) {
        return 1;
    }
    if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
    }
    if (typeof a === "number" && typeof b === "number") {
        return a - b;
    }
    if (typeof a === "boolean" && typeof b === "boolean") {
        return Number(a) - Number(b);
    }
    const left = String(a);
    const right = String(b);
    return left < right ? -1 : left > right ? 1 : 0;
}
function compareOrderValues(a, b, orderBy) {
    for (const order of orderBy) {
        const left = (0, field_js_1.getFieldValue)(a, order.field);
        const right = (0, field_js_1.getFieldValue)(b, order.field);
        const result = compareValues(left, right);
        if (result !== 0) {
            return order.direction === "desc" ? -result : result;
        }
    }
    return 0;
}
function stableSortWithTieBreaker(items, comparator) {
    return items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
        const cmp = comparator(a.item, b.item);
        if (cmp !== 0)
            return cmp;
        return a.index - b.index;
    })
        .map(({ item }) => item);
}
function createComparator(orderBy) {
    return (a, b) => compareOrderValues(a, b, orderBy);
}
//# sourceMappingURL=sort.js.map