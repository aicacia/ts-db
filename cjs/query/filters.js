"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNever = void 0;
exports.createCTEContext = createCTEContext;
exports.applyNestedCTEs = applyNestedCTEs;
exports.applyFilter = applyFilter;
exports.applyFiltersWithContext = applyFiltersWithContext;
exports.applyFilters = applyFilters;
const string_fuzzy_equals_1 = require("@aicacia/string-fuzzy_equals");
const index_js_1 = require("../utils/index.js");
const utils_js_1 = require("./utils.js");
var utils_js_2 = require("./utils.js");
Object.defineProperty(exports, "assertNever", { enumerable: true, get: function () { return utils_js_2.assertNever; } });
function toSearchString(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}
function fuzzyContainsMatch(value, search) {
    const haystack = toSearchString(value).toLowerCase();
    const needle = toSearchString(search).toLowerCase();
    if (needle.length === 0) {
        return true;
    }
    if (haystack.includes(needle)) {
        return true;
    }
    return (0, string_fuzzy_equals_1.fuzzyEquals)(needle, haystack, false);
}
function createCTEContext() {
    return {
        results: {},
    };
}
function applyNestedCTEs(cte, docs, context) {
    if (!cte.ctes) {
        return;
    }
    for (const [name, nestedCTE] of Object.entries(cte.ctes)) {
        applyNestedCTEs(nestedCTE, docs, context);
        const nestedResults = applyFiltersWithContext(docs, nestedCTE, context);
        context.results[name] = nestedResults;
    }
}
function isNumber(value) {
    return typeof value === "number" && !Number.isNaN(value);
}
function applyFiltersInternal(docs, filters, context) {
    if (!filters || filters.length === 0) {
        return docs;
    }
    const filtered = [];
    for (const doc of docs) {
        let passesAllFilters = true;
        for (const filter of filters) {
            if (!applyFilter(filter, doc, context)) {
                passesAllFilters = false;
                break;
            }
        }
        if (passesAllFilters) {
            filtered.push(doc);
        }
    }
    return filtered;
}
function applyFilter(filter, doc, context) {
    if (filter.type === "comparison") {
        const fieldValue = (0, index_js_1.getFieldValue)(doc, filter.field);
        switch (filter.operator) {
            case "equal":
                return fieldValue === filter.value;
            case "notEqual":
                return fieldValue !== filter.value;
            case "greaterThan":
                return (isNumber(fieldValue) &&
                    isNumber(filter.value) &&
                    fieldValue > filter.value);
            case "lessThan":
                return (isNumber(fieldValue) &&
                    isNumber(filter.value) &&
                    fieldValue < filter.value);
            case "greaterThanOrEqual":
                return (isNumber(fieldValue) &&
                    isNumber(filter.value) &&
                    fieldValue >= filter.value);
            case "lessThanOrEqual":
                return (isNumber(fieldValue) &&
                    isNumber(filter.value) &&
                    fieldValue <= filter.value);
            case "in":
                return Array.isArray(filter.value)
                    ? filter.value.includes(fieldValue)
                    : false;
            case "contains": {
                const haystack = toSearchString(fieldValue);
                const needle = toSearchString(filter.value);
                return needle.length === 0 ? true : haystack.includes(needle);
            }
            case "containsIgnoreCase": {
                const haystack = toSearchString(fieldValue).toLowerCase();
                const needle = toSearchString(filter.value).toLowerCase();
                return needle.length === 0 ? true : haystack.includes(needle);
            }
            case "fuzzyContains":
                return fuzzyContainsMatch(fieldValue, filter.value);
            case "includes":
                return Array.isArray(fieldValue) && fieldValue.includes(filter.value);
            default:
                return (0, utils_js_1.assertNever)(filter);
        }
    }
    if (filter.type === "logical") {
        switch (filter.operator) {
            case "and": {
                for (const subFilter of filter.filters) {
                    if (!applyFilter(subFilter, doc, context)) {
                        return false;
                    }
                }
                return true;
            }
            case "or": {
                for (const subFilter of filter.filters) {
                    if (applyFilter(subFilter, doc, context)) {
                        return true;
                    }
                }
                return false;
            }
            default:
                return (0, utils_js_1.assertNever)(filter);
        }
    }
    if (filter.type === "reference") {
        if (!context) {
            return true;
        }
        const cteResults = context.results[filter.cteName];
        if (!cteResults) {
            return filter.operator === "notIn";
        }
        if (filter.field) {
            const fieldValue = (0, index_js_1.getFieldValue)(doc, filter.field);
            const existsInCTE = cteResults.some(
            // biome-ignore lint/style/noNonNullAssertion: checked above
            (cteDoc) => (0, index_js_1.getFieldValue)(cteDoc, filter.field) === fieldValue);
            return filter.operator === "in" ? existsInCTE : !existsInCTE;
        }
        const existsInCTE = cteResults.includes(doc);
        return filter.operator === "in" ? existsInCTE : !existsInCTE;
    }
    return (0, utils_js_1.assertNever)(filter);
}
function applyFiltersWithContext(docs, cte, context) {
    return applyFiltersInternal(docs, cte.filters, context);
}
function applyFilters(docs, cte) {
    return applyFiltersInternal(docs, cte.filters);
}
//# sourceMappingURL=filters.js.map