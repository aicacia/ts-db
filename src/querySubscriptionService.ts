import type { SourceAdapter, UnsubscribeFn } from "./types.js";
import { getCTEIdentity, type CTE } from "./cte.js";
import { toError } from "./utils.js";
import {
	createSubscriptionManager,
	type SubscriptionAdapter,
	type SubscriptionManager,
} from "./subscriptionManager.js";
import type { SourceSubscription } from "./sourceSubscription.js";
import { createSourceSubscription } from "./sourceSubscription.js";
import type {
	QuerySubscriptionCallback,
	QuerySubscriptionResult,
} from "./queryBuilder.js";
import type { QueryExecutionPort } from "./queryExecution.js";
import { createDefaultQueryExecutionPort } from "./queryExecution.js";

export type { QueryExecutionPort } from "./queryExecution.js";

export interface QuerySubscriptionServiceConfig<T> {
	source?: SourceAdapter<T>;
	sourceSubscription?: SourceSubscription<T>;
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

export const createQuerySubscriptionAdapter = <T>(
	cte: CTE<T>,
	sourceSubscription: SourceSubscription<T>,
	queryExecutor: QueryExecutionPort<T>,
): SubscriptionAdapter<T> => {
	return {
		subscribe(onUpdate, onError) {
			return sourceSubscription.subscribe(
				(docs) => {
					let results: T[];
					try {
						results = queryExecutor.execute(cte, [...docs]);
					} catch (err) {
						try {
							onError(toError(err));
						} catch (e) {
							throw toError(e);
						}
						return;
					}

					try {
						onUpdate(results);
					} catch (uErr) {
						try {
							onError(toError(uErr));
						} catch (e) {
							throw toError(e);
						}
					}
				},
				onError,
			);
		},

		fetchSnapshot: () =>
			queryExecutor.execute(cte, [...sourceSubscription.fetchSnapshot()]),
	};
};

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
			return queryExecutor.execute(cte, [
				...sourceSubscription.fetchSnapshot(),
			]);
		},
	};
}
