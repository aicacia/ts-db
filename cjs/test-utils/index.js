"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestCollection = createTestCollection;
exports.createTestSingleton = createTestSingleton;
const index_js_1 = require("../collection/index.js");
const index_js_2 = require("../singleton/index.js");
const index_js_3 = require("../adapters/index.js");
/** Create a test collection backed by `MemoryAdapter`. */
// biome-ignore lint/suspicious/noExplicitAny: need to support any object
function createTestCollection(docs, keyField = "id") {
    const adapter = new index_js_3.MemoryAdapter(keyField, docs);
    const collection = (0, index_js_1.createCollection)({
        id: `test-${Math.random().toString(36).substring(2, 9)}`,
        source: adapter,
        keyOf: (doc) => String(doc[keyField]),
    });
    return { collection, adapter };
}
/** Create a test singleton backed by `MemorySingletonAdapter`. */
function createTestSingleton(initialValue) {
    const adapter = new index_js_3.MemorySingletonAdapter(initialValue);
    const singleton = (0, index_js_2.createSingleton)({
        id: `test-singleton-${Math.random().toString(36).substring(2, 9)}`,
        source: adapter,
    });
    return { singleton, adapter };
}
//# sourceMappingURL=index.js.map