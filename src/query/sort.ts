import type { CTEOrderBy } from "./cte.js";
import { getFieldValue } from "../field.js";

export function compareValues(a: unknown, b: unknown): number {
	if (a === b) return 0;

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

export function compareOrderValues<T>(a: T, b: T, orderBy: CTEOrderBy<T>[]) {
	for (const order of orderBy) {
		const left = getFieldValue(a, order.field);
		const right = getFieldValue(b, order.field);
		const result = compareValues(left, right);
		if (result !== 0) {
			return order.direction === "desc" ? -result : result;
		}
	}
	return 0;
}

export function stableSortWithTieBreaker<T>(
	items: T[],
	comparator: (a: T, b: T) => number,
): T[] {
	return items
		.map((item, index) => ({ item, index }))
		.sort((a, b) => {
			const cmp = comparator(a.item, b.item);
			if (cmp !== 0) return cmp;
			return a.index - b.index;
		})
		.map(({ item }) => item);
}

export function createComparator<T>(orderBy: CTEOrderBy<T>[]) {
	return (a: T, b: T) => compareOrderValues(a, b, orderBy);
}
