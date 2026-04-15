import type { SourceAdapter, UnsubscribeFn } from "./types.js";
import { getCTEIdentity } from "./queryIdentity.js";
import type { CTE } from "./cte.js";
import { toError } from "./utils.js";
import {
	createSubscriptionManager,
	type SubscriptionManager,
	type SubscriptionAdapter,
} from "./subscriptionManager.js";
import type { SourceSubscription } from "./sourceSubscription.js";
import { createSourceSubscription } from "./sourceSubscription.js";
import type {
	QuerySubscriptionCallback,
	QuerySubscriptionResult,
} from "./queryBuilder.js";
import type { QueryExecutionPort } from "./queryExecution.js";
import { createDefaultQueryExecutionPort } from "./queryExecution.js";
import { createQuerySubscriptionAdapter } from "./querySubscriptionAdapter.js";

export type { QueryExecutionPort } from "./queryExecution.js";

export interface QuerySubscriptionServiceConfig<T> {
	source?: SourceAdapter<T>;
	sourceSubscription?: SubscriptionAdapter<T>;
	subscriptionManager?: SubscriptionManager<T>;
	queryExecutor?: QueryExecutionPort<T>;
	keySerializer?: (cte: CTE<T>) => string;
}

export interface QuerySubscriptionService<T> {
	subscribe(
		cte: CTE<T>,
		callbacks: QuerySubscriptionCallback<T>,
	): UnsubscribeFn;
	createSubscription(cte: CTE<T>): QuerySubscriptionResult<T>;
	fetchSnapshot(cte: CTE<T>): T[];
}

export function createQuerySubscriptionService<T>(
	config: QuerySubscriptionServiceConfig<T>,
): QuerySubscriptionService<T> {
	if (!config.source && !config.sourceSubscription) {
		throw new Error(
			"QuerySubscriptionService requires either source or sourceSubscription",
		);
	}

	const sourceSubscription =
		config.sourceSubscription ?? createSourceSubscription(config.source!);
	const subscriptionManager =
		config.subscriptionManager ?? createSubscriptionManager<T>();
	const queryExecutor: QueryExecutionPort<T> =
		config.queryExecutor ?? createDefaultQueryExecutionPort<T>();
	const serializeKey = config.keySerializer ?? getCTEIdentity;

	const createSubscription = (cte: CTE<T>): QuerySubscriptionResult<T> => {
		return (callbacks) => {
			const subscriptionKey = serializeKey(cte);

			const adapterFactory = () =>
				createQuerySubscriptionAdapter(cte, sourceSubscription, queryExecutor);

			return subscriptionManager.subscribe({
				id: subscriptionKey,
				adapterFactory,
				onUpdate: callbacks.onUpdate,
				onError: callbacks.onError,
			});
		};
	};

	return {
		subscribe(cte, callbacks) {
			return createSubscription(cte)(callbacks);
		},

		createSubscription,

		fetchSnapshot(cte: CTE<T>) {
			const subscriptionKey = serializeKey(cte);
			const snapshot = subscriptionManager.getSnapshot(subscriptionKey);
			if (snapshot !== null) {
				return snapshot;
			}

			const sourceDocs = sourceSubscription.getSnapshot?.() ?? []

			return queryExecutor.execute(cte, [...sourceDocs]);
		},
	};
}
