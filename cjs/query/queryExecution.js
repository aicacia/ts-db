"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultQueryExecutionPort = createDefaultQueryExecutionPort;
const filterEngine_js_1 = require("./filterEngine.js");
function createDefaultQueryExecutionPort() {
    return {
        execute(cte, docs) {
            return (0, filterEngine_js_1.applyCTE)(cte, docs);
        },
    };
}
//# sourceMappingURL=queryExecution.js.map