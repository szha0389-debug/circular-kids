// The case state machine. This is the single implementation shared by the local
// dev API, the Vercel functions and the worker — none of them may hold their own
// copy of these rules.


import { breakdownFor, findItem, problemsFor } from "./catalogue.js";
import { MAX_QUESTIONS, questionsFor, SKIPPED } from "./clues.js";
import { compare, reason, VERDICTS } from "./reasoning.js";
import {
  BOUNDARIES,
  boundaryFor,
  sanitiseComparisonResponse,
  sanitiseSafetyResponse
} from "./safety.js";

export const STAGES = [
  "identify", "breakdown", "clues", "verdict", "reveal", "handover",
  "safety-activity", "safety-reveal", "safety-comparison", "safety-boundary"
];

/** Cases are held for this long; a photo is never part of one. */
export const TTL_MS = 30 * 60 * 1000;

const VALID_VERDICTS = new Set(VERDICTS.map(v => v.value));

/**
 * Fields a client may write. `conclusion`, `reasoning`, `uncertainty` and
 * `dangerFlag` are deliberately absent — all four are derived.
 */
const WRITABLE = new Set([
  "stage", "itemId", "problems", "answers", "verdict", "safetyResponse", "comparisonResponse"
]);

export function createRecord(id, now = Date.now()) {
  return {
    id,
    stage: "identify",
    itemId: null,
    problems: [],
    answers: [],
    verdict: null,
    safetyResponse: null,
    comparisonResponse: null,
    safetyBoundary: null,
    completed: false,
    // Recorded so the client and any auditor can see the claim the UI makes.
    // Nothing in this module ever sets it true.
    imageStored: false,
    createdAt: now,
    updatedAt: now
  };
}

export function isExpired(record, now = Date.now()) {
  return !record || now - record.updatedAt > TTL_MS;
}

function sanitiseProblems(value, itemId) {
  if (!Array.isArray(value)) return [];
  const offered = new Set([...problemsFor(itemId).map(p => p.id), "no-problem", "not-sure"]);
  // Multi-select is required by US-1.2; order is preserved so the first choice
  // still drives clue selection.
  return [...new Set(value.filter(id => typeof id === "string" && offered.has(id)))];
}

function sanitiseAnswers(value, problems) {
  if (!Array.isArray(value)) return [];
  const questions = questionsFor(problems);
  return questions.map((question, index) => {
    const answer = value[index];
    if (answer === SKIPPED) return SKIPPED;
    const allowed = question.options.some(option => option.value === answer);
    return allowed ? answer : null;
  });
}

/**
 * Apply a client patch. Unknown keys are dropped rather than rejected so that a
 * newer screen talking to an older API degrades instead of failing.
 */
export function applyUpdate(record, input = {}, now = Date.now()) {
  if (!record) return null;
  const patch = {};

  for (const [key, value] of Object.entries(input || {})) {
    if (WRITABLE.has(key)) patch[key] = value;
  }

  if ("itemId" in patch) {
    const item = findItem(patch.itemId);
    // An unknown id would leave the case pointing at nothing, so it is ignored.
    if (item) {
      if (item.id !== record.itemId) {
        // Changing the item invalidates everything chosen against the old one.
        record.problems = [];
        record.answers = [];
      }
      record.itemId = item.id;
    }
  }

  if ("problems" in patch) {
    record.problems = sanitiseProblems(patch.problems, record.itemId);
    record.answers = [];
  }

  if ("answers" in patch) {
    record.answers = sanitiseAnswers(patch.answers, record.problems);
  }

  if ("verdict" in patch) {
    // "not sure" is a given answer, not a skip (US-1.4).
    record.verdict = VALID_VERDICTS.has(patch.verdict) ? patch.verdict : null;
  }

  if ("safetyResponse" in patch) {
    record.safetyResponse = sanitiseSafetyResponse(patch.safetyResponse);
    record.comparisonResponse = null;
    record.safetyBoundary = null;
  }

  if ("comparisonResponse" in patch) {
    record.comparisonResponse = sanitiseComparisonResponse(patch.comparisonResponse);
  }

  if ("stage" in patch && STAGES.includes(patch.stage)) {
    record.stage = patch.stage;
  }

  if (record.safetyResponse) record.safetyBoundary = boundaryFor(record);

  record.updatedAt = now;
  return record;
}

