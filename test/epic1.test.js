// Tests written against the Epic 1 acceptance criteria, story by story.
// Each test name quotes the criterion it covers so a reviewer can trace them.

import test from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORIES,
  breakdownFor,
  itemsInCategory,
  problemsFor
} from "../core/catalogue.js";
import { MAX_QUESTIONS, questionsFor } from "../core/clues.js";
import { CONFIDENCE_THRESHOLD, recognise, REASONS } from "../core/recognition.js";
import { compare, reason } from "../core/reasoning.js";
import {
  applyUpdate,
  caseView,
  createRecord,
  reveal,
  transferPayload
} from "../core/investigation.js";
import { handle } from "../core/handler.js";
import { createStore } from "../core/store.js";

// ─────────────────────────────────────────────── US-1.1  identify the item

test("US-1.1 the item list shows the six child-friendly categories", () => {
  assert.deepEqual(
    CATEGORIES.map(c => c.label),
    ["Toys", "Electronics", "Clothes", "Furniture", "School Items", "Household Items"]
  );
});

test("US-1.1 every category offers items with an icon and a plain name", () => {
  for (const category of CATEGORIES) {
    const items = itemsInCategory(category.id);
    assert.ok(items.length >= 3, `${category.label} should offer several items`);
    for (const item of items) {
      assert.ok(item.icon, `${item.id} needs an icon`);
      // A plain name is everyday English: letters, spaces and real hyphens only
      // ("T-shirt" is fine, "toy-car" is a slug leaking through).
      assert.ok(item.name, `${item.id} needs a name`);
      assert.match(item.name, /^[A-Za-z][A-Za-z -]*$/, `${item.id} name must be words`);
      assert.doesNotMatch(item.name, /^[a-z]+(-[a-z]+)+$/, `${item.id} name is a slug`);
    }
  }
});

test("US-1.1 'something else' is available in every category", () => {
  for (const category of CATEGORIES) {
    const items = itemsInCategory(category.id);
    assert.equal(items.at(-1).isGeneral, true, `${category.label} needs an escape hatch`);
  }
});

test("US-1.1 an unsupported file goes to the list, not to an error", () => {
  const result = recognise({ name: "clip.gif", type: "image/gif", size: 20 });
  assert.equal(result.suggestion, null);
  assert.equal(result.reason, REASONS.UNSUPPORTED);
  assert.equal(result.available, true);
});

test("US-1.1 an unrecognisable photo goes to the list rather than showing a guess", () => {
  const result = recognise({ name: "IMG_4021.jpg", type: "image/jpeg", size: 90_000 });
  assert.equal(result.suggestion, null);
  assert.equal(result.reason, REASONS.NO_MATCH);
});

test("US-1.1 a returned candidate clears the agreed confidence threshold", () => {
  const result = recognise({ name: "my-headphones.jpg", type: "image/jpeg", size: 90_000 });
  assert.equal(result.suggestion.itemId, "headphones");
  assert.ok(result.suggestion.confidence >= CONFIDENCE_THRESHOLD);
});

test("US-1.1 a list-opened case has the same capability as a photo-opened one", () => {
  const viaList = createRecord("a");
  applyUpdate(viaList, { itemId: "headphones" });
  const viaPhoto = createRecord("b");
  applyUpdate(viaPhoto, { itemId: recognise({ name: "headphones.png", type: "image/png", size: 10 }).suggestion.itemId });
  assert.deepEqual(caseView(viaList), caseView(viaPhoto));
});

// ──────────────────────────────────────────── US-1.2  breakdown and problem

test("US-1.2 an assembled item breaks down into named components", () => {
  const breakdown = breakdownFor("headphones");
  assert.equal(breakdown.mode, "components");
  const names = breakdown.elements.map(e => e.name.toLowerCase());
  for (const part of ["casing", "ear cushion", "cable", "battery", "speaker driver"]) {
    assert.ok(names.includes(part), `headphones should name its ${part}`);
  }
});

test("US-1.2 a one-piece item with distinct areas breaks down into sections", () => {
  const breakdown = breakdownFor("backpack");
  assert.equal(breakdown.mode, "sections");
  const names = breakdown.elements.map(e => e.name.toLowerCase());
  for (const section of ["zip", "straps", "main compartment", "base"]) {
    assert.ok(names.includes(section), `backpack should name its ${section}`);
  }
});

