import type { CollectionInterface } from "../collection/Collection.js";
import type { UnsubscribeFn } from "../types.js";
import type { CTE } from "./cte.js";

export interface QueryJoinDescriptor {
	collection: CollectionInterface<unknown>;
	leftField: string;
	rightField?: string;
	type: "inner" | "left";
}

export interface QuerySubscription<T> {
	subscribe(
		onUpdate: (values: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn;
}

export interface QueryExecutor<T> {
	execute(
		cte: CTE<T>,
		source?: T[],
		joins?: QueryJoinDescriptor[],
	): QuerySubscription<T>;
}
