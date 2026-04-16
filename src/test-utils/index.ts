import { createCollection, type ICollection } from "../collection/index.js";
import { createSingleton, type ISingleton } from "../singleton/index.js";
import { MemoryAdapter, MemorySingletonAdapter } from "../adapters/index.js";

// biome-ignore lint/suspicious/noExplicitAny: need to support any object
export interface TestCollectionResult<T extends Record<string, any>> {
	collection: ICollection<T>;
	adapter: MemoryAdapter<T>;
}

/** Result from `createTestSingleton`. */
export interface TestSingletonResult<T> {
	singleton: ISingleton<T>;
	adapter: MemorySingletonAdapter<T>;
}

/** Create a test collection backed by `MemoryAdapter`. */
// biome-ignore lint/suspicious/noExplicitAny: need to support any object
export function createTestCollection<T extends Record<string, any>>(
	docs?: T[],
	keyField = "id",
): TestCollectionResult<T> {
	const adapter = new MemoryAdapter<T>(keyField, docs);
	const collection = createCollection({
		id: `test-${Math.random().toString(36).substring(2, 9)}`,
		source: adapter,
		keyOf: (doc) => String(doc[keyField]),
	});

	return { collection, adapter };
}

/** Create a test singleton backed by `MemorySingletonAdapter`. */
export function createTestSingleton<T>(
	initialValue?: T,
): TestSingletonResult<T> {
	const adapter = new MemorySingletonAdapter<T>(initialValue);
	const singleton = createSingleton({
		id: `test-singleton-${Math.random().toString(36).substring(2, 9)}`,
		source: adapter,
	});

	return { singleton, adapter };
}
