// Clue questions for US-1.3.
//
// Hard rules from the story:
//   - never more than three questions
//   - every question is answered by tapping; nothing requires typing
//   - every question can be skipped
//   - questions are relevant to this item and this suspected problem
//   - the site gives no reaction to an answer (enforced in the UI, not here)
//
// `weight` records how degraded an answer looks, 0 (sound) to 2 (badly gone).
// It feeds the reveal in core/reasoning.js and is never shown to the child.
// `danger` marks an observation Epic 2 must see. Epic 1 records it and stays
// silent about it — this epic reports, E2 warns.

export const MAX_QUESTIONS = 3;

/** Answer recorded when a child uses the skip control. */
export const SKIPPED = "skipped";

const ASK_SHAPE = {
  id: "shape",
  text: "Does it still hold its usual shape?",
  options: [
    { value: "yes", label: "Yes", weight: 0 },
    { value: "a-little", label: "A little changed", weight: 1 },
    { value: "very", label: "Very changed", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_SPREAD = {
  id: "spread",
  text: "Is the problem only in one small area?",
  options: [
    { value: "one-area", label: "Just one small area", weight: 0 },
    { value: "few-areas", label: "A few areas", weight: 1 },
    { value: "all-over", label: "All over", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_SAFETY_SIGNS = {
  id: "safety-signs",
  text: "Can you see any cracks, sharp edges or leaking liquid?",
  options: [
    { value: "none", label: "None", weight: 0 },
    { value: "one", label: "One of those", weight: 2, danger: true },
    { value: "several", label: "More than one", weight: 2, danger: true },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_STILL_WORKS = {
  id: "still-works",
  text: "Does any part of it still do its job?",
  options: [
    { value: "all", label: "Yes, all of it", weight: 0 },
    { value: "some", label: "Some of it", weight: 1 },
    { value: "none", label: "None of it", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_CRACK_SIZE = {
  id: "crack-size",
  text: "How big does the crack look?",
  options: [
    { value: "none", label: "I cannot see one", weight: 0 },
    { value: "small", label: "A small one", weight: 1 },
    { value: "big", label: "A big one", weight: 2, danger: true },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_HOLE_SIZE = {
  id: "hole-size",
  text: "How big does the hole look?",
  options: [
    { value: "tiny", label: "Tiny", weight: 0 },
    { value: "finger", label: "About a finger wide", weight: 1 },
    { value: "larger", label: "Larger than that", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_FABRIC_STRENGTH = {
  id: "fabric-strength",
  text: "Does the fabric around it still feel strong?",
  options: [
    { value: "strong", label: "Still strong", weight: 0 },
    { value: "thin", label: "A little thin", weight: 1 },
    { value: "very-thin", label: "Very thin", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_STAIN_AREA = {
  id: "stain-area",
  text: "How much does the mark cover?",
  options: [
    { value: "small", label: "A small patch", weight: 0 },
    { value: "medium", label: "A fair amount", weight: 1 },
    { value: "most", label: "Most of it", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_WASHED = {
  id: "washed",
  text: "Has it been washed since the mark appeared?",
  options: [
    { value: "not-yet", label: "Not yet", weight: 0 },
    { value: "once", label: "Once", weight: 1 },
    { value: "many", label: "Several times", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_CABLE_COVER = {
  id: "cable-cover",
  text: "Can you see a split in the cable cover?",
  options: [
    { value: "none", label: "No split", weight: 0 },
    { value: "small", label: "A small split", weight: 1, danger: true },
    { value: "large", label: "A large split", weight: 2, danger: true },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_WIRE_VISIBLE = {
  id: "wire-visible",
  text: "Can you see any wire inside the cover?",
  options: [
    { value: "no", label: "No", weight: 0 },
    { value: "yes", label: "Yes", weight: 2, danger: true },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_BATTERY_SHAPE = {
  id: "battery-shape",
  text: "Does the battery area look swollen or changed in shape?",
  options: [
    { value: "no", label: "No", weight: 0 },
    { value: "yes", label: "Yes", weight: 2, danger: true },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_LEAK = {
  id: "leak",
  text: "Can you see any liquid or powder around it?",
  options: [
    { value: "no", label: "No", weight: 0 },
    { value: "yes", label: "Yes", weight: 2, danger: true },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_CHARGE_AREA = {
  id: "charge-area",
  text: "Does the charging area look normal?",
  options: [
    { value: "normal", label: "Looks normal", weight: 0 },
    { value: "dusty", label: "Dusty or blocked", weight: 1 },
    { value: "damaged", label: "Looks damaged", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_ZIP_TEETH = {
  id: "zip-teeth",
  text: "Can you see any missing zip teeth?",
  options: [
    { value: "none", label: "None missing", weight: 0 },
    { value: "few", label: "One or two", weight: 1 },
    { value: "several", label: "Several", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_ZIP_ALIGNED = {
  id: "zip-aligned",
  text: "Do the two sides of the zip line up?",
  options: [
    { value: "yes", label: "Yes", weight: 0 },
    { value: "no", label: "No", weight: 1 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_STITCHING = {
  id: "stitching",
  text: "Is the stitching around it still holding?",
  options: [
    { value: "holding", label: "Still holding", weight: 0 },
    { value: "loose", label: "Coming loose", weight: 1 },
    { value: "gone", label: "Come apart", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_PIECE_PRESENT = {
  id: "piece-present",
  text: "Do you still have the missing piece somewhere?",
  options: [
    { value: "yes", label: "Yes", weight: 0 },
    { value: "maybe", label: "Maybe, somewhere", weight: 1 },
    { value: "no", label: "No", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_WOBBLE = {
  id: "wobble",
  text: "Does it wobble when it is standing still?",
  options: [
    { value: "no", label: "No", weight: 0 },
    { value: "slight", label: "A little", weight: 1 },
    { value: "lots", label: "A lot", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

const ASK_FIT = {
  id: "fit",
  text: "Would it fit someone smaller than you?",
  options: [
    { value: "yes", label: "Yes", weight: 0 },
    { value: "maybe", label: "Maybe", weight: 1 },
    { value: "no", label: "No", weight: 2 },
    { value: "not-sure", label: "Not sure", weight: null }
  ]
};

/**
 * Candidate questions per problem id, most specific first. Problem ids repeat
 * across items on purpose — "hole" means the same thing on a T-shirt and a
 * backpack, so the same clues apply.
 */
const BY_PROBLEM = {
  "no-sound": [ASK_CRACK_SIZE, ASK_CHARGE_AREA],
  "one-side": [ASK_CABLE_COVER, ASK_CHARGE_AREA],
  "cable-damaged": [ASK_CABLE_COVER, ASK_WIRE_VISIBLE],
  "will-not-charge": [ASK_CHARGE_AREA, ASK_BATTERY_SHAPE],
  "battery-odd": [ASK_BATTERY_SHAPE, ASK_LEAK],
  "battery-short": [ASK_BATTERY_SHAPE, ASK_CHARGE_AREA],
  "no-power": [ASK_CHARGE_AREA, ASK_BATTERY_SHAPE],
  "gets-hot": [ASK_CABLE_COVER, ASK_LEAK],
  "screen-cracked": [ASK_CRACK_SIZE, ASK_STILL_WORKS],
  "cracked": [ASK_CRACK_SIZE, ASK_SPREAD],
  "chipped": [ASK_CRACK_SIZE, ASK_STILL_WORKS],
  "cushion-worn": [ASK_SPREAD, ASK_STILL_WORKS],
  "button-stuck": [ASK_STILL_WORKS, ASK_SPREAD],
  "plug-loose": [ASK_CABLE_COVER, ASK_STILL_WORKS],
  "slow": [ASK_STILL_WORKS, ASK_SPREAD],
  "no-light": [ASK_CABLE_COVER, ASK_STILL_WORKS],
  "switch-broken": [ASK_STILL_WORKS, ASK_CABLE_COVER],

  "hole": [ASK_HOLE_SIZE, ASK_FABRIC_STRENGTH],
  "thin": [ASK_FABRIC_STRENGTH, ASK_SPREAD],
  "fabric-torn": [ASK_HOLE_SIZE, ASK_FABRIC_STRENGTH],
  "stain": [ASK_STAIN_AREA, ASK_WASHED],
  "stained": [ASK_STAIN_AREA, ASK_WASHED],
  "seam-open": [ASK_STITCHING, ASK_SPREAD],
  "lining-torn": [ASK_HOLE_SIZE, ASK_STITCHING],
  "pocket-hole": [ASK_HOLE_SIZE, ASK_FABRIC_STRENGTH],
  "bobbled": [ASK_SPREAD, ASK_FABRIC_STRENGTH],
  "rough": [ASK_WASHED, ASK_SPREAD],
  "shape-changed": [ASK_SHAPE, ASK_FIT],
  "too-small": [ASK_FIT, ASK_FABRIC_STRENGTH],
  "base-worn": [ASK_HOLE_SIZE, ASK_FABRIC_STRENGTH],

  "zip-stuck": [ASK_ZIP_ALIGNED, ASK_ZIP_TEETH],
  "strap-loose": [ASK_STITCHING, ASK_SPREAD],
  "sole-loose": [ASK_STITCHING, ASK_SPREAD],
  "sole-worn": [ASK_SPREAD, ASK_STILL_WORKS],
  "laces-gone": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "handle-broken": [ASK_CRACK_SIZE, ASK_STILL_WORKS],
  "clip-broken": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "cap-broken": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "lid-lost": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "leaks": [ASK_LEAK, ASK_STILL_WORKS],
  "spout-worn": [ASK_SPREAD, ASK_STILL_WORKS],
  "pieces-missing": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "rules-gone": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "box-torn": [ASK_HOLE_SIZE, ASK_SPREAD],
  "board-bent": [ASK_SHAPE, ASK_STILL_WORKS],
  "piece-loose": [ASK_STITCHING, ASK_PIECE_PRESENT],
  "squashed": [ASK_SHAPE, ASK_WASHED],

  "wobbly": [ASK_WOBBLE, ASK_STILL_WORKS],
  "leg-broken": [ASK_CRACK_SIZE, ASK_WOBBLE],
  "seat-torn": [ASK_HOLE_SIZE, ASK_FABRIC_STRENGTH],
  "scratched": [ASK_SPREAD, ASK_STILL_WORKS],
  "top-marked": [ASK_SPREAD, ASK_STILL_WORKS],
  "drawer-stuck": [ASK_SHAPE, ASK_STILL_WORKS],
  "swollen": [ASK_SHAPE, ASK_SPREAD],
  "sagging": [ASK_SHAPE, ASK_STILL_WORKS],
  "back-loose": [ASK_STITCHING, ASK_WOBBLE],
  "shade-torn": [ASK_HOLE_SIZE, ASK_SPREAD],
  "wheel-off": [ASK_PIECE_PRESENT, ASK_STILL_WORKS],
  "wheel-stuck": [ASK_STILL_WORKS, ASK_SHAPE],
  "no-move": [ASK_STILL_WORKS, ASK_SHAPE],
  "damaged": [ASK_CRACK_SIZE, ASK_SPREAD],
  "not-working": [ASK_STILL_WORKS, ASK_SPREAD]
};

/**
 * Asked when the child chose "Not sure", or when a problem carries no specific
 * clues. These are general condition questions, never leading ones.
 */
const GENERAL_QUESTIONS = [ASK_SHAPE, ASK_SAFETY_SIGNS, ASK_STILL_WORKS];

/**
 * Pick at most MAX_QUESTIONS clues for the chosen problems.
 *
 * Problems may be multi-select (US-1.2), so we take the most specific question
 * for each chosen problem in order, then top up from that problem's second
 * choice, then from the general set. Duplicates are dropped by question id.
 */
export function questionsFor(problemIds = []) {
  const chosen = [];
  const seen = new Set();

  const take = question => {
    if (!question || seen.has(question.id) || chosen.length >= MAX_QUESTIONS) return;
    seen.add(question.id);
    chosen.push(question);
  };

  const ids = Array.isArray(problemIds) ? problemIds.filter(Boolean) : [];
  const specific = ids.map(id => BY_PROBLEM[id]).filter(Boolean);

  // One pass per rank, so two chosen problems each contribute before either
  // contributes twice.
  for (let rank = 0; rank < 2; rank += 1) {
    for (const list of specific) take(list[rank]);
  }
  for (const question of GENERAL_QUESTIONS) take(question);

  return chosen.slice(0, MAX_QUESTIONS).map(question => ({
    ...question,
    options: question.options.some(option => option.value === "no-problem")
      ? question.options
      : [...question.options, { value: "no-problem", label: "I cannot see a problem", weight: 0 }]
  }));
}

export function findOption(question, value) {
  if (!question) return null;
  return question.options.find(option => option.value === value) || null;
}
