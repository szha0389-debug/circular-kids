const GENERIC_WORDS = new Set([
  "fresh", "organic", "original", "classic", "natural", "food", "foods",
  "brand", "pack", "packet", "bottle", "can", "tin", "jar"
]);

export function normaliseFoodName(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word && !GENERIC_WORDS.has(word))
    .join(" ");
}

export function foodTokens(value) {
  return new Set(normaliseFoodName(value).split(" ").filter(Boolean));
}

export function matchInventoryItem(candidate, inventory = []) {
  const candidateName = normaliseFoodName(candidate?.name);
  const candidateBarcode = String(candidate?.barcode || "").trim();
  const candidateCategory = normaliseFoodName(candidate?.category);
  const candidateTokens = foodTokens(candidate?.name);

  let best = null;
  for (const item of inventory.filter(entry => entry.status === "available" && Number(entry.quantity) > 0)) {
    const itemName = normaliseFoodName(item.name);
    const barcodeMatch = candidateBarcode && item.barcode && candidateBarcode === String(item.barcode);
    const exactName = candidateName && itemName === candidateName;
    const categoryMatch = candidateCategory && normaliseFoodName(item.category) === candidateCategory;
    const shared = [...candidateTokens].filter(token => foodTokens(item.name).has(token));
    const overlap = candidateTokens.size ? shared.length / candidateTokens.size : 0;
    const relevant = categoryMatch || overlap >= 0.5 || (candidateName.length > 2 && itemName.includes(candidateName));
    const score = barcodeMatch ? 3 : exactName ? 2 : relevant ? 1 : 0;
    if (score && (!best || score > best.score)) {
      best = { item, type: score >= 2 ? "exact" : "similar", score };
    }
  }
  return best;
}

export function makeFoodItem(input = {}, id = crypto.randomUUID()) {
  return {
    id,
    name: String(input.name || "").trim(),
    brand: String(input.brand || "").trim(),
    category: String(input.category || "").trim(),
    barcode: String(input.barcode || "").trim(),
    quantity: Number(input.quantity) || 0,
    unit: String(input.unit || "item").trim(),
    packageInfo: String(input.packageInfo || "").trim(),
    status: input.status === "used" ? "used" : "available"
  };
}
