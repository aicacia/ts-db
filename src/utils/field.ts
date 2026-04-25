import type { FieldPath } from "../types/index.js";

/** Get nested field value from document using dot notation. */
export function getFieldValue<T>(doc: T, field: FieldPath<T>): unknown {
	const parts = field.split(".");
	let value: unknown = doc;

	for (const part of parts) {
		if (value === null || value === undefined || typeof value !== "object") {
			return undefined;
		}
		value = (value as Record<string, unknown>)[part];
	}

	return value;
}
