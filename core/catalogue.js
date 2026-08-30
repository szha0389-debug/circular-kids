// Item catalogue for Epic 1.
//
// Materials are named in plain words, never technical codes. No element name or
// problem label may imply opening, unscrewing or dismantling anything: Epic 2
// tells the child not to touch a swollen battery, so Epic 1 must never have
// suggested opening the casing.

export const BREAKDOWN_MODES = ["components", "sections", "qualities"];

/** Every category from US-1.1, in the order the story lists them. */
export const CATEGORIES = [
  { id: "toys", label: "Toys", icon: "🧸" },
  { id: "electronics", label: "Electronics", icon: "🎧" },
  { id: "clothes", label: "Clothes", icon: "👕" },
  { id: "furniture", label: "Furniture", icon: "🪑" },
  { id: "school", label: "School Items", icon: "🎒" },
  { id: "household", label: "Household Items", icon: "🍽️" }
];

// Shared quality sets, used whenever an item has no component or section data.
const WEAR_QUALITIES = [
  { id: "fit", name: "Does it still fit you?" },
  { id: "fabric", name: "Is the fabric still sound?" },
  { id: "mark", name: "Is it only a stain or mark?" },
  { id: "shape", name: "Does it still hold its shape?" }
];

const GENERAL_QUALITIES = [
  { id: "works", name: "Does it still do its job?" },
  { id: "outside", name: "Does the outside look sound?" },
  { id: "shape", name: "Does it still hold its shape?" },
  { id: "mark", name: "Is it only a mark or a stain?" }
];

