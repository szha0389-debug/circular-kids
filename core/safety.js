// Epic 2 — Know What Is Safe for Me.
//
// All safety boundaries are derived here, on the server. The client may record
// what the child chose, but it cannot choose or loosen the safety boundary.

import { findItem, problemsFor } from "./catalogue.js";
import { reason } from "./reasoning.js";

export const BOUNDARIES = Object.freeze({
  SAFE: "safe-to-try",
  ADULT: "ask-an-adult",
  STOP: "do-not-touch"
});

export const BOUNDARY_DETAILS = Object.freeze({
  [BOUNDARIES.SAFE]: {
    label: "Safe to Try",
    icon: "🌱",
    rank: 0,
    instruction: "You may keep looking with a trusted adult nearby. Stop if you notice anything new.",
    rule: "Small, ordinary problems can be looked at without opening or testing the item."
  },
  [BOUNDARIES.ADULT]: {
    label: "Ask an Adult",
    icon: "🙋",
    rank: 1,
    instruction: "Pause here and show the item to a trusted adult before doing anything else.",
    rule: "If you are unsure, or an item uses electricity, heat or chemicals, ask an adult."
  },
  [BOUNDARIES.STOP]: {
    label: "Do Not Touch",
    icon: "✋",
    rank: 2,
    instruction: "Move away from the item and tell a trusted adult now. Do not touch, smell, open or test it.",
    rule: "Damaged electrical parts, swollen batteries, sharp edges, broken glass, heat and chemicals need an adult."
  }
});

export const ACTION_CHOICES = Object.freeze([
  { value: "stop-and-tell", label: "Stop and tell a trusted adult", icon: "🙋" },
  { value: "look-only", label: "Keep looking without touching it", icon: "👀" },
  { value: "try-it", label: "Try to make it work myself", icon: "🛠️" },
  { value: "no-warning", label: "I cannot see a warning sign", icon: "✅" },
  { value: "not-sure", label: "I’m not sure", icon: "💭" }
]);

export const COMPARISON_CHOICES = Object.freeze([
  { value: "loose-wheel", label: "The toy with a loose wheel", icon: "🚗" },
  { value: "damaged-cable", label: "The item with a damaged cable", icon: "🔌" },
  { value: "not-sure", label: "I’m not sure", icon: "💭" }
]);

const ELECTRICAL = new Set(["cable-damaged", "battery-odd", "gets-hot", "screen-cracked"]);
const SHARP = new Set(["cracked", "screen-cracked"]);
const LOW_RISK = new Set([
  "stain", "stained", "scratched", "pieces-missing", "rules-gone", "too-small",
  "wheel-off", "wheel-stuck", "button-stuck", "bobbled", "laces-gone"
]);

function labelsFor(record) {
  const offered = problemsFor(record.itemId);
  return record.problems.map(id => offered.find(problem => problem.id === id)?.label || id);
}

function warningFrom(record, reasoning) {
  const ids = new Set(record.problems || []);
  const item = findItem(record.itemId);
  const labels = labelsFor(record);

  if (ids.has("battery-odd")) {
    return {
      id: "swollen-battery",
      icon: "🔋",
      title: "The battery area has changed shape",
      clue: "A swollen or changed battery can become hot or leak.",
      explanation: "A changed battery needs space and an adult. Do not press it, charge it or open the item.",
      severity: "serious"
    };
  }
  if (ids.has("cable-damaged") || ids.has("gets-hot")) {
    return {
      id: "damaged-electrical-part",
      icon: "⚡",
      title: ids.has("gets-hot") ? "An electrical part is getting hot" : "The cable cover looks damaged",
      clue: ids.has("gets-hot")
        ? "Unexpected heat can be a warning that electricity is not moving safely."
        : "A split cable cover may expose an electrical part.",
      explanation: "Damaged or hot electrical parts must not be plugged in, touched or tested by a child.",
      severity: "serious"
    };
  }
  if (ids.has("screen-cracked")) {
    return {
      id: "broken-glass",
      icon: "📱",
      title: "The screen has cracked glass",
      clue: "Cracked glass can have edges that cut even when they are hard to see.",
      explanation: "Put the item down without pressing the crack and tell a trusted adult.",
      severity: "serious"
    };
  }
  if (reasoning.dangerFlag || [...ids].some(id => SHARP.has(id))) {
    return {
      id: "sharp-or-leaking",
      icon: "⚠️",
      title: "There may be a sharp, cracked or leaking part",
      clue: "A sharp edge or leaking material can hurt skin.",
      explanation: "Do not touch the damaged place. Move away and ask a trusted adult to look.",
      severity: "serious"
    };
  }
  if (ids.has("no-problem")) {
    return {
      id: "no-visible-problem",
      icon: item?.icon || "✅",
      title: `No problem was noticed on the ${item?.name || "item"}`,
      clue: "No visible damage or warning sign was selected.",
      explanation: "It is okay to stop here. Keep an adult nearby and stop if you notice anything new.",
      severity: "lower"
    };
  }
  if (reasoning.lowInformation || ids.has("not-sure") || !item) {
    return {
      id: "uncertain-item",
      icon: "🔎",
      title: "There is not enough information yet",
      clue: "When a warning sign is unclear, stopping and asking is the safe next step.",
      explanation: "You do not need to test the item to find out. Ask a trusted adult.",
      severity: "uncertain"
    };
  }
  if ([...ids].every(id => LOW_RISK.has(id))) {
    return {
      id: "ordinary-damage",
      icon: item.icon || "📦",
      title: `The ${item.name} has an ordinary visible problem`,
      clue: labels[0] || "The problem is small and easy to see from the outside.",
      explanation: "You may keep looking from the outside. Stop if you notice heat, a smell, liquid, glass or a sharp edge.",
      severity: "lower"
    };
  }
  return {
    id: "adult-check",
    icon: item?.icon || "📦",
    title: `The ${item?.name || "item"} needs a careful check`,
    clue: labels[0] || "The problem needs another pair of eyes.",
    explanation: "Ask a trusted adult before handling, repairing or testing it.",
    severity: "uncertain"
  };
}

