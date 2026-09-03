// Legacy investigation-route recognition contract retained for API compatibility.
// The current browser flow uses /api/image-recognition and the PyTorch backend.

export const CONFIDENCE_THRESHOLD = 0.6;
export const RECOGNITION_TIMEOUT_MS = 8000;
export const MAX_ATTEMPTS = 2;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
 * Preserve the team's metadata-based recognition endpoint for older clients.
 * Current clients use the independent PyTorch image-upload endpoint instead.
 */
export function recognise({ name = "", type = "", size = 0 } = {}) {
  const typeOk = ACCEPTED_TYPES.includes(String(type).toLowerCase());
  if (!typeOk || !Number.isFinite(size) || size <= 0) {
    return { available: true, suggestion: null, reason: REASONS.UNSUPPORTED };
  }

  const lower = String(name).toLowerCase();
  const found = WORD_MAP.find(entry => entry.words.some(word => lower.includes(word)));
  if (!found) {
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
