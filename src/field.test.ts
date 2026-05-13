import test from "tape";
import { getFieldValue } from "./field.js";

test("getFieldValue: gets top-level field", (t) => {
	const doc = { a: 1 };
	t.equal(getFieldValue(doc, "a"), 1);
	t.end();
});

test("getFieldValue: gets nested field", (t) => {
	const doc = { a: { b: { c: 2 } } };
	t.equal(getFieldValue(doc, "a.b.c"), 2);
	t.end();
});

test("getFieldValue: returns undefined for missing field", (t) => {
	const doc = { a: 1 };
	// @ts-expect-error testing invalid field path
	t.equal(getFieldValue(doc, "b"), undefined);
	t.end();
});

test("getFieldValue: returns undefined for null/undefined in path", (t) => {
	const doc = { a: null };
	// @ts-expect-error testing invalid field path
	t.equal(getFieldValue(doc, "a.b"), undefined);
	t.end();
});

test("getFieldValue: returns undefined for non-object in path", (t) => {
	const doc = { a: 1 };
	// @ts-expect-error testing invalid field path
	t.equal(getFieldValue(doc, "a.b"), undefined);
	t.end();
});

test("getFieldValue: returns undefined for undefined in path", (t) => {
	const doc = { a: undefined };
	// @ts-expect-error testing invalid field path
	t.equal(getFieldValue(doc, "a.b"), undefined);
	t.end();
});

test("getFieldValue: returns undefined for null in path", (t) => {
	const doc = { a: null };
	// @ts-expect-error testing invalid field path
	t.equal(getFieldValue(doc, "a.b"), undefined);
	t.end();
});
