// Epic 5 — small, explainable simulations of what may happen after a child
// chooses a future. These are educational pathways, never live tracking.

const CATEGORY_DESTINATIONS = Object.freeze({
  clothes: "a clothing reuse or textile service",
  electronics: "an approved e-waste collection service",
  furniture: "a local reuse, repair or material service",
  toys: "a local reuse, repair or material service",
  school: "a local reuse, repair or material service",
  household: "the service that accepts this item's materials"
});

const OUTCOMES = Object.freeze({
  keep: {
    icon: "🌱",
    title: "It keeps doing its job",
    consequence: "The whole item and its original purpose stay in use.",
    stages: [
      ["🏠", "Back into everyday use", item => `The ${item} returns to the place where it is normally used.`],
      ["👀", "Check it as you use it", item => `Keep noticing whether the ${item} still works and looks safe.`],
      ["🔁", "Useful for longer", item => `Careful use may help the ${item} stay useful for longer.`]
    ]
  },
  repair: {
    icon: "🧵",
    title: "A fix may keep it in use",
    consequence: "Most of the item may stay in use while the damaged part is fixed or replaced.",
    stages: [
      ["🙋", "Ask a trusted adult", item => `Show the ${item} and what you noticed without opening or testing it.`],
      ["🔎", "Check the repair safely", item => `A trusted adult can decide whether a safe repair or repair service is suitable.`],
      ["🛠️", "Repair the damaged part", item => `If it can be repaired, only the part that needs attention may change.`],
      ["🌱", "Use it again", item => `The ${item} may return to use instead of becoming waste now.`]
    ]
  },
  reuse: {
    icon: "🎨",
    title: "It gets a different job",
    consequence: "The item and most of its materials stay in use, but its original purpose changes.",
    stages: [
      ["💭", "Choose a safe new purpose", item => `Think of a simple new job for the ${item} and check the idea with an adult.`],
      ["🧼", "Get it ready", item => `Clean or prepare the ${item} only in a way the safety boundary allows.`],
      ["✨", "Begin its new job", item => `The ${item} can be used in a different way at home.`],
      ["🔁", "Keep materials useful", item => `Reusing it may delay the day when its materials become waste.`]
    ]
  },
  donate: {
    icon: "🤝",
    title: "Someone else may use it",
    consequence: "The item, its purpose and its useful life may continue with another person.",
    stages: [
      ["🙋", "Check it with a trusted adult", item => `Together, check that the ${item} is clean, complete and suitable to pass on.`],
      ["📦", "Choose where it could go", item => `A trusted adult can contact a friend, community group or donation service first.`],
      ["✅", "The receiver checks it", item => `The receiver decides whether they can accept and use the ${item}.`],
      ["🤝", "A possible new home", item => `If it is accepted, someone else may keep using the ${item}.`]
    ]
  },
  recycle: {
    icon: "♻️",
    title: "Some materials may be recovered",
    consequence: "The original item stops being used, but suitable materials may become resources for something new.",
    stages: [
      ["🙋", "Find the right service", (item, context) => `A trusted adult checks whether ${context.destination} accepts the ${item}.`],
      ["📍", "Take it to the approved place", item => `Follow the service instructions for the whole ${item}; do not open or dismantle it.`],
      ["🏭", "Materials are sorted", item => `The service may separate useful materials from the ${item} using its own safe process.`],
      ["♻️", "A possible next material life", item => `Accepted materials may be used in new products, while unsuitable parts may still be disposed of.`]
    ]
  }
});

function cleanText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function allowedByBoundary(futureId, boundary) {
  if (boundary === "do-not-touch") return futureId === "repair" || futureId === "recycle";
  if (boundary === "ask-an-adult") return futureId !== "donate";
  return boundary === "safe-to-try";
}

export function journeyFor({ item, problems = [], boundary, boundaryLabel, future } = {}) {
  if (!item || !future || !OUTCOMES[future.id] || !allowedByBoundary(future.id, boundary)) return null;
  const itemName = cleanText(item.name, "item");
  const pattern = OUTCOMES[future.id];
  const context = {
    destination: CATEGORY_DESTINATIONS[item.category] || CATEGORY_DESTINATIONS.household
  };
  const noticed = problems
    .map(problem => cleanText(problem?.label, ""))
    .filter(Boolean)
    .join(", ") || "No clear problem was noticed";

  return {
    id: future.id,
    icon: pattern.icon,
    title: pattern.title,
    itemName,
    noticed,
    boundary: cleanText(boundaryLabel, boundary),
    consequence: pattern.consequence,
    steps: pattern.stages.map(([icon, title, describe], index) => ({
      number: index + 1,
      icon,
      title,
      text: describe(itemName, context)
    })),
    uncertainty: future.id === "donate"
      ? "Donation services decide what they can accept. Call or check first, because acceptance is not guaranteed."
      : future.id === "recycle"
        ? "Collection services differ across regional Victoria. The service decides what it can recover, so this outcome is possible rather than guaranteed."
        : "This is one likely pathway. The item's condition and the help available may change what happens next."
  };
}

export function journeyChange(previousFuture, nextFuture, itemName = "item") {
  if (!previousFuture || !nextFuture || previousFuture.id === nextFuture.id) return null;
  const change = {
    keep: `The ${itemName} now keeps its original job and stays at home.`,
    repair: `The ${itemName} now needs a trusted adult to check whether a repair can keep it in use.`,
    reuse: `The ${itemName} now stays in use with a different purpose.`,
    donate: `The ${itemName} may now keep its original purpose with someone else.`,
    recycle: `The ${itemName} now loses its original purpose so suitable materials may be recovered.`
  }[nextFuture.id];
  return `Changed from ${previousFuture.label} to ${nextFuture.label}. ${change}`;
}

export const JOURNEY_FUTURE_IDS = Object.freeze(Object.keys(OUTCOMES));
