import test from "tape";
import { createCollection } from "./collection.js";
import { createQueryBuilder } from "./queryBuilder.js";
import { MemoryAdapter } from "./memoryAdapter.js";
import type { SourceAdapter } from "./types.js";
import type {
	QuerySubscriptionService,
	QuerySubscriptionResult,
} from "./querySubscriptionService.js";
import type { CTE } from "./cte.js";

interface Recipe {
	id: string;
	name: string;
	status: string;
}

test("Collection: accepts injected QuerySubscriptionService", (t) => {
	let subscriptionCalled = false;

	const querySubscriptionService: QuerySubscriptionService<Recipe> = {
		subscribe(cte, callbacks) {
			subscriptionCalled = true;
			callbacks.onUpdate([]);
			return () => {
				/* noop */
			};
		},
		createSubscription(cte) {
			return (callbacks) => {
				subscriptionCalled = true;
				callbacks.onUpdate([]);
				return () => {
					/* noop */
				};
			};
		},
		createQueryBuilder() {
			return createQueryBuilder<Recipe>((cte: CTE<Recipe>) => {
				subscriptionCalled = true;
				return (callbacks) => {
					callbacks.onUpdate([]);
					return () => {
						/* noop */
					};
				};
			});
		},
		fetchSnapshot() {
			return [];
		},
	};

	const source: SourceAdapter<Recipe> = {
		subscribe() {
			return () => {
				/* noop */
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return { state: "idle" };
		},
	};

	const collection = createCollection({
		id: "recipes",
		source,
		keyOf: (doc) => doc.id,
		querySubscriptionService,
	});

	collection.subscribe(
		() => {
			t.ok(subscriptionCalled, "Should use injected QuerySubscriptionService");
		},
		() => t.fail("unexpected error"),
	);

	t.end();
});

test("Collection: query() delegates builder creation to injected QuerySubscriptionService", (t) => {
	let queryBuilt = false;

	const querySubscriptionService: QuerySubscriptionService<Recipe> = {
		subscribe() {
			return () => {
				/* noop */
			};
		},
		createSubscription() {
			return () => {
				return () => {
					/* noop */
				};
			};
		},
		createQueryBuilder() {
			queryBuilt = true;
			return createQueryBuilder<Recipe>((cte: CTE<Recipe>) => {
				return (callbacks) => {
					callbacks.onUpdate([]);
					return () => {
						/* noop */
					};
				};
			});
		},
		fetchSnapshot() {
			return [];
		},
	};

	const source: SourceAdapter<Recipe> = {
		subscribe() {
			return () => {
				/* noop */
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return { state: "idle" };
		},
	};

	const collection = createCollection({
		id: "recipes",
		source,
		keyOf: (doc) => doc.id,
		querySubscriptionService,
	});

	collection.query().subscribe(
		() => {
			t.ok(queryBuilt, "Should call createQueryBuilder on injected QuerySubscriptionService");
		},
		() => t.fail("unexpected error"),
	);

	t.end();
});

test("Collection: allows injected QueryExecutionPort", (t) => {
	const source: SourceAdapter<Recipe> = {
		subscribe(onUpdate) {
			onUpdate([
			{ id: "1", name: "Pasta", status: "active" },
			{ id: "2", name: "Soup", status: "archived" },
		]);
			return () => {
				/* noop */
			};
		},
		async create() {},
		async update() {},
		async delete() {},
		getStatus() {
			return { state: "idle" };
		},
	};

	const collection = createCollection({
		id: "recipes",
		source,
		keyOf: (doc) => doc.id,
		queryExecutor: {
			execute(cte, docs) {
				return docs.filter((doc) => doc.status === "active");
			},
		},
	});

	const updates: Recipe[][] = [];
	const unsub = collection.query().subscribe(
		(docs) => updates.push([...docs]),
		() => t.fail("unexpected error"),
	);

	t.equal(updates.length, 1, "Should receive initial query result");
	t.equal(updates[0].length, 1, "Should apply injected query executor");
	unsub();
	t.end();
});

test("Collection query: join filters by matching root collection to joined collection", (t) => {
	interface RecipeWithItem {
		id: string;
		name: string;
		itemId: string;
	}

	interface Item {
		id: string;
		name: string;
	}

	const recipesAdapter = new MemoryAdapter<RecipeWithItem>("id", [
		{ id: "1", name: "Pancakes", itemId: "a" },
		{ id: "2", name: "Omelet", itemId: "b" },
	]);

	const itemsAdapter = new MemoryAdapter<Item>("id", [
		{ id: "a", name: "Flour" },
	]);

	const recipes = createCollection({
		id: "recipes",
		source: recipesAdapter,
		keyOf: (doc) => doc.id,
		keyField: "id",
	});

	const items = createCollection({
		id: "items",
		source: itemsAdapter,
		keyOf: (doc) => doc.id,
		keyField: "id",
	});

	const results: RecipeWithItem[] = [];
	const unsub = recipes.query()
		.join(items, "itemId")
		.subscribe(
			(docs) => results.push(...docs),
			() => t.fail("unexpected error"),
		);

	t.equal(results.length, 1, "Should return only matching root documents");
	t.equal(results[0].id, "1", "Should match the joined item key");
	unsub();
	t.end();
});

test("Collection query: join supports multiple root-level joins", (t) => {
	interface RecipeWithItemSupplier {
		id: string;
		name: string;
		itemId: string;
		supplierId: string;
	}

	interface Item {
		id: string;
		name: string;
	}

	interface Supplier {
		id: string;
		name: string;
	}

	const recipesAdapter = new MemoryAdapter<RecipeWithItemSupplier>("id", [
		{ id: "1", name: "Pasta", itemId: "x", supplierId: "s1" },
		{ id: "2", name: "Salad", itemId: "y", supplierId: "s2" },
	]);

	const itemsAdapter = new MemoryAdapter<Item>("id", [
		{ id: "x", name: "Tomato" },
	]);

	const suppliersAdapter = new MemoryAdapter<Supplier>("id", [
		{ id: "s1", name: "Grower" },
	]);

	const recipes = createCollection({
		id: "recipes",
		source: recipesAdapter,
		keyOf: (doc) => doc.id,
		keyField: "id",
	});

	const items = createCollection({
		id: "items",
		source: itemsAdapter,
		keyOf: (doc) => doc.id,
		keyField: "id",
	});

	const suppliers = createCollection({
		id: "suppliers",
		source: suppliersAdapter,
		keyOf: (doc) => doc.id,
		keyField: "id",
	});

	const results: RecipeWithItemSupplier[] = [];
	const unsub = recipes.query()
		.join(items, "itemId")
		.join(suppliers, "supplierId")
		.subscribe(
			(docs) => results.push(...docs),
			() => t.fail("unexpected error"),
		);

	t.equal(results.length, 1, "Should return only documents matching all joins");
	t.equal(results[0].id, "1", "Should return the root doc that matches every join");
	unsub();
	t.end();
});
