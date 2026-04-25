import type { AdapterStatus, SingletonSourceAdapter, SourceAdapter, UnsubscribeFn } from "../types/index.js";
/** In-memory collection adapter intended for tests and demos. */
export declare class MemoryAdapter<T extends Record<string, any>> implements SourceAdapter<T> {
    private _documents;
    private _subscriptions;
    private _keyField;
    private _status;
    constructor(keyField?: string, initialDocs?: T[]);
    subscribe(onUpdate: (docs: T[]) => void, onError: (error: Error) => void, query?: unknown): UnsubscribeFn;
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    getStatus(): AdapterStatus;
    /** Return all stored documents. */
    getAllDocuments(): T[];
    /** Remove all stored documents. */
    clear(): void;
    private _notifySubscribers;
}
/** In-memory singleton adapter intended for tests and demos. */
export declare class MemorySingletonAdapter<T> implements SingletonSourceAdapter<T> {
    private _value;
    private _subscriptions;
    private _status;
    constructor(initialValue?: T);
    subscribe(onUpdate: (value: T | undefined) => void, onError: (error: Error) => void): UnsubscribeFn;
    set(doc: T): Promise<void>;
    update(changes: Partial<T>): Promise<void>;
    getStatus(): AdapterStatus;
    /** Return the current value. */
    getValue(): T | undefined;
    /** Clear the current value. */
    clear(): void;
    private _notifySubscribers;
}
//# sourceMappingURL=memoryAdapter.d.ts.map