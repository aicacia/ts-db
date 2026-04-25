import type { UnsubscribeFn } from "../types/index.js";
import type { IQueryBuilder } from "../query/queryBuilder.js";
import type { ISingleton } from "../singleton/index.js";
export interface StoreState<T> {
    data: T;
    error: Error | null;
    unsubscribe: UnsubscribeFn | null;
}
/**
 * Create a reactive collection store for use in Svelte components
 * Cleanup is handled automatically via Svelte effect
 *
 * Usage in component:
 * ```
 * import { collection } from '@aicacia/db/svelte';
 * const recipes = collection(recipesCollection.query());
 *
 * // In template:
 * {#each recipes.data as recipe (recipe.id)}
 *   <div>{recipe.name}</div>
 * {/each}
 * ```
 */
export declare function collection<T>(query: IQueryBuilder<T>): {
    data: T[];
    error: Error | null;
};
/**
 * Create a reactive singleton store for use in Svelte components
 * Cleanup is handled automatically via Svelte effect
 *
 * Usage in component:
 * ```
 * import { singleton } from '@aicacia/db/svelte';
 * const settings = singleton(settingsSingleton);
 *
 * // In template:
 * <div>{settings.data?.theme}</div>
 * ```
 */
export declare function singleton<T>(source: ISingleton<T>): {
    data: T | undefined;
    error: Error | null;
};
//# sourceMappingURL=index.svelte.d.ts.map