import test from "node:test";
import assert from "node:assert/strict";
import {
  MYSTERIES,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  TAP_TOLERANCE,
  findMystery,
  hintFor,
  insideRect,
  isCorrectArea,
  isHit,
  nextMystery,
  shouldNudge
} from "../core/mysteries.js";

const centre = ([x, y, width, height]) => ({ x: x + width / 2, y: y + height / 2 });

function overlaps([ax, ay, aw, ah], [bx, by, bw, bh], pad = 0) {
  return ax < bx + bw + pad && ax + aw + pad > bx && ay < by + bh + pad && ay + ah + pad > by;
}

test("AC4.1.1 every mystery presents one familiar scene with a short question", () => {
  assert.ok(MYSTERIES.length >= 4);
  for (const mystery of MYSTERIES) {
    assert.ok(mystery.title && mystery.prompt && mystery.category, mystery.id);
    assert.ok(mystery.prompt.length <= 100, `${mystery.id} prompt should stay short`);
    assert.equal(mystery.areas.filter(area => area.correct).length, 1, `${mystery.id} has one key issue`);
  }
});

test("AC4.1.1 the prompt does not give the answer away", () => {
  for (const mystery of MYSTERIES) {
    const answer = mystery.areas.find(area => area.correct).label.toLowerCase();
    assert.ok(!mystery.prompt.toLowerCase().includes(answer), mystery.id);
  }
});

test("AC4.1.2 targets sit inside the scene and are large enough for a child's tap", () => {
  for (const mystery of MYSTERIES) {
    const [x, y, width, height] = mystery.target;
    assert.ok(x >= 0 && y >= 0 && x + width <= SCENE_WIDTH && y + height <= SCENE_HEIGHT, mystery.id);
    assert.ok(width >= 48 && height >= 48, `${mystery.id} target is too small to tap`);
  }
});

test("AC4.1.2 a tap on the problem is accepted", () => {
  for (const mystery of MYSTERIES) {
    assert.equal(isHit(mystery, centre(mystery.target)), true, mystery.id);
  }
});

test("AC4.1.2 a near-correct tap just outside the target is still accepted", () => {
  const mystery = findMystery("bottle-bin");
  const [x, y] = mystery.target;
  assert.equal(isHit(mystery, { x: x - TAP_TOLERANCE + 2, y: y + 10 }), true);
  assert.equal(isHit(mystery, { x: x - TAP_TOLERANCE - 20, y: y + 10 }), false);
});

test("AC4.1.2 taps elsewhere and malformed taps are not accepted", () => {
  for (const mystery of MYSTERIES) {
    for (const area of mystery.areas.filter(item => !item.correct)) {
      assert.equal(isHit(mystery, centre(area.rect)), false, `${mystery.id}: ${area.id}`);
    }
    assert.equal(isHit(mystery, { x: Number.NaN, y: 10 }), false);
    assert.equal(isHit(mystery, null), false);
  }
});

test("AC4.1.2 named areas never overlap the tap zone, so both routes agree", () => {
  for (const mystery of MYSTERIES) {
    const correct = mystery.areas.find(area => area.correct);
    assert.deepEqual(correct.rect, mystery.target, mystery.id);
    for (const area of mystery.areas.filter(item => !item.correct)) {
      assert.ok(!overlaps(area.rect, mystery.target, TAP_TOLERANCE), `${mystery.id}: ${area.id} overlaps the target`);
    }
    assert.equal(isCorrectArea(mystery, correct.id), true);
    assert.equal(isCorrectArea(mystery, mystery.areas.find(area => !area.correct).id), false);
    assert.equal(isCorrectArea(mystery, "invented"), false);
  }
});

test("AC4.1.3 a correct answer explains why the spot matters in plain words", () => {
  for (const mystery of MYSTERIES) {
    assert.ok(mystery.success.title && mystery.success.text && mystery.lesson, mystery.id);
    assert.doesNotMatch(mystery.success.text, /\b(danger(ous)?|toxic|explode|die|kill)\b/i, mystery.id);
  }
});

test("AC4.1.3 an item with a safety angle carries an adult-help note", () => {
  const battery = findMystery("old-battery");
  assert.match(battery.safetyNote, /trusted adult/i);
});

test("AC4.1.4 a miss gives a hint that grows more specific without revealing the answer", () => {
  const mystery = findMystery("running-tap");
  assert.equal(hintFor(mystery, 0), null);
  assert.equal(hintFor(mystery, 1).text, mystery.hints[0]);
  assert.equal(hintFor(mystery, 2).text, mystery.hints[1]);
  assert.equal(hintFor(mystery, 7).text, mystery.hints[1]);
  for (const item of MYSTERIES) {
    const answer = item.areas.find(area => area.correct).label.toLowerCase();
    for (const hint of item.hints) assert.ok(!hint.toLowerCase().includes(answer), `${item.id}: ${hint}`);
  }
});

test("AC4.1.4 repeated misses stay encouraging and never shame the child", () => {
  const mystery = findMystery("park-litter");
  for (let misses = 1; misses <= 6; misses += 1) {
    const hint = hintFor(mystery, misses);
    assert.doesNotMatch(`${hint.title} ${hint.text}`, /\b(wrong|incorrect|fail(ed)?|bad|silly)\b/i);
  }
  assert.equal(shouldNudge(2), false);
  assert.equal(shouldNudge(3), true);
});

test("AC4.3.1 mysteries span different categories", () => {
  const categories = new Set(MYSTERIES.map(mystery => mystery.category));
  assert.ok(categories.size >= 4);
});

test("AC4.3.2 the next suggestion is unsolved and from another category", () => {
  const next = nextMystery("bottle-bin", ["bottle-bin"]);
  assert.notEqual(next.id, "bottle-bin");
  assert.notEqual(next.category, findMystery("bottle-bin").category);
});

test("AC4.3.2 when everything is solved, a different mystery is still offered", () => {
  const everything = MYSTERIES.map(mystery => mystery.id);
  const next = nextMystery("lights-on", everything);
  assert.ok(next);
  assert.notEqual(next.id, "lights-on");
});

test("insideRect respects its tolerance on every edge", () => {
  const rect = [100, 100, 50, 50];
  assert.equal(insideRect(rect, { x: 90, y: 125 }, 10), true);
  assert.equal(insideRect(rect, { x: 160, y: 125 }, 10), true);
  assert.equal(insideRect(rect, { x: 125, y: 161 }, 10), false);
});
