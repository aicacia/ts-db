import type { SourceAdapter, UnsubscribeFn } from "../types/index.js";
import { getCTEIdentity } from "./cte.js";
import type { CTE } from "./cte.js";
import {
	createSubscriptionManager,
	type SubscriptionAdapter,
	type SubscriptionManager,
} from "./subscriptionManager.js";
import type { SourceSubscription } from "./sourceSubscription.js";
import { createSourceSubscription } from "./sourceSubscription.js";
import type {
	IQueryBuilder,
	QuerySubscriptionCallback,
	QuerySubscriptionResult,
} from "./queryBuilder.js";
import { createQueryBuilder } from "./queryBuilder.js";
import type { QueryExecutionPort } from "./queryExecution.js";
import { createDefaultQueryExecutionPort } from "./queryExecution.js";
import { createQuerySubscriptionAdapter } from "./querySubscriptionAdapter.js";

export type { QueryExecutionPort } from "./queryExecution.js";

export interface QuerySubscriptionServiceConfig<T> {
	source?: SourceAdapter<T, CTE<T>>;
	sourceSubscription?: SourceSubscription<T, CTE<T>>;
	subscriptionManager?: SubscriptionManager<T>;
	queryExecutor?: QueryExecutionPort<T>;
	keySerializer?: (cte: CTE<T>) => string;
}

export type QueryServiceConfig<T> = QuerySubscriptionServiceConfig<T>;
export type QueryService<T> = QuerySubscriptionService<T>;

export interface QuerySubscriptionService<T> {
	subscribe(
		cte: CTE<T>,
		callbacks: QuerySubscriptionCallback<T>,
	): UnsubscribeFn;
	createSubscription(cte: CTE<T>): QuerySubscriptionResult<T>;
	createQueryBuilder(): IQueryBuilder<T>;
	fetchSnapshot(cte: CTE<T>): T[];
}

class QuerySubscriptionServiceImpl<T> implements QuerySubscriptionService<T> {
	private readonly sourceSubscription: SourceSubscription<T, CTE<T>>;
	private readonly subscriptionManager: SubscriptionManager<T>;
	private readonly queryExecutor: QueryExecutionPort<T>;
	private readonly serializeKey: (cte: CTE<T>) => string;

	constructor(config: QuerySubscriptionServiceConfig<T>) {
		if (!config.source && !config.sourceSubscription) {
			throw new Error(
				"QuerySubscriptionService requires either source or sourceSubscription",
			);
		}

		this.sourceSubscription =
			config.sourceSubscription ??
			createSourceSubscription(config.source as SourceAdapter<T, CTE<T>>);
		this.subscriptionManager =
			config.subscriptionManager ?? createSubscriptionManager<T>();
		this.queryExecutor =
			config.queryExecutor ?? createDefaultQueryExecutionPort<T>();
		this.serializeKey = config.keySerializer ?? getCTEIdentity;
	}

	subscribe(
		cte: CTE<T>,
		callbacks: QuerySubscriptionCallback<T>,
	): UnsubscribeFn {
		return this.createSubscription(cte)(callbacks);
	}

	createSubscription(cte: CTE<T>): QuerySubscriptionResult<T> {
		const subscriptionKey = this.serializeKey(cte);

		const adapterFactory = (): SubscriptionAdapter<T> =>
			createQuerySubscriptionAdapter(cte, this.sourceSubscription, this.queryExecutor);

		return (callbacks) => {
			return this.subscriptionManager.subscribe({
				id: subscriptionKey,
				adapterFactory,
				onUpdate: callbacks.onUpdate,
				onError: callbacks.onError,
			});
		};
	}

	createQueryBuilder(): IQueryBuilder<T> {
		return createQueryBuilder((cte: CTE<T>) => this.createSubscription(cte));
	}

	fetchSnapshot(cte: CTE<T>): T[] {
		const subscriptionKey = this.serializeKey(cte);
		const snapshot = this.subscriptionManager.getSnapshot(subscriptionKey);
		if (snapshot !== null) {
			return snapshot;
		}

		const snapshotProvider = this.sourceSubscription.getSnapshot;
		if (!snapshotProvider) {
			throw new Error(
				"Source subscription does not support snapshot retrieval",
			);
		}

		const sourceDocs = snapshotProvider.call(this.sourceSubscription);

		return this.queryExecutor.execute(cte, [...sourceDocs]);
	}
}

export function createQuerySubscriptionService<T>(
	config: QuerySubscriptionServiceConfig<T>,
): QuerySubscriptionService<T> {
	return new QuerySubscriptionServiceImpl(config);
}

export function createQueryService<T>(
	config: QueryServiceConfig<T>,
): QueryService<T> {
	return createQuerySubscriptionService(config);
}
