import Busboy from "busboy";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ort from "onnxruntime-node";
import sharp from "sharp";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MODEL_PATH = path.join(ROOT, "public", "model", "circular-kids.onnx");
const CLASSES_PATH = path.join(ROOT, "training", "classes.json");

export const MAX_IMAGE_BYTES = 4_000_000;
const INPUT_SIZE = 224;
const RESIZE_SIZE = 256;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_SUFFIXES = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const classes = JSON.parse(fs.readFileSync(CLASSES_PATH, "utf8"));
if (classes.length !== 23) throw new Error(`Expected 23 image classes, found ${classes.length}`);

// A warm Vercel Function instance reuses this promise and its native ONNX session.
const sessionPromise = ort.InferenceSession.create(MODEL_PATH, {
  executionProviders: ["cpu"],
  graphOptimizationLevel: "all",
  intraOpNumThreads: 1,
  interOpNumThreads: 1
});

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readImagePart(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers?.["content-type"] || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      reject(new RequestError(400, "Upload the image as multipart/form-data."));
      return;
    }

    let parser;
    try {
      parser = Busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: MAX_IMAGE_BYTES, fields: 0, parts: 1 }
      });
    } catch {
      reject(new RequestError(400, "The image upload could not be read."));
      return;
    }

    let found = false;
    let tooLarge = false;
    let invalidType = false;
    const chunks = [];

    parser.on("file", (fieldName, stream, info) => {
      if (fieldName !== "image" || found) {
        stream.resume();
        return;
      }
      found = true;
      const suffix = path.extname(info.filename || "").toLowerCase();
      invalidType = !ALLOWED_MIME_TYPES.has(info.mimeType) || !ALLOWED_SUFFIXES.has(suffix);
      if (invalidType) {
        stream.resume();
        return;
      }
      stream.on("limit", () => {
        tooLarge = true;
      });
      stream.on("data", chunk => chunks.push(chunk));
      stream.on("error", reject);
    });
    parser.on("error", () => reject(new RequestError(400, "The image upload could not be read.")));
    parser.on("close", () => {
      if (!found) return reject(new RequestError(400, "Choose an image to upload."));
      if (invalidType) return reject(new RequestError(400, "Use a JPEG, PNG, or WebP image."));
      if (tooLarge) return reject(new RequestError(413, "Use an image smaller than 4 MB."));
      const payload = Buffer.concat(chunks);
      if (!payload.length) return reject(new RequestError(400, "The uploaded image is empty."));
      resolve(payload);
    });

    if (Buffer.isBuffer(req.body)) parser.end(req.body);
    else if (typeof req.body === "string") parser.end(Buffer.from(req.body));
    else req.pipe(parser);
  });
}

async function preprocess(payload) {
  let metadata;
  try {
    metadata = await sharp(payload, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new RequestError(400, "The uploaded file is not a valid image.");
  }
  if (!metadata.width || !metadata.height || (metadata.pages || 1) !== 1) {
    throw new RequestError(400, "The uploaded file is not a valid image.");
  }

  // Match torchvision Resize(256) followed by CenterCrop(224).
  const scale = RESIZE_SIZE / Math.min(metadata.width, metadata.height);
  const width = Math.floor(metadata.width * scale);
  const height = Math.floor(metadata.height * scale);
  const left = Math.floor((width - INPUT_SIZE) / 2);
  const top = Math.floor((height - INPUT_SIZE) / 2);

  let result;
  try {
    result = await sharp(payload, { failOn: "error", limitInputPixels: 40_000_000 })
      .toColourspace("srgb")
      .removeAlpha()
      .resize(width, height, { fit: "fill", kernel: sharp.kernel.linear })
      .extract({ left, top, width: INPUT_SIZE, height: INPUT_SIZE })
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new RequestError(400, "The uploaded file is not a valid image.");
  }
  if (result.info.channels !== 3) {
    throw new RequestError(400, "The uploaded file is not a valid RGB image.");
  }

  const plane = INPUT_SIZE * INPUT_SIZE;
  const tensor = new Float32Array(3 * plane);
  for (let pixel = 0; pixel < plane; pixel += 1) {
    const source = pixel * 3;
    tensor[pixel] = (result.data[source] / 255 - MEAN[0]) / STD[0];
    tensor[plane + pixel] = (result.data[source + 1] / 255 - MEAN[1]) / STD[1];
    tensor[2 * plane + pixel] = (result.data[source + 2] / 255 - MEAN[2]) / STD[2];
  }
  return new ort.Tensor("float32", tensor, [1, 3, INPUT_SIZE, INPUT_SIZE]);
}

function rankPredictions(logits) {
  const values = Array.from(logits.data, Number);
  const maximum = Math.max(...values);
  const exponentials = values.map(value => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials
    .map((value, index) => ({
      itemId: classes[index].itemId,
      name: classes[index].name,
      confidence: value / total
    }))
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3);
}

export async function modelHealth() {
  try {
    await sessionPromise;
    return { status: 200, body: { status: "ok", modelLoaded: true, device: "cpu", classes: classes.length } };
  } catch (error) {
    console.error("ONNX model failed to load", error);
    return {
      status: 503,
      body: { status: "unavailable", modelLoaded: false, device: "cpu", classes: classes.length }
    };
  }
}

export async function imageRecognitionResult(req) {
  if (req.method !== "POST") {
    return { status: 405, body: { detail: "That action is not available." } };
  }
  try {
    const [session, payload] = await Promise.all([sessionPromise, readImagePart(req)]);
    const input = await preprocess(payload);
    const outputs = await session.run({ images: input });
    const predictions = rankPredictions(outputs.logits);
    return {
      status: 200,
      body: { success: true, prediction: predictions[0], topPredictions: predictions }
    };
  } catch (error) {
    if (error instanceof RequestError) {
      return { status: error.status, body: { detail: error.message } };
    }
    console.error("ONNX image recognition failed", error);
    return { status: 503, body: { detail: "Image recognition is unavailable." } };
  }
}
