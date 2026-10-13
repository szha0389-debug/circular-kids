import test from "node:test";
import assert from "node:assert/strict";
import { chunkRecoveryUrl, isChunkLoadError } from "../src/router/chunkRecovery.js";

test("a stale Vite route module is recognised as a recoverable deployment switch", () => {
  assert.equal(
    isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: /assets/ProblemView-old.js")),
    true
  );
  assert.equal(isChunkLoadError(new Error("The service is temporarily unavailable")), false);
});

test("chunk recovery reloads at the route the child was trying to open", () => {
  assert.equal(
    chunkRecoveryUrl("https://example.test/#/identify", "/problem"),
    "https://example.test/#/problem"
  );
  assert.equal(
    chunkRecoveryUrl("https://example.test/?preview=1#/identify", "clues?from=problem"),
    "https://example.test/?preview=1#/clues?from=problem"
  );
});
