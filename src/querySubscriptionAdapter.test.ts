import test from "tape";
import { createQuerySubscriptionAdapter } from "./querySubscriptionAdapter.js";
import type { CTE } from "./cte.js";
import type { SourceSubscription } from "./sourceSubscription.js";
import type { QueryExecutionPort } from "./queryExecution.js";

interface Recipe {
	id: string;
	name: string;
	status: string;
}

test("QuerySubscriptionAdapter: subscribe applies query executor results", (t) => {
	const sourceSubscription: SourceSubscription<Recipe> = {
		subscribe(onUpdate) {
			onUpdate([
				{ id: "1", name: "Pasta", status: "active" },
				{ id: "2", name: "Soup", status: "archived" },
			]);
			return () => {
				/* noop */
			};
		},
		getSnapshot() {
			return [
				{ id: "1", name: "Pasta", status: "active" },
				{ id: "2", name: "Soup", status: "archived" },
			];
		},
	};

	const queryExecutor: QueryExecutionPort<Recipe> = {
		execute(cte, docs) {
			return docs.filter((doc) => doc.status === "active");
		},
	};

	const cte: CTE<Recipe> = { version: "1.0" };
	const adapter = createQuerySubscriptionAdapter(
		cte,
		sourceSubscription,
		queryExecutor,
	);

	const updates: Recipe[][] = [];
	const unsub = adapter.subscribe(
		(docs) => updates.push(docs),
		() => t.fail("unexpected error"),
	);

	t.equal(updates.length, 1, "Should receive one update from adapter");
	t.deepEqual(
		updates[0].map((doc) => doc.id),
		["1"],
		"Should apply the query executor filter",
	);

	unsub();
	t.end();
});

test("QuerySubscriptionAdapter: getSnapshot delegates through query executor", (t) => {
	const sourceSubscription: SourceSubscription<Recipe> = {
		subscribe() {
			return () => {
				/* noop */
			};
		},
		getSnapshot() {
			return [
				{ id: "1", name: "Pasta", status: "active" },
				{ id: "2", name: "Soup", status: "archived" },
			];
		},
	};

	const queryExecutor: QueryExecutionPort<Recipe> = {
		execute(_cte, docs) {
			return docs.filter((doc) => doc.status === "active");
		},
	};

	const cte: CTE<Recipe> = { version: "1.0" };
	const adapter = createQuerySubscriptionAdapter(
		cte,
		sourceSubscription,
		queryExecutor,
	);

	t.deepEqual(
		adapter.getSnapshot(),
		[{ id: "1", name: "Pasta", status: "active" }],
		"Should return query-executed snapshot results",
	);
	t.end();
});
