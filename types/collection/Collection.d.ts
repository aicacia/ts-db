import type { CTE } from "../query/cte.js";
import type { QueryBuilderInterface } from "../query/QueryBuilder.js";
import type { AdapterStatus, Constructor, UnsubscribeFn } from "../types.js";
export interface CollectionAdapter<T> {
    subscribe(onUpdate: (docs: T[]) => void, onError: (error: Error) => void, query: CTE<T>): UnsubscribeFn;
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    getStatus(): AdapterStatus;
}
export interface CollectionAdapterOptions<T> {
    keyOf: (doc: T) => string;
}
export interface CollectionConfig<T, O extends Omit<CollectionAdapterOptions<T>, "keyOf"> = Omit<CollectionAdapterOptions<T>, "keyOf">> {
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
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    getStatus(): AdapterStatus;
    getKeyOf(): (doc: T) => string;
    getSource(): CollectionAdapter<T>;
}
export declare class Collection<T, O extends CollectionAdapterOptions<T> = CollectionAdapterOptions<T>> implements CollectionInterface<T> {
    #private;
    readonly config: CollectionConfig<T, O>;
    constructor(config: CollectionConfig<T, O>);
    get id(): string;
    create(doc: T): Promise<void>;
    update(id: string, changes: Partial<T>): Promise<void>;
    delete(id: string): Promise<void>;
    query(): QueryBuilderInterface<T>;
    subscribe(onUpdate: (docs: T[]) => void, onError?: (error: Error) => void): UnsubscribeFn;
    getStatus(): AdapterStatus;
    getKeyOf(): (doc: T) => string;
    getSource(): CollectionAdapter<T>;
}
export declare function createCollection<T, O extends CollectionAdapterOptions<T> = CollectionAdapterOptions<T>>(config: CollectionConfig<T, O>): CollectionInterface<T>;
//# sourceMappingURL=Collection.d.ts.map