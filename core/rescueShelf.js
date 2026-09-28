// Epic 6 — privacy-minimal Rescue Shelf records. The allow-list in
// sanitiseRecord is the contract: photos, free text and unrelated case data are
// never retained even if a caller accidentally supplies them.

export const RESCUE_OUTCOMES = Object.freeze([
  { id: "still-using", label: "Still using it" },
  { id: "fixed-with-adult", label: "Fixed it with a trusted adult" },
  { id: "reused-at-home", label: "Reused it at home" },
  { id: "gave-away", label: "Gave it to someone else" },
  { id: "donated", label: "Donated it" },
  { id: "recycled", label: "Recycled it" },
  { id: "disposed", label: "Eventually disposed of it" },
  { id: "not-decided", label: "Not decided yet" },
  { id: "something-else", label: "Something else happened" }
]);

const OUTCOME_IDS = new Set(RESCUE_OUTCOMES.map(outcome => outcome.id));

function text(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 240) : fallback;
}

export function sanitiseRecord(input = {}) {
  if (!input || typeof input !== "object") return null;
  const id = text(input.id, "");
  const itemName = text(input.itemName, "");
  if (!id || !itemName) return null;
  return {
    id,
    itemName,
    noticedProblem: text(input.noticedProblem, "No clear problem noticed"),
    safetyBoundary: text(input.safetyBoundary, "Safety boundary not available"),
    chosenFuture: text(input.chosenFuture, "Future not recorded"),
    outcome: OUTCOME_IDS.has(input.outcome) ? input.outcome : "not-decided"
  };
}

export function sanitiseShelf(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map(sanitiseRecord)
    .filter(record => record && !seen.has(record.id) && seen.add(record.id));
}

export function createRescueRecord({ id, item, problems = [], boundary, future } = {}) {
  const boundaryValue = boundary?.label || boundary?.boundary || boundary;
  if (!item?.name || !boundaryValue || !future?.label) return null;
  const noticedProblem = problems
    .map(problem => text(problem?.label, ""))
    .filter(Boolean)
    .join(", ") || "No clear problem noticed";
  return sanitiseRecord({
    id,
    itemName: item?.name,
    noticedProblem,
    safetyBoundary: boundaryValue,
    chosenFuture: future?.label,
    outcome: "not-decided"
  });
}

export function outcomeLabel(id) {
  return RESCUE_OUTCOMES.find(outcome => outcome.id === id)?.label || "Not decided yet";
}

export function storyFor(record) {
  const clean = sanitiseRecord(record);
  if (!clean) return "";
  return `${clean.itemName} — ${clean.noticedProblem} — chose ${clean.chosenFuture} — ${outcomeLabel(clean.outcome).toLowerCase()}.`;
}

export function groupForOutcome(outcome) {
  if (outcome === "fixed-with-adult") return "Repaired with adult help";
  if (outcome === "still-using") return "Still being used";
  if (outcome === "reused-at-home") return "Reused at home";
  if (outcome === "gave-away" || outcome === "donated") return "Given to someone else";
  if (outcome === "recycled") return "Recycled";
  return "Waiting for an update";
}

export function groupShelf(records) {
  const groups = new Map();
  for (const record of sanitiseShelf(records)) {
    const label = groupForOutcome(record.outcome);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(record);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}
