import { fuzzyEquals } from "@aicacia/string-fuzzy_equals";
import { D2, filter, MessageType } from "@electric-sql/d2ts";
import { getFieldValue } from "../field.js";
import { compareOrderValues, compareValues, stableSortWithTieBreaker, } from "./sort.js";
function createComparisonPredicate(filter) {
    const fieldValue = (doc) => getFieldValue(doc, filter.field);
    const expected = filter.value;
    switch (filter.operator) {
        case "equal":
            return (doc) => fieldValue(doc) === expected;
        case "notEqual":
            return (doc) => fieldValue(doc) !== expected;
        case "greaterThan":
            return (doc) => compareValues(fieldValue(doc), expected) > 0;
        case "lessThan":
            return (doc) => compareValues(fieldValue(doc), expected) < 0;
        case "greaterThanOrEqual":
            return (doc) => compareValues(fieldValue(doc), expected) >= 0;
        case "lessThanOrEqual":
            return (doc) => compareValues(fieldValue(doc), expected) <= 0;
        case "in": {
            if (Array.isArray(expected)) {
                const expectedSet = new Set(expected);
                return (doc) => expectedSet.has(fieldValue(doc));
            }
            return (doc) => fieldValue(doc) === expected;
        }
        case "contains":
            return (doc) => {
                const value = fieldValue(doc);
                if (typeof value === "string" && typeof expected === "string") {
                    return value.includes(expected);
                }
                if (Array.isArray(value)) {
                    return value.includes(expected);
                }
                return false;
            };
        case "containsIgnoreCase": {
            if (typeof expected !== "string") {
                return () => false;
            }
            const expectedLower = expected.toLowerCase();
            return (doc) => {
                const value = fieldValue(doc);
                if (typeof value === "string") {
                    return value.toLowerCase().includes(expectedLower);
                }
                if (Array.isArray(value)) {
                    return value.some((item) => typeof item === "string" &&
                        item.toLowerCase().includes(expectedLower));
                }
                return false;
            };
        }
        case "fuzzyContains": {
            if (typeof expected !== "string") {
                return () => false;
            }
            return (doc) => {
                const value = fieldValue(doc);
                if (typeof value === "string") {
                    return fuzzyEquals(expected, value, false);
                }
                if (Array.isArray(value)) {
                    return value.some((item) => typeof item === "string" && fuzzyEquals(expected, item, false));
                }
                return false;
            };
        }
        case "includes":
            return (doc) => {
                const value = fieldValue(doc);
                if (Array.isArray(value)) {
                    return value.includes(expected);
                }
                if (typeof value === "string" && typeof expected === "string") {
                    return value.includes(expected);
                }
                return false;
            };
        default:
            return () => false;
    }
}
function createLogicalPredicate(filter) {
    const predicates = filter.filters.map(createFilterPredicate);
    if (filter.operator === "and") {
        return (doc) => predicates.every((predicate) => predicate(doc));
    }
    return (doc) => predicates.some((predicate) => predicate(doc));
}
function createFilterPredicate(filter) {
    switch (filter.type) {
        case "comparison":
            return createComparisonPredicate(filter);
        case "logical":
            return createLogicalPredicate(filter);
        case "reference":
            throw new Error("Reference filters are not supported for d2ts incremental queries");
        default:
            return () => true;
    }
}
function createPipeline(root, cte) {
    let stream = root;
    const filters = cte.filters;
    if (filters?.length) {
        const filterPredicate = (doc) => filters.every((filter) => createFilterPredicate(filter)(doc));
        stream = stream.pipe(filter(filterPredicate));
    }
    if (cte.orderBy?.length) {
        // Order and pagination are applied after extraction because the current
        // d2ts orderBy operator is not reliable for this query shape.
    }
    return stream;
}
function toMultiSetArray(docs) {
    return docs.map((doc) => [doc, 1]);
}
function flattenDocs(collection) {
    return collection.flatMap(([value, multiplicity]) => Array.from({ length: Math.max(0, multiplicity) }, () => value));
}
function extractDocuments(messages) {
    for (let index = messages.length - 1; index >= 0; index--) {
        const message = messages[index];
        if (message.type === MessageType.DATA) {
            return flattenDocs(message.data.collection.getInner());
        }
    }
    return [];
}
function applyLimitOffset(results, cte) {
    let orderedResults = results;
    const orderBy = cte.orderBy;
    if (orderBy?.length) {
        orderedResults = stableSortWithTieBreaker([...results], (a, b) => compareOrderValues(a, b, orderBy));
    }
    const offset = cte.offset ?? 0;
    const limit = cte.limit ?? orderedResults.length;
    return orderedResults.slice(offset, offset + limit);
}
export class D2Executor {
    execute(cte, source = [], joins = []) {
        const graph = new D2({ initialFrontier: 0 });
        const root = graph.newInput();
        const stream = createPipeline(root, cte);
        graph.finalize();
        const reader = stream.connectReader();
        let version = 0;
        let subscriber = null;
        const joinDefs = joins ?? [];
        const rightCache = new Map();
        let rightUnsubs = [];
        const getResults = () => {
            const dataVersion = version++;
            root.sendData(dataVersion, toMultiSetArray(source));
            root.sendFrontier(dataVersion);
            graph.run();
            const messages = reader.drain();
            const leftResults = applyLimitOffset(extractDocuments(messages), cte);
            if (!joinDefs.length) {
                return leftResults;
            }
            let joinedResults = leftResults;
            for (const join of joinDefs) {
                const collectionId = join.collection.id;
                const rightDocs = rightCache.get(collectionId) ?? [];
                joinedResults = joinedResults
                    .map((left) => {
                    const leftKey = getFieldValue(left, join.leftField);
                    const matches = rightDocs.filter((right) => getFieldValue(right, (join.rightField ?? join.leftField)) === leftKey);
                    if (join.type === "inner" && matches.length === 0) {
                        return null;
                    }
                    return {
                        ...left,
                        [collectionId]: matches,
                    };
                })
                    .filter((r) => r !== null);
            }
            return joinedResults;
        };
        const publish = () => {
            if (!subscriber) {
                return;
            }
            try {
                subscriber.onUpdate(getResults());
            }
            catch (error) {
                if (subscriber.onError) {
                    subscriber.onError(error instanceof Error ? error : new Error(String(error)));
                }
            }
        };
        return {
            subscribe(onUpdate, onError) {
                subscriber = { onUpdate, onError };
                rightUnsubs = [];
                for (const join of joinDefs) {
                    const collectionId = join.collection.id;
                    const unsub = join.collection.subscribe((docs) => {
                        rightCache.set(collectionId, docs.slice());
                        publish();
                    }, onError ?? (() => { }));
                    rightUnsubs.push(unsub);
                }
                publish();
                return () => {
                    subscriber = null;
                    for (const u of rightUnsubs)
                        u();
                    rightUnsubs = [];
                };
            },
        };
    }
}
//# sourceMappingURL=D2Executor.js.map