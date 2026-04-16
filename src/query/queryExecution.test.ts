import test from "tape";
import { createDefaultQueryExecutionPort } from "./queryExecution.js";
import { equal } from "./cte.js";
import type { CTE } from "./cte.js";

interface Recipe {
	id: string;
	name: string;
	status: string;
}

test("QueryExecutionPort: default executor applies CTE filters", (t) => {
	const port = createDefaultQueryExecutionPort<Recipe>();
	const cte: CTE<Recipe> = {
		version: "1.0",
		filters: [equal("status", "active")],
	};

	const result = port.execute(cte, [
		{ id: "1", name: "Pasta", status: "active" },
		{ id: "2", name: "Soup", status: "archived" },
	]);

	t.deepEqual(
		result.map((doc) => doc.id),
		["1"],
		"Should return only active documents",
	);
	t.end();
});

test("QueryExecutionPort: default executor returns all docs for empty CTE", (t) => {
	const port = createDefaultQueryExecutionPort<Recipe>();
	const cte: CTE<Recipe> = { version: "1.0" };

	const docs = [
		{ id: "1", name: "Pasta", status: "active" },
		{ id: "2", name: "Soup", status: "archived" },
	];

	t.deepEqual(
		port.execute(cte, docs),
		docs,
		"Should return original docs when no filters are defined",
	);
	t.end();
});
