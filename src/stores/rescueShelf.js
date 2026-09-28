import { defineStore } from "pinia";
import {
  RESCUE_OUTCOMES,
  createRescueRecord,
  groupShelf,
  sanitiseShelf
} from "../../core/rescueShelf.js";

export const RESCUE_SHELF_KEY = "circularKidsRescueShelfV1";

function loadRecords() {
  try {
    return sanitiseShelf(JSON.parse(localStorage.getItem(RESCUE_SHELF_KEY) || "[]"));
  } catch {
    return [];
  }
}

function newId() {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  } catch { /* use the non-identifying fallback below */ }
  return `rescue-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useRescueShelf = defineStore("rescueShelf", {
  state: () => ({
    records: loadRecords(),
    lastSavedId: null
  }),
  getters: {
    groups: state => groupShelf(state.records),
    outcomes: () => RESCUE_OUTCOMES,
    count: state => state.records.length
  },
  actions: {
    persist() {
      try { localStorage.setItem(RESCUE_SHELF_KEY, JSON.stringify(this.records)); } catch { /* on-device history is optional */ }
    },
    saveCurrent({ item, problems, boundary, future }) {
      const record = createRescueRecord({ id: newId(), item, problems, boundary, future });
      if (!record) return null;
      this.records.unshift(record);
      this.lastSavedId = record.id;
      this.persist();
      return record;
    },
    updateOutcome(id, outcome) {
      if (!RESCUE_OUTCOMES.some(option => option.id === outcome)) return false;
      const record = this.records.find(entry => entry.id === id);
      if (!record) return false;
      record.outcome = outcome;
      this.persist();
      return true;
    },
    remove(id) {
      const next = this.records.filter(record => record.id !== id);
      if (next.length === this.records.length) return false;
      this.records = next;
      this.persist();
      return true;
    },
    clear() {
      this.records = [];
      this.lastSavedId = null;
      try { localStorage.removeItem(RESCUE_SHELF_KEY); } catch { /* already clear in memory */ }
    }
  }
});
