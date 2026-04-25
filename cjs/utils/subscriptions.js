"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifySubscribers = notifySubscribers;
exports.notifySubscribersSwallow = notifySubscribersSwallow;
exports.notifySubscriberErrors = notifySubscriberErrors;
const error_js_1 = require("./error.js");
function notifySubscribers(subscribers, value) {
    for (const sub of subscribers) {
        const err = (0, error_js_1.safeInvoke)(sub.onUpdate, value, sub.onError);
        if (err)
            return err;
    }
    return undefined;
}
function notifySubscribersSwallow(subscribers, value) {
    for (const sub of subscribers) {
        (0, error_js_1.safeInvoke)(sub.onUpdate, value, sub.onError, true);
    }
}
function notifySubscriberErrors(subscribers, error) {
    const normalized = (0, error_js_1.toError)(error);
    for (const sub of subscribers) {
        if (sub.onError) {
            (0, error_js_1.safeInvoke)(sub.onError, normalized, undefined, true);
        }
    }
}
//# sourceMappingURL=subscriptions.js.map