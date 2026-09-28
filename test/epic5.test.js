import test from "node:test";
import assert from "node:assert/strict";
import { JOURNEY_FUTURE_IDS, journeyChange, journeyFor } from "../core/journeys.js";

const item = { id: "headphones", name: "headphones", category: "electronics" };
const problems = [{ id: "cushion-worn", label: "An ear cushion is worn" }];
const future = id => ({ id, label: id[0].toUpperCase() + id.slice(1) });

test("US5-1 every Epic 3 future has a short child-friendly journey", () => {
  for (const id of JOURNEY_FUTURE_IDS) {
    const journey = journeyFor({
      item,
      problems,
      boundary: "safe-to-try",
      boundaryLabel: "Safe to Try",
      future: future(id)
    });
    assert.ok(journey, id);
    assert.ok(journey.steps.length >= 3 && journey.steps.length <= 4, id);
    assert.equal(journey.noticed, problems[0].label);
    assert.equal(journey.boundary, "Safe to Try");
    assert.match(journey.uncertainty, /may|possible|not guaranteed/i);
  }
});

test("US5-1 recycling names the approved electronics service and avoids child dismantling", () => {
  const journey = journeyFor({ item, problems, boundary: "safe-to-try", future: future("recycle") });
  const wording = journey.steps.map(step => step.text).join(" ");
  assert.match(wording, /approved e-waste collection service/i);
  assert.match(wording, /do not open or dismantle/i);
  assert.match(journey.uncertainty, /regional Victoria/i);
});

test("US5-1 incomplete context never creates a journey", () => {
  assert.equal(journeyFor({ item, problems, boundary: null, future: future("reuse") }), null);
  assert.equal(journeyFor({ item: null, problems, boundary: "safe-to-try", future: future("reuse") }), null);
  assert.equal(journeyFor({ item, problems, boundary: "safe-to-try", future: future("invented") }), null);
});

test("US5-2 a restrictive safety boundary keeps unsafe options unavailable", () => {
  assert.equal(journeyFor({ item, problems, boundary: "do-not-touch", future: future("reuse") }), null);
  assert.equal(journeyFor({ item, problems, boundary: "ask-an-adult", future: future("donate") }), null);
  assert.ok(journeyFor({ item, problems, boundary: "do-not-touch", future: future("recycle") }));
});

test("US5-2 replay highlights the main downstream change", () => {
  const message = journeyChange(future("repair"), future("reuse"), "headphones");
  assert.match(message, /Changed from Repair to Reuse/);
  assert.match(message, /different purpose/);
  assert.equal(journeyChange(future("repair"), future("repair"), "headphones"), null);
});
