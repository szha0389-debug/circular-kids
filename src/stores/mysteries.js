import { defineStore } from "pinia";
import { MYSTERIES } from "../../core/mysteries.js";

// Only mystery ids are kept — no name, no answers, nothing about the child
// (AC4.3.1). Storage can be unavailable in a private window, so every read and
// write is allowed to fail without blocking the activity.
const DONE_KEY = "circularKidsMysteriesDone";

function loadDone() {
  try {
    const saved = JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(id => MYSTERIES.some(mystery => mystery.id === id)) : [];
  } catch {
    return [];
  }
}

export const useMysteries = defineStore("mysteries", {
  state: () => ({ done: loadDone() }),
  getters: {
    isDone: state => id => state.done.includes(id),
    doneCount: state => state.done.length
  },
  actions: {
    markDone(id) {
      if (this.done.includes(id)) return;
      this.done.push(id);
      try { localStorage.setItem(DONE_KEY, JSON.stringify(this.done)); } catch { /* progress is a nicety */ }
    }
  }
});
