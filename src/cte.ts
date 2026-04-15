import type { FieldPath } from "./types.js";

export interface CTE<T> {
	version: "1.0";
	name?: string;
	columns?: string[];
	filters?: CTEFilter<T>[];
	orderBy?: CTEOrderBy<T>[];
	limit?: number;
	offset?: number;
	ctes?: Record<string, CTE<T>>;
}

export type CTEFilter<T> =
	| CTEComparisonFilter<T>
	| CTELogicalFilter<T>
	| CTEReferenceFilter<T>;

export interface CTEComparisonFilter<T> {
	type: "comparison";
	operator: CTEComparisonOperator;
	field: FieldPath<T>;
	value: unknown;
}

export interface CTEReferenceFilter<T> {
	type: "reference";
	operator: "in" | "notIn";
	cteName: string;
	field?: FieldPath<T>;
}

export type CTEComparisonOperator =
	| "equal"
	| "notEqual"
	| "greaterThan"
	| "lessThan"
	| "greaterThanOrEqual"
	| "lessThanOrEqual"
	| "in"
	| "contains"
	| "containsIgnoreCase"
	| "fuzzyContains"
	| "includes";

export interface CTELogicalFilter<T> {
	type: "logical";
	operator: "and" | "or";
	filters: CTEFilter<T>[];
}

export interface CTEOrderBy<T> {
	field: FieldPath<T>;
	direction: "asc" | "desc";
}

type IdentityPrimitive = string | number | boolean | null;
type IdentityValue =
	| IdentityPrimitive
	| IdentityValue[]
	| { [key: string]: IdentityValue };

export function createCTE<T>(): CTE<T> {
	return {
		version: "1.0",
	};
}

function normalizeIdentityValue(
	value: unknown,
	seen: WeakSet<object>,
): IdentityValue {
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

	if (
		typeof value === "string" ||
		typeof value === "boolean" ||
		typeof value === "undefined" ||
		typeof value === "symbol" ||
		typeof value === "function"
	) {
		return value === undefined ? "__undefined" : String(value);
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeIdentityValue(item, seen));
	}

	if (typeof value === "object") {
		const objectValue = value as Record<string, unknown>;
		if (seen.has(objectValue)) {
			throw new Error(
				"Circular reference detected while generating CTE identity",
			);
		}

		seen.add(objectValue);

		const entries = Object.entries(objectValue)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right));

		const normalized: { [key: string]: IdentityValue } = {};
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
export { getCTEIdentity } from "./queryIdentity.js";

export function compare<T>(
	field: FieldPath<T>,
	operator: CTEComparisonOperator,
	value: unknown,
): CTEComparisonFilter<T> {
	return {
		type: "comparison",
		operator,
		field,
		value,
	};
}

export function equal<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "equal", value);
}

export function notEqual<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "notEqual", value);
}

export function greaterThan<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "greaterThan", value);
}

export function lessThan<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "lessThan", value);
}

export function greaterThanOrEqual<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "greaterThanOrEqual", value);
}

export function lessThanOrEqual<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "lessThanOrEqual", value);
}

export function inOperator<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "in", value);
}

export function contains<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "contains", value);
}

export function containsIgnoreCase<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "containsIgnoreCase", value);
}

export function fuzzyContains<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "fuzzyContains", value);
}

export function includes<T>(
	field: FieldPath<T>,
	value: unknown,
): CTEComparisonFilter<T> {
	return compare(field, "includes", value);
}

export function inCTE<T>(
	cteName: string,
	field?: FieldPath<T>,
): CTEReferenceFilter<T> {
	return {
		type: "reference",
		operator: "in",
		cteName,
		field,
	};
}

export function notInCTE<T>(
	cteName: string,
	field?: FieldPath<T>,
): CTEReferenceFilter<T> {
	return {
		type: "reference",
		operator: "notIn",
		cteName,
		field,
	};
}

export function and<T>(...filters: CTEFilter<T>[]): CTELogicalFilter<T> {
	return {
		type: "logical",
		operator: "and",
		filters,
	};
}

export function or<T>(...filters: CTEFilter<T>[]): CTELogicalFilter<T> {
	return {
		type: "logical",
		operator: "or",
		filters,
	};
}
