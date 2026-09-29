import test from "node:test";
import assert from "node:assert/strict";

import {
  CONFIDENCE_THRESHOLD,
  IMAGE_LABELS,
  chooseSuggestion
} from "../src/services/imageRecognition.js";
import { CATEGORIES, itemsInCategory } from "../core/catalogue.js";

test("the model candidates exactly cover every concrete catalogue item", () => {
  const catalogueIds = CATEGORIES.flatMap(category =>
    itemsInCategory(category.id).filter(item => !item.isGeneral && item.recognisable !== false).map(item => item.id)
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
  assert.equal(result.suggestion.confidenceLevel, "confident");
});

test("the highest score is retained but clearly marked when confidence is low", () => {
  const backpack = IMAGE_LABELS.findIndex(item => item.itemId === "backpack");
  const jacket = IMAGE_LABELS.findIndex(item => item.itemId === "jacket");
  const weak = new Array(IMAGE_LABELS.length).fill(0.01);
  weak[backpack] = 0.12;
  weak[jacket] = 0.11;
  const weakResult = chooseSuggestion(weak);
  assert.equal(weakResult.suggestion.itemId, "backpack");
  assert.equal(weakResult.suggestion.confidenceLevel, "low");

  const ambiguous = new Array(IMAGE_LABELS.length).fill(0.01);
  ambiguous[backpack] = CONFIDENCE_THRESHOLD;
  ambiguous[jacket] = 0.59;
  const thresholdResult = chooseSuggestion(ambiguous);
  assert.equal(thresholdResult.suggestion.itemId, "backpack");
  assert.equal(thresholdResult.suggestion.confidenceLevel, "confident");
});
