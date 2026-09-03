import { imageRecognitionResult } from "./_image-recognition.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const result = await imageRecognitionResult(req);
  return res.status(result.status).json(result.body);
}
