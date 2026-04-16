// Core types
export type {
	AdapterStatus,
	FieldPath,
	SourceAdapter,
	UnsubscribeFn,
} from "./types.js";

// Collection types and API
export type { CollectionConfig, ICollection } from "./collection.js";
export { Collection, createCollection } from "./collection.js";

// Singleton types and API
export type { SingletonConfig, ISingleton } from "./singleton.js";
export { Singleton, createSingleton } from "./singleton.js";

// Query module public API
export * from "./query/index.js";

// Adapters
export { MemoryAdapter, MemorySingletonAdapter } from "./memoryAdapter.js";
export { HttpSourceAdapter } from "./httpAdapter.js";
export type {
	HttpSourceAdapterConfig,
	HttpSourceAdapterLiveConfig,
	HttpOperation,
	LiveTransportMethod,
} from "./httpAdapter.js";

// Utilities
export { getFieldValue } from "./utils.js";

// Test utilities
export {
	createTestCollection,
	createTestSingleton,
	type TestCollectionResult,
	type TestSingletonResult,
} from "./test-utils.js";
