import test from "tape";
import type { CTEComparisonFilter, CTEOrderBy } from "./cte.js";
import { applyCTE, applyFilter, applyOrderBy } from "./filterEngine.js";

interface Recipe {
	id: string;
	name: string | undefined;
}

test("Filter engine: contains filter does not treat undefined as string 'undefined'", (t) => {
	const filter: CTEComparisonFilter<Recipe> = {
		type: "comparison",
		field: "name",
		operator: "contains",
		value: "undefined",
	};

	t.equal(
		applyFilter(filter, { id: "1", name: undefined }),
		false,
		"Undefined field values should not match the literal string 'undefined'",
	);

	t.end();
});

test("Filter engine: contains filter returns true for empty needle", (t) => {
	const filter: CTEComparisonFilter<Recipe> = {
		type: "comparison",
		field: "name",
		operator: "contains",
		value: "",
	};

	t.equal(
		applyFilter(filter, { id: "1", name: "Pasta" }),
		true,
		"Empty contains value should match any string",
	);

	t.end();
});

test("Filter engine: in filter returns false for non-array values", (t) => {
	const filter: CTEComparisonFilter<Recipe> = {
		type: "comparison",
		field: "id",
		operator: "in",
		value: "not-an-array",
	};

	t.equal(
		applyFilter(filter, { id: "1", name: "Pasta" }),
		false,
		"Non-array values should not match an in filter",
	);

	t.end();
});

test("Filter engine: includes filter returns false when field is not an array", (t) => {
	const filter: CTEComparisonFilter<Recipe> = {
		type: "comparison",
		field: "id",
		operator: "includes",
		value: "1",
	};

	t.equal(
		applyFilter(filter, { id: "1", name: "Pasta" }),
		false,
		"Includes filter should return false when field is not an array",
	);

	t.end();
});

test("Filter engine: applyOrderBy returns a sorted copy without mutating input", (t) => {
	const docs = [
		{ id: "2", name: "B" },
		{ id: "1", name: "A" },
	];

	const orderBy: CTEOrderBy<Recipe>[] = [
		{ field: "name", direction: "asc" },
	];
	const sorted = applyOrderBy(docs, orderBy);

	t.deepEqual(
		sorted.map((doc) => doc.id),
		["1", "2"],
		"Should sort documents by name in ascending order",
	);
	t.deepEqual(
		docs.map((doc) => doc.id),
		["2", "1"],
		"Should not mutate the original documents array",
	);

	t.end();
});

test("Filter engine: applyCTE respects orderBy and returns sorted results", (t) => {
	const docs = [
		{ id: "2", name: "B" },
		{ id: "1", name: "A" },
	];

	const cte = {
		version: "1.0",
		filters: [],
		orderBy: [{ field: "name", direction: "asc" }],
	};

	const result = applyCTE(cte, docs);

	t.deepEqual(
		result.map((doc) => doc.id),
		["1", "2"],
		"applyCTE should sort results when orderBy is provided",
	);
	t.deepEqual(
		docs.map((doc) => doc.id),
		["2", "1"],
		"applyCTE should not mutate the original documents array",
	);

	t.end();
});
