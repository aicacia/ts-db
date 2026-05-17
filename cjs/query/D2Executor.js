"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.D2Executor = void 0;
const string_fuzzy_equals_1 = require("@aicacia/string-fuzzy_equals");
const d2ts_1 = require("@electric-sql/d2ts");
const field_js_1 = require("../field.js");
const sort_js_1 = require("./sort.js");
function createComparisonPredicate(filter) {
    const fieldValue = (doc) => (0, field_js_1.getFieldValue)(doc, filter.field);
    const expected = filter.value;
    switch (filter.operator) {
        case "equal":
            return (doc) => fieldValue(doc) === expected;
        case "notEqual":
            return (doc) => fieldValue(doc) !== expected;
        case "greaterThan":
            return (doc) => (0, sort_js_1.compareValues)(fieldValue(doc), expected) > 0;
        case "lessThan":
            return (doc) => (0, sort_js_1.compareValues)(fieldValue(doc), expected) < 0;
        case "greaterThanOrEqual":
            return (doc) => (0, sort_js_1.compareValues)(fieldValue(doc), expected) >= 0;
        case "lessThanOrEqual":
            return (doc) => (0, sort_js_1.compareValues)(fieldValue(doc), expected) <= 0;
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
                    return (0, string_fuzzy_equals_1.fuzzyEquals)(expected, value, false);
                }
                if (Array.isArray(value)) {
                    return value.some((item) => typeof item === "string" && (0, string_fuzzy_equals_1.fuzzyEquals)(expected, item, false));
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
    var _a;
    let stream = root;
    const filters = cte.filters;
    if (filters === null || filters === void 0 ? void 0 : filters.length) {
        const filterPredicate = (doc) => filters.every((filter) => createFilterPredicate(filter)(doc));
        stream = stream.pipe((0, d2ts_1.filter)(filterPredicate));
    }
    if ((_a = cte.orderBy) === null || _a === void 0 ? void 0 : _a.length) {
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
        if (message.type === d2ts_1.MessageType.DATA) {
            return flattenDocs(message.data.collection.getInner());
        }
    }
    return [];
}
function applyLimitOffset(results, cte) {
    var _a, _b;
    let orderedResults = results;
    const orderBy = cte.orderBy;
    if (orderBy === null || orderBy === void 0 ? void 0 : orderBy.length) {
        orderedResults = (0, sort_js_1.stableSortWithTieBreaker)([...results], (a, b) => (0, sort_js_1.compareOrderValues)(a, b, orderBy));
    }
    const offset = (_a = cte.offset) !== null && _a !== void 0 ? _a : 0;
    const limit = (_b = cte.limit) !== null && _b !== void 0 ? _b : orderedResults.length;
    return orderedResults.slice(offset, offset + limit);
}
class D2Executor {
    execute(cte, source = [], joins = []) {
        const graph = new d2ts_1.D2({ initialFrontier: 0 });
        const root = graph.newInput();
        const stream = createPipeline(root, cte);
        graph.finalize();
        const reader = stream.connectReader();
        let version = 0;
        let subscriber = null;
        const joinDefs = joins !== null && joins !== void 0 ? joins : [];
        const rightCache = new Map();
        let rightUnsubs = [];
        const getResults = () => {
            var _a;
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
                const rightDocs = (_a = rightCache.get(collectionId)) !== null && _a !== void 0 ? _a : [];
                joinedResults = joinedResults
                    .map((left) => {
                    const leftKey = (0, field_js_1.getFieldValue)(left, join.leftField);
                    const matches = rightDocs.filter((right) => {
                        var _a;
                        return (0, field_js_1.getFieldValue)(right, ((_a = join.rightField) !== null && _a !== void 0 ? _a : join.leftField)) === leftKey;
                    });
                    if (join.type === "inner" && matches.length === 0) {
                        return null;
                    }
                    return Object.assign(Object.assign({}, left), { [collectionId]: matches });
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
                    }, onError !== null && onError !== void 0 ? onError : (() => { }));
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
exports.D2Executor = D2Executor;
//# sourceMappingURL=D2Executor.js.map