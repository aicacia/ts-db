import { createCollection } from "../collection/index.js";
import { createSingleton } from "../singleton/index.js";
import { MemoryAdapter, MemorySingletonAdapter } from "../adapters/index.js";
/** Create a test collection backed by `MemoryAdapter`. */
// biome-ignore lint/suspicious/noExplicitAny: need to support any object
export function createTestCollection(docs, keyField = "id") {
    const adapter = new MemoryAdapter(keyField, docs);
    const collection = createCollection({
        id: `test-${Math.random().toString(36).substring(2, 9)}`,
        source: adapter,
        keyOf: (doc) => String(doc[keyField]),
    });
    return { collection, adapter };
}
/** Create a test singleton backed by `MemorySingletonAdapter`. */
export function createTestSingleton(initialValue) {
    const adapter = new MemorySingletonAdapter(initialValue);
    const singleton = createSingleton({
        id: `test-singleton-${Math.random().toString(36).substring(2, 9)}`,
        source: adapter,
    });
    return { singleton, adapter };
}
//# sourceMappingURL=index.js.map