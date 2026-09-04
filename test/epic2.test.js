// Epic 2 acceptance tests — Know What Is Safe for Me.

import test from "node:test";
import assert from "node:assert/strict";

import { handle } from "../core/handler.js";
import { applyUpdate, createRecord, safetyStatus } from "../core/investigation.js";
import {
  BOUNDARIES,
  boundaryFor,
  comparisonActivity,
  finalSafetyResult,
  safetyActivity,
  safetyReveal
} from "../core/safety.js";
import { createStore } from "../core/store.js";

function recordFor(itemId, problems, answers = []) {
  const record = createRecord("epic-2-case");
  applyUpdate(record, { itemId, problems, answers, verdict: "partly-useful" });
  return record;
}

test("AC2.1.1 a relevant serious warning sign appears before optional learning", () => {
  const record = recordFor("phone", ["battery-odd"]);
  const activity = safetyActivity(record);
  assert.equal(activity.warning.id, "swollen-battery");
  assert.equal(activity.immediateStop, true);
  assert.match(activity.warning.explanation, /do not/i);
});

test("AC2.1.1 an incomplete transfer receives a general safe scenario", () => {
  const activity = safetyActivity(createRecord("incomplete"));
  assert.equal(activity.warning.id, "uncertain-item");
  assert.equal(activity.warning.severity, "uncertain");
  assert.match(activity.warning.explanation, /adult/i);
});

test("AC2.1.1 no safety activity instructs touching, smelling, opening or testing", () => {
  for (const record of [
    recordFor("charger", ["cable-damaged"]),
    recordFor("phone", ["screen-cracked"]),
    recordFor("toy-car", ["wheel-off"]),
    createRecord("uncertain")
  ]) {
    const text = JSON.stringify(safetyActivity(record));
    assert.doesNotMatch(text, /touch it|smell it|open it|test it/i);
  }
});

test("AC2.1.2 a choice is required and Not Sure is valid", () => {
  const record = recordFor("toy-car", ["wheel-off"]);
  assert.equal(safetyReveal(record).ok, false);
  applyUpdate(record, { safetyResponse: "not-sure" });
  assert.equal(safetyReveal(record).ok, true);
  assert.equal(record.safetyResponse, "not-sure");
});

test("AC2.1.2 an invented action is rejected", () => {
  const record = recordFor("toy-car", ["wheel-off"]);
  applyUpdate(record, { safetyResponse: "grab-the-wire" });
  assert.equal(record.safetyResponse, null);
});

test("AC2.1.2 no visible warning leads a lower-risk case to Safe to Try", () => {
  const record = recordFor("toy-car", ["wheel-off"]);
  applyUpdate(record, { safetyResponse: "no-warning" });
  assert.equal(boundaryFor(record), BOUNDARIES.SAFE);
});

test("AC2.1.2 no visible warning cannot weaken a serious warning", () => {
  const record = recordFor("phone", ["battery-odd"]);
  applyUpdate(record, { safetyResponse: "no-warning" });
  assert.equal(boundaryFor(record), BOUNDARIES.STOP);
});

test("AC2.1.3 the reveal explains the sign without marking the child wrong", () => {
  const record = recordFor("charger", ["cable-damaged"]);
  applyUpdate(record, { safetyResponse: "try-it" });
  const result = safetyReveal(record);
  const text = JSON.stringify(result);
  assert.equal(result.ok, true);
  assert.match(text, /electrical/i);
  assert.doesNotMatch(text, /\b(correct|incorrect|wrong)\b/i);
});

test("AC2.1.4 a serious warning always stops child-led investigation", () => {
  const record = recordFor("phone", ["screen-cracked"]);
  applyUpdate(record, { safetyResponse: "look-only", comparisonResponse: "loose-wheel" });
  const result = finalSafetyResult(record);
  assert.equal(result.boundary, BOUNDARIES.STOP);
  assert.equal(result.pathways.childLed, false);
  assert.equal(result.pathways.repairInstructionsBlocked, true);
});

test("AC2.2.1 comparison uses a clear lower-risk and higher-risk pair", () => {
  const comparison = comparisonActivity();
  assert.deepEqual(comparison.situations.map(x => x.id), ["loose-wheel", "damaged-cable"]);
  assert.ok(comparison.choices.some(x => x.value === "not-sure"));
  assert.doesNotMatch(JSON.stringify(comparison), /physically test|plug it in/i);
});

test("AC2.2.2 exactly one of the three safety boundaries is returned", () => {
  const safe = recordFor("toy-car", ["wheel-off"], ["yes", "all", "yes"]);
  applyUpdate(safe, { safetyResponse: "look-only", comparisonResponse: "loose-wheel" });
  assert.equal(boundaryFor(safe), BOUNDARIES.SAFE);

  const uncertain = recordFor("toy-car", ["not-sure"]);
  applyUpdate(uncertain, { safetyResponse: "not-sure", comparisonResponse: "loose-wheel" });
  assert.equal(boundaryFor(uncertain), BOUNDARIES.ADULT);

  const serious = recordFor("phone", ["battery-odd"]);
  applyUpdate(serious, { safetyResponse: "stop-and-tell", comparisonResponse: "loose-wheel" });
  assert.equal(boundaryFor(serious), BOUNDARIES.STOP);
});

test("AC2.2.3 final result includes item reasoning and a transferable rule", () => {
  const record = recordFor("phone", ["battery-odd"]);
  applyUpdate(record, { safetyResponse: "stop-and-tell", comparisonResponse: "loose-wheel" });
  const result = finalSafetyResult(record);
  assert.ok(result.warning.clue);
  assert.ok(result.rule);
  assert.match(result.rule, /battery|electrical|adult/i);
});

test("AC2.2.4 the restrictive boundary persists in the investigation record", () => {
  const record = recordFor("charger", ["cable-damaged"]);
  applyUpdate(record, { safetyResponse: "stop-and-tell", comparisonResponse: "loose-wheel", stage: "safety-boundary" });
  const status = safetyStatus(record);
  assert.equal(status.safetyBoundary, BOUNDARIES.STOP);
  assert.equal(status.restricted, true);
  assert.equal(status.stage, "safety-boundary");
});

test("API Epic 2 routes preserve answer-before-reveal and return the final boundary", async () => {
  const store = createStore();
  const opened = await handle({ method: "POST", path: "/api/investigations" }, store);
  const id = opened.body.id;
  await handle({
    method: "PATCH",
    path: `/api/investigations/${id}`,
    body: { itemId: "phone", problems: ["screen-cracked"], verdict: "partly-useful" }
  }, store);

  const premature = await handle({ method: "POST", path: `/api/investigations/${id}/safety-reveal` }, store);
  assert.equal(premature.status, 409);

  await handle({ method: "PATCH", path: `/api/investigations/${id}`, body: { safetyResponse: "stop-and-tell" } }, store);
  const revealed = await handle({ method: "POST", path: `/api/investigations/${id}/safety-reveal` }, store);
  assert.equal(revealed.status, 200);

  await handle({ method: "PATCH", path: `/api/investigations/${id}`, body: { comparisonResponse: "loose-wheel" } }, store);
  const boundary = await handle({ method: "POST", path: `/api/investigations/${id}/safety-boundary` }, store);
  assert.equal(boundary.status, 200);
  assert.equal(boundary.body.boundary, BOUNDARIES.STOP);
});
