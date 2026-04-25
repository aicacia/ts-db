import type { AdapterStatus, SingletonSourceAdapter, UnsubscribeFn } from "../types/index.js";
/**
 * Singleton configuration
 */
export interface SingletonConfig<T> {
    /** Unique singleton identifier */
    id: string;
    /** Source adapter for this singleton */
    source: SingletonSourceAdapter<T>;
    /** Default value if not yet set */
    defaultValue?: T;
}
/**
 * Singleton interface
 */
export interface ISingleton<T> {
    readonly id: string;
    /**
     * Subscribe to singleton value
     */
    subscribe(onUpdate: (value: T | undefined) => void, onError?: (error: Error) => void): UnsubscribeFn;
    /**
     * Replace entire singleton value
     * @throws Error if set fails
     */
    set(doc: T): Promise<void>;
    /**
     * Merge changes into singleton value
     * @throws Error if update fails
     */
    update(changes: Partial<T>): Promise<void>;
    /**
     * Get current adapter status
     */
    getStatus(): AdapterStatus;
}
/**
 * Singleton - represents a singleton value (at most one document)
 */
export declare class Singleton<T> implements ISingleton<T> {
    readonly id: string;
    private _source;
    private _subscriptions;
    private _adapterUnsubscribe;
    private _cache;
    private _defaultValue;
    private _adapterSubscribed;
    constructor(config: SingletonConfig<T>);
    subscribe(onUpdate: (value: T | undefined) => void, onError?: (error: Error) => void): UnsubscribeFn;
    set(doc: T): Promise<void>;
    update(changes: Partial<T>): Promise<void>;
    getStatus(): AdapterStatus;
    private _startAdapterSubscription;
    private _stopAdapterSubscription;
    private _handleAdapterUpdate;
    private _handleAdapterError;
}
export declare function createSingleton<T>(config: SingletonConfig<T>): ISingleton<T>;
//# sourceMappingURL=singleton.d.ts.map