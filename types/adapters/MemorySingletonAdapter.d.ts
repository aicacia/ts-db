import type { SingletonAdapter } from "../singleton/Singleton.js";
import type { AdapterStatus } from "../types.js";
export interface MemorySingletonAdapterOptions<T> {
    initialValue?: T;
}
export declare class MemorySingletonAdapter<T> implements SingletonAdapter<T> {
    #private;
    constructor(options?: MemorySingletonAdapterOptions<T>);
    subscribe(onUpdate: (value: T | undefined) => void, onError: (error: Error) => void): () => void;
    set(doc: T): Promise<void>;
    update(changes: Partial<T>): Promise<void>;
    getStatus(): AdapterStatus;
}
//# sourceMappingURL=MemorySingletonAdapter.d.ts.map