import type { AdapterStatus, Constructor, UnsubscribeFn } from "../types.js";
export interface SingletonAdapter<T> {
    subscribe(onUpdate: (value: T | undefined) => void, onError: (error: Error) => void): UnsubscribeFn;
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
    subscribe(onUpdate: (value: T | undefined) => void, onError?: (error: Error) => void): UnsubscribeFn;
    set(doc: T): Promise<void>;
    update(changes: Partial<T>): Promise<void>;
    getStatus(): AdapterStatus;
    getSource(): SingletonAdapter<T>;
}
export declare class Singleton<T, O extends {} = object> implements SingletonInterface<T> {
    #private;
    readonly config: SingletonConfig<T, O>;
    constructor(config: SingletonConfig<T, O>);
    subscribe(onUpdate: (value: T | undefined) => void, onError?: (error: Error) => void): UnsubscribeFn;
    set(doc: T): Promise<void>;
    update(changes: Partial<T>): Promise<void>;
    getStatus(): AdapterStatus;
    getSource(): SingletonAdapter<T>;
}
export declare function createSingleton<T, O extends {} = object>(config: SingletonConfig<T, O>): SingletonInterface<T>;
//# sourceMappingURL=Singleton.d.ts.map