import { safeInvoke, toError } from "./error.js";
export function notifySubscribers(subscribers, value) {
    for (const sub of subscribers) {
        const err = safeInvoke(sub.onUpdate, value, sub.onError);
        if (err)
            return err;
    }
    return undefined;
}
export function notifySubscribersSwallow(subscribers, value) {
    for (const sub of subscribers) {
        safeInvoke(sub.onUpdate, value, sub.onError, true);
    }
}
export function notifySubscriberErrors(subscribers, error) {
    const normalized = toError(error);
    for (const sub of subscribers) {
        if (sub.onError) {
            safeInvoke(sub.onError, normalized, undefined, true);
        }
    }
}
//# sourceMappingURL=subscriptions.js.map