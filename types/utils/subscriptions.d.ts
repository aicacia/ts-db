export type Subscriber<T> = {
    onUpdate: (value: T) => void;
    onError?: (error: Error) => void;
};
export declare function notifySubscribers<T>(subscribers: Iterable<Subscriber<T>>, value: T): Error | undefined;
export declare function notifySubscribersSwallow<T>(subscribers: Iterable<Subscriber<T>>, value: T): void;
export declare function notifySubscriberErrors(subscribers: Iterable<{
    onError?: (error: Error) => void;
}>, error: unknown): void;
//# sourceMappingURL=subscriptions.d.ts.map