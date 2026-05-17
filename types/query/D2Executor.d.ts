import type { CTE } from "./cte.js";
import type { QueryExecutor, QueryJoinDescriptor, QuerySubscription } from "./executor.js";
export declare class D2Executor<T> implements QueryExecutor<T> {
    execute(cte: CTE<T>, source?: T[], joins?: QueryJoinDescriptor[]): QuerySubscription<T>;
}
//# sourceMappingURL=D2Executor.d.ts.map