import type { CTE } from "../cte.js";

type IdentityPrimitive = string | number | boolean | null;
type IdentityValue =
	| IdentityPrimitive
	| IdentityValue[]
	| { [key: string]: IdentityValue };

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

export function getCTEIdentity<T>(cte: CTE<T>): string {
	const normalized = normalizeIdentityValue(cte, new WeakSet<object>());
	return JSON.stringify(normalized);
}