const ITEMS = [
  // ---------------------------------------------------------------- toys
  {
    id: "soft-toy", name: "soft toy", icon: "🧸", category: "toys",
    mode: "sections",
    elements: [
      { id: "seams", name: "Seams", material: "thread" },
      { id: "fur", name: "Outside fabric", material: "soft fabric" },
      { id: "filling", name: "Filling", material: "stuffing" },
      { id: "eyes", name: "Eyes and nose", material: "hard plastic" }
    ],
    problems: [
      { id: "seam-open", label: "A seam has come open", elementId: "seams" },
      { id: "fabric-torn", label: "The fabric is torn", elementId: "fur" },
      { id: "squashed", label: "It has gone flat or lumpy", elementId: "filling" },
      { id: "piece-loose", label: "An eye or nose is loose", elementId: "eyes" },
      { id: "stained", label: "It has a stain", elementId: "fur" }
    ]
  },
  {
    id: "toy-car", name: "toy car", icon: "🚗", category: "toys",
    mode: "components",
    elements: [
      { id: "body", name: "Body", material: "hard plastic" },
      { id: "wheels", name: "Wheels", material: "rubber and plastic" },
      { id: "axles", name: "Axles", material: "metal" },
      { id: "paint", name: "Paint", material: "paint" }
    ],
    problems: [
      { id: "wheel-off", label: "A wheel has come off", elementId: "wheels" },
      { id: "wheel-stuck", label: "A wheel will not turn", elementId: "axles" },
      { id: "cracked", label: "The body looks cracked", elementId: "body" },
      { id: "scratched", label: "The paint is scratched", elementId: "paint" }
    ]
  },
  {
    id: "board-game", name: "board game", icon: "🎲", category: "toys",
    mode: "sections",
    elements: [
      { id: "box", name: "Box", material: "card" },
      { id: "board", name: "Board", material: "card" },
      { id: "pieces", name: "Playing pieces", material: "plastic or wood" },
      { id: "rules", name: "Rules sheet", material: "paper" }
    ],
    problems: [
      { id: "pieces-missing", label: "Some pieces are missing", elementId: "pieces" },
      { id: "box-torn", label: "The box is torn", elementId: "box" },
      { id: "board-bent", label: "The board is bent or torn", elementId: "board" },
      { id: "rules-gone", label: "The rules sheet is gone", elementId: "rules" }
    ]
  },
  {
    id: "electronic-toy", name: "toy with batteries", icon: "🤖", category: "toys",
    mode: "components",
    elements: [
      { id: "casing", name: "Casing", material: "hard plastic" },
      { id: "battery", name: "Battery area", material: "metal and plastic" },
      { id: "controls", name: "Buttons", material: "rubber and plastic" },
      { id: "moving", name: "Moving parts", material: "plastic" },
      { id: "speaker", name: "Sound", material: "magnet and plastic" }
    ],
    problems: [
      { id: "no-power", label: "It does not switch on", elementId: "battery" },
      { id: "battery-odd", label: "The battery area looks changed", elementId: "battery" },
      { id: "no-move", label: "It does not move any more", elementId: "moving" },
      { id: "no-sound", label: "It makes no sound", elementId: "speaker" },
      { id: "button-stuck", label: "A button is stuck", elementId: "controls" },
      { id: "cracked", label: "The casing looks cracked", elementId: "casing" }
    ]
  },

  // --------------------------------------------------------- electronics
  {
    id: "headphones", name: "headphones", icon: "🎧", category: "electronics",
    mode: "components",
    elements: [
      { id: "casing", name: "Casing", material: "hard plastic" },
      { id: "cushion", name: "Ear cushion", material: "foam and fabric" },
      { id: "cable", name: "Cable", material: "rubber and copper" },
      { id: "battery", name: "Battery", material: "lithium" },
      { id: "driver", name: "Speaker driver", material: "magnet and plastic" }
    ],
    problems: [
      { id: "no-sound", label: "There is no sound", elementId: "driver" },
      { id: "one-side", label: "Only one side works", elementId: "driver" },
      { id: "cable-damaged", label: "The cable looks damaged", elementId: "cable" },
      { id: "will-not-charge", label: "It will not charge", elementId: "battery" },
      { id: "battery-odd", label: "The battery area looks changed", elementId: "battery" },
      { id: "cushion-worn", label: "An ear cushion is worn or peeling", elementId: "cushion" },
      { id: "cracked", label: "The casing looks cracked", elementId: "casing" }
    ]
  },
  {
    id: "phone", name: "mobile phone", icon: "📱", category: "electronics",
    mode: "components",
    elements: [
      { id: "screen", name: "Screen", material: "glass" },
      { id: "casing", name: "Casing", material: "metal and glass" },
      { id: "battery", name: "Battery", material: "lithium" },
      { id: "port", name: "Charging port", material: "metal" },
      { id: "buttons", name: "Buttons", material: "metal and plastic" }
    ],
    problems: [
      { id: "screen-cracked", label: "The screen is cracked", elementId: "screen" },
      { id: "will-not-charge", label: "It will not charge", elementId: "port" },
      { id: "battery-odd", label: "The back looks swollen or changed", elementId: "battery" },
      { id: "battery-short", label: "The battery runs down very fast", elementId: "battery" },
      { id: "no-power", label: "It does not switch on", elementId: "battery" },
      { id: "button-stuck", label: "A button is stuck", elementId: "buttons" }
    ]
  },
  {
    id: "charger", name: "charger", icon: "🔌", category: "electronics",
    mode: "components",
    elements: [
      { id: "cable", name: "Cable", material: "rubber and copper" },
      { id: "plug", name: "Plug", material: "hard plastic and metal" },
      { id: "connector", name: "Connector tip", material: "metal" }
    ],
    problems: [
      { id: "cable-damaged", label: "The cable cover is split", elementId: "cable" },
      { id: "will-not-charge", label: "It does not charge anything", elementId: "connector" },
      { id: "plug-loose", label: "The plug feels loose", elementId: "plug" },
      { id: "gets-hot", label: "It gets hot", elementId: "plug" }
    ]
  },
  {
    id: "tablet", name: "tablet", icon: "💻", category: "electronics",
    mode: "components",
    elements: [
      { id: "screen", name: "Screen", material: "glass" },
      { id: "casing", name: "Casing", material: "metal and plastic" },
      { id: "battery", name: "Battery", material: "lithium" },
      { id: "port", name: "Charging port", material: "metal" }
    ],
    problems: [
      { id: "screen-cracked", label: "The screen is cracked", elementId: "screen" },
      { id: "will-not-charge", label: "It will not charge", elementId: "port" },
      { id: "battery-odd", label: "The back looks swollen or changed", elementId: "battery" },
      { id: "no-power", label: "It does not switch on", elementId: "battery" },
      { id: "slow", label: "It has become very slow", elementId: "casing" }
    ]
  },

  // ------------------------------------------------------------- clothes
  {
    id: "tshirt", name: "T-shirt", icon: "👕", category: "clothes",
    mode: "qualities",
    elements: WEAR_QUALITIES,
    problems: [
      { id: "hole", label: "It has a hole", elementId: "fabric" },
      { id: "stain", label: "It has a stain", elementId: "mark" },
      { id: "seam-open", label: "A seam has come open", elementId: "fabric" },
      { id: "shape-changed", label: "It has changed shape", elementId: "shape" },
      { id: "too-small", label: "It does not fit any more", elementId: "fit" }
    ]
  },
  {
    id: "jumper", name: "jumper", icon: "🧶", category: "clothes",
    mode: "qualities",
    elements: WEAR_QUALITIES,
    problems: [
      { id: "hole", label: "It has a hole", elementId: "fabric" },
      { id: "bobbled", label: "The wool has gone bobbly", elementId: "fabric" },
      { id: "stain", label: "It has a stain", elementId: "mark" },
      { id: "shape-changed", label: "It has stretched out of shape", elementId: "shape" },
      { id: "too-small", label: "It does not fit any more", elementId: "fit" }
    ]
  },
  {
    id: "shoes", name: "shoes", icon: "👟", category: "clothes",
    mode: "components",
    elements: [
      { id: "sole", name: "Sole", material: "rubber" },
      { id: "upper", name: "Upper", material: "fabric or leather" },
      { id: "laces", name: "Laces", material: "fabric" },
      { id: "lining", name: "Inside lining", material: "fabric" }
    ],
    problems: [
      { id: "sole-loose", label: "The sole is coming away", elementId: "sole" },
      { id: "sole-worn", label: "The sole is worn smooth", elementId: "sole" },
      { id: "hole", label: "There is a hole in the upper", elementId: "upper" },
      { id: "laces-gone", label: "The laces are broken or missing", elementId: "laces" },
      { id: "too-small", label: "They do not fit any more", elementId: "lining" }
    ]
  },
  {
    id: "jacket", name: "jacket", icon: "🧥", category: "clothes",
    mode: "sections",
    elements: [
      { id: "zip", name: "Zip", material: "metal or plastic" },
      { id: "outer", name: "Outer fabric", material: "coated fabric" },
      { id: "lining", name: "Lining", material: "soft fabric" },
      { id: "pockets", name: "Pockets", material: "fabric" }
    ],
    problems: [
      { id: "zip-stuck", label: "The zip will not close", elementId: "zip" },
      { id: "hole", label: "There is a tear in the outer fabric", elementId: "outer" },
      { id: "lining-torn", label: "The lining is torn", elementId: "lining" },
      { id: "pocket-hole", label: "A pocket has a hole", elementId: "pockets" },
      { id: "stain", label: "It has a stain", elementId: "outer" }
    ]
  },

  // ----------------------------------------------------------- furniture
  {
    id: "chair", name: "chair", icon: "🪑", category: "furniture",
    mode: "components",
    elements: [
      { id: "legs", name: "Legs", material: "wood or metal" },
      { id: "seat", name: "Seat", material: "wood or fabric" },
      { id: "back", name: "Back", material: "wood or fabric" },
      { id: "joints", name: "Joints", material: "wood and screws" }
    ],
    problems: [
      { id: "wobbly", label: "It wobbles", elementId: "joints" },
      { id: "leg-broken", label: "A leg is cracked or broken", elementId: "legs" },
      { id: "seat-torn", label: "The seat is torn", elementId: "seat" },
      { id: "stain", label: "It has a stain", elementId: "seat" },
      { id: "scratched", label: "It is scratched or marked", elementId: "back" }
    ]
  },
  {
    id: "desk", name: "desk", icon: "🪵", category: "furniture",
    mode: "sections",
    elements: [
      { id: "top", name: "Table top", material: "wood" },
      { id: "legs", name: "Legs", material: "wood or metal" },
      { id: "drawers", name: "Drawers", material: "wood" },
      { id: "joints", name: "Joints", material: "wood and screws" }
    ],
    problems: [
      { id: "wobbly", label: "It wobbles", elementId: "joints" },
      { id: "top-marked", label: "The top is scratched or marked", elementId: "top" },
      { id: "drawer-stuck", label: "A drawer sticks", elementId: "drawers" },
      { id: "swollen", label: "The wood has swollen from water", elementId: "top" }
    ]
  },
  {
    id: "shelf", name: "shelf", icon: "🗄️", category: "furniture",
    mode: "sections",
    elements: [
      { id: "boards", name: "Shelf boards", material: "wood" },
      { id: "sides", name: "Sides", material: "wood" },
      { id: "back", name: "Back panel", material: "thin board" },
      { id: "joints", name: "Joints", material: "wood and screws" }
    ],
    problems: [
      { id: "sagging", label: "A shelf is sagging", elementId: "boards" },
      { id: "wobbly", label: "It wobbles", elementId: "joints" },
      { id: "back-loose", label: "The back panel is loose", elementId: "back" },
      { id: "scratched", label: "It is scratched or marked", elementId: "sides" }
    ]
  },

  // -------------------------------------------------------- school items
  {
    id: "backpack", name: "backpack", icon: "🎒", category: "school",
    mode: "sections",
    elements: [
      { id: "zip", name: "Zip", material: "metal or plastic" },
      { id: "straps", name: "Straps", material: "webbing" },
      { id: "main", name: "Main compartment", material: "strong fabric" },
      { id: "base", name: "Base", material: "coated fabric" }
    ],
    problems: [
      { id: "zip-stuck", label: "The zip will not close", elementId: "zip" },
      { id: "strap-loose", label: "A strap is loose or torn", elementId: "straps" },
      { id: "hole", label: "The fabric is torn", elementId: "main" },
      { id: "base-worn", label: "The base is worn through", elementId: "base" },
      { id: "stain", label: "It has a stain", elementId: "main" }
    ]
  },
  {
    id: "pencil-case", name: "pencil case", icon: "✏️", category: "school",
    mode: "sections",
    elements: [
      { id: "zip", name: "Zip", material: "metal or plastic" },
      { id: "fabric", name: "Outside fabric", material: "fabric" },
      { id: "lining", name: "Lining", material: "fabric" }
    ],
    problems: [
      { id: "zip-stuck", label: "The zip will not close", elementId: "zip" },
      { id: "hole", label: "There is a hole", elementId: "fabric" },
      { id: "stain", label: "It is marked with ink", elementId: "fabric" },
      { id: "lining-torn", label: "The lining is torn", elementId: "lining" }
    ]
  },
  {
    id: "lunch-box", name: "lunch box", icon: "🥪", category: "school",
    mode: "components",
    elements: [
      { id: "lid", name: "Lid", material: "hard plastic" },
      { id: "body", name: "Body", material: "hard plastic" },
      { id: "seal", name: "Seal", material: "rubber" },
      { id: "clips", name: "Clips", material: "hard plastic" }
    ],
    problems: [
      { id: "clip-broken", label: "A clip is broken", elementId: "clips" },
      { id: "leaks", label: "It leaks", elementId: "seal" },
      { id: "cracked", label: "It looks cracked", elementId: "body" },
      { id: "stained", label: "It is stained or smells", elementId: "body" },
      { id: "lid-lost", label: "The lid does not fit any more", elementId: "lid" }
    ]
  },
  {
    id: "water-bottle", name: "water bottle", icon: "🧴", category: "school",
    mode: "components",
    elements: [
      { id: "cap", name: "Cap", material: "hard plastic" },
      { id: "body", name: "Body", material: "hard plastic or metal" },
      { id: "seal", name: "Seal", material: "rubber" },
      { id: "spout", name: "Spout", material: "soft plastic" }
    ],
    problems: [
      { id: "leaks", label: "It leaks", elementId: "seal" },
      { id: "cap-broken", label: "The cap is broken", elementId: "cap" },
      { id: "cracked", label: "It looks cracked", elementId: "body" },
      { id: "stained", label: "It is stained or smells", elementId: "body" },
      { id: "spout-worn", label: "The spout is chewed or worn", elementId: "spout" }
    ]
  },

  // ----------------------------------------------------- household items
  {
    id: "mug", name: "mug", icon: "☕", category: "household",
    mode: "components",
    elements: [
      { id: "body", name: "Body", material: "china" },
      { id: "handle", name: "Handle", material: "china" },
      { id: "glaze", name: "Glaze", material: "glaze" }
    ],
    problems: [
      { id: "chipped", label: "It is chipped", elementId: "body" },
      { id: "cracked", label: "It is cracked", elementId: "body" },
      { id: "handle-broken", label: "The handle is broken", elementId: "handle" },
      { id: "stained", label: "It is stained inside", elementId: "glaze" }
    ]
  },
  {
    id: "storage-box", name: "storage box", icon: "📦", category: "household",
    mode: "components",
    elements: [
      { id: "lid", name: "Lid", material: "hard plastic" },
      { id: "body", name: "Body", material: "hard plastic" },
      { id: "handles", name: "Handles", material: "hard plastic" }
    ],
    problems: [
      { id: "cracked", label: "It is cracked", elementId: "body" },
      { id: "lid-lost", label: "The lid does not fit any more", elementId: "lid" },
      { id: "handle-broken", label: "A handle is broken", elementId: "handles" },
      { id: "stained", label: "It is stained or cloudy", elementId: "body" }
    ]
  },
  {
    id: "lamp", name: "lamp", icon: "💡", category: "household",
    mode: "components",
    elements: [
      { id: "shade", name: "Shade", material: "fabric or plastic" },
      { id: "base", name: "Base", material: "metal or ceramic" },
      { id: "cable", name: "Cable", material: "rubber and copper" },
      { id: "switch", name: "Switch", material: "hard plastic" }
    ],
    problems: [
      { id: "no-light", label: "It does not light up", elementId: "switch" },
      { id: "cable-damaged", label: "The cable cover is split", elementId: "cable" },
      { id: "switch-broken", label: "The switch does not click", elementId: "switch" },
      { id: "shade-torn", label: "The shade is torn or marked", elementId: "shade" },
      { id: "wobbly", label: "The base wobbles", elementId: "base" }
    ]
  },
  {
    id: "towel", name: "towel", icon: "🧻", category: "household",
    mode: "qualities",
    elements: WEAR_QUALITIES,
    problems: [
      { id: "thin", label: "The fabric has gone thin", elementId: "fabric" },
      { id: "hole", label: "It has a hole", elementId: "fabric" },
      { id: "stain", label: "It has a stain", elementId: "mark" },
      { id: "rough", label: "It has gone rough or stiff", elementId: "shape" }
    ]
  }
];

