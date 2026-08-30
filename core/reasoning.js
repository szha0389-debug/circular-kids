
import { findOption, questionsFor, SKIPPED } from "./clues.js";

export const VERDICTS = [
  { value: "still-useful", label: "Still useful", band: 0 },
  { value: "partly-useful", label: "Partly useful", band: 1 },
  { value: "unusable", label: "Completely unusable", band: 2 },
  { value: "not-sure", label: "Not sure", band: null }
];

const VERDICT_BY_VALUE = new Map(VERDICTS.map(v => [v.value, v]));

