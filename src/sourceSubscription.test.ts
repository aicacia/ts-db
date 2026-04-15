import test from "tape";
import { createSourceSubscription } from "./sourceSubscription.js";
import type { SourceAdapter } from "./types.js";

interface Recipe {
	id: string;
	name: string;
	status: string;
}

test("SourceSubscription: subscribes to source only once for multiple listeners", (t) => {
	let subscribeCalls = 0;
	let unsubscribeCalls = 0;

	let onUpdate: ((docs: Recipe[]) => void) | null = null;
	let onError: ((error: Error) => void) | null = null;

	const adapter: SourceAdapter<Recipe> = {
		subscribe(update, error) {
			subscribeCalls += 1;
			onUpdate = update;
			onError = error;
			update([]);
			return () => {
				unsubscribeCalls += 1;
				onUpdate = null;
				onError = null;
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return { state: "idle" };
		},
	};

	const sourceSubscription = createSourceSubscription(adapter);

	const updatesA: Recipe[][] = [];
	const updatesB: Recipe[][] = [];

	const unsubA = sourceSubscription.subscribe(
		(docs) => updatesA.push([...docs]),
		() => t.fail("unexpected error A"),
	);

	const unsubB = sourceSubscription.subscribe(
		(docs) => updatesB.push([...docs]),
		() => t.fail("unexpected error B"),
	);

	t.equal(subscribeCalls, 1, "Should subscribe to source adapter only once");
	t.deepEqual(updatesA[0], [], "First subscriber should receive initial snapshot");
	t.deepEqual(updatesB[0], [], "Second subscriber should receive initial snapshot");

	onUpdate?.([
		{ id: "1", name: "Pasta", status: "active" },
	]);

	t.equal(updatesA.length, 2, "First subscriber should receive update from source");
	t.equal(updatesB.length, 2, "Second subscriber should receive update from source");

	unsubA();
	unsubB();
	t.equal(unsubscribeCalls, 1, "Should unsubscribe from source adapter once after last listener");
	t.end();
});

test("SourceSubscription: getSnapshot returns latest docs", (t) => {
	let onUpdate: ((docs: Recipe[]) => void) | null = null;
	let onError: ((error: Error) => void) | null = null;

	const adapter: SourceAdapter<Recipe> = {
		subscribe(update, error) {
			onUpdate = update;
			onError = error;
			update([{ id: "1", name: "Pasta", status: "active" }]);
			return () => {
				/* noop */
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return { state: "idle" };
		},
	};

	const sourceSubscription = createSourceSubscription(adapter);
	const updates: Recipe[][] = [];

	sourceSubscription.subscribe(
		(docs) => updates.push([...docs]),
		() => t.fail("unexpected error"),
	);

	if (onUpdate) {
		onUpdate([
			{ id: "2", name: "Soup", status: "archived" },
		]);
	}

	t.deepEqual(
		sourceSubscription.getSnapshot(),
		[{ id: "2", name: "Soup", status: "archived" }],
		"getSnapshot should return the latest source docs",
	);
	t.end();
});

test("SourceSubscription: propagates adapter errors to subscribers", (t) => {
	let onUpdate: ((docs: Recipe[]) => void) | null = null;
	let onError: ((error: Error) => void) | null = null;

	const adapter: SourceAdapter<Recipe> = {
		subscribe(update, error) {
			onUpdate = update;
			onError = error;
			return () => {
				/* noop */
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return { state: "idle" };
		},
	};

	const sourceSubscription = createSourceSubscription(adapter);
	let didError = false;

	sourceSubscription.subscribe(
		() => t.fail("unexpected update"),
		(error) => {
			didError = true;
			t.equal(error.message, "source-error", "Should receive source adapter error");
		},
	);

	onError?.(new Error("source-error"));
	t.true(didError, "Error callback should be invoked");
	t.end();
});
