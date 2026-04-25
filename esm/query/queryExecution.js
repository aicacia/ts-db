import { applyCTE } from "./filterEngine.js";
export function createDefaultQueryExecutionPort() {
    return {
        execute(cte, docs) {
            return applyCTE(cte, docs);
        },
    };
}
//# sourceMappingURL=queryExecution.js.map