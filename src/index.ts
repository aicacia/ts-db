// Collection

export type { MemoryCollectionAdapterOptions } from "./adapters/MemoryCollectionAdapter.js";
// Adapters
export { MemoryCollectionAdapter } from "./adapters/MemoryCollectionAdapter.js";
export type { MemorySingletonAdapterOptions } from "./adapters/MemorySingletonAdapter.js";
export { MemorySingletonAdapter } from "./adapters/MemorySingletonAdapter.js";
export type {
	CollectionConfig,
	CollectionInterface,
} from "./collection/Collection.js";
export { Collection, createCollection } from "./collection/Collection.js";
// Field utilities
export type { FieldPath } from "./field.js";
export { getFieldValue } from "./field.js";
export type {
	CTE,
	CTEComparisonOperator,
	CTEFilter,
	CTEJoin,
	CTEOrderBy,
} from "./query/cte.js";
export {
	compare,
	contains,
	containsIgnoreCase,
	createCTE,
	equal,
	fuzzyContains,
	getCTEIdentity,
	greaterThan,
	greaterThanOrEqual,
	includes,
	inOperator,
	lessThan,
	lessThanOrEqual,
	notEqual,
} from "./query/cte.js";
export { D2Executor } from "./query/D2Executor.js";
export type {
	QueryExecutor,
	QueryJoinDescriptor,
	QuerySubscription,
} from "./query/executor.js";
// Query/CTE
export type { QueryBuilderInterface } from "./query/QueryBuilder.js";
// Singleton
export type {
	SingletonConfig,
	SingletonInterface,
} from "./singleton/Singleton.js";
export { createSingleton, Singleton } from "./singleton/Singleton.js";

// Core types
export type { AdapterStatus, Constructor, UnsubscribeFn } from "./types.js";
