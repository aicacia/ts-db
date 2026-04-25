import { type ICollection } from "../collection/index.js";
import { type ISingleton } from "../singleton/index.js";
import { MemoryAdapter, MemorySingletonAdapter } from "../adapters/index.js";
export interface TestCollectionResult<T extends Record<string, any>> {
    collection: ICollection<T>;
    adapter: MemoryAdapter<T>;
}
/** Result from `createTestSingleton`. */
export interface TestSingletonResult<T> {
    singleton: ISingleton<T>;
    adapter: MemorySingletonAdapter<T>;
}
/** Create a test collection backed by `MemoryAdapter`. */
export declare function createTestCollection<T extends Record<string, any>>(docs?: T[], keyField?: string): TestCollectionResult<T>;
/** Create a test singleton backed by `MemorySingletonAdapter`. */
export declare function createTestSingleton<T>(initialValue?: T): TestSingletonResult<T>;
//# sourceMappingURL=index.d.ts.map