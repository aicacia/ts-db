import { fuzzyEquals } from "@aicacia/string-fuzzy_equals";
import type { CTE, CTEFilter } from "./cte.js";
import { getFieldValue } from "../utils/index.js";
import { assertNever } from "./utils.js";
export { assertNever } from "./utils.js";

function toSearchString(value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}

	return String(value);
}

function fuzzyContainsMatch(value: unknown, search: unknown): boolean {
	const haystack = toSearchString(value).toLowerCase();
	const needle = toSearchString(search).toLowerCase();

	if (needle.length === 0) {
		return true;
	}

	if (haystack.includes(needle)) {
		return true;
	}

	return fuzzyEquals(needle, haystack, false);
}

export interface CTEContext<T> {
	results: Record<string, T[]>;
}

export function createCTEContext<T>(): CTEContext<T> {
	return {
		results: {},
	};
}

export function applyNestedCTEs<T>(
	cte: CTE<T>,
	docs: T[],
	context: CTEContext<T>,
): void {
	if (!cte.ctes) {
		return;
	}

	for (const [name, nestedCTE] of Object.entries(cte.ctes)) {
		applyNestedCTEs(nestedCTE, docs, context);
		const nestedResults = applyFiltersWithContext(docs, nestedCTE, context);
		context.results[name] = nestedResults;
	}
}

function isNumber(value: unknown): value is number {
	return typeof value === "number" && !Number.isNaN(value);
}

function applyFiltersInternal<T>(
	docs: T[],
	filters?: CTEFilter<T>[],
	context?: CTEContext<T>,
): T[] {
	if (!filters || filters.length === 0) {
		return docs;
	}

	const filtered: T[] = [];

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

export function applyFilter<T>(
	filter: CTEFilter<T>,
	doc: T,
	context?: CTEContext<T>,
): boolean {
	if (filter.type === "comparison") {
		const fieldValue = getFieldValue(doc, filter.field);

		switch (filter.operator) {
			case "equal":
				return fieldValue === filter.value;
			case "notEqual":
				return fieldValue !== filter.value;
			case "greaterThan":
				return (
					isNumber(fieldValue) &&
					isNumber(filter.value) &&
					fieldValue > filter.value
				);
			case "lessThan":
				return (
					isNumber(fieldValue) &&
					isNumber(filter.value) &&
					fieldValue < filter.value
				);
			case "greaterThanOrEqual":
				return (
					isNumber(fieldValue) &&
					isNumber(filter.value) &&
					fieldValue >= filter.value
				);
			case "lessThanOrEqual":
				return (
					isNumber(fieldValue) &&
					isNumber(filter.value) &&
					fieldValue <= filter.value
				);
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
				return assertNever(filter as never);
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
				return assertNever(filter as never);
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
			const fieldValue = getFieldValue(doc, filter.field);
			const existsInCTE = cteResults.some(
				// biome-ignore lint/style/noNonNullAssertion: checked above
				(cteDoc) => getFieldValue(cteDoc, filter.field!) === fieldValue,
			);
			return filter.operator === "in" ? existsInCTE : !existsInCTE;
		}
		const existsInCTE = cteResults.includes(doc);
		return filter.operator === "in" ? existsInCTE : !existsInCTE;
	}

	return assertNever(filter);
}

export function applyFiltersWithContext<T>(
	docs: T[],
	cte: CTE<T>,
	context: CTEContext<T>,
): T[] {
	return applyFiltersInternal(docs, cte.filters, context);
}

export function applyFilters<T>(docs: T[], cte: CTE<T>): T[] {
	return applyFiltersInternal(docs, cte.filters);
}