/**
 * The "something else" escape hatch required by US-1.1. One per category, so a
 * child who cannot find their item still continues with a real case rather than
 * hitting a dead end. It uses the qualities mode, which needs no external data.
 */
function generalItem(category) {
  return {
    id: `general-${category.id}`,
    name: "something else",
    icon: "✨",
    category: category.id,
    mode: "qualities",
    elements: GENERAL_QUALITIES,
    problems: [
      { id: "not-working", label: "It does not do its job any more", elementId: "works" },
      { id: "damaged", label: "It looks damaged", elementId: "outside" },
      { id: "shape-changed", label: "It has changed shape", elementId: "shape" },
      { id: "stain", label: "It has a mark or a stain", elementId: "mark" }
    ],
    isGeneral: true
  };
}

const GENERAL_ITEMS = CATEGORIES.map(generalItem);
const ALL_ITEMS = [...ITEMS, ...GENERAL_ITEMS];
const BY_ID = new Map(ALL_ITEMS.map(item => [item.id, item]));

/** Every item, including the per-category "something else" entries. */
export function allItems() {
  return ALL_ITEMS;
}

/** Items in a category, with "something else" always last. */
export function itemsInCategory(categoryId) {
  return ALL_ITEMS.filter(item => item.category === categoryId)
    .sort((a, b) => Number(Boolean(a.isGeneral)) - Number(Boolean(b.isGeneral)));
}