test("US-1.2 an item with neither breaks down into plain qualities", () => {
  const breakdown = breakdownFor("tshirt");
  assert.equal(breakdown.mode, "qualities");
  assert.ok(breakdown.elements.every(e => /\?$/.test(e.name)), "qualities are plain questions");
});

test("US-1.2 materials are named in plain words, never technical codes", () => {
  for (const item of [...CATEGORIES.flatMap(c => itemsInCategory(c.id))]) {
    for (const element of breakdownFor(item.id).elements) {
      if (!element.material) continue;
      assert.match(element.material, /^[a-z][a-z ]*$/, `${item.id}.${element.id} must be plain words`);
    }
  }
});

test("US-1.2 an item with no component data falls back to qualities and continues", () => {
  const breakdown = breakdownFor("an-item-we-have-never-heard-of");
  assert.equal(breakdown.mode, "qualities");
  assert.equal(breakdown.fallback, true);
  assert.ok(problemsFor("an-item-we-have-never-heard-of").length > 0);
});

test("US-1.2 no wording anywhere asks the child to open, unscrew or dismantle", () => {
  // The control is on instructions to the child, not on the word "open" itself:
  // "a seam has come open" describes damage, "open the casing" asks for it.
  const forbidden =
    /\b(unscrew|dismantle|disassemble|prise|prize)\b|\b(open|pull|take|prise|pry)\s+(it|them|the|your)\b|\btake\s+apart\b|\bremove\s+the\b/i;
  for (const category of CATEGORIES) {
    for (const item of itemsInCategory(category.id)) {
      for (const element of breakdownFor(item.id).elements) {
        assert.doesNotMatch(element.name, forbidden, `${item.id}: ${element.name}`);
      }
      for (const problem of problemsFor(item.id)) {
        assert.doesNotMatch(problem.label, forbidden, `${item.id}: ${problem.label}`);
      }
    }
  }
  for (const question of questionsFor(["not-sure"])) {
    assert.doesNotMatch(question.text, forbidden, question.text);
  }
});

test("US-1.2 more than one problem can be selected", () => {
  const record = createRecord("multi");
  applyUpdate(record, { itemId: "headphones", problems: ["no-sound", "cable-damaged"] });
  assert.deepEqual(record.problems, ["no-sound", "cable-damaged"]);
});

test("US-1.2 selecting 'Not sure' flags the case and still produces clues", () => {
  const record = createRecord("unsure");
  applyUpdate(record, { itemId: "mug", problems: ["not-sure"] });
  assert.ok(questionsFor(record.problems).length > 0);
  const reasoning = reason({ problems: record.problems, answers: [] });
  assert.ok(reasoning.uncertainty.includes("suspected problem"));
});

test("US-1.2 a problem that was never offered is rejected", () => {
  const record = createRecord("bogus");
  applyUpdate(record, { itemId: "mug", problems: ["battery-odd", "cracked"] });
  assert.deepEqual(record.problems, ["cracked"], "a mug has no battery");
});

test("US-1.2 no visible problem is accepted and produces neutral clue questions", () => {
  const record = createRecord("no-problem");
  applyUpdate(record, { itemId: "mug", problems: ["no-problem"] });
  assert.deepEqual(record.problems, ["no-problem"]);
  assert.ok(questionsFor(record.problems).length > 0);
});

// ─────────────────────────────────────────────────── US-1.3  the clues

test("US-1.3 there are never more than three questions", () => {
  const many = ["no-sound", "cable-damaged", "battery-odd", "cracked", "cushion-worn"];
  assert.ok(questionsFor(many).length <= MAX_QUESTIONS);
  assert.equal(questionsFor(many).length, MAX_QUESTIONS);
});

test("US-1.3 every question is answerable by tapping, with no free text", () => {
  for (const question of questionsFor(["hole", "stain"])) {
    assert.ok(Array.isArray(question.options) && question.options.length >= 2);
    for (const option of question.options) {
      assert.equal(typeof option.label, "string");
      assert.notEqual(option.value, undefined);
    }
  }
});

test("US-1.3 every clue question allows the child to report no visible problem", () => {
  for (const question of questionsFor(["cracked"])) {
    const option = question.options.find(entry => entry.value === "no-problem");
    assert.equal(option?.label, "I cannot see a problem");
    assert.equal(option?.weight, 0);
  }
});

