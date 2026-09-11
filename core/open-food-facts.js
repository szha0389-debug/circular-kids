const API_ROOT = "https://world.openfoodfacts.org";
const FIELDS = "code,product_name,brands,quantity,categories_tags_en";

function productFrom(payload) {
  const product = payload?.product || payload?.products?.[0];
  if (!product?.product_name) return null;
  return {
    name: product.product_name,
    barcode: String(product.code || ""),
    brand: String(product.brands || ""),
    category: String(product.categories_tags_en?.[0] || "").replace(/^en:/, "").replaceAll("-", " "),
    packageInfo: String(product.quantity || "")
  };
}

export async function findFoodProduct({ barcode = "", name = "" }, fetchImpl = fetch) {
  const cleanBarcode = String(barcode).replace(/\D/g, "");
  let url;
  if (cleanBarcode) {
    url = `${API_ROOT}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json?fields=${FIELDS}`;
  } else {
    const search = String(name).trim();
    if (!search) return null;
    const params = new URLSearchParams({
      search_terms: search,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "1",
      fields: FIELDS
    });
    url = `${API_ROOT}/cgi/search.pl?${params}`;
  }

  const response = await fetchImpl(url, {
    headers: { "User-Agent": "CircularKids/3.0 (university learning project)" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("Open Food Facts request failed");
  return productFrom(await response.json());
}
