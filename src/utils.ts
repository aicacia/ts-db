import type { CTEOrderBy } from "./cte.js";
import type { FieldPath } from "./types.js";

/**
 * Compare two values for sorting.
 * Null/undefined values sort last.
 */
export function compareValues(a: unknown, b: unknown): number {
	if (a === null || a === undefined) return 1;
	if (b === null || b === undefined) return -1;
	if (a === b) return 0;

	const aType = typeof a;
	const bType = typeof b;

	if (aType !== bType) {
		return aType < bType ? -1 : 1;
	}

	if (
		aType === "string" ||
		aType === "number" ||
		aType === "bigint" ||
		aType === "boolean"
	) {
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	}

	const aString = String(a);
	const bString = String(b);
	if (aString < bString) return -1;
	if (aString > bString) return 1;
	return 0;
}

/**
 * Get nested field value from document using dot notation.
 */
export function getFieldValue<T>(doc: T, field: FieldPath<T>): unknown {
	const parts = field.split(".");
	let value: unknown = doc;

	for (const part of parts) {
		if (value === null || value === undefined) return undefined;
		value = (value as Record<string, unknown>)[part];
	}

	return value;
}

/**
 * Create a comparator function for sorting documents by multiple fields.
 */
export function createItemSortFunction<T>(
	orderBy: CTEOrderBy<T>[],
): (a: T, b: T) => number {
	return (a: T, b: T) => {
		for (const order of orderBy) {
			const aVal = getFieldValue(a, order.field);
			const bVal = getFieldValue(b, order.field);

			const comparison = compareValues(aVal, bVal);
			if (comparison !== 0) {
				return order.direction === "asc" ? comparison : -comparison;
			}
		}
		return 0;
	};
}

/**
 * Callback invoked when an error occurs while dispatching an update.
 */
export type ErrorCallback = (error: Error) => void;

/**
 * Invoke a callback safely and optionally report any failure to an error handler.
 * If the callback throws and the error handler is provided, the error handler is called.
 * If the error handler also throws, that failure is propagated unless swallowOnErrorFailures is true.
 */
export function safeInvoke<T>(
	callback: (value: T) => void,
	value: T,
	onError?: ErrorCallback,
	swallowOnErrorFailures = false,
): Error | undefined {
	try {
		callback(value);
		return undefined;
	} catch (error) {
		const normalized = toError(error);
		if (!onError) {
			return normalized;
		}

		try {
			onError(normalized);
			return undefined;
		} catch (handlerError) {
			if (swallowOnErrorFailures) {
				return undefined;
			}
			return toError(handlerError);
		}
	}
}

/**
 * Normalize unknown error to Error instance.
 */
export function toError(error: unknown): Error {
	return error instanceof Error ? error : new Error(String(error));
}
