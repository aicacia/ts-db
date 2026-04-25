import type { SourceAdapter, UnsubscribeFn } from "../types/index.js";
import type { CTE } from "./cte.js";
import { type SubscriptionManager } from "./subscriptionManager.js";
import type { SourceSubscription } from "./sourceSubscription.js";
import type { IQueryBuilder, QuerySubscriptionCallback, QuerySubscriptionResult } from "./queryBuilder.js";
import type { QueryExecutionPort } from "./queryExecution.js";
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
    subscribe(cte: CTE<T>, callbacks: QuerySubscriptionCallback<T>): UnsubscribeFn;
    createSubscription(cte: CTE<T>): QuerySubscriptionResult<T>;
    createQueryBuilder(): IQueryBuilder<T>;
    fetchSnapshot(cte: CTE<T>): T[];
}
export declare function createQuerySubscriptionService<T>(config: QuerySubscriptionServiceConfig<T>): QuerySubscriptionService<T>;
export declare function createQueryService<T>(config: QueryServiceConfig<T>): QueryService<T>;
//# sourceMappingURL=querySubscriptionService.d.ts.map