"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuerySubscriptionAdapter = void 0;
const index_js_1 = require("../utils/index.js");
const createQuerySubscriptionAdapter = (cte, sourceAdapter, queryExecutor) => {
    return {
        subscribe(onUpdate, onError) {
            return sourceAdapter.subscribe((docs) => {
                let results;
                try {
                    results = queryExecutor.execute(cte, [...docs]);
                }
                catch (err) {
                    try {
                        onError((0, index_js_1.toError)(err));
                    }
                    catch (e) {
                        throw (0, index_js_1.toError)(e);
                    }
                    return;
                }
                const updateError = (0, index_js_1.safeInvoke)(onUpdate, results, onError);
                if (updateError) {
                    throw updateError;
                }
            }, onError, cte);
        },
        getSnapshot: () => {
            var _a, _b;
            const sourceSnapshot = (_b = (_a = sourceAdapter.getSnapshot) === null || _a === void 0 ? void 0 : _a.call(sourceAdapter, cte)) !== null && _b !== void 0 ? _b : [];
            return queryExecutor.execute(cte, [...sourceSnapshot]);
        },
    };
};
exports.createQuerySubscriptionAdapter = createQuerySubscriptionAdapter;
//# sourceMappingURL=querySubscriptionAdapter.js.map