import { toError } from "./utils.js";

export interface AdapterLike<T> {
  subscribe(
    onUpdate: (rows: T[]) => void,
    onError: (err: Error) => void,
  ): () => void;
  fetchSnapshot?: () => T[] | Promise<T[]>;
}

type Subscriber<T> = {
  onUpdate: (rows: T[]) => void;
  onError?: (err: Error) => void;
};

interface Entry<T> {
  adapter?: AdapterLike<T>;
  adapterUnsubscribe?: () => void;
  subscribers: Set<Subscriber<T>>;
  lastResults: T[] | null;
}

export class SubscriptionManager<T> {
  private _entries: Map<string, Entry<T>> = new Map();

  subscribe(opts: {
    id: string;
    adapterFactory: () => AdapterLike<T>;
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
        entry!.lastResults = rows;

        const subs = Array.from(entry!.subscribers.values());

        // First, call onUpdate for all subscribers, capture the first error if any.
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

        // If any onUpdate threw, dispatch that error to all subscribers' onError handlers
        if (firstUpdateError) {
          let handlerFailure: unknown;
          for (const s of subs) {
            if (s.onError) {
              try {
                s.onError(firstUpdateError);
              } catch (hErr) {
                handlerFailure = hErr;
              }
            } else {
              handlerFailure = firstUpdateError;
            }
          }

          if (handlerFailure !== undefined && entry!.subscribers.size === 1) {
            throw toError(handlerFailure);
          }
        }
      };

      const internalError = (err: Error) => {
        let handlerFailure: unknown;
        const subs = Array.from(entry!.subscribers.values());
        for (const s of subs) {
          if (s.onError) {
            try {
              s.onError(toError(err));
            } catch (hErr) {
              handlerFailure = hErr;
            }
          } else {
            handlerFailure = err;
          }
        }
        if (handlerFailure !== undefined && entry!.subscribers.size === 1) {
          throw toError(handlerFailure);
        }
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
            if (entry!.subscribers.size === 1) {
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
}

export function createSubscriptionManager<T>() {
  return new SubscriptionManager<T>();
}
