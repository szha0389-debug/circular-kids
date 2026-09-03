import { modelHealth } from "../_image-recognition.js";

export default async function handler(_req, res) {
  res.setHeader("Cache-Control", "no-store");
  const result = await modelHealth();
  return res.status(result.status).json(result.body);
}
