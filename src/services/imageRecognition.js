// Browser inference for our own three-convolution CNN. The architecture and
// weights are produced by training/train.py from random initial parameters.

import classes from "../../training/classes.json" with { type: "json" };

const MODEL_URL = "/model/model.json";
const INPUT_SIZE = 128;

export const IMAGE_LABELS = classes;

let modelPromise;

async function getModel(onProgress) {
  if (!modelPromise) {
    modelPromise = fetch(MODEL_URL, { method: "HEAD" })
      .then(response => {
        const type = response.headers.get("Content-Type") || "";
        if (!response.ok || !type.includes("application/json")) {
          throw new Error("The trained model files have not been generated yet.");
        }
        return import("@tensorflow/tfjs");
      })
      .then(tf =>
        tf.loadLayersModel(MODEL_URL, {
          onProgress: fraction =>
            onProgress?.(`Loading our trained model… ${Math.round(fraction * 100)}%`)
        })
      )
      .catch(error => {
        modelPromise = null;
        throw new Error(
          "No trained Circular Kids model was found. Run training/train.py after collecting the dataset.",
          { cause: error }
        );
      });
  }
  return modelPromise;
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
    suggestion: { itemId: best.item.itemId, confidence: best.score },
    reason: null
  };
}

/**
 * Resize onto a square canvas without distorting the subject, matching
 * `pad_to_aspect_ratio=True` in training/train.py: scale to fit inside
 * `size`, then centre on a black square. A plain stretch-to-square resize
 * would warp tall or wide items (a water bottle, a towel) in a way the
 * training data never saw.
 */
function resizeWithPad(tf, pixels, size) {
  const [height, width] = pixels.shape;
  const scale = Math.min(size / width, size / height);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  const resized = tf.image.resizeBilinear(pixels, [scaledHeight, scaledWidth]);
  const top = Math.floor((size - scaledHeight) / 2);
  const left = Math.floor((size - scaledWidth) / 2);
  return resized.pad([
    [top, size - scaledHeight - top],
    [left, size - scaledWidth - left],
    [0, 0]
  ]);
}

/** Classify the actual image pixels. No file name is read or sent anywhere. */
export async function recogniseImage(file, onProgress) {
  onProgress?.("Loading our trained image model…");
  const [tf, model, bitmap] = await Promise.all([
    import("@tensorflow/tfjs"),
    getModel(onProgress),
    createImageBitmap(file)
  ]);
  onProgress?.("Looking at the picture…");
  try {
    const scores = tf.tidy(() => {
      const pixels = tf.browser.fromPixels(bitmap);
      const padded = resizeWithPad(tf, pixels, INPUT_SIZE);
      const batch = padded.expandDims(0);
      return model.predict(batch).dataSync();
    });
    return chooseSuggestion(Array.from(scores));
  } finally {
    bitmap.close();
  }
}
