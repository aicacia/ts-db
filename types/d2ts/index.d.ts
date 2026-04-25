import { type KeyValue } from "@electric-sql/d2ts";
import type { CTE } from "../query/cte.js";
export type KeyedChange<T> = [KeyValue<string, T>, number];
export interface IncrementalQuery<T> {
    getResults(): T[];
    applyChanges(changes: KeyedChange<T>[]): T[];
}
export declare function createIncrementalQuery<T>(cte: CTE<T>): IncrementalQuery<T>;
//# sourceMappingURL=index.d.ts.map