import type { SourceAdapter } from "../types/index.js";
import type { SnapshotSubscriptionAdapter } from "./subscriptionManager.js";
export interface SourceSubscription<T, Q = unknown> extends SnapshotSubscriptionAdapter<T, Q> {
}
export declare function createSourceSubscription<T, Q = unknown>(source: SourceAdapter<T, Q>): SourceSubscription<T, Q>;
//# sourceMappingURL=sourceSubscription.d.ts.map