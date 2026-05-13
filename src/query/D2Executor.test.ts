import test from "tape";
import { createCTE, equal } from "./cte.js";
import { D2Executor } from "./D2Executor.js";
import type { QueryExecutor } from "./executor.js";
import { QueryBuilder } from "./QueryBuilder.js";

class StubExecutor<T> implements QueryExecutor<T> {
	execute() {
		return {
			subscribe(onUpdate) {
				onUpdate([]);
				return () => {};
			},
		};
	}
}

test("D2Executor: executes basic query subscriptions", (t) => {
	const source = [
		{ id: "1", name: "Alice", active: true },
		{ id: "2", name: "Bob", active: false },
	];

	const cte = createCTE<(typeof source)[0]>();
	cte.filters = [equal("active", true)];

	const query = new D2Executor<(typeof source)[0]>().execute(cte, source);
	const updates: Array<typeof source> = [];

	query.subscribe(
		(result) => updates.push(result),
		(error) => t.fail(error.message),
	);

	t.deepEqual(updates, [[{ id: "1", name: "Alice", active: true }]]);
	t.end();
});

test("QueryBuilder: constructor injection accepts a custom executor", (t) => {
	const source = [
		{ id: "1", name: "Alice", active: true },
		{ id: "2", name: "Bob", active: false },
	];

	const builder = new QueryBuilder({ source, executor: new StubExecutor() });
	const updates: Array<typeof source> = [];

	builder.subscribe(
		(result) => updates.push(result),
		(error) => t.fail(error.message),
	);

	t.deepEqual(updates, [[]]);
	t.end();
});
