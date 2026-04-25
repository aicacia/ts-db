import type { CTE } from "./cte.js";
export interface QueryExecutionPort<T> {
    execute(cte: CTE<T>, docs: T[]): T[];
}
export declare function createDefaultQueryExecutionPort<T>(): QueryExecutionPort<T>;
//# sourceMappingURL=queryExecution.d.ts.map