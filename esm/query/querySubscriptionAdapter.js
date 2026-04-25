import { safeInvoke, toError } from "../utils/index.js";
export const createQuerySubscriptionAdapter = (cte, sourceAdapter, queryExecutor) => {
    return {
        subscribe(onUpdate, onError) {
            return sourceAdapter.subscribe((docs) => {
                let results;
                try {
                    results = queryExecutor.execute(cte, [...docs]);
                }
                catch (err) {
                    try {
                        onError(toError(err));
                    }
                    catch (e) {
                        throw toError(e);
                    }
                    return;
                }
                const updateError = safeInvoke(onUpdate, results, onError);
                if (updateError) {
                    throw updateError;
                }
            }, onError, cte);
        },
        getSnapshot: () => {
            const sourceSnapshot = sourceAdapter.getSnapshot?.(cte) ?? [];
            return queryExecutor.execute(cte, [...sourceSnapshot]);
        },
    };
};
//# sourceMappingURL=querySubscriptionAdapter.js.map