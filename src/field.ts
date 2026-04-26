type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type FieldKey<T> = Extract<keyof T, string>;

export type FieldPath<T, D extends number = 3> = [D] extends [0]
	? FieldKey<T>
	: T extends object
		?
				| FieldKey<T>
				| `${FieldKey<T>}.${FieldPath<NonNullable<T[FieldKey<T>]>, Prev[D]>}`
		: never;

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
