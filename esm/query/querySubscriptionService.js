import { getCTEIdentity } from "./cte.js";
import { createSubscriptionManager, } from "./subscriptionManager.js";
import { createSourceSubscription } from "./sourceSubscription.js";
import { createQueryBuilder } from "./queryBuilder.js";
import { createDefaultQueryExecutionPort } from "./queryExecution.js";
import { createQuerySubscriptionAdapter } from "./querySubscriptionAdapter.js";
class QuerySubscriptionServiceImpl {
    constructor(config) {
        if (!config.source && !config.sourceSubscription) {
            throw new Error("QuerySubscriptionService requires either source or sourceSubscription");
        }
        this.sourceSubscription =
            config.sourceSubscription ??
                createSourceSubscription(config.source);
        this.subscriptionManager =
            config.subscriptionManager ?? createSubscriptionManager();
        this.queryExecutor =
            config.queryExecutor ?? createDefaultQueryExecutionPort();
        this.serializeKey = config.keySerializer ?? getCTEIdentity;
    }
    subscribe(cte, callbacks) {
        return this.createSubscription(cte)(callbacks);
    }
    createSubscription(cte) {
        const subscriptionKey = this.serializeKey(cte);
        const adapterFactory = () => createQuerySubscriptionAdapter(cte, this.sourceSubscription, this.queryExecutor);
        return (callbacks) => {
            return this.subscriptionManager.subscribe({
                id: subscriptionKey,
                adapterFactory,
                onUpdate: callbacks.onUpdate,
                onError: callbacks.onError,
            });
        };
    }
    createQueryBuilder() {
        return createQueryBuilder((cte) => this.createSubscription(cte));
    }
    fetchSnapshot(cte) {
        const subscriptionKey = this.serializeKey(cte);
        const snapshot = this.subscriptionManager.getSnapshot(subscriptionKey);
        if (snapshot !== null) {
            return snapshot;
        }
        const snapshotProvider = this.sourceSubscription.getSnapshot;
        if (!snapshotProvider) {
            throw new Error("Source subscription does not support snapshot retrieval");
        }
        const sourceDocs = snapshotProvider.call(this.sourceSubscription);
        return this.queryExecutor.execute(cte, [...sourceDocs]);
    }
}
export function createQuerySubscriptionService(config) {
    return new QuerySubscriptionServiceImpl(config);
}
export function createQueryService(config) {
    return createQuerySubscriptionService(config);
}
//# sourceMappingURL=querySubscriptionService.js.map