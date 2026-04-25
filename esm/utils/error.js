/**
 * Invoke a callback safely and optionally report any failure to an error handler.
 * If the callback throws and the error handler is provided, the error handler is called.
 * If the error handler also throws, that failure is propagated unless swallowOnErrorFailures is true.
 */
export function safeInvoke(callback, value, onError, swallowOnErrorFailures = false) {
    try {
        callback(value);
        return undefined;
    }
    catch (error) {
        const normalized = toError(error);
        if (!onError) {
            return normalized;
        }
        try {
            onError(normalized);
            return undefined;
        }
        catch (handlerError) {
            if (swallowOnErrorFailures) {
                return undefined;
            }
            return toError(handlerError);
        }
    }
}
/**
 * Normalize unknown error to Error instance.
 */
export function toError(error) {
    return error instanceof Error ? error : new Error(String(error));
}
//# sourceMappingURL=error.js.map