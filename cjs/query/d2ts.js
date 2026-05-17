"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.D2Executor = void 0;
exports.createIncrementalQuery = createIncrementalQuery;
const D2Executor_js_1 = require("./D2Executor.js");
function createIncrementalQuery(cte, source = [], joins = []) {
    return new D2Executor_js_1.D2Executor().execute(cte, source, joins);
}
var D2Executor_js_2 = require("./D2Executor.js");
Object.defineProperty(exports, "D2Executor", { enumerable: true, get: function () { return D2Executor_js_2.D2Executor; } });
//# sourceMappingURL=d2ts.js.map