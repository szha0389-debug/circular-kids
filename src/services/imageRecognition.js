// Same-origin API client for the PyTorch classifier running in the backend.

import classes from "../../training/classes.json" with { type: "json" };

export const IMAGE_LABELS = classes;

/** Return the highest-scoring class whenever the model produces scores. */
export function chooseSuggestion(scores = []) {
  const ranked = scores
    .map((score, index) => ({ score, item: IMAGE_LABELS[index] }))
    .sort((left, right) => right.score - left.score);
  const [best] = ranked;
  if (!best?.item) {
    return { available: true, suggestion: null, reason: "no-scores" };
  }
  return {
    available: true,
    suggestion: { itemId: best.item.itemId, confidence: best.score },
    reason: null
  };
}

/** Upload one image to the local backend classifier. */
export async function recogniseImage(file, onProgress) {
  onProgress?.("Sending your picture to our trained model…");
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/image-recognition", { method: "POST", body: formData });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success || !body.prediction) {
    throw new Error(body.detail || body.message || "Image recognition is unavailable.");
  }
  const matchingClass = IMAGE_LABELS.find(entry => entry.itemId === body.prediction.itemId);
  if (!matchingClass) throw new Error("The recognition service returned an unknown item.");
  return {
    available: true,
    suggestion: { itemId: matchingClass.itemId, confidence: body.prediction.confidence },
    topPredictions: body.topPredictions || [],
    reason: null
  };
}
