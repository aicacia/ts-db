import type { SourceAdapter, UnsubscribeFn } from "../types/index.js";
import type { SnapshotSubscriptionAdapter } from "./subscriptionManager.js";
import {
	notifySubscribersSwallow,
	notifySubscriberErrors,
} from "../utils/subscriptions.js";
import { toError } from "../utils/index.js";

interface SourceQueryEntry<T> {
	sourceUnsubscribe: UnsubscribeFn;
	listeners: Set<{
		onUpdate: (docs: T[]) => void;
		onError: (error: Error) => void;
	}>;
	currentDocs: T[];
	hasSnapshot: boolean;
}

export interface SourceSubscription<T, Q = unknown>
	extends SnapshotSubscriptionAdapter<T, Q> {}

function createQueryKey<Q>(query?: Q): string {
	if (query === undefined) {
		return "__default__";
	}

	try {
		return `query:${JSON.stringify(query)}`;
	} catch {
		return `query:${String(query)}`;
	}
}

export function createSourceSubscription<T, Q = unknown>(
	source: SourceAdapter<T, Q>,
): SourceSubscription<T, Q> {
	const entries = new Map<string, SourceQueryEntry<T>>();

	function notifyListeners(entry: SourceQueryEntry<T>, docs: T[]): void {
		notifySubscribersSwallow(entry.listeners, docs);
	}

	function notifyError(entry: SourceQueryEntry<T>, error: Error): void {
		notifySubscriberErrors(entry.listeners, error);
	}

	function ensureSourceSubscription(query?: Q): SourceQueryEntry<T> {
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
		subscribe(onUpdate, onError, query?: Q) {
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

		getSnapshot(query?: Q) {
			const entry = entries.get(createQueryKey(query));
			return entry ? [...entry.currentDocs] : [];
		},
	};
}
