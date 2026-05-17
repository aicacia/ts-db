import type { CollectionAdapter, CollectionAdapterOptions } from "../collection/Collection.js";
import type { CTE } from "../query/cte.js";
import type { AdapterStatus, UnsubscribeFn } from "../types.js";
export interface MemoryCollectionAdapterOptions<T> extends CollectionAdapterOptions<T> {
    initialDocs?: T[];
}
export declare class MemoryCollectionAdapter<T> implements CollectionAdapter<T> {
    #private;
    constructor(options?: MemoryCollectionAdapterOptions<T>);
    subscribe(onUpdate: (docs: T[]) => void, onError: (error: Error) => void, _query: CTE<T>): UnsubscribeFn;
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    getStatus(): AdapterStatus;
}
//# sourceMappingURL=MemoryCollectionAdapter.d.ts.map