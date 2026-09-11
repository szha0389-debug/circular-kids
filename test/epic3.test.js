import test from "node:test";
import assert from "node:assert/strict";

import { makeFoodItem, matchInventoryItem, normaliseFoodName } from "../core/shopping.js";
import { findFoodProduct } from "../core/open-food-facts.js";

const inventory = [
  makeFoodItem({ name: "Full Cream Milk", quantity: 1, unit: "L", category: "dairy", barcode: "111" }, "milk"),
  makeFoodItem({ name: "Red Apples", quantity: 4, unit: "item", category: "fruit" }, "apples")
];

test("AC1 exact inventory item triggers a duplicate reminder match", () => {
  const match = matchInventoryItem({ name: "Full Cream Milk", barcode: "111" }, inventory);
  assert.equal(match.type, "exact");
  assert.equal(match.item.id, "milk");
});

test("AC2 a match retains its remaining quantity and unit", () => {
  const { item } = matchInventoryItem({ name: "Milk" }, inventory);
  assert.equal(item.quantity, 1);
  assert.equal(item.unit, "L");
});

test("AC3 unrelated food has no duplicate-purchase match", () => {
  assert.equal(matchInventoryItem({ name: "Wholemeal Bread", category: "bakery" }, inventory), null);
});

test("similar foods in the same category produce a relevant match", () => {
  const match = matchInventoryItem({ name: "Green Apples", category: "fruit" }, inventory);
  assert.equal(match.type, "similar");
  assert.equal(match.item.id, "apples");
});

test("used-up inventory is ignored", () => {
  const used = [makeFoodItem({ name: "Milk", quantity: 0, unit: "L", status: "used" }, "used")];
  assert.equal(matchInventoryItem({ name: "Milk" }, used), null);
});

test("AC5 an empty new-user inventory works without waste history", () => {
  assert.equal(matchInventoryItem({ name: "Milk" }, []), null);
});

test("food names are normalised for useful comparison", () => {
  assert.equal(normaliseFoodName("  Organic MILK! "), "milk");
});

test("barcode lookup maps Open Food Facts fields used by E3", async () => {
  const fakeFetch = async url => {
    assert.match(url, /api\/v2\/product\/9300000000001/);
    return {
      ok: true,
      async json() {
        return { product: { code: "9300000000001", product_name: "Oat Milk", brands: "Example", quantity: "1 L", categories_tags_en: ["en:plant-based-milks"] } };
      }
    };
  };
  const product = await findFoodProduct({ barcode: "9300000000001" }, fakeFetch);
  assert.deepEqual(product, {
    name: "Oat Milk",
    barcode: "9300000000001",
    brand: "Example",
    category: "plant based milks",
    packageInfo: "1 L"
  });
});
