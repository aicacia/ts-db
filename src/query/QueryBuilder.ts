import type {
	CollectionAdapter,
	CollectionInterface,
} from "../collection/Collection.js";
import type { FieldPath } from "../field.js";
import type { UnsubscribeFn } from "../types.js";
import type { CTE, CTEComparisonOperator, CTEFilter } from "./cte.js";
import {
	and,
	compare,
	contains,
	containsIgnoreCase,
	createCTE,
	equal,
	fuzzyContains,
	greaterThan,
	greaterThanOrEqual,
	includes,
	inOperator,
	lessThan,
	lessThanOrEqual,
	notEqual,
	or,
} from "./cte.js";
import { D2Executor } from "./D2Executor.js";
import type { QueryExecutor, QueryJoinDescriptor } from "./executor.js";

export interface QueryBuilderInterface<T> {
	subscribe(
		onUpdate: (values: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn;

	where(filter: CTEFilter<T>): this;
	compare(
		field: FieldPath<T>,
		operator: CTEComparisonOperator,
		value: unknown,
	): this;
	equal(field: FieldPath<T>, value: unknown): this;
	notEqual(field: FieldPath<T>, value: unknown): this;
	greaterThan(field: FieldPath<T>, value: unknown): this;
	lessThan(field: FieldPath<T>, value: unknown): this;
	greaterThanOrEqual(field: FieldPath<T>, value: unknown): this;
	lessThanOrEqual(field: FieldPath<T>, value: unknown): this;
	in(field: FieldPath<T>, value: unknown): this;
	contains(field: FieldPath<T>, value: unknown): this;
	containsIgnoreCase(field: FieldPath<T>, value: unknown): this;
	fuzzyContains(field: FieldPath<T>, value: unknown): this;
	includes(field: FieldPath<T>, value: unknown): this;
	and(...filters: CTEFilter<T>[]): this;
	or(...filters: CTEFilter<T>[]): this;

	orderBy(field: FieldPath<T>, direction?: "asc" | "desc"): this;
	limit(n: number): this;
	offset(n: number): this;
	paginate(page: number, pageSize?: number): this;

	source(source: T[]): this;
	toCTE(): CTE<T>;

	join<U>(
		collection: CollectionInterface<U>,
		leftField: FieldPath<T>,
		rightField?: FieldPath<U>,
		type?: "inner" | "left",
	): this;
}

export interface QueryBuilderOptions<T> {
	source?: T[];
	executor?: QueryExecutor<T>;
	adapter?: CollectionAdapter<T>;
}

export class QueryBuilder<T> implements QueryBuilderInterface<T> {
	protected _cte: CTE<T>;
	protected _source: T[];
	protected _executor: QueryExecutor<T>;
	protected _adapter?: CollectionAdapter<T>;
	protected _joins: QueryJoinDescriptor[] = [];

	constructor(sourceOrOptions: T[] | QueryBuilderOptions<T> = []) {
		this._cte = createCTE();

		if (Array.isArray(sourceOrOptions)) {
			this._source = sourceOrOptions;
			this._executor = new D2Executor<T>();
		} else {
			this._source = sourceOrOptions.source ?? [];
			this._executor = sourceOrOptions.executor ?? new D2Executor<T>();
			this._adapter = sourceOrOptions.adapter;
		}
	}

	where(filter: CTEFilter<T>): this {
		if (!this._cte.filters) this._cte.filters = [];
		this._cte.filters.push(filter);
		return this;
	}

	compare(
		field: FieldPath<T>,
		operator: CTEComparisonOperator,
		value: unknown,
	): this {
		return this.where(compare(field, operator, value));
	}
	equal(field: FieldPath<T>, value: unknown): this {
		return this.where(equal(field, value));
	}
	notEqual(field: FieldPath<T>, value: unknown): this {
		return this.where(notEqual(field, value));
	}
	greaterThan(field: FieldPath<T>, value: unknown): this {
		return this.where(greaterThan(field, value));
	}
	lessThan(field: FieldPath<T>, value: unknown): this {
		return this.where(lessThan(field, value));
	}
	greaterThanOrEqual(field: FieldPath<T>, value: unknown): this {
		return this.where(greaterThanOrEqual(field, value));
	}
	lessThanOrEqual(field: FieldPath<T>, value: unknown): this {
		return this.where(lessThanOrEqual(field, value));
	}
	in(field: FieldPath<T>, value: unknown): this {
		return this.where(inOperator(field, value));
	}
	contains(field: FieldPath<T>, value: unknown): this {
		return this.where(contains(field, value));
	}
	containsIgnoreCase(field: FieldPath<T>, value: unknown): this {
		return this.where(containsIgnoreCase(field, value));
	}
	fuzzyContains(field: FieldPath<T>, value: unknown): this {
		return this.where(fuzzyContains(field, value));
	}
	includes(field: FieldPath<T>, value: unknown): this {
		return this.where(includes(field, value));
	}
	and(...filters: CTEFilter<T>[]): this {
		return this.where(and(...filters));
	}
	or(...filters: CTEFilter<T>[]): this {
		return this.where(or(...filters));
	}

	orderBy(field: FieldPath<T>, direction: "asc" | "desc" = "asc"): this {
		if (!this._cte.orderBy) this._cte.orderBy = [];
		this._cte.orderBy.push({ field, direction });
		return this;
	}
	limit(n: number): this {
		this._cte.limit = n;
		return this;
	}
	offset(n: number): this {
		this._cte.offset = n;
		return this;
	}
	paginate(page: number, pageSize = 10): this {
		this._cte.offset = page * pageSize;
		this._cte.limit = pageSize;
		return this;
	}

	toCTE(): CTE<T> {
		// Return a shallow copy to prevent mutation and include joins
		const cte = { ...this._cte };
		if (this._joins.length) {
			cte.joins = this._joins.map((j) => ({
				collectionId: j.collection.id,
				leftField: j.leftField,
				rightField: j.rightField,
				type: j.type,
			}));
		}
		return cte;
	}

	source(source: T[]): this {
		this._source = source;
		return this;
	}

	join<U>(
		collection: CollectionInterface<U>,
		leftField: FieldPath<T>,
		rightField?: FieldPath<U>,
		type: "inner" | "left" = "left",
	): this {
		this._joins.push({
			collection: collection as unknown as CollectionInterface<unknown>,
			leftField: String(leftField),
			rightField: rightField ? String(rightField) : String(leftField),
			type,
		});
		return this;
	}

	subscribe(
		onUpdate: (values: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn {
		try {
			const cte = this.toCTE();
			if (this._adapter) {
				let execUnsub: UnsubscribeFn | null = null;
				const adapterUnsub = this._adapter.subscribe(
					(docs: T[]) => {
						try {
							if (execUnsub) execUnsub();
							this._source = docs.slice();
							const query = this._executor.execute(
								cte,
								this._source,
								this._joins,
							);
							execUnsub = query.subscribe(onUpdate, onError);
						} catch (err) {
							if (onError)
								onError(err instanceof Error ? err : new Error(String(err)));
						}
					},
					onError ?? (() => {}),
					cte,
				);
				return () => {
					adapterUnsub();
					if (execUnsub) execUnsub();
				};
			}

			const query = this._executor.execute(cte, this._source, this._joins);
			return query.subscribe(onUpdate, onError);
		} catch (err) {
			if (onError) onError(err instanceof Error ? err : new Error(String(err)));
			return () => {};
		}
	}
}
