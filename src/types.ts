export interface AdapterStatus {
	state: "idle" | "syncing" | "offline" | "error";
	lastSyncAt?: number;
	error?: Error;
}

export type UnsubscribeFn = () => void;

export type Constructor<T, A extends unknown[] = unknown[]> = new (
	...args: A
) => T;
