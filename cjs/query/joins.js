"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeJoinIndex = computeJoinIndex;
exports.buildJoinIndexes = buildJoinIndexes;
exports.applyJoins = applyJoins;
const index_js_1 = require("../utils/index.js");
function computeJoinIndex(rightDocs, rightField) {
    var _a;
    const index = new Map();
    for (const doc of rightDocs) {
        const rawKey = (0, index_js_1.getFieldValue)(doc, rightField);
        const key = rawKey === null || rawKey === undefined ? "" : String(rawKey);
        const bucket = (_a = index.get(key)) !== null && _a !== void 0 ? _a : [];
        bucket.push(doc);
        index.set(key, bucket);
    }
    return index;
}
function buildJoinIndexes(joins, rightDocs) {
    return joins.map((join, index) => { var _a; return computeJoinIndex((_a = rightDocs[index]) !== null && _a !== void 0 ? _a : [], join.rightField); });
}
function applyJoins(docs, joins, rightDocs) {
    const indexes = buildJoinIndexes(joins, rightDocs);
    return docs
        .map((doc) => {
        var _a, _b;
        let result = Object.assign({}, doc);
        for (const [index, join] of joins.entries()) {
            const leftKey = (0, index_js_1.getFieldValue)(doc, join.leftField);
            const lookupKey = leftKey === null || leftKey === undefined ? "" : String(leftKey);
            const matches = (_b = (_a = indexes[index]) === null || _a === void 0 ? void 0 : _a.get(lookupKey)) !== null && _b !== void 0 ? _b : [];
            result = Object.assign(Object.assign({}, result), { [join.collection.id]: matches });
            if (join.type === "inner" && matches.length === 0) {
                return null;
            }
        }
        return result;
    })
        .filter((doc) => doc !== null);
}
//# sourceMappingURL=joins.js.map