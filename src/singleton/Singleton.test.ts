import test from "tape";
import { MemorySingletonAdapter } from "../adapters/MemorySingletonAdapter.js";
import { createSingleton } from "./Singleton.js";

test("Singleton: delegates subscribe/set/update through MemorySingletonAdapter", async (t) => {
	const singleton = createSingleton({
		sourceType: MemorySingletonAdapter,
		sourceOptions: { initialValue: { count: 1 } },
	});

	const values: Array<{ count: number } | undefined> = [];

	singleton.subscribe(
		(value) => values.push(value as { count: number } | undefined),
		(error) => t.fail(error.message),
	);

	t.deepEqual(values, [{ count: 1 }]);

	await singleton.set({ count: 2 });
	t.deepEqual(values, [{ count: 1 }, { count: 2 }]);

	await singleton.update({ count: 3 });
	t.deepEqual(values, [{ count: 1 }, { count: 2 }, { count: 3 }]);

	t.equal(singleton.getSource(), singleton.getSource());
	t.equal(singleton.getStatus().state, "idle");
	t.end();
});

test("MemorySingletonAdapter: update rejects without current value", async (t) => {
	const adapter = new MemorySingletonAdapter<{ count: number }>({});

	try {
		await adapter.update({ count: 1 });
		t.fail("expected update to reject");
	} catch (error) {
		t.ok(error instanceof Error, "throws an Error");
		t.equal(
			(error as Error).message,
			"Unable to update singleton without a current value",
		);
	}

	t.end();
});
