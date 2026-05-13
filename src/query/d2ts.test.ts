import test from "tape";
import { containsIgnoreCase, createCTE, greaterThan } from "./cte.js";
import { createIncrementalQuery } from "./d2ts.js";
import { QueryBuilder } from "./QueryBuilder.js";

test("createIncrementalQuery: filters and orderBy produce expected results", (t) => {
	const source = [
		{ id: "a", name: "Alpha", score: 60 },
		{ id: "b", name: "Bravo", score: 45 },
		{ id: "c", name: "Code", score: 70 },
		{ id: "d", name: "Delta", score: 55 },
	];

	const cte = createCTE<(typeof source)[0]>();
	cte.filters = [greaterThan("score", 50), containsIgnoreCase("name", "a")];
	cte.orderBy = [{ field: "score", direction: "desc" }];
	cte.limit = 2;

	const query = createIncrementalQuery(cte, source);
	const updates: Array<typeof source> = [];

	query.subscribe(
		(result) => updates.push(result),
		(error) => t.fail(error.message),
	);

	t.deepEqual(updates, [
		[
			{ id: "a", name: "Alpha", score: 60 },
			{ id: "d", name: "Delta", score: 55 },
		],
	]);
	t.end();
});

test("QueryBuilder: source method enables query subscriptions", (t) => {
	const source = [
		{ id: "1", name: "Alice", active: true },
		{ id: "2", name: "Bob", active: false },
		{ id: "3", name: "Carol", active: true },
	];

	const builder = new QueryBuilder(source)
		.equal("active", true)
		.orderBy("name", "asc");

	const updates: Array<typeof source> = [];

	builder.subscribe(
		(result) => updates.push(result),
		(error) => t.fail(error.message),
	);

	t.deepEqual(updates, [
		[
			{ id: "1", name: "Alice", active: true },
			{ id: "3", name: "Carol", active: true },
		],
	]);
	t.end();
});
