"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Singleton = void 0;
exports.createSingleton = createSingleton;
const tslib_1 = require("tslib");
const index_js_1 = require("../utils/index.js");
/**
 * Singleton - represents a singleton value (at most one document)
 */
class Singleton {
    constructor(config) {
        this._subscriptions = new Set();
        this._adapterUnsubscribe = null;
        this._adapterSubscribed = false;
        this.id = config.id;
        this._source = config.source;
        this._cache = config.defaultValue;
        this._defaultValue = config.defaultValue;
    }
    subscribe(onUpdate, onError) {
        const subscription = {
            onUpdate,
            onError: onError ||
                ((error) => {
                    throw error;
                }),
        };
        try {
            onUpdate(this._cache);
        }
        catch (error) {
            subscription.onError((0, index_js_1.toError)(error));
        }
        this._subscriptions.add(subscription);
        if (this._subscriptions.size === 1) {
            this._startAdapterSubscription();
        }
        return () => {
            this._subscriptions.delete(subscription);
            if (this._subscriptions.size === 0) {
                this._stopAdapterSubscription();
            }
        };
    }
    set(doc) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._source.set(doc);
        });
    }
    update(changes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this._source.update(changes);
        });
    }
    getStatus() {
        return this._source.getStatus();
    }
    _startAdapterSubscription() {
        if (this._adapterSubscribed) {
            return;
        }
        this._adapterSubscribed = true;
        this._adapterUnsubscribe = this._source.subscribe((value) => this._handleAdapterUpdate(value), (error) => this._handleAdapterError(error));
    }
    _stopAdapterSubscription() {
        if (this._adapterUnsubscribe) {
            this._adapterUnsubscribe();
            this._adapterUnsubscribe = null;
        }
        this._adapterSubscribed = false;
    }
    _handleAdapterUpdate(value) {
        const effectiveValue = value === undefined && this._defaultValue !== undefined
            ? this._defaultValue
            : value;
        if (this._cache !== effectiveValue) {
            this._cache = effectiveValue;
            for (const subscription of this._subscriptions) {
                try {
                    subscription.onUpdate(this._cache);
                }
                catch (error) {
                    this._handleAdapterError((0, index_js_1.toError)(error));
                }
            }
        }
    }
    _handleAdapterError(error) {
        for (const subscription of this._subscriptions) {
            try {
                subscription.onError(error);
            }
            catch (_a) {
                // Silently ignore errors from error handlers to prevent infinite loops
            }
        }
    }
}
exports.Singleton = Singleton;
function createSingleton(config) {
    return new Singleton(config);
}
//# sourceMappingURL=singleton.js.map