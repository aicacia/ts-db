import type { CTEOrderBy } from "./cte.js";
import { createItemSortFunction } from "../utils/index.js";

export function applyOrderBy<T>(docs: T[], orderBy: CTEOrderBy<T>[]): T[] {
	const sorted = [...docs];
	return sorted.sort(createItemSortFunction(orderBy));
}

export function applyPagination<T>(
	docs: T[],
	offset?: number,
	limit?: number,
): T[] {
	let results = docs;

	if (offset !== undefined && offset > 0) {
		results = results.slice(offset);
	}

	if (limit !== undefined && limit > 0) {
		results = results.slice(0, limit);
	}

	return results;
}
