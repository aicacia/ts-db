import type { CTE, CTEFilter } from "./cte.js";

export function assertNever(value: never): never {
	throw new Error(`Unexpected value: ${String(value)}`);
}

function cloneValue<T>(value: T): T {
	if (value === null || typeof value !== "object") {
		return value;
	}

	if (typeof structuredClone === "function") {
		return structuredClone(value);
	}

	if (Array.isArray(value)) {
		return value.map(cloneValue) as unknown as T;
	}

	const copied: Record<string, unknown> = {};
	for (const key of Object.keys(value as Record<string, unknown>)) {
		copied[key] = cloneValue((value as Record<string, unknown>)[key]);
	}

	return copied as T;
}

export function cloneFilters<T>(filters: CTEFilter<T>[]): CTEFilter<T>[] {
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

		return assertNever(filter as never);
	});
}

export function cloneCTE<T>(cte: CTE<T>): CTE<T> {
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
			? Object.fromEntries(
					Object.entries(cte.ctes).map(([key, childCTE]) => [
						key,
						cloneCTE(childCTE),
					]),
				)
			: undefined,
	};
}
