import type { AdapterStatus, UnsubscribeFn, Constructor } from "../types.js";

export interface SingletonAdapter<T> {
	subscribe(
		onUpdate: (value: T | undefined) => void,
		onError: (error: Error) => void,
	): UnsubscribeFn;
	set(doc: T): Promise<void>;
	update(changes: Partial<T>): Promise<void>;
	getStatus(): AdapterStatus;
}

export interface SingletonConfig<T, O extends {} = object> {
	sourceType: Constructor<SingletonAdapter<T>, [O]>;
	sourceOptions?: O;
	defaultValue?: T;
}

export interface SingletonInterface<T> {
	subscribe(
		onUpdate: (value: T | undefined) => void,
		onError?: (error: Error) => void,
	): UnsubscribeFn;
	set(doc: T): Promise<void>;
	update(changes: Partial<T>): Promise<void>;
	getStatus(): AdapterStatus;
	getSource(): SingletonAdapter<T>;
}

export class Singleton<T, O extends {} = object>
	implements SingletonInterface<T>
{
	readonly #source: SingletonAdapter<T>;

	constructor(private readonly config: SingletonConfig<T, O>) {
		const sourceOptions =
			config.sourceOptions === undefined ? ({} as O) : config.sourceOptions;
		this.#source = new config.sourceType(sourceOptions);
	}

	subscribe(
		onUpdate: (value: T | undefined) => void,
		onError: (error: Error) => void = () => {},
	): UnsubscribeFn {
		return this.#source.subscribe(onUpdate, onError);
	}

	set(doc: T): Promise<void> {
		return this.#source.set(doc);
	}

	update(changes: Partial<T>): Promise<void> {
		return this.#source.update(changes);
	}

	getStatus(): AdapterStatus {
		return this.#source.getStatus();
	}

	getSource(): SingletonAdapter<T> {
		return this.#source;
	}
}

export function createSingleton<T, O extends {} = object>(
	config: SingletonConfig<T, O>,
): SingletonInterface<T> {
	return new Singleton(config);
}
