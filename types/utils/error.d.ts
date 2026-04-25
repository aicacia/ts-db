export type ErrorCallback = (error: Error) => void;
/**
 * Invoke a callback safely and optionally report any failure to an error handler.
 * If the callback throws and the error handler is provided, the error handler is called.
 * If the error handler also throws, that failure is propagated unless swallowOnErrorFailures is true.
 */
export declare function safeInvoke<T>(callback: (value: T) => void, value: T, onError?: ErrorCallback, swallowOnErrorFailures?: boolean): Error | undefined;
/**
 * Normalize unknown error to Error instance.
 */
export declare function toError(error: unknown): Error;
//# sourceMappingURL=error.d.ts.map