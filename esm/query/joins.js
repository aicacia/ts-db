import { getFieldValue } from "../utils/index.js";
export function computeJoinIndex(rightDocs, rightField) {
    const index = new Map();
    for (const doc of rightDocs) {
        const rawKey = getFieldValue(doc, rightField);
        const key = rawKey === null || rawKey === undefined ? "" : String(rawKey);
        const bucket = index.get(key) ?? [];
        bucket.push(doc);
        index.set(key, bucket);
    }
    return index;
}
export function buildJoinIndexes(joins, rightDocs) {
    return joins.map((join, index) => computeJoinIndex(rightDocs[index] ?? [], join.rightField));
}
export function applyJoins(docs, joins, rightDocs) {
    const indexes = buildJoinIndexes(joins, rightDocs);
    return docs
        .map((doc) => {
        let result = { ...doc };
        for (const [index, join] of joins.entries()) {
            const leftKey = getFieldValue(doc, join.leftField);
            const lookupKey = leftKey === null || leftKey === undefined ? "" : String(leftKey);
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
        .filter((doc) => doc !== null);
}
//# sourceMappingURL=joins.js.map