import type { CTE } from "../cte.js";
import { applyCTE } from "../filterEngine.js";

export interface QueryExecutionPort<T> {
	execute(cte: CTE<T>, docs: T[]): T[];
}

export function createDefaultQueryExecutionPort<T>(): QueryExecutionPort<T> {
	return {
		execute(cte, docs) {
			return applyCTE(cte, docs);
		},
	};
}
