import test from "tape";
import { QueryBuilder, createQueryBuilder } from "./queryBuilder.js";
import { equal } from "./cte.js";

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
	t.ok(results.every((doc) => doc.status === "active"), "Should return only active documents");
	t.end();
});

test("QueryBuilder: pure builder subscribe throws", (t) => {
	const query = new QueryBuilder<Recipe>().where(equal("status", "active"));

	t.throws(
		() => query.subscribe(() => {}, () => {}),
		/QueryBuilder.subscribe requires a runtime query compiler/,
		"subscribe should throw the expected pure builder error",
	);

	t.end();
});
