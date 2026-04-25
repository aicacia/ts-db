import test from "tape";
import { applyOrderBy, applyPagination } from "./order.js";

interface Item {
	id: string;
	name?: string;
}

test("order: applyOrderBy sorts ascending and does not mutate input", (t) => {
	const docs: Item[] = [
		{ id: "2", name: "B" },
		{ id: "1", name: "A" },
	];

	const sorted = applyOrderBy(docs, [{ field: "name", direction: "asc" }]);

	t.deepEqual(
		sorted.map((d) => d.id),
		["1", "2"],
		"sorted ascending",
	);
	t.deepEqual(
		docs.map((d) => d.id),
		["2", "1"],
		"original not mutated",
	);

	t.end();
});

test("order: applyPagination respects offset and limit", (t) => {
	const docs: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

	const page = applyPagination(docs, 1, 2);

	t.deepEqual(
		page.map((d) => d.id),
		["b", "c"],
		"pagination returns correct slice",
	);

	t.end();
});