/** What the breakdown and problem screens need for the current item. */
export function caseView(record) {
  if (!record?.itemId) return null;
  const item = findItem(record.itemId);
  if (!item) return null;
  return {
    item: { id: item.id, name: item.name, icon: item.icon, category: item.category },
    breakdown: breakdownFor(item.id),
    problems: problemsFor(item.id),
    questions: questionsFor(record.problems).map(question => ({
      id: question.id,
      text: question.text,
      // `weight` and `danger` are stripped: the clue screen must give no
      // reaction to an answer, and cannot leak one it never receives.
      options: question.options.map(option => ({ value: option.value, label: option.label }))
    }))
  };
}

/**
 * The reveal. Refuses to compute anything until a verdict exists — this is the
 * code-level guard for "the site does not answer first".
 */
export function reveal(record) {
  if (!record?.verdict) {
    return { ok: false, message: "Record your own verdict first." };
  }
  const reasoning = reason({ problems: record.problems, answers: record.answers });
  return {
    ok: true,
    verdict: record.verdict,
    reasoning: {
      conclusion: reasoning.conclusion,
      lowInformation: reasoning.lowInformation,
      uncertainty: reasoning.uncertainty
    },
    comparison: compare(record.verdict, reasoning)
  };
}

/** Everything required before a case may be handed to Epic 2. */
export function missingPieces(record) {
  const missing = [];
  if (!record?.itemId || !findItem(record.itemId)) missing.push("item");
  if (!record?.problems?.length) missing.push("suspected problem");
  if (!record?.verdict) missing.push("verdict");
  return missing;
}

/**
 * The handover payload for US-1.5. Epic 1 assigns no safety level and gives no
 * advice: it reports what was observed, flags what was uncertain, and stops.
 */
export function transferPayload(record) {
  const missing = missingPieces(record);
  if (missing.length) {
    return {
      ok: false,
      missing,
      message: "Some of the case is still missing. Your page has been kept."
    };
  }

  const item = findItem(record.itemId);
  const reasoning = reason({ problems: record.problems, answers: record.answers });
  const questions = questionsFor(record.problems);
  const offered = [
    ...problemsFor(record.itemId),
    { id: "no-problem", label: "No problem noticed" },
    { id: "not-sure", label: "Not sure" }
  ];
  const labelOf = id => offered.find(problem => problem.id === id)?.label || id;

  return {
    ok: true,
    destination: "epic-2",
    payload: {
      investigationId: record.id,
      item: { id: item.id, name: item.name, category: item.category },
      suspectedProblems: record.problems.map(id => ({ id, label: labelOf(id) })),
      answers: questions.map((question, index) => ({
        question: question.text,
        value: record.answers[index] ?? null,
        skipped: record.answers[index] === SKIPPED || record.answers[index] == null
      })),
      verdict: record.verdict,
      reasoning: reasoning.conclusion,
      lowInformation: reasoning.lowInformation,
      uncertainty: reasoning.uncertainty,
      // Epic 2 owns every safety decision. This is an observation, not a level.
      dangerFlag: reasoning.dangerFlag,
      // Restated in the payload so Epic 2 never has to ask for a photo.
      imageTransferred: false
    }
  };
}

export function safetyStatus(record) {
  if (!record) return null;
  const boundary = record.safetyResponse ? boundaryFor(record) : null;
  return {
    stage: record.stage,
    safetyResponse: record.safetyResponse || null,
    comparisonResponse: record.comparisonResponse || null,
    safetyBoundary: boundary,
    restricted: boundary === BOUNDARIES.STOP
  };
}

export { MAX_QUESTIONS, SKIPPED, VERDICTS };
