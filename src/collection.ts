import type { AdapterStatus, SourceAdapter, UnsubscribeFn } from "./types.js";
import { getCTEIdentity, type CTE } from "./cte.js";
import { applyCTE } from "./filterEngine.js";
import {
	QueryBuilder,
	type IQueryBuilder,
	type QuerySubscriptionResult,
} from "./queryBuilder.js";
import { toError } from "./utils.js";
import { createSubscriptionManager, type SubscriptionManager } from "./subscriptionManager.js";

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

interface QuerySubscription<T> {
	cte: CTE<T>;
	count: number;
	lastResults: T[] | null;
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
	private _adapterUnsubscribe: UnsubscribeFn | null = null;
	private _hasSourceSnapshot = false;
	private _sourceDocs: T[] = [];
	private _subscriptionManager: SubscriptionManager<T>;

	/** listeners that receive raw source docs for per-CTE filtering */
	private _sourceListeners: Set<{
		onUpdate: (docs: T[]) => void;
		onError?: (err: Error) => void;
	}> = new Set();

	constructor(config: CollectionConfig<T>) {
		this.id = config.id;
		this._source = config.source;
		this._subscriptionManager = config.subscriptionManager ?? createSubscriptionManager<T>();
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
			return this._createQuerySubscription(cte);
		});
	}

	getStatus(): AdapterStatus {
		return this._source.getStatus();
	}

	private _createQuerySubscription(cte: CTE<T>): QuerySubscriptionResult<T> {
		return (callbacks) => {
			const subscriptionKey = getCTEIdentity(cte);

			const adapterFactory = () => {
				return {
					subscribe: (onUpdate: (rows: T[]) => void, onError: (err: Error) => void) => {
						// ensure the collection has a live source subscription
						this._ensureAdapterSubscription();

						const listener = {
							onUpdate: (docs: T[]) => {
								let results: T[];
								try {
									results = applyCTE(cte, [...docs]);
								} catch (err) {
									try {
										onError(toError(err));
									} catch (e) {
										// if onError throws and there's no recovery, propagate
										throw toError(e);
									}
									return;
								}

								try {
									onUpdate(results);
								} catch (uErr) {
									try {
										onError(toError(uErr));
									} catch (e) {
										// propagate if onError throws
										throw toError(e);
									}
								}
							},
							onError: (err: Error) => {
								try {
									onError(err);
								} catch (e) {
									throw toError(e);
								}
							},
						};

						this._sourceListeners.add(listener);

						// send initial snapshot if available
						if (this._hasSourceSnapshot) {
							try {
								listener.onUpdate(this._sourceDocs);
							} catch (err) {
								try {
									onError(toError(err));
								} catch (e) {
									throw toError(e);
								}
							}
						}

						return () => {
							this._sourceListeners.delete(listener);
							if (this._sourceListeners.size === 0) {
								this._stopAdapterSubscription();
							}
						};
					},
					fetchSnapshot: () => {
						return applyCTE(cte, [...this._sourceDocs]);
					},
				};
			};

			return this._subscriptionManager.subscribe({
				id: subscriptionKey,
				adapterFactory,
				onUpdate: callbacks.onUpdate,
				onError: callbacks.onError,
			});
		};
	}

	private _ensureAdapterSubscription(): void {
		if (this._adapterUnsubscribe) {
			return;
		}

		this._adapterUnsubscribe = this._source.subscribe(
			(docs) => this._handleSourceUpdate(docs),
			(error) => this._handleSourceError(error),
		);
	}

	private _stopAdapterSubscription(): void {
		if (!this._adapterUnsubscribe) {
			return;
		}

		this._adapterUnsubscribe();
		this._adapterUnsubscribe = null;
		this._hasSourceSnapshot = false;
		this._sourceDocs = [];
	}

	private _computeQueryResults(
		querySubscription: QuerySubscription<T>,
	): T[] | null {
		try {
			return applyCTE(querySubscription.cte, [...this._sourceDocs]);
		} catch (error) {
			return null;
		}
	}

	private _handleSourceUpdate(docs: T[]): void {
		this._sourceDocs = [...docs];
		this._hasSourceSnapshot = true;

		for (const listener of Array.from(this._sourceListeners)) {
			try {
				listener.onUpdate(this._sourceDocs);
			} catch (err) {
				if (listener.onError) {
					try {
						listener.onError(toError(err));
					} catch (_e) {
						// swallow listener error to avoid crashing subscription loop
					}
				}
			}
		}
	}

	private _handleSourceError(error: Error): void {
		for (const listener of Array.from(this._sourceListeners)) {
			if (listener.onError) {
				try {
					listener.onError(toError(error));
				} catch (_e) {
					// ignore
				}
			}
		}
	}
    
}

export function createCollection<T>(
	config: CollectionConfig<T>,
): ICollection<T> {
	return new Collection(config);
}
