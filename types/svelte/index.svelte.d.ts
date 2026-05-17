import type { QueryBuilderInterface } from "../query/QueryBuilder.js";
import type { SingletonInterface } from "../singleton/index.js";
import type { UnsubscribeFn } from "../types.js";
export interface StoreState<T> {
    data: T;
    error: Error | null;
    unsubscribe: UnsubscribeFn | null;
}
export declare function collection<T>(query: QueryBuilderInterface<T>): {
    data: T[];
    error: Error | null;
};
export declare function singleton<T>(source: SingletonInterface<T>): {
    data: T | undefined;
    error: Error | null;
};
//# sourceMappingURL=index.svelte.d.ts.map