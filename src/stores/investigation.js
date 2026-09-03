// The case, client side.
//
// Two things this store deliberately does NOT hold:
//   - the site's reasoning before the verdict is recorded. `reveal` is fetched
//     only after `recordVerdict` has succeeded, so no screen can render an
//     assessment early even by accident (US-1.4).
//   - the photo, anywhere persistent. It lives as an object URL and is revoked
//     when the case closes or the page unloads.

import { defineStore } from "pinia";
import { api, ApiError } from "@/api/client";

const RECOGNITION_TIMEOUT_MS = 8000;
const CASE_KEY = "circularKidsInvestigationId";
export const MAX_IMAGE_BYTES = 6_000_000;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const useInvestigation = defineStore("investigation", {
  state: () => ({
    id: null,
    ready: false,

    categories: [],

    // Photo — session only.
    photoUrl: null,
    photoName: "",

    // Recognition
    suggestion: null,
    recognitionReason: null,
    attempts: 0,

    // Case
    item: null,
    breakdown: null,
    problemOptions: [],
    problems: [],
    questions: [],
    answers: [],
    verdict: null,

    // Reveal — populated only after the verdict is recorded.
    reveal: null,
    handover: null,

    // Epic 2 — persisted answers are loaded from the API after refresh.
    safetyActivity: null,
    safetyResponse: null,
    safetyReveal: null,
    safetyComparison: null,
    comparisonResponse: null,
    safetyResult: null,
    safetyStage: null,

    busy: false,
    notice: "",
    noticeTone: "info"
  }),

  getters: {
    hasPhoto: state => Boolean(state.photoUrl),
    itemChosen: state => Boolean(state.item),
    problemsChosen: state => state.problems.length > 0,
    verdictRecorded: state => Boolean(state.verdict),
    safetyReady: state => Boolean(state.id && state.item),
    safetyAnswered: state => Boolean(state.safetyResponse),
    comparisonAnswered: state => Boolean(state.comparisonResponse),
    safetyBoundarySet: state => Boolean(state.safetyResult?.boundary || state.safetyResult?.safetyBoundary),
    /** US-1.3: a case where every clue was skipped still proceeds, flagged. */
    allSkipped: state =>
      state.questions.length > 0 &&
      state.answers.every(answer => answer === "skipped" || answer == null)
  },

  actions: {
    say(message, tone = "info") {
      this.notice = message;
      this.noticeTone = tone;
    },

    async start() {
      if (this.ready) return;
      const catalogue = await api.catalogue();
      this.categories = catalogue.categories;

      const savedId = localStorage.getItem(CASE_KEY);
      if (savedId) {
        try {
          const record = await api.get(savedId);
          this.id = record.id;
          this.problems = record.problems || [];
          this.answers = record.answers || [];
          this.verdict = record.verdict || null;
          const view = record.itemId ? await api.caseView(record.id) : null;
          if (view?.item) {
            this.item = view.item;
            this.breakdown = view.breakdown;
            this.problemOptions = view.problems;
            this.questions = view.questions;
          }
          const status = await api.safetyStatus(record.id);
          this.safetyStage = status.stage;
          this.safetyResponse = status.safetyResponse;
          this.comparisonResponse = status.comparisonResponse;
          if (status.safetyBoundary) this.safetyResult = status;
          this.ready = true;
          return;
        } catch {
          localStorage.removeItem(CASE_KEY);
        }
      }

      const opened = await api.open();
      this.id = opened.id;
      localStorage.setItem(CASE_KEY, opened.id);
      this.ready = true;
    },

    /** Accepts a File, keeps it in memory only. Returns an error string or null. */
    attachPhoto(file) {
      if (!file) return null;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return "That kind of picture does not work here. Try a JPEG, PNG or WebP.";
      }
      if (file.size === 0) return "That picture looks empty. Try another one.";
      if (file.size > MAX_IMAGE_BYTES) return "That picture is a bit too big. Try one under 6 MB.";

      this.releasePhoto();
      this.photoUrl = URL.createObjectURL(file);
      this.photoName = file.name;
      this._file = file;
      return null;
    },

    releasePhoto() {
      if (this.photoUrl) URL.revokeObjectURL(this.photoUrl);
      this.photoUrl = null;
      this._file = null;
    },

    /**
     * Ask what the item might be. Every unhappy path resolves to
     * `{ suggested: false }` — the caller routes to the item list and never
     * shows an error screen.
     */
    async identify() {
      if (!this._file) return { suggested: false };
      this.busy = true;
      this.attempts += 1;
      try {
        const result = await api.recognise(this.id, this._file, RECOGNITION_TIMEOUT_MS);
        if (result.suggestion) {
          this.suggestion = result.suggestion;
          this.recognitionReason = null;
          return { suggested: true };
        }
        this.suggestion = null;
        this.recognitionReason = result.reason || "no-match";
        return { suggested: false };
      } catch (error) {
        // A timeout is not an error the child needs to hear about.
        this.suggestion = null;
        this.recognitionReason = error instanceof ApiError ? "no-match" : "timeout";
        return { suggested: false };
      } finally {
        this.busy = false;
      }
    },

    /** Confirming a suggestion and picking from the list land in the same place. */
    async chooseItem(itemId) {
      this.busy = true;
      try {
        await api.patch(this.id, { itemId, stage: "breakdown" });
        const view = await api.caseView(this.id);
        this.item = view.item;
        this.breakdown = view.breakdown;
        this.problemOptions = view.problems;
        this.problems = [];
        this.answers = [];
        this.questions = [];
        this.verdict = null;
        this.reveal = null;
      } finally {
        this.busy = false;
      }
    },

    /** US-1.2: more than one thing may be wrong. */
    toggleProblem(problemId) {
      const at = this.problems.indexOf(problemId);
      if (at === -1) this.problems.push(problemId);
      else this.problems.splice(at, 1);
    },

    async confirmProblems() {
      this.busy = true;
      try {
        await api.patch(this.id, { problems: this.problems, stage: "clues" });
        const view = await api.caseView(this.id);
        this.questions = view.questions;
        this.answers = new Array(view.questions.length).fill(null);
      } finally {
        this.busy = false;
      }
    },

    /**
     * Record an answer. This action stores and returns — it must not produce any
     * reaction, hint or encouragement, because that would leak the conclusion
     * before the child has committed a verdict (US-1.3).
     */
    answer(index, value) {
      this.answers[index] = value;
    },

    skip(index) {
      this.answers[index] = "skipped";
    },

    async saveAnswers() {
      await api.patch(this.id, { answers: this.answers, stage: "verdict" });
    },

    /** US-1.4. The reveal is fetched only once this has succeeded. */
    async recordVerdict(value) {
      this.busy = true;
      try {
        this.verdict = value;
        await api.patch(this.id, { verdict: value, stage: "reveal" });
        this.reveal = await api.reveal(this.id);
      } finally {
        this.busy = false;
      }
    },

    async handOver() {
      this.busy = true;
      try {
        this.handover = await api.transfer(this.id);
        this.releasePhoto();
        return this.handover;
      } finally {
        this.busy = false;
      }
    },

    async loadSafetyActivity() {
      this.busy = true;
      try {
        this.safetyActivity = await api.safetyActivity(this.id);
        return this.safetyActivity;
      } finally {
        this.busy = false;
      }
    },

    async recordSafetyResponse(value) {
      this.busy = true;
      try {
        await api.patch(this.id, { safetyResponse: value, stage: "safety-reveal" });
        this.safetyResponse = value;
        this.safetyReveal = await api.safetyReveal(this.id);
        this.safetyStage = "safety-reveal";
        return this.safetyReveal;
      } finally {
        this.busy = false;
      }
    },

    async loadSafetyComparison() {
      this.safetyComparison = await api.safetyComparison(this.id);
      return this.safetyComparison;
    },

    async recordComparisonResponse(value) {
      this.busy = true;
      try {
        await api.patch(this.id, { comparisonResponse: value, stage: "safety-boundary" });
        this.comparisonResponse = value;
        this.safetyResult = await api.safetyBoundary(this.id);
        this.safetyStage = "safety-boundary";
        return this.safetyResult;
      } finally {
        this.busy = false;
      }
    },

    async restoreSafetyResult() {
      if (!this.safetyResponse || !this.comparisonResponse) return null;
      this.safetyResult = await api.safetyBoundary(this.id);
      return this.safetyResult;
    },

    async closeCase() {
      try {
        if (this.id) await api.complete(this.id);
      } catch {
        // Closing is best-effort; the photo is released either way.
      }
      this.releasePhoto();
      localStorage.removeItem(CASE_KEY);
      this.$reset();
    }
  }
});
