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

// Query builder types and API
export type {
	IQueryBuilder,
	OrderDirection,
	QueryCompiler,
	QuerySubscriptionResult,
} from "./query/queryBuilder.js";
export { QueryBuilder, createQueryBuilder } from "./query/queryBuilder.js";

// CTE types and operations
export type { CTE, CTEFilter, CTEOrderBy } from "./cte.js";
export {
	and,
	compare,
	contains,
	containsIgnoreCase,
	createCTE,
	equal,
	fuzzyContains,
	getCTEIdentity,
	greaterThan,
	greaterThanOrEqual,
	inCTE,
	inOperator,
	includes,
	lessThan,
	lessThanOrEqual,
	notEqual,
	notInCTE,
	or,
} from "./cte.js";

// Adapters
export { MemoryAdapter, MemorySingletonAdapter } from "./memoryAdapter.js";
export { HttpSourceAdapter } from "./httpAdapter.js";
export type {
	HttpSourceAdapterConfig,
	HttpSourceAdapterLiveConfig,
	HttpOperation,
	LiveTransportMethod,
} from "./httpAdapter.js";
export type {
	SubscriptionAdapter,
	SubscriptionAdapterFactory,
} from "./query/subscriptionManager.js";
export {
	SubscriptionManager,
	createSubscriptionManager,
} from "./query/subscriptionManager.js";
export type { SourceSubscription } from "./query/sourceSubscription.js";
export { createSourceSubscription } from "./query/sourceSubscription.js";
export type {
	QueryExecutionPort,
	QuerySubscriptionServiceConfig,
	QuerySubscriptionService,
} from "./query/querySubscriptionService.js";
export { createQuerySubscriptionService } from "./query/querySubscriptionService.js";

// Filter engine
export {
	applyCTE,
	applyFilter,
	applyOrderBy,
	applyPagination,
} from "./filterEngine.js";

// Utilities
export { getFieldValue } from "./utils.js";

// Test utilities
export {
	createTestCollection,
	createTestSingleton,
	type TestCollectionResult,
	type TestSingletonResult,
} from "./test-utils.js";
