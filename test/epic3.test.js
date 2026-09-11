import test from "node:test";
import assert from "node:assert/strict";
import { suitableFutures } from "../core/futures.js";

const item = { id: "backpack", name: "Backpack" };
const damaged = [{ id: "zip-broken", label: "The zip is broken" }];

test("AC3.1.1 suitable futures use the item condition and safety boundary", () => {
  const options = suitableFutures({ item, problems: damaged, boundary: "safe-to-try" });
  assert.deepEqual(options.map(option => option.id), ["repair", "reuse", "donate", "recycle"]);
});

test("AC3.1.1 a do-not-touch boundary exposes no normal child-led action", () => {
  const options = suitableFutures({ item, problems: damaged, boundary: "do-not-touch" });
  assert.ok(options.length > 0);
  assert.ok(options.every(option => option.adultRequired));
  assert.ok(!options.some(option => option.id === "keep" || option.id === "donate"));
});

test("AC3.1.2 every option explains preserves, changes and loses", () => {
  const options = suitableFutures({ item, problems: damaged, boundary: "ask-an-adult" });
  for (const option of options) {
    assert.ok(option.preserves);
    assert.ok(option.changes);
    assert.ok(option.loses);
  }
});

test("AC3.2.2 every option provides one clear next step", () => {
  const options = suitableFutures({ item, problems: damaged, boundary: "safe-to-try" });
  for (const option of options) assert.match(option.nextStep, /\.$/);
});

test("missing safety result prevents future options", () => {
  assert.deepEqual(suitableFutures({ item, problems: damaged, boundary: null }), []);
});
