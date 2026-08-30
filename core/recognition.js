// The recognition boundary, for US-1.1.
//
// Recognition is the only place AI decides anything in this epic, and even then
// the child confirms it. Everything downstream treats a recognised case and a
// hand-picked case identically.
//
// The implementation below is a stub: it matches words in the file name and
// never looks at a single pixel. That is deliberate — no image bytes leave the
// browser today (open decision 4: the photo is held for the session only). It
// exists so the contract, the thresholds and the fallbacks can be built and
// tested now. Replacing it means replacing `recognise` and nothing else.

/**
 * Open decision 1 in the epic: below this confidence we skip straight to manual
 * selection rather than show the child a guess.
 */
export const CONFIDENCE_THRESHOLD = 0.6;

/** US-1.1: a result or progress must appear within 8 seconds. */
export const RECOGNITION_TIMEOUT_MS = 8000;

/** Open decision 2: stop proposing after this many failed identifications. */
export const MAX_ATTEMPTS = 2;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Reasons the caller must route to the item list. None of them is an "error". */
export const REASONS = {
  UNSUPPORTED: "unsupported",
  LOW_CONFIDENCE: "low-confidence",
  NO_MATCH: "no-match",
  TIMEOUT: "timeout"
};

const WORD_MAP = [
  { words: ["headphone", "earphone", "earbud", "headset"], itemId: "headphones" },
  { words: ["phone", "iphone", "android", "mobile"], itemId: "phone" },
  { words: ["charger", "cable", "lead", "adapter"], itemId: "charger" },
  { words: ["tablet", "ipad"], itemId: "tablet" },
  { words: ["tshirt", "t-shirt", "shirt", "top", "tee"], itemId: "tshirt" },
  { words: ["jumper", "sweater", "hoodie"], itemId: "jumper" },
  { words: ["shoe", "sneaker", "trainer", "boot"], itemId: "shoes" },
  { words: ["jacket", "coat"], itemId: "jacket" },
  { words: ["teddy", "plush", "soft-toy", "softtoy"], itemId: "soft-toy" },
  { words: ["toycar", "toy-car", "car"], itemId: "toy-car" },
  { words: ["boardgame", "board-game", "puzzle"], itemId: "board-game" },
  { words: ["robot", "toy"], itemId: "electronic-toy" },
  { words: ["chair", "stool"], itemId: "chair" },
  { words: ["desk", "table"], itemId: "desk" },
  { words: ["shelf", "bookcase"], itemId: "shelf" },
  { words: ["backpack", "rucksack", "schoolbag", "bag"], itemId: "backpack" },
  { words: ["pencilcase", "pencil-case", "pencil"], itemId: "pencil-case" },
  { words: ["lunchbox", "lunch-box", "lunch"], itemId: "lunch-box" },
  { words: ["bottle", "flask"], itemId: "water-bottle" },
  { words: ["mug", "cup"], itemId: "mug" },
  { words: ["box", "container", "tub"], itemId: "storage-box" },
  { words: ["lamp", "light"], itemId: "lamp" },
  { words: ["towel"], itemId: "towel" }
];

/**
 * Identify a candidate item from the file metadata.
 *
 * Returns `{ available, suggestion, reason }`. A null suggestion always carries
 * a reason, and every reason routes the child to the item list — never to an
 * error screen. `itemId` is resolved against the catalogue by the caller.
 *
 * @param {{name?: string, type?: string, size?: number}} file
 */
export function recognise({ name = "", type = "", size = 0 } = {}) {
  const typeOk = ACCEPTED_TYPES.includes(String(type).toLowerCase());
  if (!typeOk || !Number.isFinite(size) || size <= 0) {
    return { available: true, suggestion: null, reason: REASONS.UNSUPPORTED };
  }

  const lower = String(name).toLowerCase();
  const found = WORD_MAP.find(entry => entry.words.some(word => lower.includes(word)));

  if (!found) {
    // A child's indoor photo of a worn object will land here most of the time.
    // The item list is not a fallback feature — it is the main path.
    return { available: true, suggestion: null, reason: REASONS.NO_MATCH };
  }

  const confidence = 0.91;
  if (confidence < CONFIDENCE_THRESHOLD) {
    return { available: true, suggestion: null, reason: REASONS.LOW_CONFIDENCE };
  }

  return {
    available: true,
    suggestion: { itemId: found.itemId, confidence },
    reason: null
  };
}
