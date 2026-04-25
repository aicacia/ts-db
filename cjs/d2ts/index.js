"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIncrementalQuery = createIncrementalQuery;
const d2ts_1 = require("@electric-sql/d2ts");
const filterEngine_js_1 = require("../query/filterEngine.js");
const index_js_1 = require("../utils/index.js");
function toResultArray(materialized, cte) {
    const results = [];
    for (const { doc, multiplicity } of materialized.values()) {
        const copies = Math.max(0, multiplicity);
        for (let index = 0; index < copies; index++) {
            results.push(doc);
        }
    }
    if (cte.orderBy && cte.orderBy.length > 0) {
        results.sort((0, index_js_1.createItemSortFunction)(cte.orderBy));
    }
    if (cte.offset !== undefined && cte.offset > 0) {
        results.splice(0, cte.offset);
    }
    if (cte.limit !== undefined && cte.limit > 0 && results.length > cte.limit) {
        results.length = cte.limit;
    }
    return results;
}
function createIncrementalQuery(cte) {
    const graph = new d2ts_1.D2({ initialFrontier: 0 });
    const input = graph.newInput();
    let stream = input;
    if (cte.filters && cte.filters.length > 0) {
        stream = stream.pipe((0, d2ts_1.filter)(([_, doc]) => {
            // biome-ignore lint/style/noNonNullAssertion: checked above
            return cte.filters.every((entry) => (0, filterEngine_js_1.applyFilter)(entry, doc));
        }));
    }
    if (cte.orderBy && cte.orderBy.length > 0) {
        stream = stream.pipe((0, d2ts_1.orderBy)((doc) => doc, {
            // biome-ignore lint/style/noNonNullAssertion: checked above
            comparator: (0, index_js_1.createItemSortFunction)(cte.orderBy),
        }));
    }
    const materialized = new Map();
    let hasPendingResultDelta = false;
    stream.pipe((0, d2ts_1.output)((message) => {
        var _a;
        if (message.type !== d2ts_1.MessageType.DATA) {
            return;
        }
        for (const [[key, doc], multiplicity,] of message.data.collection.getInner()) {
            const existing = materialized.get(key);
            const existingMultiplicity = (_a = existing === null || existing === void 0 ? void 0 : existing.multiplicity) !== null && _a !== void 0 ? _a : 0;
            const nextMultiplicity = existingMultiplicity + multiplicity;
            if (nextMultiplicity <= 0) {
                if (existing) {
                    materialized.delete(key);
                    hasPendingResultDelta = true;
                }
                continue;
            }
            if (!existing ||
                existing.doc !== doc ||
                existingMultiplicity !== nextMultiplicity) {
                materialized.set(key, {
                    doc,
                    multiplicity: nextMultiplicity,
                });
                hasPendingResultDelta = true;
            }
        }
    }));
    graph.finalize();
    let version = 1;
    let cachedResults = [];
    const computeResults = () => {
        if (cte.orderBy && cte.orderBy.length > 0) {
            cachedResults = toResultArray(materialized, cte);
            return cachedResults;
        }
        cachedResults = toResultArray(materialized, Object.assign(Object.assign({}, cte), { orderBy: undefined }));
        return cachedResults;
    };
    return {
        getResults() {
            return cachedResults;
        },
        applyChanges(changes) {
            if (changes.length === 0) {
                return cachedResults;
            }
            hasPendingResultDelta = false;
            input.sendData(version, changes);
            input.sendFrontier(version + 1);
            version += 1;
            graph.run();
            if (!hasPendingResultDelta) {
                return cachedResults;
            }
            return computeResults();
        },
    };
}
//# sourceMappingURL=index.js.map