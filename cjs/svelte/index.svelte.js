"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collection = collection;
exports.singleton = singleton;
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