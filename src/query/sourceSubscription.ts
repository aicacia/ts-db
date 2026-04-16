import type { SourceAdapter, UnsubscribeFn } from "../types.js";
import type { SnapshotSubscriptionAdapter } from "./subscriptionManager.js";
import { safeInvoke, toError } from "../utils.js";

interface SourceQueryEntry<T> {
sourceUnsubscribe: UnsubscribeFn;
listeners: Set<{
onUpdate: (docs: T[]) => void;
onError: (error: Error) => void;
}>;
currentDocs: T[];
hasSnapshot: boolean;
}

export interface SourceSubscription<T> extends SnapshotSubscriptionAdapter<T> {}

function createQueryKey(query?: unknown): string {
if (query === undefined) {
return "__default__";
}

try {
return `query:${JSON.stringify(query)}`;
} catch {
return `query:${String(query)}`;
}
}

export function createSourceSubscription<T>(
source: SourceAdapter<T>,
): SourceSubscription<T> {
const entries = new Map<string, SourceQueryEntry<T>>();

function notifyListeners(entry: SourceQueryEntry<T>, docs: T[]): void {
for (const listener of Array.from(entry.listeners)) {
safeInvoke(listener.onUpdate, docs, listener.onError, true);
}
}

function notifyError(entry: SourceQueryEntry<T>, error: Error): void {
for (const listener of Array.from(entry.listeners)) {
if (listener.onError) {
safeInvoke(listener.onError, toError(error), undefined, true);
}
}
}

function ensureSourceSubscription(query?: unknown): SourceQueryEntry<T> {
const key = createQueryKey(query);
let entry = entries.get(key);
if (entry) {
return entry;
}

entry = {
sourceUnsubscribe: () => {
/* noop */
},
listeners: new Set(),
currentDocs: [],
hasSnapshot: false,
};

entry.sourceUnsubscribe = source.subscribe(
(docs) => {
entry.currentDocs = [...docs];
entry.hasSnapshot = true;
notifyListeners(entry, entry.currentDocs);
},
(error) => {
notifyError(entry, error);
},
query,
);

entries.set(key, entry);
return entry;
}

return {
subscribe(onUpdate, onError, query?: unknown) {
const entry = ensureSourceSubscription(query);
let receivedSnapshot = false;

const wrappedListener = {
onUpdate(docs: T[]) {
receivedSnapshot = true;
onUpdate(docs);
},
onError(error: Error) {
onError(error);
},
};

entry.listeners.add(wrappedListener);

if (entry.hasSnapshot && !receivedSnapshot) {
try {
wrappedListener.onUpdate([...entry.currentDocs]);
} catch (err) {
wrappedListener.onError(toError(err));
}
}

return () => {
entry.listeners.delete(wrappedListener);
if (entry.listeners.size === 0) {
try {
entry.sourceUnsubscribe();
} catch {
// ignore unsubscribe errors
}
entries.delete(createQueryKey(query));
}
};
},

getSnapshot(query?: unknown) {
const entry = entries.get(createQueryKey(query));
return entry ? [...entry.currentDocs] : [];
},
};
}
