"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collection = collection;
exports.singleton = singleton;
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
function collection(query) {
    let data = $state([]);
    let error = $state(null);
    let unsubscribe = null;
    $effect(() => {
        unsubscribe = query.subscribe((docs) => {
            data = [...docs];
            error = null;
        }, (err) => {
            error = err;
        });
        return () => {
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }
        };
    });
    return {
        get data() {
            return data;
        },
        get error() {
            return error;
        },
    };
}
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
function singleton(source) {
    let data = $state(undefined);
    let error = $state(null);
    let unsubscribe = null;
    $effect(() => {
        unsubscribe = source.subscribe((value) => {
            data = value;
            error = null;
        }, (err) => {
            error = err;
        });
        return () => {
            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }
        };
    });
    return {
        get data() {
            return data;
        },
        get error() {
            return error;
        },
    };
}
//# sourceMappingURL=index.svelte.js.map