test("US-1.3 questions are relevant to the suspected problem", () => {
  const ids = questionsFor(["cable-damaged"]).map(q => q.id);
  assert.ok(ids.includes("cable-cover"), "a damaged cable should ask about the cover");
});

test("US-1.3 the clue screen is never sent anything that could leak a conclusion", () => {
  const record = createRecord("leak");
  applyUpdate(record, { itemId: "headphones", problems: ["battery-odd"] });
  const sent = JSON.stringify(caseView(record).questions);
  assert.ok(!sent.includes("weight"), "weights must not reach the client");
  assert.ok(!sent.includes("danger"), "danger marks must not reach the client");
});

test("US-1.3 skipping every question still proceeds, flagged low-information", () => {
  const record = createRecord("skipall");
  applyUpdate(record, { itemId: "tshirt", problems: ["hole"] });
  applyUpdate(record, { answers: ["skipped", "skipped", "skipped"], verdict: "not-sure" });
  const result = reveal(record);
  assert.equal(result.ok, true);
  assert.equal(result.reasoning.lowInformation, true);
});

// ─────────────────────────────────────────────────── US-1.4  the verdict

test("US-1.4 nothing continues until a verdict is chosen", () => {
  const record = createRecord("noverdict");
  applyUpdate(record, { itemId: "mug", problems: ["cracked"], answers: ["small", "one-area"] });
  assert.equal(reveal(record).ok, false);
  assert.equal(transferPayload(record).ok, false);
  assert.ok(transferPayload(record).missing.includes("verdict"));
});

test("US-1.4 the site cannot write a conclusion into the case", () => {
  const record = createRecord("noinject");
  applyUpdate(record, {
    itemId: "mug",
    conclusion: "This is rubbish",
    dangerFlag: true,
    uncertainty: ["everything"],
    reasoning: "planted"
  });
  assert.ok(!("conclusion" in record));
  assert.ok(!("reasoning" in record));
  assert.ok(!("dangerFlag" in record));
});

test("US-1.4 'not sure' is recorded as a given verdict, not as a skip", () => {
  const record = createRecord("notsure");
  applyUpdate(record, { itemId: "mug", problems: ["cracked"], verdict: "not-sure" });
  assert.equal(record.verdict, "not-sure");
  assert.equal(reveal(record).ok, true);
  assert.equal(transferPayload(record).ok, true);
});

test("US-1.4 a verdict cannot be silently overwritten by the site's assessment", () => {
  const record = createRecord("keep");
  applyUpdate(record, { itemId: "mug", problems: ["cracked"], answers: ["big", "all-over"] });
  applyUpdate(record, { verdict: "still-useful" });
  const before = record.verdict;
  reveal(record);
  transferPayload(record);
  assert.equal(record.verdict, before);
  assert.equal(transferPayload(record).payload.verdict, "still-useful");
});

test("US-1.4 an invented verdict value is refused", () => {
  const record = createRecord("bad");
  applyUpdate(record, { itemId: "mug", verdict: "definitely-rubbish" });
  assert.equal(record.verdict, null);
});

// ───────────────────────────────────────────────────── US-1.5  the reveal

test("US-1.5 the reveal states what the clues suggest in plain words", () => {
  const record = createRecord("plain");
  applyUpdate(record, { itemId: "tshirt", problems: ["hole"] });
  applyUpdate(record, { answers: ["tiny", "strong"], verdict: "still-useful" });
  const result = reveal(record);
  assert.match(result.reasoning.conclusion, /^[A-Z][a-z]/);
  assert.ok(result.reasoning.conclusion.length < 140);
});

test("US-1.5 when the two differ, one clue is named and nothing more is said", () => {
  const record = createRecord("differ");
  applyUpdate(record, { itemId: "headphones", problems: ["cable-damaged"] });
  applyUpdate(record, { answers: ["large", "yes"], verdict: "still-useful" });
  const { comparison } = reveal(record);
  assert.equal(comparison.differs, true);
  assert.ok(comparison.clue.question, "the clue that pulls the other way is named");
  assert.ok(comparison.clue.answer);
  // "stops there": the comparison carries no advice or follow-up field.
  assert.deepEqual(Object.keys(comparison).sort(), ["clue", "differs", "note"]);
});

