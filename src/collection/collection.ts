import type {
	AdapterStatus,
	SourceAdapter,
	UnsubscribeFn,
	FieldPath,
} from "../types/index.js";
import type { CTE } from "../query/cte.js";
import type { IQueryBuilder } from "../query/queryBuilder.js";
import {
	createQueryService,
	type QueryService,
	type QuerySubscriptionService,
} from "../query/querySubscriptionService.js";
import type { QueryExecutionPort } from "../query/querySubscriptionService.js";
import type { SubscriptionManager } from "../query/subscriptionManager.js";
import type { SourceSubscription } from "../query/sourceSubscription.js";

export interface CollectionConfig<T> {
	id: string;
	source: SourceAdapter<T>;
	keyOf: (doc: T) => string;
	keyField?: FieldPath<T>;
	subscriptionManager?: SubscriptionManager<T>;
	sourceSubscription?: SourceSubscription<T>;
	queryExecutor?: QueryExecutionPort<T>;
	keySerializer?: (cte: CTE<T>) => string;
	queryService?: QueryService<T>;
	querySubscriptionService?: QuerySubscriptionService<T>;
}

export interface ICollection<T> {
	readonly id: string;
	create(doc: T): Promise<void>;
	update(id: string, changes: Partial<T>): Promise<void>;
	delete(id: string): Promise<void>;
	query(): IQueryBuilder<T>;
	subscribe(
		onUpdate: (docs: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn;
	getStatus(): AdapterStatus;
	getKeyOf(): (doc: T) => string;
	getKeyField(): FieldPath<T> | undefined;
}

/**
 * Collection manages document subscriptions using a dual-layer pattern:
 * 1. Per-CTE adapter subscriptions (_cteSubscriptions) - one per unique query
 * 2. Query-level subscriptions (_querySubscriptions, _callbacks) - tracks user subscriptions
 *
 * This allows multiple user subscriptions to the same query to share a single adapter subscription,
 * improving efficiency and reducing redundant filtering operations.
 */

export class Collection<T> implements ICollection<T> {
	readonly id: string;
	private _source: SourceAdapter<T>;
	private _queryService: QueryService<T>;
	private _keyOf: (doc: T) => string;
	private _keyField: FieldPath<T> | undefined;

	constructor(config: CollectionConfig<T>) {
		this.id = config.id;
		this._source = config.source;
		this._keyOf = config.keyOf;
		this._keyField = config.keyField;
		const injectedQueryService = config.queryService ?? config.querySubscriptionService;
		this._queryService =
			injectedQueryService ??
			createQueryService({
				source: this._source,
				sourceSubscription: config.sourceSubscription,
				subscriptionManager: config.subscriptionManager,
				queryExecutor: config.queryExecutor,
				keySerializer: config.keySerializer,
			});
	}

	async create(doc: T): Promise<void> {
		await this._source.create(doc);
	}

	async update(id: string, changes: Partial<T>): Promise<void> {
		await this._source.update(id, changes);
	}

	async delete(id: string): Promise<void> {
		await this._source.delete(id);
	}

	query(): IQueryBuilder<T> {
		return this._queryService.createQueryBuilder();
	}

	subscribe(
		onUpdate: (docs: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn {
		return this.query().subscribe(onUpdate, onError);
	}

	getStatus(): AdapterStatus {
		return this._source.getStatus();
	}

	getKeyOf(): (doc: T) => string {
		return this._keyOf;
	}

	getKeyField(): FieldPath<T> | undefined {
		return this._keyField;
	}
}

export function createCollection<T>(
	config: CollectionConfig<T>,
): ICollection<T> {
	return new Collection(config);
}
