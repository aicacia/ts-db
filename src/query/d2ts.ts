import type { CTE } from "./cte.js";
import { D2Executor } from "./D2Executor.js";
import type { QueryJoinDescriptor, QuerySubscription } from "./executor.js";

export function createIncrementalQuery<T>(
	cte: CTE<T>,
	source: T[] = [],
	joins: QueryJoinDescriptor[] = [],
): QuerySubscription<T> {
	return new D2Executor<T>().execute(cte, source, joins);
}

export { D2Executor } from "./D2Executor.js";
export type {
	QueryExecutor,
	QueryJoinDescriptor,
	QuerySubscription,
} from "./executor.js";