test("US-1.5 no wording marks a verdict right, wrong, correct or incorrect", () => {
  const banned = /\b(right|wrong|correct|incorrect|mistake|should have|well done|good job)\b/i;
  const cases = [
    { problems: ["hole"], answers: ["tiny", "strong"], verdict: "unusable" },
    { problems: ["cable-damaged"], answers: ["large", "yes"], verdict: "still-useful" },
    { problems: ["not-sure"], answers: ["skipped", "skipped", "skipped"], verdict: "not-sure" },
    { problems: ["cracked"], answers: ["small", "few-areas"], verdict: "partly-useful" }
  ];
  for (const setup of cases) {
    const record = createRecord("wording");
    applyUpdate(record, { itemId: "tshirt", problems: setup.problems });
    applyUpdate(record, { answers: setup.answers, verdict: setup.verdict });
    const text = JSON.stringify(reveal(record));
    assert.doesNotMatch(text, banned, `banned wording in: ${text}`);
  }
});

test("US-1.5 a low-information case says so and stays tentative", () => {
  const record = createRecord("thin");
  applyUpdate(record, { itemId: "mug", problems: ["not-sure"] });
  applyUpdate(record, { answers: ["skipped", "skipped", "skipped"], verdict: "still-useful" });
  const result = reveal(record);
  assert.equal(result.reasoning.lowInformation, true);
  assert.match(result.reasoning.conclusion, /guess/i);
});

test("US-1.5 the handover carries everything Epic 2 needs, and no photo", () => {
  const record = createRecord("hand");
  applyUpdate(record, { itemId: "headphones", problems: ["battery-odd", "no-sound"] });
  applyUpdate(record, { answers: ["yes", "no", "normal"], verdict: "partly-useful" });
  const { ok, payload } = transferPayload(record);
  assert.equal(ok, true);
  for (const field of [
    "item", "suspectedProblems", "answers", "verdict", "reasoning", "uncertainty", "dangerFlag"
  ]) {
    assert.ok(field in payload, `handover must carry ${field}`);
  }
  assert.equal(payload.imageTransferred, false);
  assert.ok(!JSON.stringify(payload).includes("photo"));
});

test("US-1.5 Epic 1 hands over an observation, never a safety level", () => {
  const record = createRecord("nolevel");
  applyUpdate(record, { itemId: "phone", problems: ["battery-odd"] });
  applyUpdate(record, { answers: ["yes", "yes"], verdict: "unusable" });
  const { payload } = transferPayload(record);
  assert.equal(payload.dangerFlag, true, "the observation travels");
  const keys = Object.keys(payload).join(" ");
  assert.doesNotMatch(keys, /safetyLevel|riskLevel|severity|advice|recommendation/i);
});

// ───────────────────────────────────────────── Definition of Done / API

test("DoD an incomplete case is never handed over, and the page is kept", () => {
  const result = transferPayload(createRecord("empty"));
  assert.equal(result.ok, false);
  assert.match(result.message, /kept/i);
});

test("API the catalogue, case and reveal route through one shared handler", async () => {
  const store = createStore();

  const created = await handle({ method: "POST", path: "/api/investigations" }, store);
  assert.equal(created.status, 201);
  const id = created.body.id;

  const catalogue = await handle({ method: "GET", path: "/api/catalogue" }, store);
  assert.equal(catalogue.body.categories.length, 6);

  await handle(
    { method: "PATCH", path: `/api/investigations/${id}`, body: { itemId: "backpack", problems: ["zip-stuck"] } },
    store
  );

  const early = await handle({ method: "POST", path: `/api/investigations/${id}/reveal` }, store);
  assert.equal(early.status, 409, "the reveal is refused before a verdict");

  await handle(
    { method: "PATCH", path: `/api/investigations/${id}`, body: { answers: ["no", "few"], verdict: "partly-useful" } },
    store
  );

  const revealed = await handle({ method: "POST", path: `/api/investigations/${id}/reveal` }, store);
  assert.equal(revealed.status, 200);

  const handedOver = await handle({ method: "POST", path: `/api/investigations/${id}/transfer` }, store);
  assert.equal(handedOver.status, 200);
  assert.equal(handedOver.body.destination, "epic-2");

  const after = await handle({ method: "GET", path: `/api/investigations/${id}` }, store);
  assert.equal(after.body.completed, true);
  assert.equal(after.body.imageStored, false);
});

test("API an unknown case is told it has finished, not that it errored", async () => {
  const store = createStore();
  const result = await handle({ method: "GET", path: "/api/investigations/nope" }, store);
  assert.equal(result.status, 404);
  assert.doesNotMatch(result.body.message, /error/i);
});
