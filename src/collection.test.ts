import test from "tape";
import { createCollection } from "./collection.js";
import type { SourceAdapter } from "./types.js";
import type {
	QuerySubscriptionService,
	QuerySubscriptionResult,
} from "./querySubscriptionService.js";
import type { CTE } from "./cte.js";

interface Recipe {
	id: string;
	name: string;
	status: string;
}

test("Collection: accepts injected QuerySubscriptionService", (t) => {
	let subscriptionCalled = false;

	const querySubscriptionService: QuerySubscriptionService<Recipe> = {
		subscribe(cte, callbacks) {
			subscriptionCalled = true;
			callbacks.onUpdate([]);
			return () => {
				/* noop */
			};
		},
		createSubscription(cte) {
			return (callbacks) => {
				subscriptionCalled = true;
				callbacks.onUpdate([]);
				return () => {
					/* noop */
				};
			};
		},
		fetchSnapshot() {
			return [];
		},
	};

	const source: SourceAdapter<Recipe> = {
		subscribe() {
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

	const collection = createCollection({
		id: "recipes",
		source,
		keyOf: (doc) => doc.id,
		querySubscriptionService,
	});

	collection.subscribe(
		() => {
			t.ok(subscriptionCalled, "Should use injected QuerySubscriptionService");
		},
		() => t.fail("unexpected error"),
	);

	t.end();
});

test("Collection: allows injected QueryExecutionPort", (t) => {
	const source: SourceAdapter<Recipe> = {
		subscribe(onUpdate) {
			onUpdate([
			{ id: "1", name: "Pasta", status: "active" },
			{ id: "2", name: "Soup", status: "archived" },
		]);
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

	const collection = createCollection({
		id: "recipes",
		source,
		keyOf: (doc) => doc.id,
		queryExecutor: {
			execute(cte, docs) {
				return docs.filter((doc) => doc.status === "active");
			},
		},
	});

	const updates: Recipe[][] = [];
	const unsub = collection.query().subscribe(
		(docs) => updates.push([...docs]),
		() => t.fail("unexpected error"),
	);

	t.equal(updates.length, 1, "Should receive initial query result");
	t.equal(updates[0].length, 1, "Should apply injected query executor");
	unsub();
	t.end();
});
