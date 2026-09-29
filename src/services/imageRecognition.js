// Same-origin API client for the PyTorch classifier running in the backend.

import classes from "../../training/classes.json" with { type: "json" };

export const IMAGE_LABELS = classes;
export const CONFIDENCE_THRESHOLD = 0.6;

export function confidenceLevelFor(score) {
  return Number.isFinite(score) && score >= CONFIDENCE_THRESHOLD ? "confident" : "low";
}

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
    suggestion: {
      itemId: best.item.itemId,
      confidence: best.score,
      confidenceLevel: confidenceLevelFor(best.score)
    },
    reason: null
  };
}

/** Upload one image to the local backend classifier. */
export async function recogniseImage(file, onProgress, timeout = 90000) {
  onProgress?.("Sending your picture to our trained model…");
  const formData = new FormData();
  formData.append("image", file);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch("/api/image-recognition", {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success || !body.prediction) {
      throw new Error(body.detail || body.message || "Image recognition is unavailable.");
    }
    const matchingClass = IMAGE_LABELS.find(entry => entry.itemId === body.prediction.itemId);
    if (!matchingClass) throw new Error("The recognition service returned an unknown item.");
    const confidence = Number(body.prediction.confidence);
    if (!Number.isFinite(confidence)) {
      throw new Error("The recognition service returned an invalid confidence score.");
    }
    return {
      available: true,
      suggestion: {
        itemId: matchingClass.itemId,
        confidence,
        confidenceLevel: body.prediction.confidenceLevel || confidenceLevelFor(confidence)
      },
      topPredictions: body.topPredictions || [],
      reason: null
    };
  } finally {
    clearTimeout(timer);
  }
}
