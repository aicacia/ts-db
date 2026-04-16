import type { UnsubscribeFn } from "../types.js";
import { toError } from "../utils.js";

export interface SubscriptionAdapter<T> {
  subscribe(
    onUpdate: (rows: T[]) => void,
    onError: (err: Error) => void,
  ): UnsubscribeFn;
  getSnapshot?: () => T[];
}

export type SnapshotSubscriptionAdapter<T> = SubscriptionAdapter<T> & {
  getSnapshot(): T[];
};

export type SubscriptionAdapterFactory<T> = () => SubscriptionAdapter<T>;

type Subscriber<T> = {
  onUpdate: (rows: T[]) => void;
  onError?: (err: Error) => void;
};

interface Entry<T> {
  adapter?: SubscriptionAdapter<T>;
  adapterUnsubscribe?: UnsubscribeFn;
  subscribers: Set<Subscriber<T>>;
  lastResults: T[] | null;
}

export class SubscriptionManager<T> {
  private _entries: Map<string, Entry<T>> = new Map();

  private _copySubscribers(entry: Entry<T>): Subscriber<T>[] {
    return Array.from(entry.subscribers.values());
  }

  private _dispatchSubscriberError(subscribers: Subscriber<T>[], error: Error): void {
    let handlerFailure: unknown;
    let missingErrorHandler = false;

    for (const subscriber of subscribers) {
      if (subscriber.onError) {
        try {
          subscriber.onError(error);
        } catch (hErr) {
          handlerFailure = hErr;
        }
      } else {
        missingErrorHandler = true;
      }
    }

    if (missingErrorHandler) {
      throw error;
    }

    if (handlerFailure !== undefined && subscribers.length === 1) {
      throw toError(handlerFailure);
    }
  }

  subscribe(opts: {
    id: string;
    adapterFactory: SubscriptionAdapterFactory<T>;
    onUpdate: (rows: T[]) => void;
    onError?: (err: Error) => void;
  }): () => void {
    const id = opts.id;
    
    let entry = this._entries.get(id);

    if (!entry) {
      entry = {
        adapter: undefined,
        adapterUnsubscribe: undefined,
        subscribers: new Set(),
        lastResults: null,
      };
      this._entries.set(id, entry);
    }

    const subscriber: Subscriber<T> = {
      onUpdate: opts.onUpdate,
      onError: opts.onError,
    };

    // Add subscriber before adapter.subscribe so synchronous adapter pushes
    // will reach this subscriber immediately.
    entry.subscribers.add(subscriber);

    const hadAdapterBefore = Boolean(entry.adapter);

    if (!entry.adapter) {
      const adapter = opts.adapterFactory();
      entry.adapter = adapter;

      const internalUpdate = (rows: T[]) => {
        entry.lastResults = rows;

        const subs = this._copySubscribers(entry);

        let firstUpdateError: Error | undefined;
        for (const s of subs) {
          try {
            s.onUpdate(rows);
          } catch (uErr) {
            if (!firstUpdateError) {
              firstUpdateError = toError(uErr);
            }
          }
        }

        if (firstUpdateError) {
          this._dispatchSubscriberError(subs, firstUpdateError);
        }
      };

      const internalError = (err: Error) => {
        const subs = this._copySubscribers(entry);
        this._dispatchSubscriberError(subs, toError(err));
      };

      // Start adapter subscription
      entry.adapterUnsubscribe = adapter.subscribe(internalUpdate, internalError);
    }
    const justCreatedAdapter = !hadAdapterBefore && Boolean(entry.adapter);

    // If we already have cached results (from a previous adapter subscription), send them immediately
    if (entry.lastResults !== null && !justCreatedAdapter) {
      try {
        opts.onUpdate(entry.lastResults);
      } catch (err) {
        const normalized = toError(err);
        if (opts.onError) {
          try {
            opts.onError(normalized);
          } catch (e) {
            // If only one subscriber, mimic previous behaviour and throw
            if (entry.subscribers.size === 1) {
              throw toError(e);
            }
          }
        } else {
          // No error handler provided -> throw
          throw normalized;
        }
      }
    }

    // Return unsubscribe
    return () => {
      const current = this._entries.get(id);
      if (!current) {
        return;
      }

      current.subscribers.delete(subscriber);

      if (current.subscribers.size === 0) {
        // teardown adapter subscription
        if (current.adapterUnsubscribe) {
          try {
            current.adapterUnsubscribe();
          } catch (e) {
            // ignore adapter unsubscribe errors
          }
        }
        this._entries.delete(id);
      }
    };
  }

  getSnapshot(id: string): T[] | null {
    const entry = this._entries.get(id);
    if (!entry) {
      return null;
    }

    if (entry.lastResults !== null) {
      return entry.lastResults;
    }

    if (!entry.adapter) {
      return null;
    }

    const snapshotProvider = entry.adapter.getSnapshot;

    if (!snapshotProvider) {
      return null;
    }

    try {
      return snapshotProvider.call(entry.adapter);
    } catch {
      return null;
    }
  }
}

export function createSubscriptionManager<T>() {
  return new SubscriptionManager<T>();
}
