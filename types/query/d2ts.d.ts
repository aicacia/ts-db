import type { CTE } from "./cte.js";
import type { QueryJoinDescriptor, QuerySubscription } from "./executor.js";
export declare function createIncrementalQuery<T>(cte: CTE<T>, source?: T[], joins?: QueryJoinDescriptor[]): QuerySubscription<T>;
export { D2Executor } from "./D2Executor.js";
export type { QueryExecutor, QueryJoinDescriptor, QuerySubscription, } from "./executor.js";
//# sourceMappingURL=d2ts.d.ts.map