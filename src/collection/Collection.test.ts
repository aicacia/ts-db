import test from "tape";
import { createCollection } from "./Collection.js";
import { MemoryCollectionAdapter } from "../adapters/MemoryCollectionAdapter.js";

test("Collection: delegates create/update/delete/subscribe/getStatus/getSource/getKeyOf through MemoryCollectionAdapter", async (t) => {
	const collection = createCollection<
		{ id: string; name: string },
		import(
			"../adapters/MemoryCollectionAdapter.js",
		).MemoryCollectionAdapterOptions<{ id: string; name: string }>
	>({
		id: "test",
		sourceType: MemoryCollectionAdapter,
		sourceOptions: {
			keyOf: (doc) => doc.id,
			initialDocs: [{ id: "1", name: "first" }],
		},
		keyOf: (doc) => doc.id,
	});

	const updates: Array<Array<{ id: string; name: string }>> = [];

	collection.subscribe(
		(docs) => updates.push(docs),
		(error) => t.fail(error.message),
	);

	t.deepEqual(updates, [[{ id: "1", name: "first" }]]);

	await collection.create({ id: "2", name: "second" });
	t.deepEqual(updates, [
		[{ id: "1", name: "first" }],
		[
			{ id: "1", name: "first" },
			{ id: "2", name: "second" },
		],
	]);

	await collection.update("1", { name: "first-updated" });
	t.deepEqual(updates[2], [
		{ id: "1", name: "first-updated" },
		{ id: "2", name: "second" },
	]);

	await collection.delete("2");
	t.deepEqual(updates[3], [{ id: "1", name: "first-updated" }]);

	t.equal(collection.getSource(), collection.getSource());
	t.equal(collection.getStatus().state, "idle");
	t.equal(collection.getKeyOf()({ id: "x", name: "x" }), "x");
	t.end();
});

test("Collection.query: builds a QueryBuilder from adapter docs", (t) => {
	const collection = createCollection<
		{ id: string; name: string },
		import(
			"../adapters/MemoryCollectionAdapter.js",
		).MemoryCollectionAdapterOptions<{ id: string; name: string }>
	>({
		id: "test-query",
		sourceType: MemoryCollectionAdapter,
		sourceOptions: {
			keyOf: (doc) => doc.id,
			initialDocs: [{ id: "1", name: "first" }],
		},
		keyOf: (doc) => doc.id,
	});

	const updates: Array<Array<{ id: string; name: string }>> = [];

	collection.query().subscribe(
		(docs) => updates.push(docs),
		(error) => t.fail(error.message),
	);

	t.deepEqual(updates, [[{ id: "1", name: "first" }]]);
	t.end();
});
