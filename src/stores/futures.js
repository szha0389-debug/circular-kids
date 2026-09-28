import { defineStore } from "pinia";
import { suitableFutures } from "../../core/futures.js";

export const useFutures = defineStore("futures", {
  state: () => ({
    options: [],
    explored: [],
    selectedId: null,
    replayFromId: null,
    lastJourneyFromId: null,
    journeySeen: false
  }),
  getters: {
    selected: state => state.options.find(option => option.id === state.selectedId) || null,
    replayFrom: state => state.options.find(option => option.id === state.replayFromId) || null,
    lastJourneyFrom: state => state.options.find(option => option.id === state.lastJourneyFromId) || null,
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
    },
    beginReplay() {
      this.replayFromId = this.selectedId;
      this.lastJourneyFromId = null;
    },
    cancelReplay() {
      if (this.replayFromId) this.selectedId = this.replayFromId;
      this.replayFromId = null;
    },
    completeReplay() {
      this.lastJourneyFromId = this.replayFromId;
      this.replayFromId = null;
    },
    markJourneySeen() {
      this.journeySeen = true;
    }
  }
});
