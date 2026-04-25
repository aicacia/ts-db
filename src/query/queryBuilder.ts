import type { FieldPath, UnsubscribeFn } from "../types/index.js";
import type { ICollection } from "../collection/index.js";

import {
	type CTE,
	type CTEComparisonOperator,
	type CTEFilter,
	and,
	compare,
	contains,
	containsIgnoreCase,
	createCTE,
	equal,
	fuzzyContains,
	greaterThan,
	greaterThanOrEqual,
	inOperator,
	includes,
	lessThan,
	lessThanOrEqual,
	notEqual,
	or,
} from "./cte.js";
import { applyCTE } from "./filterEngine.js";
import { cloneCTE } from "./utils.js";
import { applyJoins, type JoinResult } from "./joins.js";

// join helpers extracted to ./joins.ts

/**
 * Order direction
 */
export type OrderDirection = "asc" | "desc";

export type JoinType = "inner" | "left";

export interface JoinConfig<Left> {
	collection: ICollection<unknown>;
	leftField: FieldPath<Left>;
	rightField: FieldPath<unknown>;
	type: JoinType;
}

/**
 * Query builder interface
 */
export interface IQueryBuilder<T> {
	/**
	 * Add a filter condition to the CTE
	 */
	where(filter: CTEFilter<T>): IQueryBuilder<T>;

	/**
	 * Add a comparison filter with full operator control.
	 */
	compare(
		field: FieldPath<T>,
		operator: CTEComparisonOperator,
		value: unknown,
	): IQueryBuilder<T>;

