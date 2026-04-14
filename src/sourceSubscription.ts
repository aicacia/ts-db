import type { SourceAdapter, UnsubscribeFn } from "./types.js";
import { toError } from "./utils.js";

export interface SourceSubscription<T> {
	subscribe(
		onUpdate: (docs: T[]) => void,
		onError: (error: Error) => void,
	): UnsubscribeFn;
	fetchSnapshot(): T[];
}

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
			try {
				listener.onUpdate(docs);
			} catch (err) {
				try {
					listener.onError(toError(err));
				} catch {
					// swallow if listener error handler throws
				}
			}
		}
	}

	function notifyError(error: Error): void {
		for (const listener of Array.from(listeners)) {
			try {
				listener.onError(toError(error));
			} catch {
				// swallow listener error handler failures
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

		fetchSnapshot() {
			return [...currentDocs];
		},
	};
}
