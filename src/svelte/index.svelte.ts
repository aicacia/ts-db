import type { QueryBuilderInterface } from "../query/QueryBuilder.js";
import type { SingletonInterface } from "../singleton/index.js";
import type { UnsubscribeFn } from "../types.js";

export interface StoreState<T> {
	data: T;
	error: Error | null;
	unsubscribe: UnsubscribeFn | null;
}

export function collection<T>(query: QueryBuilderInterface<T>): {
	data: T[];
	error: Error | null;
} {
	let data: T[] = $state([]);
	let error: Error | null = $state(null);
	let unsubscribe: UnsubscribeFn | null = null;

	$effect(() => {
		unsubscribe = query.subscribe(
			(docs: T[]) => {
				data = [...docs];
				error = null;
			},
			(err: Error) => {
				error = err;
			},
		);

		return () => {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
		};
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
	};
}

export function singleton<T>(source: SingletonInterface<T>): {
	data: T | undefined;
	error: Error | null;
} {
	let data: T | undefined = $state(undefined);
	let error: Error | null = $state(null);
	let unsubscribe: (() => void) | null = null;

	$effect(() => {
		unsubscribe = source.subscribe(
			(value: T | undefined) => {
				data = value;
				error = null;
			},
			(err: Error) => {
				error = err;
			},
		);

		return () => {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
		};
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
	};
}
