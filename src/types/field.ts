type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type FieldKey<T> = Extract<keyof T, string>;

export type FieldPath<T, D extends number = 3> = [D] extends [0]
	? FieldKey<T>
	: T extends object
	? FieldKey<T> | `${FieldKey<T>}.${FieldPath<NonNullable<T[FieldKey<T>]>, Prev[D]>}`
	: never;
