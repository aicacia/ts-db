"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuerySubscriptionService = createQuerySubscriptionService;
exports.createQueryService = createQueryService;
const cte_js_1 = require("./cte.js");
const subscriptionManager_js_1 = require("./subscriptionManager.js");
const sourceSubscription_js_1 = require("./sourceSubscription.js");
const queryBuilder_js_1 = require("./queryBuilder.js");
const queryExecution_js_1 = require("./queryExecution.js");
const querySubscriptionAdapter_js_1 = require("./querySubscriptionAdapter.js");
class QuerySubscriptionServiceImpl {
    constructor(config) {
        var _a, _b, _c, _d;
        if (!config.source && !config.sourceSubscription) {
            throw new Error("QuerySubscriptionService requires either source or sourceSubscription");
        }
        this.sourceSubscription =
            (_a = config.sourceSubscription) !== null && _a !== void 0 ? _a : (0, sourceSubscription_js_1.createSourceSubscription)(config.source);
        this.subscriptionManager =
            (_b = config.subscriptionManager) !== null && _b !== void 0 ? _b : (0, subscriptionManager_js_1.createSubscriptionManager)();
        this.queryExecutor =
            (_c = config.queryExecutor) !== null && _c !== void 0 ? _c : (0, queryExecution_js_1.createDefaultQueryExecutionPort)();
        this.serializeKey = (_d = config.keySerializer) !== null && _d !== void 0 ? _d : cte_js_1.getCTEIdentity;
    }
    subscribe(cte, callbacks) {
        return this.createSubscription(cte)(callbacks);
    }
    createSubscription(cte) {
        const subscriptionKey = this.serializeKey(cte);
        const adapterFactory = () => (0, querySubscriptionAdapter_js_1.createQuerySubscriptionAdapter)(cte, this.sourceSubscription, this.queryExecutor);
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
        return (0, queryBuilder_js_1.createQueryBuilder)((cte) => this.createSubscription(cte));
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
function createQuerySubscriptionService(config) {
    return new QuerySubscriptionServiceImpl(config);
}
function createQueryService(config) {
    return createQuerySubscriptionService(config);
}
//# sourceMappingURL=querySubscriptionService.js.map