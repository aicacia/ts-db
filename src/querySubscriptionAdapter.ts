import type { SubscriptionAdapter } from "./subscriptionManager.js";
import type { QueryExecutionPort } from "./queryExecution.js";
import type { CTE } from "./cte.js";
import { toError } from "./utils.js";

export const createQuerySubscriptionAdapter = <T>(
	cte: CTE<T>,
	sourceAdapter: SubscriptionAdapter<T>,
	queryExecutor: QueryExecutionPort<T>,
): SubscriptionAdapter<T> => {
	return {
		subscribe(onUpdate, onError) {
			return sourceAdapter.subscribe(
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

		getSnapshot: () => {
			const sourceSnapshot = sourceAdapter.getSnapshot?.() ?? [];
			return queryExecutor.execute(cte, [...sourceSnapshot]);
		},
	};
};
