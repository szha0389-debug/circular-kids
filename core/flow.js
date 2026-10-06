// The guided journey, as one list.
//
// Every screen the child can reach with an open case belongs to exactly one
// stage and one step inside it. The left-hand progress menu reads this file, so
// the menu, the stage cards on the welcome screen and the router gates all
// describe the same journey instead of three hand-maintained copies of it.
//
// A step declares two things about the case, by name:
//   `done`  — the flag that is true once this step has been finished
//   `needs` — the flag that must be true before the step can be opened
// Both are keys into the plain object `flowProgress` is given, so this file
// stays free of Pinia, of the router and of the browser.

export const FLOW_STAGES = Object.freeze([
  {
    id: "investigate",
    icon: "🔎",
    title: "Investigate my item",
    accent: "coral",
    steps: [
      { id: "identify", label: "Show my item", route: "identify", done: "itemChosen" },
      { id: "problem", label: "Spot the problem", route: "problem", done: "problemsChosen", needs: "itemChosen" },
      { id: "clues", label: "Follow the clues", route: "clues", done: "cluesAnswered", needs: "problemsChosen" },
      { id: "verdict", label: "Give my verdict", route: "verdict", done: "verdictRecorded", needs: "problemsChosen" },
      { id: "reveal", label: "My findings", route: "reveal", done: "investigationDone", needs: "verdictRecorded" }
    ]
  },
  {
    id: "safety",
    icon: "🛡️",
    title: "Check what is safe",
    accent: "yellow",
    steps: [
      { id: "safety-activity", label: "Spot the warning sign", route: "safety-activity", done: "safetyAnswered", needs: "investigationDone" },
      { id: "safety-comparison", label: "Compare two situations", route: "safety-comparison", done: "comparisonAnswered", needs: "safetyAnswered" },
      { id: "safety-boundary", label: "My safety boundary", route: "safety-boundary", done: "safetyBoundarySet", needs: "comparisonAnswered" }
    ]
  },
  {
    id: "futures",
    icon: "🌱",
    title: "Choose a future",
    accent: "green",
    steps: [
      { id: "futures-compare", label: "Compare the options", route: "futures-explore", done: "futureSelected", needs: "safetyBoundarySet" },
      { id: "futures-result", label: "My choice", route: "futures-result", done: "futureSelected", needs: "futureSelected" }
    ]
  },
  {
    id: "journey",
    icon: "🗺️",
    title: "Follow the journey",
    accent: "blue",
    steps: [
      { id: "item-journey", label: "What happens next", route: "item-journey", done: "journeySeen", needs: "futureSelected" },
      {
        id: "journey-replay",
        label: "Replay another future",
        route: "futures-compare",
        query: { returnTo: "journey" },
        done: "journeyReplayed",
        needs: "journeySeen"
      }
    ]
  },
  {
    id: "shelf",
    icon: "🪴",
    title: "My rescue shelf",
    accent: "purple",
    steps: [
      // Epic 6 is on-device, so it is never locked behind the rest of the case.
      { id: "rescue-shelf", label: "Open my shelf", route: "rescue-shelf", done: "shelfUsed" }
    ]
  }
]);

/** The step a route belongs to, or null for a screen outside the journey. */
export function stepForRoute(routeName) {
  for (const stage of FLOW_STAGES) {
    for (const step of stage.steps) {
      if (step.route === routeName) return { stage, step };
    }
  }
  return null;
}

/**
 * The journey, marked up for display.
 *
 * `state` carries one boolean per flag named in FLOW_STAGES. A missing flag
 * counts as false, so a caller that knows nothing about, say, the shelf simply
 * sees that stage as unfinished rather than crashing.
 */
export function flowProgress(state = {}, currentStepId = null) {
  return FLOW_STAGES.map(stage => {
    const steps = stage.steps.map(step => ({
      ...step,
      done: Boolean(state[step.done]),
      // A step with no `needs` is always open; one whose flag is set can be
      // revisited, which is what makes the menu a way to move around and not
      // just a picture of where the child has been.
      open: !step.needs || Boolean(state[step.needs]),
      current: step.id === currentStepId
    }));

    return {
      ...stage,
      steps,
      done: steps.every(step => step.done),
      open: steps.some(step => step.open),
      current: steps.some(step => step.current),
      doneCount: steps.filter(step => step.done).length
    };
  });
}

/** How far through the whole journey the child is, as a percentage. */
export function flowCompletion(stages) {
  const steps = stages.flatMap(stage => stage.steps);
  if (!steps.length) return 0;
  return Math.round((steps.filter(step => step.done).length / steps.length) * 100);
}

// ── What depends on what ────────────────────────────────────────────────────
//
// The case is a chain of answers, and almost nothing on screen is an answer:
// the reasoning, the findings, the warning, the safety boundary and the list of
// possible futures are all worked out from the answers before them.
//
// Going back and changing an earlier answer used to take several taps through
// the Back buttons, and from the safety or futures screens it was not possible
// at all. The journey menu puts every earlier step one tap away from anywhere,
// so it is now an ordinary thing to do — which means a result that outlives the
// answer it was worked out from is no longer an unlikely path. A boundary of
// "Ask an adult" still on screen after the child has just said the cable cover
// is split would be the worst kind of wrong.
//
// Each entry reads "this is worked out from that". It is a graph and not a
// line, because the verdict is a leaf: the safety warning is worked out from
// the clues, not from what the child concluded about them.
export const DEPENDS_ON = Object.freeze({
  problems: "item",
  answers: "problems",
  verdict: "answers",
  reveal: "verdict",
  safetyResponse: "answers",
  comparisonResponse: "safetyResponse",
  boundary: "comparisonResponse",
  future: "boundary",
  journey: "future"
});

/**
 * Everything that stops being true when `answer` changes, nearest first.
 *
 * Returns an empty list for an answer nothing is worked out from, and for a
 * name that is not part of the case at all.
 */
export function invalidatedBy(answer) {
  const stale = [];
  const queue = [answer];
  while (queue.length) {
    const current = queue.shift();
    for (const [name, source] of Object.entries(DEPENDS_ON)) {
      if (source !== current || stale.includes(name)) continue;
      stale.push(name);
      queue.push(name);
    }
  }
  return stale;
}
