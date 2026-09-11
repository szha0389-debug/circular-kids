import { defineStore } from "pinia";
import { suitableFutures } from "../../core/futures.js";

export const useFutures = defineStore("futures", {
  state: () => ({ options: [], explored: [], selectedId: null }),
  getters: {
    selected: state => state.options.find(option => option.id === state.selectedId) || null,
    hasExplored: state => state.explored.length > 0
  },
  actions: {
    prepare(context) {
      this.options = suitableFutures(context);
      this.explored = this.explored.filter(id => this.options.some(option => option.id === id));
      if (!this.options.some(option => option.id === this.selectedId)) this.selectedId = null;
    },
    explore(id) {
      if (!this.explored.includes(id)) this.explored.push(id);
    },
    select(id) {
      if (this.options.some(option => option.id === id)) this.selectedId = id;
    }
  }
});
