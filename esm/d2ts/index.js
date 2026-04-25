import { D2, MessageType, filter, orderBy, output, } from "@electric-sql/d2ts";
import { applyFilter } from "../query/filterEngine.js";
import { createItemSortFunction } from "../utils/index.js";
function toResultArray(materialized, cte) {
    const results = [];
    for (const { doc, multiplicity } of materialized.values()) {
        const copies = Math.max(0, multiplicity);
        for (let index = 0; index < copies; index++) {
            results.push(doc);
        }
    }
    if (cte.orderBy && cte.orderBy.length > 0) {
        results.sort(createItemSortFunction(cte.orderBy));
    }
    if (cte.offset !== undefined && cte.offset > 0) {
        results.splice(0, cte.offset);
    }
    if (cte.limit !== undefined && cte.limit > 0 && results.length > cte.limit) {
        results.length = cte.limit;
    }
    return results;
}
export function createIncrementalQuery(cte) {
    const graph = new D2({ initialFrontier: 0 });
    const input = graph.newInput();
    let stream = input;
    if (cte.filters && cte.filters.length > 0) {
        stream = stream.pipe(filter(([_, doc]) => {
            // biome-ignore lint/style/noNonNullAssertion: checked above
            return cte.filters.every((entry) => applyFilter(entry, doc));
        }));
    }
    if (cte.orderBy && cte.orderBy.length > 0) {
        stream = stream.pipe(orderBy((doc) => doc, {
            // biome-ignore lint/style/noNonNullAssertion: checked above
            comparator: createItemSortFunction(cte.orderBy),
        }));
    }
    const materialized = new Map();
    let hasPendingResultDelta = false;
    stream.pipe(output((message) => {
        if (message.type !== MessageType.DATA) {
            return;
        }
        for (const [[key, doc], multiplicity,] of message.data.collection.getInner()) {
            const existing = materialized.get(key);
            const existingMultiplicity = existing?.multiplicity ?? 0;
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
        cachedResults = toResultArray(materialized, {
            ...cte,
            orderBy: undefined,
        });
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