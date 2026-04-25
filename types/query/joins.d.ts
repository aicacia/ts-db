import type { FieldPath } from "../types/index.js";
import type { ICollection } from "../collection/index.js";
export type JoinType = "inner" | "left";
export type JoinResult<Right> = Record<string, Right[]>;
export interface JoinConfig<Left> {
    collection: ICollection<unknown>;
    leftField: FieldPath<Left>;
    rightField: FieldPath<unknown>;
    type: JoinType;
}
export declare function computeJoinIndex(rightDocs: unknown[], rightField: FieldPath<unknown>): Map<string, unknown[]>;
export declare function buildJoinIndexes<T>(joins: JoinConfig<T>[], rightDocs: unknown[][]): Map<string, unknown[]>[];
export declare function applyJoins<T>(docs: T[], joins: JoinConfig<T>[], rightDocs: unknown[][]): Array<T & Record<string, unknown[]>>;
//# sourceMappingURL=joins.d.ts.map