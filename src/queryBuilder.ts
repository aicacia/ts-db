import type { FieldPath, UnsubscribeFn } from "./types.js";
import type { ICollection } from "./collection.js";
import {
	type CTE,
	type CTEComparisonOperator,
	type CTEFilter,
	and as createAndFilter,
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
	or as createOrFilter,
} from "./cte.js";
import { applyCTE } from "./filterEngine.js";
import { getFieldValue } from "./utils.js";

function assertNever(value: never): never {
	throw new Error(`Unexpected value: ${String(value)}`);
}

function cloneValue<T>(value: T): T {
	if (value === null || typeof value !== "object") {
		return value;
	}

	if (typeof structuredClone === "function") {
		return structuredClone(value);
	}

	if (Array.isArray(value)) {
		return value.map(cloneValue) as unknown as T;
	}

	const copied: Record<string, unknown> = {};
	for (const key of Object.keys(value as Record<string, unknown>)) {
		copied[key] = cloneValue((value as Record<string, unknown>)[key]);
	}

	return copied as T;
}

function cloneFilters<T>(filters: CTEFilter<T>[]): CTEFilter<T>[] {
	return filters.map((filter) => {
		if (filter.type === "comparison") {
			return {
				...filter,
				value: cloneValue(filter.value),
			};
		}

		if (filter.type === "logical") {
			return {
				...filter,
				filters: cloneFilters(filter.filters),
			};
		}

		if (filter.type === "reference") {
			return {
				...filter,
			};
		}

		return assertNever(filter);
	});
}

function cloneCTE<T>(cte: CTE<T>): CTE<T> {
	return {
		version: cte.version,
		name: cte.name,
		columns: cte.columns ? [...cte.columns] : undefined,
		filters: cte.filters ? cloneFilters(cte.filters) : undefined,
		orderBy: cte.orderBy ? [...cte.orderBy] : undefined,
		limit: cte.limit,
		offset: cte.offset,
		joins: cte.joins ? cte.joins.map((join) => ({ ...join })) : undefined,
		ctes: cte.ctes
			? Object.fromEntries(
				Object.entries(cte.ctes).map(([key, childCTE]) => [key, cloneCTE(childCTE)]),
			)
			: undefined,
	};
}

function getFieldValueByPath(doc: unknown, field: string): unknown {
	const parts = field.split(".");
	let value: unknown = doc;

	for (const part of parts) {
		if (value === null || value === undefined || typeof value !== "object") {
			return undefined;
		}
		value = (value as Record<string, unknown>)[part];
	}

	return value;
}

function computeJoinIndex(
	rightDocs: unknown[],
	rightField: string,
): Map<string, unknown[]> {
	const index = new Map<string, unknown[]>();

	for (const doc of rightDocs) {
		const rawKey = getFieldValueByPath(doc, rightField);
		const key = rawKey === null || rawKey === undefined ? "" : String(rawKey);
		const bucket = index.get(key) ?? [];
		bucket.push(doc);
		index.set(key, bucket);
	}

	return index;
}

function buildJoinIndexes<T>(
	joins: JoinConfig<T>[],
	rightDocs: unknown[][],
) {
	return joins.map((join, index) =>
		computeJoinIndex(rightDocs[index] ?? [], join.rightField),
	);
}

function applyJoins<T>(
	docs: T[],
	joins: JoinConfig<T>[],
	rightDocs: unknown[][],
): Array<T & Record<string, unknown[]>> {
	const indexes = buildJoinIndexes(joins, rightDocs);

	return docs
		.map((doc) => {
			let result: T & Record<string, unknown[]> = { ...doc };

			for (const [index, join] of joins.entries()) {
				const leftKey = getFieldValue(doc, join.leftField);
				const lookupKey = leftKey === null || leftKey === undefined ? "" : String(leftKey);
				const matches = indexes[index]?.get(lookupKey) ?? [];

				result = {
					...result,
					[join.collection.id]: matches,
				};

				if (join.type === "inner" && matches.length === 0) {
					return null;
				}
			}

			return result;
		})
		.filter((doc): doc is T & Record<string, unknown[]> => doc !== null);
}

export type JoinResult<Right> = Record<string, Right[]>;

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
	private _cte: CTE<T>;
	private _compile: QueryCompiler<T>;
	private _joins: JoinConfig<T>[] = [];

	constructor(compile?: QueryCompiler<T>) {
		this._cte = createCTE();
		this._compile =
			compile ??
			((cte) => {
				return () => {
					throw new Error(
						"QueryBuilder.subscribe requires a runtime query compiler",
					);
				};
			});
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
		return this.where(createAndFilter(...filters));
	}

	or(...filters: CTEFilter<T>[]): IQueryBuilder<T> {
		return this.where(createOrFilter(...filters));
	}

	join<Right>(
		rightCollection: ICollection<Right>,
		leftField: FieldPath<T>,
		rightField?: FieldPath<Right>,
		type: JoinType = "inner",
	): IQueryBuilder<T & JoinResult<Right>> {
		const resolvedRightField =
			rightField ?? rightCollection.getKeyField();

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

		return this;
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
		const subqueryBuilder = fn(new QueryBuilder(this._compile));
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
			join.collection.query().subscribe(
				(docs) => {
					rightRows[index] = docs;
					emit();
				},
				errorHandler,
			),
		);

		return () => {
			rootUnsub();
			for (const unsub of joinUnsubs) {
				unsub();
			}
		};
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

export function createQueryBuilder<T>(compile?: QueryCompiler<T>): QueryBuilder<T> {
	return new QueryBuilder<T>(compile);
}
