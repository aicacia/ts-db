import test from "tape";
import { createQuerySubscriptionService } from "./querySubscriptionService.js";
import { equal } from "./cte.js";
import type { CTE } from "./cte.js";
import type { SourceAdapter } from "../types.js";

interface Recipe {
	id: string;
	name: string;
	status: string;
}

const idleStatus = { state: "idle" } as const;

function createInMemorySource(): {
	adapter: SourceAdapter<Recipe>;
	emit: (docs: Recipe[]) => void;
} {
	let onUpdate: ((docs: Recipe[]) => void) | null = null;
	let onError: ((error: Error) => void) | null = null;

	return {
		adapter: {
			subscribe(update, error) {
				onUpdate = update;
				onError = error;
				update([]);
				return () => {
					onUpdate = null;
					onError = null;
				};
			},
			async create() {},
			async update() {},
			async delete() {},
			getStatus() {
				return idleStatus;
			},
		},
		emit(docs: Recipe[]) {
			if (onUpdate) {
				onUpdate(docs);
			}
		},
	};
}

test("QuerySubscriptionService: initial snapshot and query results", (t) => {
	const { adapter, emit } = createInMemorySource();
	const service = createQuerySubscriptionService({ source: adapter });

	const cte: CTE<Recipe> = {
		version: "1.0",
		filters: [equal("status", "active")],
	};

	const updates: Recipe[][] = [];
	const unsub = service.createSubscription(cte)({
		onUpdate: (docs) => updates.push([...docs]),
		onError: () => t.fail("unexpected error"),
	});

	t.equal(updates.length, 1, "Should receive initial snapshot immediately");
	t.deepEqual(updates[0], [], "Initial snapshot should start empty");

	emit([
		{ id: "1", name: "Pasta", status: "active" },
		{ id: "2", name: "Soup", status: "archived" },
	]);

	t.equal(updates.length, 2, "Should receive update after source change");
	t.deepEqual(
		updates[1].map((doc) => doc.id),
		["1"],
		"Should filter documents through CTE",
	);

	t.deepEqual(
		service.fetchSnapshot(cte).map((doc) => doc.id),
		["1"],
		"fetchSnapshot should return current query results",
	);

	unsub();
	t.end();
});

test("QuerySubscriptionService: direct subscribe() shorthand works", (t) => {
	const { adapter, emit } = createInMemorySource();
	const service = createQuerySubscriptionService({ source: adapter });

	const cte: CTE<Recipe> = {
		version: "1.0",
		filters: [equal("status", "active")],
	};

	const updates: Recipe[][] = [];
	const unsub = service.subscribe(cte, {
		onUpdate: (docs) => updates.push([...docs]),
		onError: () => t.fail("unexpected error"),
	});

	t.equal(updates.length, 1, "Should receive initial snapshot immediately");
	t.deepEqual(updates[0], [], "Initial snapshot should start empty");

	emit([
		{ id: "1", name: "Pasta", status: "active" },
		{ id: "2", name: "Soup", status: "archived" },
	]);

	t.equal(updates.length, 2, "Should receive update after source change");
	t.deepEqual(
		updates[1].map((doc) => doc.id),
		["1"],
		"Should filter documents through CTE",
	);

	unsub();
	t.end();
});

test("QuerySubscriptionService: fetchSnapshot uses cached query results when subscription exists", (t) => {
	const { adapter, emit } = createInMemorySource();
	const service = createQuerySubscriptionService({ source: adapter });

	const cte: CTE<Recipe> = {
		version: "1.0",
		filters: [equal("status", "active")],
	};

	const updates: Recipe[][] = [];
	const unsub = service.createSubscription(cte)({
		onUpdate: (docs) => updates.push([...docs]),
		onError: () => t.fail("unexpected error"),
	});

	emit([
		{ id: "1", name: "Pasta", status: "active" },
		{ id: "2", name: "Soup", status: "archived" },
	]);

	t.equal(updates.length, 2, "Should receive update after source change");
	t.deepEqual(
		service.fetchSnapshot(cte).map((doc) => doc.id),
		["1"],
		"Should use cached query results from subscription manager",
	);

	unsub();
	t.end();
});

