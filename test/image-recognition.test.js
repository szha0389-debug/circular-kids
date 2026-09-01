import test from "node:test";
import assert from "node:assert/strict";

import {
  IMAGE_LABELS,
  chooseSuggestion
} from "../src/services/imageRecognition.js";
import { CATEGORIES, itemsInCategory } from "../core/catalogue.js";

test("the model candidates exactly cover every concrete catalogue item", () => {
  const catalogueIds = CATEGORIES.flatMap(category =>
    itemsInCategory(category.id).filter(item => !item.isGeneral).map(item => item.id)
  ).sort();
  const modelIds = IMAGE_LABELS.map(item => item.itemId).sort();

  assert.deepEqual(modelIds, catalogueIds);
});

test("a confident image score becomes a catalogue suggestion", () => {
  const scores = new Array(IMAGE_LABELS.length).fill(0.01);
  scores[IMAGE_LABELS.findIndex(item => item.itemId === "backpack")] = 0.72;
  const result = chooseSuggestion(scores);

  assert.equal(result.suggestion.itemId, "backpack");
  assert.equal(result.suggestion.confidence, 0.72);
});

test("the highest score is returned even when confidence is low", () => {
  const backpack = IMAGE_LABELS.findIndex(item => item.itemId === "backpack");
  const jacket = IMAGE_LABELS.findIndex(item => item.itemId === "jacket");
  const weak = new Array(IMAGE_LABELS.length).fill(0.01);
  weak[backpack] = 0.12;
  weak[jacket] = 0.11;
  assert.equal(chooseSuggestion(weak).suggestion.itemId, "backpack");

  const ambiguous = new Array(IMAGE_LABELS.length).fill(0.01);
  ambiguous[backpack] = 0.6;
  ambiguous[jacket] = 0.59;
  assert.equal(chooseSuggestion(ambiguous).suggestion.itemId, "backpack");
});