export function safetyActivity(record) {
  const reasoning = reason({ problems: record?.problems, answers: record?.answers });
  const warning = warningFrom(record || {}, reasoning);
  return {
    ok: true,
    immediateStop: warning.severity === "serious",
    warning,
    question: "What would you do first?",
    choices: ACTION_CHOICES
  };
}

function baseBoundary(record) {
  const activity = safetyActivity(record);
  if (activity.warning.severity === "serious") return BOUNDARIES.STOP;
  if (activity.warning.severity === "uncertain") return BOUNDARIES.ADULT;
  return BOUNDARIES.SAFE;
}

export function boundaryFor(record) {
  let boundary = baseBoundary(record);
  // A child saying that no warning is visible can confirm a lower-risk case,
  // but it can never weaken a serious server-derived warning.
  if (record?.safetyResponse === "no-warning" && boundary !== BOUNDARIES.STOP) {
    boundary = BOUNDARIES.SAFE;
  }
  if (record?.safetyResponse === "not-sure") boundary = moreRestrictive(boundary, BOUNDARIES.ADULT);
  if (record?.comparisonResponse === "damaged-cable" || record?.comparisonResponse === "not-sure") {
    boundary = moreRestrictive(boundary, BOUNDARIES.ADULT);
  }
  return boundary;
}

export function moreRestrictive(a, b) {
  return BOUNDARY_DETAILS[a].rank >= BOUNDARY_DETAILS[b].rank ? a : b;
}

export function sanitiseSafetyResponse(value) {
  return ACTION_CHOICES.some(choice => choice.value === value) ? value : null;
}

export function sanitiseComparisonResponse(value) {
  return COMPARISON_CHOICES.some(choice => choice.value === value) ? value : null;
}

export function safetyReveal(record) {
  if (!record?.safetyResponse) {
    return { ok: false, message: "Choose what you would do first." };
  }
  const activity = safetyActivity(record);
  const boundary = boundaryFor(record);
  return {
    ok: true,
    response: record.safetyResponse,
    warning: activity.warning,
    boundary,
    boundaryDetails: BOUNDARY_DETAILS[boundary],
    responseNote: record.safetyResponse === "not-sure"
      ? "It is okay not to know. Asking an adult is a safe choice."
      : record.safetyResponse === "stop-and-tell"
        ? "You chose to stop and get help. That keeps the warning sign away from you."
        : "The important part is the safe next step. Your first idea is not given a score."
  };
}

export function comparisonActivity() {
  return {
    ok: true,
    question: "Which situation may be reasonable for a child to look at from the outside?",
    situations: [
      { id: "loose-wheel", icon: "🚗", title: "A loose toy wheel", detail: "No battery, heat, glass, liquid or sharp edge is visible." },
      { id: "damaged-cable", icon: "🔌", title: "A damaged electrical cable", detail: "The outside cover is split." }
    ],
    choices: COMPARISON_CHOICES
  };
}

export function finalSafetyResult(record) {
  if (!record?.safetyResponse || !record?.comparisonResponse) {
    return { ok: false, message: "Complete both safety activities first." };
  }
  const activity = safetyActivity(record);
  const boundary = boundaryFor(record);
  const details = BOUNDARY_DETAILS[boundary];
  return {
    ok: true,
    boundary,
    label: details.label,
    icon: details.icon,
    instruction: details.instruction,
    rule: details.rule,
    warning: activity.warning,
    comparisonExplanation:
      "A loose toy wheel can be looked at from the outside. A damaged cable needs an adult because electricity can hurt before a problem is easy to see.",
    pathways: {
      childLed: boundary === BOUNDARIES.SAFE,
      adultRequired: boundary !== BOUNDARIES.SAFE,
      repairInstructionsBlocked: boundary === BOUNDARIES.STOP
    }
  };
}
