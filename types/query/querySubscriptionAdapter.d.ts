import type { SubscriptionAdapter } from "./subscriptionManager.js";
import type { QueryExecutionPort } from "./queryExecution.js";
import type { CTE } from "./cte.js";
export declare const createQuerySubscriptionAdapter: <T>(cte: CTE<T>, sourceAdapter: SubscriptionAdapter<T, CTE<T>>, queryExecutor: QueryExecutionPort<T>) => SubscriptionAdapter<T>;
//# sourceMappingURL=querySubscriptionAdapter.d.ts.map