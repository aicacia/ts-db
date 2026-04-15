import test from "tape";
import { applyFilter, applyOrderBy } from "./filterEngine.js";

interface Recipe {
	id: string;
	name: string | undefined;
}

test("Filter engine: contains filter does not treat undefined as string 'undefined'", (t) => {
	const filter = {
		type: "comparison",
		field: "name",
		operator: "contains",
		value: "undefined",
	} as any;

	t.equal(
		applyFilter(filter, { id: "1", name: undefined }),
		false,
		"Undefined field values should not match the literal string 'undefined'",
	);

	t.end();
});

test("Filter engine: contains filter returns true for empty needle", (t) => {
	const filter = {
		type: "comparison",
		field: "name",
		operator: "contains",
		value: "",
	} as any;

	t.equal(
		applyFilter(filter, { id: "1", name: "Pasta" }),
		true,
		"Empty contains value should match any string",
	);

	t.end();
});

test("Filter engine: applyOrderBy returns a sorted copy without mutating input", (t) => {
	const docs = [
		{ id: "2", name: "B" },
		{ id: "1", name: "A" },
	];

	const sorted = applyOrderBy(docs, [
		{ field: "name", direction: "asc" },
	] as any);

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
