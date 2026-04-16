import type { SubscriptionAdapter } from "./subscriptionManager.js";
import type { QueryExecutionPort } from "./queryExecution.js";
import type { CTE } from "./cte.js";
import { safeInvoke, toError } from "../utils/index.js";

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

					const updateError = safeInvoke(onUpdate, results, onError);
					if (updateError) {
						throw updateError;
					}
				},
				onError,
				cte,
			);
		},

		getSnapshot: () => {
			const sourceSnapshot = sourceAdapter.getSnapshot?.(cte) ?? [];
			return queryExecutor.execute(cte, [...sourceSnapshot]);
		},
	};
};