export function findItem(itemId) {
  return BY_ID.get(itemId) || null;
}

/**
 * The breakdown shown by US-1.2. Falls back to the qualities mode whenever an
 * item has no component or section data, so a coverage gap never blocks a case.
 */
export function breakdownFor(itemId) {
  const item = findItem(itemId);
  const elements = item && Array.isArray(item.elements) && item.elements.length ? item.elements : null;
  if (!elements) {
    return { mode: "qualities", elements: GENERAL_QUALITIES, fallback: true };
  }
  return { mode: item.mode, elements, fallback: false };
}

/**
 * Problem options for US-1.2. When an item carries no repair evidence, every
 * element from its breakdown is offered instead, so the list is never empty.
 * "Not sure" is appended by the caller so it can be styled identically.
 */
export function problemsFor(itemId) {
  const item = findItem(itemId);
  const breakdown = breakdownFor(itemId);
  if (item && Array.isArray(item.problems) && item.problems.length) {
    return item.problems.map(problem => ({ ...problem, mode: breakdown.mode }));
  }
  return breakdown.elements.map(element => ({
    id: `element-${element.id}`,
    label: breakdown.mode === "qualities"
      ? element.name
      : `Something is wrong with the ${element.name.toLowerCase()}`,
    elementId: element.id,
    mode: breakdown.mode,
    derived: true
  }));
}

/** The "Not sure" option. US-1.2 requires it to sit among the others, not apart. */
export const NOT_SURE_PROBLEM = { id: "not-sure", label: "Not sure", elementId: null };
