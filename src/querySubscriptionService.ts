import type { SourceAdapter, UnsubscribeFn } from "./types.js";
import { getCTEIdentity, type CTE } from "./cte.js";
import { applyCTE } from "./filterEngine.js";
import { toError } from "./utils.js";
import {
	createSubscriptionManager,
	type SubscriptionManager,
} from "./subscriptionManager.js";
import type { SourceSubscription } from "./sourceSubscription.js";
import { createSourceSubscription } from "./sourceSubscription.js";
import type {
	QuerySubscriptionCallback,
	QuerySubscriptionResult,
} from "./queryBuilder.js";

export interface QueryExecutionPort<T> {
	execute(cte: CTE<T>, docs: T[]): T[];
}

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
	const queryExecutor: QueryExecutionPort<T> = config.queryExecutor ?? {
		execute(cte: CTE<T>, docs: T[]) {
			return applyCTE(cte, docs);
		},
	};
	const serializeKey = config.keySerializer ?? getCTEIdentity;

	const createSubscription = (cte: CTE<T>): QuerySubscriptionResult<T> => {
		return (callbacks) => {
			const subscriptionKey = serializeKey(cte);

			const adapterFactory = () => {
				return {
					subscribe(
						onUpdate: (rows: T[]) => void,
						onError: (error: Error) => void,
					) {
						return sourceSubscription.subscribe((docs) => {
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
						}, onError);
					},
					fetchSnapshot: () =>
						queryExecutor.execute(cte, [
							...sourceSubscription.fetchSnapshot(),
						]),
				};
			};

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