	/**
	 * Add equality filter.
	 */
	equal(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add not-equal filter.
	 */
	notEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add greater-than filter.
	 */
	greaterThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add less-than filter.
	 */
	lessThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add greater-than-or-equal filter.
	 */
	greaterThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add less-than-or-equal filter.
	 */
	lessThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add inclusion filter.
	 */
	in(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add contains filter.
	 */
	contains(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add case-insensitive contains filter.
	 */
	containsIgnoreCase(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add fuzzy contains filter.
	 */
	fuzzyContains(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add includes filter.
	 */
	includes(field: FieldPath<T>, value: unknown): IQueryBuilder<T>;

	/**
	 * Add logical AND filter over provided filters.
	 */
	and(...filters: CTEFilter<T>[]): IQueryBuilder<T>;

	/**
	 * Add logical OR filter over provided filters.
	 */
	or(...filters: CTEFilter<T>[]): IQueryBuilder<T>;

	/**
	 * Join another collection to the root query.
	 *
	 * The left-side field is required. The right-side field is optional when
	 * the joined collection exposes a `keyField`.
	 */
	join<Right>(
		rightCollection: ICollection<Right>,
		leftField: FieldPath<T>,
		rightField?: FieldPath<Right>,
		type?: JoinType,
	): IQueryBuilder<T & JoinResult<Right>>;

	/**
	 * Order results by field
	 *
	 * Supports both top-level fields and nested paths using dot notation.
	 *
	 * @param field - Field name or nested path (e.g., 'name' or 'user.profile.name')
	 * @param direction - Sort direction ('asc' or 'desc', default: 'asc')
	 *
	 * @example
	 * ```typescript
	 * collection.query().orderBy('name', 'asc')
	 * collection.query().orderBy('user.profile.age', 'desc')
	 * ```
	 */
	orderBy(field: FieldPath<T>, direction?: OrderDirection): IQueryBuilder<T>;

	/**
	 * Limit number of results
	 */
	limit(n: number): IQueryBuilder<T>;

	/**
	 * Skip first n results
	 */
	offset(n: number): IQueryBuilder<T>;

	/**
	 * Paginate results by page number and page size
	 *
	 * @param page - Page number (0-indexed)
	 * @param pageSize - Number of results per page (default: 10)
	 * @returns Query builder with offset and limit applied
	 */
	paginate(page: number, pageSize?: number): IQueryBuilder<T>;

	/**
	 * Define a reusable CTE subquery
	 */
	with(
		name: string,
		fn: (q: IQueryBuilder<T>) => IQueryBuilder<T>,
	): IQueryBuilder<T>;

	/**
	 * Subscribe to query results
	 *
	 * Establishes a subscription to documents matching the query. The subscription
	 * begins immediately and will emit results as they change. Errors thrown in the
	 * onUpdate callback are caught and passed to onError if provided.
	 *
	 * @param onUpdate - Called with documents matching the query.
	 *                   Errors thrown here are caught and sent to onError.
	 * @param onError - Optional callback for errors. Called with adapter errors,
	 *                  filter evaluation errors, or subscriber callback errors.
	 *                  Non-recoverable: unsubscribe is recommended.
	 *                  To retry, create a new subscription.
	 * @returns Unsubscribe function to clean up subscription and stop receiving updates
	 */
	subscribe(
		onUpdate: (docs: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn;

	/**
	 * Export query as JSON-serializable CTE
	 */
	toCTE(): CTE<T>;

	/**
	 * Compile CTE to executable filter function
	 */
	compileToFunction(): (docs: T[]) => T[];
}

/**
 * Query compiler - compiles CTE to executable result
 */
export type QueryCompiler<T> = (cte: CTE<T>) => QuerySubscriptionResult<T>;

/**
 * Query result subscription callback
 */
export interface QuerySubscriptionCallback<T> {
	onUpdate: (docs: T[]) => void;
	onError: (error: Error) => void;
}

/**
 * Query subscription result function
 */
export type QuerySubscriptionResult<T> = (
	callbacks: QuerySubscriptionCallback<T>,
) => UnsubscribeFn;

/**
 * QueryBuilder - fluent API for building JSON-serializable CTEs that can be compiled
 */
export class QueryBuilder<T> implements IQueryBuilder<T> {
	protected _cte: CTE<T>;
	protected _joins: JoinConfig<T>[] = [];

	constructor() {
		this._cte = createCTE();
	}

	protected createSubBuilder(): QueryBuilder<T> {
		return new QueryBuilder<T>();
	}

	where(filter: CTEFilter<T>): IQueryBuilder<T> {
		if (!this._cte.filters) {
			this._cte.filters = [];
		}
		this._cte.filters.push(filter);
		return this;
	}

	compare(
		field: FieldPath<T>,
		operator: CTEComparisonOperator,
		value: unknown,
	): IQueryBuilder<T> {
		return this.where(compare(field, operator, value));
	}

	equal(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(equal(field, value));
	}

	notEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(notEqual(field, value));
	}

	greaterThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(greaterThan(field, value));
	}

	lessThan(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(lessThan(field, value));
	}

	greaterThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(greaterThanOrEqual(field, value));
	}

	lessThanOrEqual(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(lessThanOrEqual(field, value));
	}

	in(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(inOperator(field, value));
	}

	contains(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(contains(field, value));
	}

	containsIgnoreCase(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(containsIgnoreCase(field, value));
	}

	fuzzyContains(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(fuzzyContains(field, value));
	}

	includes(field: FieldPath<T>, value: unknown): IQueryBuilder<T> {
		return this.where(includes(field, value));
	}

	and(...filters: CTEFilter<T>[]): IQueryBuilder<T> {
		return this.where(and(...filters));
	}

	or(...filters: CTEFilter<T>[]): IQueryBuilder<T> {
		return this.where(or(...filters));
	}

	join<Right>(
		rightCollection: ICollection<Right>,
		leftField: FieldPath<T>,
		rightField?: FieldPath<Right>,
		type: JoinType = "inner",
	): IQueryBuilder<T & JoinResult<Right>> {
		const resolvedRightField = rightField ?? rightCollection.getKeyField();

		if (!resolvedRightField) {
			throw new Error(
				"join requires a rightField when the joined collection does not expose a key field",
			);
		}

		this._joins.push({
			collection: rightCollection as ICollection<unknown>,
			leftField,
			rightField: resolvedRightField as FieldPath<unknown>,
			type,
		});

		if (!this._cte.joins) {
			this._cte.joins = [];
		}
		this._cte.joins.push({
			collectionId: rightCollection.id,
			leftField,
			rightField: resolvedRightField as FieldPath<unknown>,
			type,
		});

		return this as unknown as QueryBuilder<T & JoinResult<Right>>;
	}

	orderBy(
		field: FieldPath<T>,
		direction: OrderDirection = "asc",
	): IQueryBuilder<T> {
		if (!this._cte.orderBy) {
			this._cte.orderBy = [];
		}
		this._cte.orderBy.push({ field: field, direction });
		return this;
	}

	limit(n: number): IQueryBuilder<T> {
		if (n < 0) {
			throw new Error("limit must be >= 0");
		}
		this._cte.limit = n;
		return this;
	}

	offset(n: number): IQueryBuilder<T> {
		if (n < 0) {
			throw new Error("offset must be >= 0");
		}
		this._cte.offset = n;
		return this;
	}

	paginate(page: number, pageSize = 10): IQueryBuilder<T> {
		if (page < 0) {
			throw new Error("page must be >= 0");
		}
		if (pageSize <= 0) {
			throw new Error("pageSize must be > 0");
		}
		this._cte.offset = page * pageSize;
		this._cte.limit = pageSize;
		return this;
	}

	with(
		name: string,
		fn: (q: IQueryBuilder<T>) => IQueryBuilder<T>,
	): IQueryBuilder<T> {
		const subqueryBuilder = fn(this.createSubBuilder());
		const subqueryCTE = subqueryBuilder.toCTE();

		if (!this._cte.ctes) {
			this._cte.ctes = {};
		}
		this._cte.ctes[name] = subqueryCTE;

		return this;
	}

	subscribe(
		onUpdate: (docs: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn {
		throw new Error("QueryBuilder.subscribe requires a runtime query compiler");
	}

	toCTE(): CTE<T> {
		return cloneCTE(this._cte);
	}

	compileToFunction(): (docs: T[]) => T[] {
		if (this._joins.length > 0) {
			throw new Error("compileToFunction does not support joins");
		}

		const cte = cloneCTE(this._cte);
		return (docs: T[]) => applyCTE(cte, docs);
	}
}

export class RuntimeQueryBuilder<T> extends QueryBuilder<T> {
	private _compile: QueryCompiler<T>;

	constructor(compile: QueryCompiler<T>) {
		super();
		this._compile = compile;
	}

	protected override createSubBuilder(): QueryBuilder<T> {
		return new RuntimeQueryBuilder<T>(this._compile);
	}

	override subscribe(
		onUpdate: (docs: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn {
		const errorHandler =
			onError ||
			((error: Error) => {
				throw error;
			});

		if (this._joins.length === 0) {
			return this._compile(this._cte)({
				onUpdate,
				onError: errorHandler,
			});
		}

		const rootSubscribe = this._compile(this._cte);
		let rootDocs: T[] = [];
		const rightRows = this._joins.map(() => [] as unknown[]);

		const emit = () => {
			const results = applyJoins(rootDocs, this._joins, rightRows);
			onUpdate(results);
		};

		const rootUnsub = rootSubscribe({
			onUpdate(docs) {
				rootDocs = docs;
				emit();
			},
			onError: errorHandler,
		});

		const joinUnsubs = this._joins.map((join, index) =>
			join.collection.query().subscribe((docs) => {
				rightRows[index] = docs;
				emit();
			}, errorHandler),
		);

		return () => {
			rootUnsub();
			for (const unsub of joinUnsubs) {
				unsub();
			}
		};
	}
}

export function createQueryBuilder<T>(
	compile?: QueryCompiler<T>,
): QueryBuilder<T> {
	return compile ? new RuntimeQueryBuilder<T>(compile) : new QueryBuilder<T>();
}
