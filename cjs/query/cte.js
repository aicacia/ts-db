"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCTE = createCTE;
exports.getCTEIdentity = getCTEIdentity;
exports.compare = compare;
exports.equal = equal;
exports.notEqual = notEqual;
exports.greaterThan = greaterThan;
exports.lessThan = lessThan;
exports.greaterThanOrEqual = greaterThanOrEqual;
exports.lessThanOrEqual = lessThanOrEqual;
exports.inOperator = inOperator;
exports.contains = contains;
exports.containsIgnoreCase = containsIgnoreCase;
exports.fuzzyContains = fuzzyContains;
exports.includes = includes;
exports.inCTE = inCTE;
exports.notInCTE = notInCTE;
exports.and = and;
exports.or = or;
function createCTE() {
    return {
        version: "1.0",
    };
}
function normalizeIdentityValue(value, seen) {
    if (value === null) {
        return null;
    }
    if (value instanceof Date) {
        return `__date:${value.toISOString()}`;
    }
    if (typeof value === "number") {
        if (Number.isNaN(value)) {
            return "__number:NaN";
        }
        if (!Number.isFinite(value)) {
            return `__number:${value > 0 ? "Infinity" : "-Infinity"}`;
        }
        return value;
    }
    if (typeof value === "bigint") {
        return `__bigint:${value.toString()}`;
    }
    if (typeof value === "string" ||
        typeof value === "boolean" ||
        typeof value === "undefined" ||
        typeof value === "symbol" ||
        typeof value === "function") {
        return value === undefined ? "__undefined" : String(value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => normalizeIdentityValue(item, seen));
    }
    if (typeof value === "object") {
        const objectValue = value;
        if (seen.has(objectValue)) {
            throw new Error("Circular reference detected while generating CTE identity");
        }
        seen.add(objectValue);
        const entries = Object.entries(objectValue)
            .filter(([, item]) => item !== undefined)
            .sort(([left], [right]) => left.localeCompare(right));
        const normalized = {};
        for (const [key, item] of entries) {
            normalized[key] = normalizeIdentityValue(item, seen);
        }
        seen.delete(objectValue);
        return normalized;
    }
    return String(value);
}
/**
 * Build a deterministic identity for a CTE so equivalent query objects share subscriptions.
 */
function getCTEIdentity(cte) {
    const normalized = normalizeIdentityValue(cte, new WeakSet());
    return JSON.stringify(normalized);
}
function compare(field, operator, value) {
    return {
        type: "comparison",
        operator,
        field,
        value,
    };
}
function equal(field, value) {
    return compare(field, "equal", value);
}
function notEqual(field, value) {
    return compare(field, "notEqual", value);
}
function greaterThan(field, value) {
    return compare(field, "greaterThan", value);
}
function lessThan(field, value) {
    return compare(field, "lessThan", value);
}
function greaterThanOrEqual(field, value) {
    return compare(field, "greaterThanOrEqual", value);
}
function lessThanOrEqual(field, value) {
    return compare(field, "lessThanOrEqual", value);
}
function inOperator(field, value) {
    return compare(field, "in", value);
}
function contains(field, value) {
    return compare(field, "contains", value);
}
function containsIgnoreCase(field, value) {
    return compare(field, "containsIgnoreCase", value);
}
function fuzzyContains(field, value) {
    return compare(field, "fuzzyContains", value);
}
function includes(field, value) {
    return compare(field, "includes", value);
}
function inCTE(cteName, field) {
    return {
        type: "reference",
        operator: "in",
        cteName,
        field,
    };
}
function notInCTE(cteName, field) {
    return {
        type: "reference",
        operator: "notIn",
        cteName,
        field,
    };
}
function and(...filters) {
    return {
        type: "logical",
        operator: "and",
        filters,
    };
}
function or(...filters) {
    return {
        type: "logical",
        operator: "or",
        filters,
    };
}
//# sourceMappingURL=cte.js.map