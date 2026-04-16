import test from "tape";
import { QueryBuilder, createQueryBuilder } from "./queryBuilder.js";
import { equal } from "../cte.js";

interface Recipe {
	id: string;
	name: string;
	status: "active" | "archived";
	tags: string[];
	prepTime: number;
}

test("QueryBuilder: pure builder compileToFunction works", (t) => {
	const query = createQueryBuilder<Recipe>().where(equal("status", "active"));
	const fn = query.compileToFunction();

	const docs: Recipe[] = [
		{ id: "1", name: "Pasta", status: "active", tags: ["quick"], prepTime: 20 },
		{ id: "2", name: "Soup", status: "archived", tags: ["slow"], prepTime: 30 },
	];

	const results = fn(docs);

	t.equal(results.length, 1, "Should filter active documents");
	t.ok(
		results.every((doc) => doc.status === "active"),
		"Should return only active documents",
	);
	t.end();
});

test("QueryBuilder: pure builder subscribe throws", (t) => {
	const query = new QueryBuilder<Recipe>().where(equal("status", "active"));

	t.throws(
		() =>
			query.subscribe(
				() => {},
				() => {},
			),
		/QueryBuilder.subscribe requires a runtime query compiler/,
		"subscribe should throw the expected pure builder error",
	);

	t.end();
});

test("QueryBuilder: compileToFunction snapshots the query state", (t) => {
	const query = createQueryBuilder<Recipe>().where(equal("status", "active"));
	const fn = query.compileToFunction();

	query.where(equal("status", "archived"));

	const docs: Recipe[] = [
		{ id: "1", name: "Pasta", status: "active", tags: ["quick"], prepTime: 20 },
		{ id: "2", name: "Soup", status: "archived", tags: ["slow"], prepTime: 30 },
	];

	const results = fn(docs);

	t.equal(
		results.length,
		1,
		"Compiled function should preserve original snapshot filters",
	);
	t.equal(
		results[0].status,
		"active",
		"Compiled function should not be affected by later builder changes",
	);
	t.end();
});

test("QueryBuilder: toCTE returns a snapshot copy", (t) => {
	const query = createQueryBuilder<Recipe>().where(equal("status", "active"));
	const cte = query.toCTE();

	query.orderBy("name");

	t.notOk(
		cte.orderBy,
		"Snapshot CTE should not reflect later builder modifications",
	);
	t.end();
});

test("QueryBuilder: limit and offset validate non-negative values", (t) => {
	const query = createQueryBuilder<Recipe>();

	t.throws(
		() => query.limit(-1),
		/limit must be >= 0/,
		"limit should reject negative values",
	);

	t.throws(
		() => query.offset(-1),
		/offset must be >= 0/,
		"offset should reject negative values",
	);

	t.end();
});

test("QueryBuilder: paginate validates page and pageSize", (t) => {
	const query = createQueryBuilder<Recipe>();

	t.throws(
		() => query.paginate(-1),
		/page must be >= 0/,
		"paginate should reject negative page values",
	);

	t.throws(
		() => query.paginate(0, 0),
		/pageSize must be > 0/,
		"paginate should reject non-positive page sizes",
	);

	t.end();
});
