// Collection
export type {
	CollectionConfig,
	CollectionInterface,
} from "./collection/Collection.js";
export { Collection, createCollection } from "./collection/Collection.js";

// Singleton
export type {
	SingletonConfig,
	SingletonInterface,
} from "./singleton/Singleton.js";
export { Singleton, createSingleton } from "./singleton/Singleton.js";

// Adapters
export { MemoryCollectionAdapter } from "./adapters/MemoryCollectionAdapter.js";
export { MemorySingletonAdapter } from "./adapters/MemorySingletonAdapter.js";
export type { MemoryCollectionAdapterOptions } from "./adapters/MemoryCollectionAdapter.js";
export type { MemorySingletonAdapterOptions } from "./adapters/MemorySingletonAdapter.js";

// Query/CTE
export type { QueryBuilderInterface } from "./query/QueryBuilder.js";
export type {
	CTE,
	CTEFilter,
	CTEOrderBy,
	CTEJoin,
	CTEComparisonOperator,
} from "./query/cte.js";
export type {
	QueryExecutor,
	QueryJoinDescriptor,
	QuerySubscription,
} from "./query/executor.js";
export {
	createCTE,
	getCTEIdentity,
	compare,
	equal,
	notEqual,
	greaterThan,
	lessThan,
	greaterThanOrEqual,
	lessThanOrEqual,
	inOperator,
	contains,
	containsIgnoreCase,
	fuzzyContains,
	includes,
} from "./query/cte.js";
export { D2Executor } from "./query/D2Executor.js";

// Field utilities
export type { FieldPath } from "./field.js";
export { getFieldValue } from "./field.js";

// Core types
export type { AdapterStatus, UnsubscribeFn, Constructor } from "./types.js";
