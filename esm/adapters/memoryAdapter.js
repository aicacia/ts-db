import { notifySubscribers, } from "../utils/subscriptions.js";
/** In-memory collection adapter intended for tests and demos. */
// biome-ignore lint/suspicious/noExplicitAny: support any object
export class MemoryAdapter {
    constructor(keyField = "id", initialDocs) {
        this._documents = new Map();
        this._subscriptions = [];
        this._status = { state: "idle" };
        this._keyField = keyField;
        if (initialDocs) {
            for (const doc of initialDocs) {
                const key = String(doc[keyField]);
                this._documents.set(key, doc);
            }
        }
    }
    subscribe(onUpdate, onError, query) {
        const entry = {
            onUpdate,
            onError,
        };
        this._subscriptions.push(entry);
        const error = notifySubscribers([entry], Array.from(this._documents.values()));
        if (error) {
            throw error;
        }
        return () => {
            const index = this._subscriptions.indexOf(entry);
            if (index >= 0) {
                this._subscriptions.splice(index, 1);
            }
        };
    }
    async create(doc) {
        const key = String(doc[this._keyField]);
        if (!key || key === "undefined") {
            throw new Error(`Document missing required key field "${this._keyField}"`);
        }
        this._documents.set(key, doc);
        this._notifySubscribers();
    }
    async update(id, changes) {
        const doc = this._documents.get(id);
        if (!doc) {
            throw new Error(`Document with id "${id}" not found`);
        }
        const updated = { ...doc, ...changes };
        this._documents.set(id, updated);
        this._notifySubscribers();
    }
    async delete(id) {
        if (!this._documents.has(id)) {
            throw new Error(`Document with id "${id}" not found`);
        }
        this._documents.delete(id);
        this._notifySubscribers();
    }
    getStatus() {
        return this._status;
    }
    /** Return all stored documents. */
    getAllDocuments() {
        return Array.from(this._documents.values());
    }
    /** Remove all stored documents. */
    clear() {
        this._documents.clear();
        this._notifySubscribers();
    }
    _notifySubscribers() {
        const allDocs = Array.from(this._documents.values());
        const error = notifySubscribers(this._subscriptions, allDocs);
        if (error) {
            throw error;
        }
    }
}
/** In-memory singleton adapter intended for tests and demos. */
export class MemorySingletonAdapter {
    constructor(initialValue) {
        this._subscriptions = [];
        this._status = { state: "idle" };
        this._value = initialValue;
    }
    subscribe(onUpdate, onError) {
        const entry = {
            onUpdate,
            onError,
        };
        this._subscriptions.push(entry);
        const error = notifySubscribers([entry], this._value);
        if (error) {
            throw error;
        }
        return () => {
            const index = this._subscriptions.indexOf(entry);
            if (index >= 0) {
                this._subscriptions.splice(index, 1);
            }
        };
    }
    async set(doc) {
        this._value = doc;
        this._notifySubscribers();
    }
    async update(changes) {
        if (this._value === undefined) {
            throw new Error("Singleton is not initialized; cannot update");
        }
        this._value = { ...this._value, ...changes };
        this._notifySubscribers();
    }
    getStatus() {
        return this._status;
    }
    /** Return the current value. */
    getValue() {
        return this._value;
    }
    /** Clear the current value. */
    clear() {
        this._value = undefined;
        this._notifySubscribers();
    }
    _notifySubscribers() {
        const error = notifySubscribers(this._subscriptions, this._value);
        if (error) {
            throw error;
        }
    }
}
//# sourceMappingURL=memoryAdapter.js.map