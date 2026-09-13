// Epic 4 — Circular Mystery Challenges.
//
// Only the picture half of the epic is built: the child looks at an illustrated
// scene and taps the part that shows the problem. The action-and-reason choices
// from US4.2 are deliberately left out.
//
// Every scene is drawn in a 520 × 320 box. Targets and areas use that same
// coordinate space as [x, y, width, height], so the check never depends on how
// large the picture is rendered on screen.

export const SCENE_WIDTH = 520;
export const SCENE_HEIGHT = 320;

// AC4.1.2: a near-correct tap is accepted. This is how far outside the target a
// tap may land and still count, in scene units.
export const TAP_TOLERANCE = 18;

export const MYSTERIES = Object.freeze([
  {
    id: "bottle-bin",
    category: "Recycling",
    icon: "♻️",
    title: "The bottle and the two bins",
    prompt: "Something is about to go into the wrong bin. Can you find it?",
    hints: [
      "Read the labels on the two bins.",
      "Follow the thing that is falling. Does it match the label on its bin?"
    ],
    success: {
      title: "You found it!",
      text: "The plastic bottle is dropping into the general waste bin, but the recycling bin is right next to it. In the recycling bin, its plastic can be collected and made into something new instead of being buried."
    },
    lesson: "Check the label before you throw something away.",
    target: [280, 56, 124, 222],
    areas: [
      { id: "window", label: "The window", rect: [30, 34, 110, 90] },
      { id: "recycling-bin", label: "The blue recycling bin", rect: [146, 150, 108, 124] },
      { id: "bottle", label: "The plastic bottle falling into the general waste bin", rect: [280, 56, 124, 222], correct: true },
      { id: "plant", label: "The plant in the corner", rect: [436, 168, 64, 108] }
    ]
  },
  {
    id: "running-tap",
    category: "Saving water",
    icon: "💧",
    title: "Brushing time",
    prompt: "Someone is brushing their teeth. What is being wasted?",
    hints: [
      "Look for something that is being used even though nobody needs it right now.",
      "Look closely at the sink."
    ],
    success: {
      title: "Great spotting!",
      text: "The tap has been left running during brushing. Turning it off until it is time to rinse keeps lots of clean water from going straight down the drain."
    },
    lesson: "Turn the tap off while you brush.",
    target: [232, 128, 104, 80],
    areas: [
      { id: "mirror", label: "The mirror", rect: [180, 20, 160, 84] },
      { id: "cup", label: "The cup with the toothbrush", rect: [108, 120, 60, 74] },
      { id: "tap", label: "The tap and the water", rect: [232, 128, 104, 80], correct: true },
      { id: "cupboard", label: "The cupboard under the sink", rect: [80, 234, 360, 80] }
    ]
  },
  {
    id: "lights-on",
    category: "Saving energy",
    icon: "💡",
    title: "The empty bedroom",
    prompt: "Everyone has gone outside to play. What is still using energy?",
    hints: [
      "Nobody is in the room. Is anything still switched on?",
      "Look for something that is glowing."
    ],
    success: {
      title: "Well done, detective!",
      text: "The desk lamp is still on in an empty room, and the sun is already lighting it up. Switching off lights nobody is using saves electricity."
    },
    lesson: "Last one out? Lights off.",
    target: [244, 80, 112, 122],
    areas: [
      { id: "window", label: "The sunny window", rect: [384, 38, 116, 112] },
      { id: "bed", label: "The bed", rect: [28, 170, 190, 96] },
      { id: "lamp", label: "The glowing desk lamp", rect: [244, 80, 112, 122], correct: true },
      { id: "rug", label: "The rug on the floor", rect: [130, 276, 250, 38] }
    ]
  },
  {
    id: "park-litter",
    category: "Caring for nature",
    icon: "🌳",
    title: "A day at the park",
    prompt: "This park is lovely, but one thing does not belong here. Can you spot it?",
    hints: [
      "Look for something that should have gone somewhere else.",
      "Look down at the grass near the bench."
    ],
    success: {
      title: "You found it!",
      text: "A juice box and a wrapper have been left on the grass. Wind and rain can carry litter into creeks, where animals may mistake it for food. The bin is only a few steps away."
    },
    lesson: "If there is no bin nearby, take your rubbish home.",
    target: [204, 236, 116, 66],
    areas: [
      { id: "tree", label: "The tree", rect: [36, 36, 116, 196] },
      { id: "bench", label: "The bench", rect: [184, 150, 176, 60] },
      { id: "bin", label: "The bin", rect: [384, 158, 72, 88] },
      { id: "litter", label: "The juice box and wrapper on the grass", rect: [204, 236, 116, 66], correct: true },
      { id: "bird", label: "The bird", rect: [452, 248, 52, 40] }
    ]
  },
  {
    id: "old-battery",
    category: "Electronics",
    icon: "🔋",
    title: "The flat batteries",
    prompt: "The remote needed new batteries. Where are the old ones going?",
    hints: [
      "Look for something small that is falling.",
      "There is a special box for batteries. Are the old ones going there?"
    ],
    success: {
      title: "Great detective work!",
      text: "The old batteries are dropping into the kitchen bin. Batteries hold materials that can be recovered and used again, so they belong at a battery drop-off point, not in household rubbish."
    },
    safetyNote: "Old batteries can get hot or leak. Ask a trusted adult to put them in the battery drop-off box.",
    lesson: "Batteries never go in the household bin.",
    target: [318, 72, 136, 172],
    areas: [
      { id: "clock", label: "The clock on the wall", rect: [36, 26, 70, 70] },
      { id: "remote", label: "The TV remote", rect: [52, 206, 124, 44] },
      { id: "drop-off", label: "The battery drop-off box", rect: [188, 134, 104, 80] },
      { id: "batteries", label: "The batteries falling into the kitchen bin", rect: [318, 72, 136, 172], correct: true }
    ]
  },
  {
    id: "tshirt-hole",
    category: "Clothing",
    icon: "👕",
    title: "The T-shirt headed for the bin",
    prompt: "This T-shirt is about to be thrown away. Find what is actually wrong with it.",
    hints: [
      "Most of the T-shirt looks fine. Look for one small spot.",
      "Check the sleeves closely."
    ],
    success: {
      title: "Nice detective work!",
      text: "There is just one small hole on the sleeve, and the rest of the T-shirt is in good shape. A few stitches with an adult's help could keep it in use for a long time."
    },
    lesson: "A small problem does not always mean the end.",
    target: [134, 88, 84, 72],
    areas: [
      { id: "collar", label: "The collar", rect: [244, 40, 64, 26] },
      { id: "sleeve", label: "The left sleeve", rect: [134, 88, 84, 72], correct: true },
      { id: "star", label: "The star on the front", rect: [248, 138, 76, 72] },
      { id: "bin", label: "The bin", rect: [404, 186, 92, 110] },
      { id: "thread", label: "The reel of thread", rect: [32, 240, 70, 60] }
    ]
  }
]);

