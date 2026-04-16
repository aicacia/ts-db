import test from "tape";
import { HttpSourceAdapter } from "./httpAdapter.js";

type Dog = {
	id: string;
	name: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("HttpSourceAdapter: subscribe loads initial documents", async (t) => {
	const docs: Dog[] = [{ id: "1", name: "Fido" }];
	const calls: Array<{ input: string; init: RequestInit }> = [];

	const adapter = new HttpSourceAdapter<Dog>({
		baseUrl: "https://api.example.com",
		collectionPath: "dogs",
		live: { method: "none" },
		fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
			calls.push({ input: String(input), init: init ?? {} });
			return {
				ok: true,
				status: 200,
				statusText: "OK",
				json: async () => docs,
			} as unknown as Response;
		},
	});

	const updates: Dog[][] = [];

	const unsub = adapter.subscribe(
		(docs) => {
			updates.push(docs);
		},
		() => {
			t.fail("Unexpected error");
		},
	);

	await delay(0);

	t.equal(calls.length, 1, "Should fetch collection once on subscribe");
	t.equal(
		calls[0].input,
		"https://api.example.com/dogs",
		"Should call list endpoint",
	);
	t.deepEqual(
		updates,
		[[], docs],
		"Should receive initial empty state and then fetched docs",
	);

	unsub();
	t.end();
});

test("HttpSourceAdapter: subscribe forwards query metadata to requestFactory", async (t) => {
	const docs: Dog[] = [{ id: "1", name: "Fido" }];
	let receivedQuery: unknown = undefined;

	const adapter = new HttpSourceAdapter<Dog>({
		baseUrl: "https://api.example.com",
		collectionPath: "dogs",
		live: { method: "none" },
		requestFactory: (_op, _config, _payload, _id, query) => {
			receivedQuery = query;
			return { method: "GET", headers: {} };
		},
		fetcher: async (_input: RequestInfo | URL, init?: RequestInit) => {
			return {
				ok: true,
				status: 200,
				statusText: "OK",
				json: async () => docs,
			} as unknown as Response;
		},
	});

	const query = { version: "1.0" };
	const unsub = adapter.subscribe(
		() => {},
		() => t.fail("Unexpected error"),
		query,
	);

	await delay(0);

	t.deepEqual(
		receivedQuery,
		query,
		"Should forward query metadata to requestFactory",
	);

	unsub();
	t.end();
});

test("HttpSourceAdapter: create/update/delete use configured endpoints", async (t) => {
	const requests: Array<{ method: string; url: string; body?: string | null }> =
		[];

	const adapter = new HttpSourceAdapter<Dog>({
		baseUrl: "https://api.example.com",
		collectionPath: "dogs",
		usePutForUpdate: false,
		live: { method: "none" },
		fetcher: async (input: RequestInfo | URL, init?: RequestInit) => {
			const requestUrl = String(input);
			requests.push({
				method: init?.method ?? "GET",
				url: requestUrl,
				body: init?.body as string | undefined,
			});
			return {
				ok: true,
				status: 200,
				statusText: "OK",
				json: async () => [{ id: "1", name: "Fido" }],
			} as unknown as Response;
		},
	});

	await adapter.create({ id: "1", name: "Rex" });
	await adapter.update("1", { name: "Rexie" });
	await adapter.delete("1");

	const crudRequests = requests.filter(
		(request) =>
			request.url !== "https://api.example.com/dogs" ||
			request.method !== "GET",
	);

	t.equal(crudRequests[0]?.method, "POST", "create should use POST");
	t.equal(
		crudRequests[0]?.url,
		"https://api.example.com/dogs",
		"create should target collection path",
	);
	t.equal(
		crudRequests[1]?.method,
		"PATCH",
		"update should use PATCH by default",
	);
	t.equal(
		crudRequests[1]?.url,
		"https://api.example.com/dogs/1",
		"update should target item path",
	);
	t.equal(crudRequests[2]?.method, "DELETE", "delete should use DELETE");
	t.equal(
		crudRequests[2]?.url,
		"https://api.example.com/dogs/1",
		"delete should target item path",
	);
	t.end();
});
