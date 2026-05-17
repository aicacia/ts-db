import { D2Executor } from "./D2Executor.js";
export function createIncrementalQuery(cte, source = [], joins = []) {
    return new D2Executor().execute(cte, source, joins);
}
export { D2Executor } from "./D2Executor.js";
//# sourceMappingURL=d2ts.js.map