// Gentle openers for a missed tap. They rotate so repeated tries never read as
// the same message being repeated at the child (AC4.1.4).
const TRY_AGAIN = [
  "Good try! Look again 👀",
  "Nearly there — keep looking 🔍",
  "You're a careful detective — one more look 🌟"
];

export function findMystery(id) {
  return MYSTERIES.find(mystery => mystery.id === id) || null;
}

export function insideRect([x, y, width, height], point, tolerance = 0) {
  return (
    point.x >= x - tolerance &&
    point.x <= x + width + tolerance &&
    point.y >= y - tolerance &&
    point.y <= y + height + tolerance
  );
}

/** AC4.1.2 — does a tap, in scene units, land on the problem? */
export function isHit(mystery, point, tolerance = TAP_TOLERANCE) {
  if (!mystery || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  return insideRect(mystery.target, point, tolerance);
}

/** Keyboard and screen-reader route: the child picks a named area instead. */
export function isCorrectArea(mystery, areaId) {
  return Boolean(mystery?.areas.find(area => area.id === areaId)?.correct);
}

/**
 * AC4.1.4 — the hint after a given number of missed taps. The first hint points
 * the child in a direction; the second narrows it. Neither names the answer.
 */
export function hintFor(mystery, misses) {
  if (!mystery || misses < 1) return null;
  return {
    title: TRY_AGAIN[(misses - 1) % TRY_AGAIN.length],
    text: mystery.hints[Math.min(misses, mystery.hints.length) - 1]
  };
}

/**
 * After three misses the scene softly pulses a wide circle around the problem.
 * The child still has to tap it, so the answer is never handed over.
 */
export function shouldNudge(misses) {
  return misses >= 3;
}

/**
 * AC4.3.2 — suggest another mystery. Prefer one not yet solved from a different
 * category; otherwise anything not yet solved; otherwise any other mystery.
 * Never the one the child has just finished.
 */
export function nextMystery(currentId, doneIds = []) {
  const current = findMystery(currentId);
  const others = MYSTERIES.filter(mystery => mystery.id !== currentId);
  const fresh = others.filter(mystery => !doneIds.includes(mystery.id));
  return (
    fresh.find(mystery => mystery.category !== current?.category) ||
    fresh[0] ||
    others.find(mystery => mystery.category !== current?.category) ||
    others[0] ||
    null
  );
}
