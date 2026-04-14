import type { AdapterStatus, SourceAdapter, UnsubscribeFn } from "./types.js";
import type { CTE } from "./cte.js";
import {
	QueryBuilder,
	type IQueryBuilder,
	type QuerySubscriptionResult,
} from "./queryBuilder.js";
import { createQuerySubscriptionService, type QuerySubscriptionService } from "./querySubscriptionService.js";
import type { SubscriptionManager } from "./subscriptionManager.js";

export interface CollectionConfig<T> {
	id: string;
	source: SourceAdapter<T>;
	keyOf: (doc: T) => string;
	subscriptionManager?: SubscriptionManager<T>;
}

export interface ICollection<T> {
	readonly id: string;
	create(doc: T): Promise<void>;
	update(id: string, changes: Partial<T>): Promise<void>;
	delete(id: string): Promise<void>;
	query(): IQueryBuilder<T>;
	getStatus(): AdapterStatus;
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
	private _querySubscriptionService: QuerySubscriptionService<T>;

	constructor(config: CollectionConfig<T>) {
		this.id = config.id;
		this._source = config.source;
		this._querySubscriptionService = createQuerySubscriptionService({
			source: this._source,
			subscriptionManager: config.subscriptionManager,
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
		return new QueryBuilder((cte: CTE<T>) => {
			return this._querySubscriptionService.createSubscription(cte);
		});
	}

	getStatus(): AdapterStatus {
		return this._source.getStatus();
	}

}

export function createCollection<T>(
	config: CollectionConfig<T>,
): ICollection<T> {
	return new Collection(config);
}
