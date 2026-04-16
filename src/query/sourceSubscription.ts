import type { SourceAdapter, UnsubscribeFn } from "../types.js";
import type { SnapshotSubscriptionAdapter } from "./subscriptionManager.js";
import { safeInvoke, toError } from "../utils.js";

export interface SourceSubscription<T> extends SnapshotSubscriptionAdapter<T> {}

export function createSourceSubscription<T>(
	source: SourceAdapter<T>,
): SourceSubscription<T> {
	let adapterUnsubscribe: UnsubscribeFn | null = null;
	let hasSnapshot = false;
	let currentDocs: T[] = [];
	const listeners = new Set<{
		onUpdate: (docs: T[]) => void;
		onError: (error: Error) => void;
	}>();

	function stopSourceSubscription(): void {
		if (!adapterUnsubscribe) {
			return;
		}

		try {
			adapterUnsubscribe();
		} catch {
			// ignore adapter unsubscribe failures
		}

		adapterUnsubscribe = null;
		hasSnapshot = false;
		currentDocs = [];
	}

	function notifyListeners(docs: T[]): void {
		for (const listener of Array.from(listeners)) {
			safeInvoke(listener.onUpdate, docs, listener.onError, true);
		}
	}

	function notifyError(error: Error): void {
		for (const listener of Array.from(listeners)) {
			if (listener.onError) {
				safeInvoke(listener.onError, toError(error), undefined, true);
			}
		}
	}

	function ensureSourceSubscription(): void {
		if (adapterUnsubscribe) {
			return;
		}

		adapterUnsubscribe = source.subscribe(
			(docs) => {
				currentDocs = [...docs];
				hasSnapshot = true;
				notifyListeners(currentDocs);
			},
			(error) => {
				notifyError(error);
			},
		);
	}

	return {
		subscribe(onUpdate, onError) {
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

			ensureSourceSubscription();
			listeners.add(wrappedListener);

			if (hasSnapshot && !receivedSnapshot) {
				try {
					wrappedListener.onUpdate([...currentDocs]);
				} catch (err) {
					wrappedListener.onError(toError(err));
				}
			}

			return () => {
				listeners.delete(wrappedListener);
				if (listeners.size === 0) {
					stopSourceSubscription();
				}
			};
		},

		getSnapshot() {
			return [...currentDocs];
		},
	};
}
