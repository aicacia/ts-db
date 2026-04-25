export function assertNever(value) {
    throw new Error(`Unexpected value: ${String(value)}`);
}
function cloneValue(value) {
    if (value === null || typeof value !== "object") {
        return value;
    }
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    if (Array.isArray(value)) {
        return value.map(cloneValue);
    }
    const copied = {};
    for (const key of Object.keys(value)) {
        copied[key] = cloneValue(value[key]);
    }
    return copied;
}
export function cloneFilters(filters) {
    return filters.map((filter) => {
        if (filter.type === "comparison") {
            return {
                ...filter,
                value: cloneValue(filter.value),
            };
        }
        if (filter.type === "logical") {
            return {
                ...filter,
                filters: cloneFilters(filter.filters),
            };
        }
        if (filter.type === "reference") {
            return {
                ...filter,
            };
        }
        return assertNever(filter);
    });
}
export function cloneCTE(cte) {
    return {
        version: cte.version,
        name: cte.name,
        columns: cte.columns ? [...cte.columns] : undefined,
        filters: cte.filters ? cloneFilters(cte.filters) : undefined,
        orderBy: cte.orderBy ? [...cte.orderBy] : undefined,
        limit: cte.limit,
        offset: cte.offset,
        joins: cte.joins ? cte.joins.map((join) => ({ ...join })) : undefined,
        ctes: cte.ctes
            ? Object.fromEntries(Object.entries(cte.ctes).map(([key, childCTE]) => [
                key,
                cloneCTE(childCTE),
            ]))
            : undefined,
    };
}
//# sourceMappingURL=utils.js.map