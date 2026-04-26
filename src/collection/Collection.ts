import type { QueryBuilderInterface } from "../query/QueryBuilder.js";
import { QueryBuilder } from "../query/QueryBuilder.js";
import type { AdapterStatus, Constructor, UnsubscribeFn } from "../types.js";
import type { CTE } from "../query/cte.js";
import { createCTE } from "../query/cte.js";

export interface CollectionAdapter<T> {
	subscribe(
		onUpdate: (docs: T[]) => void,
		onError: (error: Error) => void,
		query: CTE<T>,
	): UnsubscribeFn;
	create(doc: T): Promise<void>;
	update(id: string, changes: Partial<T>): Promise<void>;
	delete(id: string): Promise<void>;
	getStatus(): AdapterStatus;
}

export interface CollectionAdapterOptions<T> {
	keyOf: (doc: T) => string;
}

export interface CollectionConfig<
	T,
	O extends Omit<CollectionAdapterOptions<T>, "keyOf"> = Omit<
		CollectionAdapterOptions<T>,
		"keyOf"
	>,
> {
	id: string;
	sourceType: Constructor<CollectionAdapter<T>, [O]>;
	sourceOptions?: O;
	keyOf: (doc: T) => string;
}

export interface CollectionInterface<T> {
	readonly id: string;

	create(doc: T): Promise<void>;
	update(id: string, changes: Partial<T>): Promise<void>;
	delete(id: string): Promise<void>;
	query(): QueryBuilderInterface<T>;
	subscribe(
		onUpdate: (docs: T[]) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn;
	getStatus(): AdapterStatus;
	getKeyOf(): (doc: T) => string;
	getSource(): CollectionAdapter<T>;
}

export class Collection<
	T,
	O extends CollectionAdapterOptions<T> = CollectionAdapterOptions<T>,
> implements CollectionInterface<T>
{
	readonly #id: string;
	readonly #source: CollectionAdapter<T>;
	readonly #keyOf: (doc: T) => string;

	constructor(private readonly config: CollectionConfig<T, O>) {
		const sourceOptions =
			config.sourceOptions === undefined
				? ({ keyOf: config.keyOf } as O)
				: config.sourceOptions;

		this.#id = config.id;
		this.#keyOf = config.keyOf;
		this.#source = new config.sourceType(sourceOptions);
	}

	get id() {
		return this.#id;
	}

	create(doc: T): Promise<void> {
		return this.#source.create(doc);
	}

	update(id: string, changes: Partial<T>): Promise<void> {
		return this.#source.update(id, changes);
	}

	delete(id: string): Promise<void> {
		return this.#source.delete(id);
	}

	query(): QueryBuilderInterface<T> {
		return new QueryBuilder({ adapter: this.#source });
	}

	subscribe(
		onUpdate: (docs: T[]) => void,
		onError: (error: Error) => void = () => {},
	): UnsubscribeFn {
		return this.#source.subscribe(onUpdate, onError, createCTE());
	}

	getStatus(): AdapterStatus {
		return this.#source.getStatus();
	}

	getKeyOf(): (doc: T) => string {
		return this.#keyOf;
	}

	getSource(): CollectionAdapter<T> {
		return this.#source;
	}
}

export function createCollection<
	T,
	O extends CollectionAdapterOptions<T> = CollectionAdapterOptions<T>,
>(config: CollectionConfig<T, O>): CollectionInterface<T> {
	return new Collection(config);
}
