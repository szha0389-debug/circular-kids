import { defineStore } from "pinia";
import { api } from "@/api/client";
import { makeFoodItem, matchInventoryItem } from "../../core/shopping.js";

const INVENTORY_KEY = "circularKidsInventory";
const SHOPPING_KEY = "circularKidsShoppingList";

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
}

export const useShopping = defineStore("shopping", {
  state: () => ({
    inventory: [],
    shoppingList: [],
    pendingItem: null,
    match: null,
    loading: false,
    message: ""
  }),
  actions: {
    load() {
      this.inventory = read(INVENTORY_KEY);
      this.shoppingList = read(SHOPPING_KEY);
    },
    save() {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(this.inventory));
      localStorage.setItem(SHOPPING_KEY, JSON.stringify(this.shoppingList));
    },
    addInventory(input) {
      this.inventory.push(makeFoodItem(input));
      this.save();
    },
    removeInventory(id) {
      this.inventory = this.inventory.filter(item => item.id !== id);
      this.save();
    },
    removeShoppingItem(id) {
      this.shoppingList = this.shoppingList.filter(item => item.id !== id);
      this.save();
    },
    async prepareItem(input) {
      this.loading = true;
      this.message = "";
      try {
        let product = null;
        try { product = await api.findFood(input); }
        catch { this.message = "Product details could not be loaded, so the name you entered was used."; }
        const candidate = makeFoodItem({
          ...product,
          ...input,
          name: product?.name || input.name,
          barcode: product?.barcode || input.barcode,
          quantity: 1,
          unit: "item"
        });
        this.pendingItem = candidate;
        this.match = matchInventoryItem(candidate, this.inventory);
        if (!this.match) this.keepPending();
      } finally {
        this.loading = false;
      }
    },
    keepPending() {
      if (!this.pendingItem) return;
      this.shoppingList.push(this.pendingItem);
      this.pendingItem = null;
      this.match = null;
      this.save();
    },
    removePending() {
      this.pendingItem = null;
      this.match = null;
      this.message = "Item removed from your shopping list.";
    }
  }
});
