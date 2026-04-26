import type { SingletonAdapter } from "../singleton/Singleton.js";
import type { AdapterStatus } from "../types.js";

export interface MemorySingletonAdapterOptions<T> {
	initialValue?: T;
}

export class MemorySingletonAdapter<T> implements SingletonAdapter<T> {
	#value: T | undefined;
	#status: AdapterStatus = { state: "idle" };
	#subscribers = new Set<{
		onUpdate: (value: T | undefined) => void;
		onError: (error: Error) => void;
	}>();

	constructor(options: MemorySingletonAdapterOptions<T> = {}) {
		this.#value = options.initialValue;
	}

	subscribe(
		onUpdate: (value: T | undefined) => void,
		onError: (error: Error) => void,
	): () => void {
		const subscriber = { onUpdate, onError };
		this.#subscribers.add(subscriber);

		try {
			onUpdate(this.#value);
		} catch (error) {
			onError(error instanceof Error ? error : new Error(String(error)));
		}

		return () => {
			this.#subscribers.delete(subscriber);
		};
	}

	async set(doc: T): Promise<void> {
		this.#setValue(doc);
	}

	async update(changes: Partial<T>): Promise<void> {
		if (this.#value === undefined) {
			throw new Error("Unable to update singleton without a current value");
		}

		this.#setValue({ ...this.#value, ...changes } as T);
	}

	getStatus(): AdapterStatus {
		return { ...this.#status };
	}

	#notifySubscribers(): void {
		for (const { onUpdate, onError } of this.#subscribers) {
			try {
				onUpdate(this.#value);
			} catch (error) {
				onError(error instanceof Error ? error : new Error(String(error)));
			}
		}
	}

	#setValue(value: T): void {
		this.#status = { state: "syncing" };
		this.#value = value;
		this.#status = { state: "idle", lastSyncAt: Date.now() };
		this.#notifySubscribers();
	}
}
