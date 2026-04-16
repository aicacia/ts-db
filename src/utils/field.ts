import type { FieldPath } from "../types.js";

/** Get nested field value from document using dot notation. */
export function getFieldValue<T>(doc: T, field: FieldPath<T>): unknown {
	const parts = field.split(".");
	let value: unknown = doc;

	for (const part of parts) {
		if (value === null || value === undefined) return undefined;
		value = (value as Record<string, unknown>)[part];
	}

	return value;
}
