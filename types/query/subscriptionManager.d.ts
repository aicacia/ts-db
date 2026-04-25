import type { UnsubscribeFn } from "../types/index.js";
export interface SubscriptionAdapter<T, Q = unknown> {
    subscribe(onUpdate: (rows: T[]) => void, onError: (err: Error) => void, query?: Q): UnsubscribeFn;
    getSnapshot?: (query?: Q) => T[];
}
export type SnapshotSubscriptionAdapter<T, Q = unknown> = SubscriptionAdapter<T, Q> & {
    getSnapshot(): T[];
};
export type SubscriptionAdapterFactory<T> = () => SubscriptionAdapter<T>;
export declare class SubscriptionManager<T> {
    private _entries;
    private _copySubscribers;
    private _dispatchSubscriberError;
    subscribe(opts: {
        id: string;
        adapterFactory: SubscriptionAdapterFactory<T>;
        onUpdate: (rows: T[]) => void;
        onError?: (err: Error) => void;
    }): () => void;
    getSnapshot(id: string): T[] | null;
}
export declare function createSubscriptionManager<T>(): SubscriptionManager<T>;
//# sourceMappingURL=subscriptionManager.d.ts.map