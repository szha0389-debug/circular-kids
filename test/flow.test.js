// The guided journey — core/flow.js.
//
// The left-hand progress menu is also a way to move around, so the rules that
// keep it honest are tested here rather than left to the component: a step must
// never be offered before the case supports it, and every stage must be
// reachable once the one before it is finished.

import test from "node:test";
import assert from "node:assert/strict";
import { DEPENDS_ON, FLOW_STAGES, flowCompletion, flowProgress, invalidatedBy, stepForRoute } from "../core/flow.js";

const ALL_STEPS = FLOW_STAGES.flatMap(stage => stage.steps);

test("every step names a route, a label and a finished flag", () => {
  for (const step of ALL_STEPS) {
    assert.ok(step.id && step.route && step.label, `incomplete step: ${step.id}`);
    assert.equal(typeof step.done, "string", `${step.id} has no finished flag`);
  }
});

test("a route belongs to exactly one step", () => {
  const routes = ALL_STEPS.map(step => step.route);
  assert.equal(new Set(routes).size, routes.length, "two steps claim the same route");
  for (const step of ALL_STEPS) {
    assert.equal(stepForRoute(step.route)?.step.id, step.id);
  }
  assert.equal(stepForRoute("welcome"), null);
});

test("what a step waits for is something another step finishes", () => {
  const produced = new Set(ALL_STEPS.map(step => step.done));
  for (const step of ALL_STEPS) {
    if (!step.needs) continue;
    assert.ok(produced.has(step.needs), `${step.id} waits for "${step.needs}", which nothing finishes`);
  }
});

test("a fresh case opens only the first step and the on-device shelf", () => {
  const open = flowProgress({})
    .flatMap(stage => stage.steps)
    .filter(step => step.open)
    .map(step => step.id);
  assert.deepEqual(open, ["identify", "rescue-shelf"]);
});

test("nothing is locked once the case is complete", () => {
  const finished = Object.fromEntries(ALL_STEPS.map(step => [step.done, true]));
  const stages = flowProgress(finished);
  assert.ok(stages.every(stage => stage.done && stage.open));
  assert.equal(flowCompletion(stages), 100);
});

test("the step being worked on is the only current one", () => {
  const stages = flowProgress({ itemChosen: true }, "problem");
  const current = stages.flatMap(stage => stage.steps).filter(step => step.current);
  assert.equal(current.length, 1);
  assert.equal(current[0].id, "problem");
  assert.equal(stages.filter(stage => stage.current).length, 1);
});

test("a finished step can still be opened again, so the menu can go back", () => {
  const stages = flowProgress({ itemChosen: true, problemsChosen: true }, "clues");
  const identify = stages[0].steps.find(step => step.id === "identify");
  assert.ok(identify.done && identify.open);
});

test("completion counts steps, not stages", () => {
  assert.equal(flowCompletion(flowProgress({})), 0);
  const partly = flowProgress({ itemChosen: true, problemsChosen: true });
  assert.equal(flowCompletion(partly), Math.round((2 / ALL_STEPS.length) * 100));
});

// ── Going back and changing an answer ───────────────────────────────────────
//
// The menu makes any earlier answer one tap away from anywhere, so a result
// outliving the answer it was worked out from is a normal path, not an edge
// case. These are the rules that stop it.

test("changing the item invalidates the whole case", () => {
  const stale = invalidatedBy("item");
  for (const name of Object.keys(DEPENDS_ON)) {
    assert.ok(stale.includes(name), `changing the item leaves "${name}" behind`);
  }
});

test("changing an observation invalidates the safety boundary and the future", () => {
  const stale = invalidatedBy("problems");
  for (const name of ["answers", "verdict", "reveal", "safetyResponse", "comparisonResponse", "boundary", "future", "journey"]) {
    assert.ok(stale.includes(name), `changing the problems leaves "${name}" behind`);
  }
});

test("a clue answer reaches the boundary, because a clue can turn a warning serious", () => {
  const stale = invalidatedBy("answers");
  assert.ok(stale.includes("boundary"));
  assert.ok(stale.includes("future"));
});

test("the verdict is a leaf: it changes the reasoning shown, not the safety boundary", () => {
  assert.deepEqual(invalidatedBy("verdict"), ["reveal"]);
});

test("the last answer invalidates nothing, and an unknown name is harmless", () => {
  assert.deepEqual(invalidatedBy("journey"), []);
  assert.deepEqual(invalidatedBy("nothing-like-this"), []);
});

test("nothing is worked out from itself, directly or in a loop", () => {
  for (const name of Object.keys(DEPENDS_ON)) {
    assert.ok(!invalidatedBy(name).includes(name), `"${name}" depends on itself`);
  }
});

test("every answer the menu can jump back to can invalidate what follows it", () => {
  // The steps a child can return to and change, named as core/flow.js names
  // them. Each must be a source something else is worked out from, or the
  // screens after it would keep showing a result built on the old answer.
  for (const answer of ["item", "problems", "answers", "safetyResponse", "comparisonResponse"]) {
    assert.ok(invalidatedBy(answer).length > 0, `nothing is invalidated by "${answer}"`);
  }
});
