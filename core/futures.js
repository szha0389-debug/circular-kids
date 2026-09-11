const DETAILS = {
  keep: { label: "Keep Using", icon: "🌱", description: "Keep the item doing the job it already does.", preserves: "The whole item and its original purpose.", changes: "Nothing, unless an adult says a small change is needed.", loses: "Nothing right now." },
  repair: { label: "Repair", icon: "🧵", description: "Fix the damaged part so the item may work for longer.", preserves: "Most of the item and the materials already used.", changes: "The damaged part may be fixed or replaced.", loses: "The old damaged part may no longer be used." },
  reuse: { label: "Reuse", icon: "🎨", description: "Give the item a different, safe purpose.", preserves: "The item and most of its materials.", changes: "What the item is used for.", loses: "Its original job may not continue." },
  donate: { label: "Donate", icon: "🤝", description: "Pass a usable item to someone who needs it.", preserves: "The item, its purpose and its useful life.", changes: "Who owns and uses it.", loses: "You will no longer have the item." },
  recycle: { label: "Recycle", icon: "♻️", description: "Let suitable materials be collected for another use.", preserves: "Some materials may stay in use.", changes: "The item is separated into materials.", loses: "The item and its original purpose." }
};

function nextStep(id, itemName, adultRequired) {
  if (adultRequired) return `Show the ${itemName} to a trusted adult and explore the ${DETAILS[id].label.toLowerCase()} option together.`;
  return {
    keep: `Put the ${itemName} back where it belongs and keep using it carefully.`,
    repair: `Ask your grandparent whether the damaged part can be repaired.`,
    reuse: `Write down one safe new purpose for the ${itemName} and check it with an adult.`,
    donate: `Ask your grandparent to help check whether the ${itemName} is ready to donate.`,
    recycle: `Ask your grandparent to find the correct local recycling option.`
  }[id];
}

export function suitableFutures({ item, problems = [], boundary }) {
  if (!item || !boundary) return [];
  const hasProblem = !problems.some(problem => problem.id === "no-problem") && problems.length > 0;
  let ids = hasProblem ? ["repair", "reuse", "donate", "recycle"] : ["keep", "reuse", "donate", "recycle"];
  if (boundary === "ask-an-adult") ids = hasProblem ? ["repair", "reuse", "recycle"] : ["keep", "reuse", "recycle"];
  if (boundary === "do-not-touch") ids = ["repair", "recycle"];

  return ids.map(id => {
    const adultRequired = boundary !== "safe-to-try" || id === "repair" || id === "recycle";
    return {
      id,
      ...DETAILS[id],
      adultRequired,
      nextStep: nextStep(id, item.name, adultRequired),
      reason: `${DETAILS[id].label} may make sense because ${hasProblem ? `the ${item.name} has a problem, but some of it may still have value` : `no clear problem was found on the ${item.name}`}.`
    };
  });
}

export function futureContext(store) {
  const problems = (store.problemOptions || []).filter(option => store.problems.includes(option.id));
  if (store.problems.includes("no-problem")) problems.push({ id: "no-problem", label: "No problem noticed" });
  if (store.problems.includes("not-sure")) problems.push({ id: "not-sure", label: "Not sure" });
  return { item: store.item, problems, boundary: store.safetyResult?.boundary || store.safetyResult?.safetyBoundary };
}
