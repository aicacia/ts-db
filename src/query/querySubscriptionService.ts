import type { SourceAdapter, UnsubscribeFn } from "../types.js";
import { getCTEIdentity } from "./cte.js";
import type { CTE } from "./cte.js";
import { toError } from "../utils.js";
import {
	createSubscriptionManager,
	type SubscriptionManager,
	type SubscriptionAdapter,
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
	createQueryBuilder(): IQueryBuilder<T>;
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

	let sourceSubscription: SubscriptionAdapter<T>;
	if (config.sourceSubscription) {
		sourceSubscription = config.sourceSubscription;
	} else if (config.source) {
		sourceSubscription = createSourceSubscription(config.source);
	} else {
		throw new Error(
			"QuerySubscriptionService requires either source or sourceSubscription",
		);
	}
	const subscriptionManager =
		config.subscriptionManager ?? createSubscriptionManager<T>();
	const queryExecutor: QueryExecutionPort<T> =
		config.queryExecutor ?? createDefaultQueryExecutionPort<T>();
	const serializeKey = config.keySerializer ?? getCTEIdentity;

	const createQuerySubscription = (cte: CTE<T>): QuerySubscriptionResult<T> => {
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

	const createQueryBuilderForService = (): IQueryBuilder<T> => {
		return createQueryBuilder((cte: CTE<T>) => createQuerySubscription(cte));
	};

	return {
		subscribe(cte, callbacks) {
			return createQuerySubscription(cte)(callbacks);
		},

		createSubscription: createQuerySubscription,
		createQueryBuilder: createQueryBuilderForService,

		fetchSnapshot(cte: CTE<T>) {
			const subscriptionKey = serializeKey(cte);
			const snapshot = subscriptionManager.getSnapshot(subscriptionKey);
			if (snapshot !== null) {
				return snapshot;
			}

			const snapshotProvider = sourceSubscription.getSnapshot;
			if (!snapshotProvider) {
				throw new Error(
					"Source subscription does not support snapshot retrieval",
				);
			}

			const sourceDocs = snapshotProvider.call(sourceSubscription, cte);

			return queryExecutor.execute(cte, [...sourceDocs]);
		},
	};
}
