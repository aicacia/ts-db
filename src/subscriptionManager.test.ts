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

test("SubscriptionManager: cached results are delivered to later subscribers", (t) => {
  const mgr = createSubscriptionManager<any>();
  let subscribeCalls = 0;
  const updatesA: any[] = [];
  const updatesB: any[] = [];

  const adapterFactory = () => {
    subscribeCalls += 1;
    return {
      subscribe(onUpdate: any, _onError: any) {
        onUpdate([{ id: "x" }]);
        return () => {
          /* noop */
        };
      },
    };
  };

  const unsubA = mgr.subscribe({
    id: "cached",
    adapterFactory,
    onUpdate: (rows) => updatesA.push(rows),
    onError: () => t.fail("unexpected error"),
  });

  t.equal(subscribeCalls, 1, "Adapter subscribe should be called once for first subscriber");
  t.equal(updatesA.length, 1, "First subscriber should receive initial snapshot");

  const unsubB = mgr.subscribe({
    id: "cached",
    adapterFactory,
    onUpdate: (rows) => updatesB.push(rows),
    onError: () => t.fail("unexpected error"),
  });

  t.equal(subscribeCalls, 1, "Adapter factory should not be called again for cached subscription");
  t.equal(updatesB.length, 1, "Second subscriber should receive cached snapshot immediately");
  t.deepEqual(mgr.getSnapshot("cached"), [{ id: "x" }], "Should return cached results from manager");

  unsubA();
  unsubB();
  t.end();
});

test("SubscriptionManager: getSnapshot delegates to adapter when no previous results exist", (t) => {
  const mgr = createSubscriptionManager<any>();
  const adapterFactory = () => ({
    subscribe(_onUpdate: any, _onError: any) {
      return () => {
        /* noop */
      };
    },
    getSnapshot() {
      return [{ id: "snapshot" }];
    },
  });

  mgr.subscribe({
    id: "adapter-snapshot",
    adapterFactory,
    onUpdate: () => {},
    onError: () => {},
  });

  t.deepEqual(
    mgr.getSnapshot("adapter-snapshot"),
    [{ id: "snapshot" }],
    "Should return adapter snapshot when cached results are unavailable",
  );

  t.end();
});

test("SubscriptionManager: adapter errors propagate to subscriber error handlers", (t) => {
  const mgr = createSubscriptionManager<any>();
  let errorReceived = false;

  const adapterFactory = () => ({
    subscribe(_onUpdate: any, onError: any) {
      onError(new Error("adapter-failure"));
      return () => {
        /* noop */
      };
    },
  });

  mgr.subscribe({
    id: "error",
    adapterFactory,
    onUpdate: () => t.fail("unexpected update"),
    onError: (err) => {
      errorReceived = true;
      t.equal(err.message, "adapter-failure", "Should receive adapter error");
    },
  });

  t.true(errorReceived, "Subscriber onError should be called for adapter errors");
  t.end();
});