test("QuerySubscriptionService: shares raw source subscription across subscribers", (t) => {
	let subscribeCalls = 0;

	const adapter: SourceAdapter<Recipe> = {
		subscribe(onUpdate, _onError) {
			subscribeCalls += 1;
			onUpdate([{ id: "1", name: "Pasta", status: "active" }]);
			return () => {
				/* noop */
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return idleStatus;
		},
	};

	const service = createQuerySubscriptionService({ source: adapter });
	const cte: CTE<Recipe> = {
		version: "1.0",
		filters: [equal("status", "active")],
	};

	const unsub1 = service.createSubscription(cte)({
		onUpdate: () => {},
		onError: () => {},
	});

	const unsub2 = service.createSubscription(cte)({
		onUpdate: () => {},
		onError: () => {},
	});

	t.equal(
		subscribeCalls,
		1,
		"Raw source adapter subscribe should be called once for shared query service",
	);

	unsub1();
	unsub2();
	t.end();
});

test("QuerySubscriptionService: custom queryExecutor is used", (t) => {
	const { adapter, emit } = createInMemorySource();
	const service = createQuerySubscriptionService({
		source: adapter,
		queryExecutor: {
			execute() {
				return [{ id: "x", name: "Custom", status: "active" }];
			},
		},
	});

	const cte: CTE<Recipe> = { version: "1.0" };
	const updates: Recipe[][] = [];

	const unsub = service.createSubscription(cte)({
		onUpdate: (docs) => updates.push([...docs]),
		onError: () => t.fail("unexpected error"),
	});

	t.equal(
		updates.length,
		1,
		"Should receive initial snapshot from custom executor",
	);
	t.deepEqual(
		updates[0].map((doc) => doc.id),
		["x"],
	);

	emit([{ id: "1", name: "Pasta", status: "active" }]);
	t.equal(updates.length, 2, "Should receive updates when source changes");
	t.deepEqual(
		updates[1].map((doc) => doc.id),
		["x"],
	);

	unsub();
	t.end();
});

test("QuerySubscriptionService: custom sourceSubscription is used", (t) => {
	let subscribeCalls = 0;
	let getSnapshotCalls = 0;

	const service = createQuerySubscriptionService({
		sourceSubscription: {
			subscribe(onUpdate, _onError) {
				subscribeCalls += 1;
				onUpdate([{ id: "1", name: "Pasta", status: "active" }]);
				return () => {
					/* noop */
				};
			},
			getSnapshot() {
				getSnapshotCalls += 1;
				return [{ id: "1", name: "Pasta", status: "active" }];
			},
		},
	});

	const cte: CTE<Recipe> = { version: "1.0" };
	const updates: Recipe[][] = [];

	t.equal(
		getSnapshotCalls,
		0,
		"Should not call sourceSubscription snapshot before use",
	);

	t.deepEqual(
		service.fetchSnapshot(cte).map((doc) => doc.id),
		["1"],
	);
	t.equal(
		getSnapshotCalls,
		1,
		"Should delegate snapshot fetch to the provided sourceSubscription when no subscription exists",
	);

	const unsub = service.createSubscription(cte)({
		onUpdate: (docs) => updates.push([...docs]),
		onError: () => t.fail("unexpected error"),
	});

	t.equal(
		subscribeCalls,
		1,
		"Should subscribe through the provided sourceSubscription",
	);
	t.equal(
		updates.length,
		1,
		"Should receive initial query results immediately",
	);
	t.deepEqual(
		updates[0].map((doc) => doc.id),
		["1"],
	);
	t.deepEqual(
		service.fetchSnapshot(cte).map((doc) => doc.id),
		["1"],
	);
	t.equal(
		getSnapshotCalls,
		1,
		"Should use cached query results after subscription exists",
	);

	unsub();
	t.end();
});

test("QuerySubscriptionService: fetchSnapshot throws without sourceSubscription snapshot support", (t) => {
	const service = createQuerySubscriptionService({
		sourceSubscription: {
			subscribe(onUpdate, _onError) {
				onUpdate([]);
				return () => {
					/* noop */
				};
			},
		},
	});

	const cte: CTE<Recipe> = { version: "1.0" };

	t.throws(
		() => service.fetchSnapshot(cte),
		/Error: Source subscription does not support snapshot retrieval/,
		"Should throw when sourceSubscription lacks snapshot retrieval",
	);

	t.end();
});
