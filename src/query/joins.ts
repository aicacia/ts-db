import type { FieldPath } from "../types/index.js";
import type { ICollection } from "../collection/index.js";
import { getFieldValue } from "../utils/index.js";

export type JoinType = "inner" | "left";

export type JoinResult<Right> = Record<string, Right[]>;

export interface JoinConfig<Left> {
	collection: ICollection<unknown>;
	leftField: FieldPath<Left>;
	rightField: FieldPath<unknown>;
	type: JoinType;
}

export function computeJoinIndex(
	rightDocs: unknown[],
	rightField: FieldPath<unknown>,
): Map<string, unknown[]> {
	const index = new Map<string, unknown[]>();

	for (const doc of rightDocs) {
		const rawKey = getFieldValue(doc, rightField);
		const key = rawKey === null || rawKey === undefined ? "" : String(rawKey);
		const bucket = index.get(key) ?? [];
		bucket.push(doc);
		index.set(key, bucket);
	}

	return index;
}

export function buildJoinIndexes<T>(
	joins: JoinConfig<T>[],
	rightDocs: unknown[][],
) {
	return joins.map((join, index) =>
		computeJoinIndex(rightDocs[index] ?? [], join.rightField),
	);
}

export function applyJoins<T>(
	docs: T[],
	joins: JoinConfig<T>[],
	rightDocs: unknown[][],
): Array<T & Record<string, unknown[]>> {
	const indexes = buildJoinIndexes(joins, rightDocs);

	return docs
		.map((doc) => {
			let result = { ...doc } as T & Record<string, unknown[]>;

			for (const [index, join] of joins.entries()) {
				const leftKey = getFieldValue(doc, join.leftField);
				const lookupKey =
					leftKey === null || leftKey === undefined ? "" : String(leftKey);
				const matches = indexes[index]?.get(lookupKey) ?? [];

				result = {
					...result,
					[join.collection.id]: matches,
				};

				if (join.type === "inner" && matches.length === 0) {
					return null;
				}
			}

			return result;
		})
		.filter((doc): doc is T & Record<string, unknown[]> => doc !== null);
}
