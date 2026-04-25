import { safeInvoke, toError } from "./error.js";

export type Subscriber<T> = {
	onUpdate: (value: T) => void;
	onError?: (error: Error) => void;
};

export function notifySubscribers<T>(
	subscribers: Iterable<Subscriber<T>>,
	value: T,
): Error | undefined {
	for (const sub of subscribers) {
		const err = safeInvoke(sub.onUpdate, value, sub.onError);
		if (err) return err;
	}

	return undefined;
}

export function notifySubscribersSwallow<T>(
	subscribers: Iterable<Subscriber<T>>,
	value: T,
): void {
	for (const sub of subscribers) {
		safeInvoke(sub.onUpdate, value, sub.onError, true);
	}
}

export function notifySubscriberErrors(
	subscribers: Iterable<{ onError?: (error: Error) => void }>,
	error: unknown,
): void {
	const normalized = toError(error);
	for (const sub of subscribers) {
		if (sub.onError) {
			safeInvoke(sub.onError, normalized, undefined, true);
		}
	}
}
