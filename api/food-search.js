import { findFoodProduct } from "../core/open-food-facts.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ message: "That action is not available." });
  try {
    const product = await findFoodProduct({ barcode: req.query.barcode, name: req.query.name });
    if (!product) return res.status(404).json({ message: "Food product not found." });
    return res.status(200).json(product);
  } catch {
    return res.status(502).json({ message: "Open Food Facts is temporarily unavailable." });
  }
}
