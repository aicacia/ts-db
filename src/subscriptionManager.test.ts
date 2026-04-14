import test from "tape";
import { createSubscriptionManager } from "./subscriptionManager.js";

test("SubscriptionManager: dedupe adapter subscribe calls", (t) => {
  const mgr = createSubscriptionManager<any>();
  let subscribeCalls = 0;

  const adapterFactory = () => ({
    subscribe(_onUpdate: any, _onError: any) {
      subscribeCalls++;
      return () => {
        /* noop */
      };
    },
  });

  const unsub1 = mgr.subscribe({
    id: "key",
    adapterFactory,
    onUpdate: () => {},
    onError: () => {},
  });

  const unsub2 = mgr.subscribe({
    id: "key",
    adapterFactory,
    onUpdate: () => {},
    onError: () => {},
  });

  t.equal(subscribeCalls, 1, "Adapter.subscribe should be called only once for same id");

  unsub1();
  unsub2();
  t.end();
});

test("SubscriptionManager: initial synchronous snapshot delivered", (t) => {
  const mgr = createSubscriptionManager<any>();
  const updates: any[] = [];

  const adapterFactory = () => ({
    subscribe(onUpdate: any, _onError: any) {
      // synchronous initial snapshot
      onUpdate([{ id: "1", name: "x" }]);
      return () => {
        /* noop */
      };
    },
  });

  const unsub = mgr.subscribe({
    id: "snap",
    adapterFactory,
    onUpdate: (rows) => updates.push(rows),
    onError: () => t.fail("unexpected error"),
  });

  t.equal(updates.length, 1, "Should receive initial snapshot synchronously");

  unsub();
  t.end();
});

test("SubscriptionManager: unsubscribe prevents further notifications", (t) => {
  const mgr = createSubscriptionManager<any>();
  const updates: any[] = [];

  let adapterInstance: any = null;
  const adapterFactory = () => {
    adapterInstance = {
      _cb: null as any,
      subscribe(onUpdate: any, _onError: any) {
        this._cb = onUpdate;
        return () => {
          this._cb = null;
        };
      },
      emit(rows: any[]) {
        if (this._cb) {
          this._cb(rows);
        }
      },
    };
    return adapterInstance;
  };

  const unsub = mgr.subscribe({
    id: "live",
    adapterFactory,
    onUpdate: (rows) => updates.push(rows),
    onError: () => t.fail("unexpected error"),
  });

  // adapter instance should be created and usable
  adapterInstance.emit([{ id: "a" }]);
  t.equal(updates.length, 1, "Should receive first update");

  unsub();

  // emit again after unsubscribe
  adapterInstance.emit([{ id: "b" }]);
  t.equal(updates.length, 1, "Should not receive updates after unsubscribe");

  t.end();
});
