import test from "node:test";
import assert from "node:assert/strict";
import {
  RESCUE_OUTCOMES,
  createRescueRecord,
  groupShelf,
  sanitiseRecord,
  sanitiseShelf,
  storyFor
} from "../core/rescueShelf.js";

const record = createRescueRecord({
  id: "rescue-1",
  item: { id: "headphones", name: "headphones", photoUrl: "blob:secret" },
  problems: [{ id: "cushion-worn", label: "An ear cushion is worn" }],
  boundary: { boundary: "ask-an-adult", label: "Ask an Adult" },
  future: { id: "repair", label: "Repair" },
  photo: "secret-image-data"
});

test("US6-1 a new shelf record contains only the privacy-minimal allow-list", () => {
  assert.deepEqual(Object.keys(record), [
    "id", "itemName", "noticedProblem", "safetyBoundary", "chosenFuture", "outcome"
  ]);
  assert.equal(record.outcome, "not-decided");
  assert.doesNotMatch(JSON.stringify(record), /blob:secret|secret-image-data|photoUrl/);
});

test("US6-1 every required follow-up outcome is available", () => {
  assert.deepEqual(RESCUE_OUTCOMES.map(option => option.id), [
    "still-using", "fixed-with-adult", "reused-at-home", "gave-away", "donated",
    "recycled", "disposed", "not-decided", "something-else"
  ]);
});

test("US6-1 saved records reject extra fields and invented outcomes", () => {
  const clean = sanitiseRecord({ ...record, outcome: "won-a-prize", score: 100, image: "data:image/png" });
  assert.equal(clean.outcome, "not-decided");
  assert.equal("score" in clean, false);
  assert.equal("image" in clean, false);
});

test("US6-1 an incomplete investigation is not saved to the shelf", () => {
  assert.equal(createRescueRecord({ id: "x", item: { name: "T-shirt" }, future: { label: "Reuse" } }), null);
  assert.equal(createRescueRecord({ id: "x", item: { name: "T-shirt" }, boundary: "Safe to Try" }), null);
});

test("US6-1 malformed and duplicate local records are discarded safely", () => {
  const saved = sanitiseShelf([record, { ...record, outcome: "recycled" }, null, { id: "missing-name" }]);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, record.id);
});

test("US6-2 records read as item stories rather than scores", () => {
  const story = storyFor({ ...record, outcome: "fixed-with-adult" });
  assert.match(story, /headphones.*ear cushion.*Repair.*fixed it with a trusted adult/i);
  assert.doesNotMatch(story, /score|points|rank/i);
});

test("US6-2 shelf records form the requested simple groups", () => {
  const groups = groupShelf([
    { ...record, id: "a", outcome: "fixed-with-adult" },
    { ...record, id: "b", outcome: "still-using" },
    { ...record, id: "c", outcome: "donated" },
    { ...record, id: "d", outcome: "recycled" }
  ]);
  assert.deepEqual(groups.map(group => group.label), [
    "Repaired with adult help", "Still being used", "Given to someone else", "Recycled"
  ]);
});
