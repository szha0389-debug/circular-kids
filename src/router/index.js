import { createRouter, createWebHashHistory } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import { useFutures } from "@/stores/futures";
import { findMystery } from "../../core/mysteries.js";
import { chunkRecoveryUrl, isChunkLoadError } from "./chunkRecovery.js";

const CHUNK_RECOVERY_KEY = "circular-kids-chunk-recovery";

// Hash routing keeps static hosting simple, but people may still type or share
// a direct path such as `/identify` or `/abc`. Move that path behind the hash
// before Vue reads it: known paths keep working and unknown ones reach the 404
// route instead of accidentally opening the homepage.
if (typeof window !== "undefined" && window.location.pathname !== "/" && !window.location.hash) {
  const directUrl = new URL(window.location.href);
  const routePath = `${directUrl.pathname}${directUrl.search}`;
  directUrl.pathname = "/";
  directUrl.search = "";
  directUrl.hash = routePath;
  window.history.replaceState(window.history.state, "", directUrl);
}

// `step` drives the five-step indicator. Two screens share step 2 because the
// prototype splits US-1.2 into "look at the parts" and "say what's wrong".
const routes = [
  { path: "/", name: "welcome", component: () => import("@/views/WelcomeView.vue") },
  { path: "/identify", name: "identify", component: () => import("@/views/IdentifyView.vue"), meta: { step: 1 } },
  { path: "/breakdown", redirect: { name: "problem" } },
  { path: "/problem", name: "problem", component: () => import("@/views/ProblemView.vue"), meta: { step: 2, needs: "item" } },
  { path: "/clues", name: "clues", component: () => import("@/views/CluesView.vue"), meta: { step: 3, needs: "problems" } },
  { path: "/verdict", name: "verdict", component: () => import("@/views/VerdictView.vue"), meta: { step: 4, needs: "problems" } },
  { path: "/reveal", name: "reveal", component: () => import("@/views/RevealView.vue"), meta: { step: 5, needs: "verdict" } },
  // The findings used to sit on a screen of their own after the reveal. They
  // say the same thing, so they now share one screen and this path only keeps
  // older links working.
  { path: "/handover", redirect: { name: "reveal" } },
  { path: "/safety", name: "safety-activity", component: () => import("@/views/SafetyActivityView.vue"), meta: { safetyStep: 1, needs: "safetyReady" } },
  // The warning sign is now explained in place, on the screen that asked about
  // it, rather than on a screen of its own.
  { path: "/safety/reveal", redirect: { name: "safety-activity" } },
  { path: "/safety/compare", name: "safety-comparison", component: () => import("@/views/SafetyComparisonView.vue"), meta: { safetyStep: 2, needs: "safetyAnswered" } },
  { path: "/safety/boundary", name: "safety-boundary", component: () => import("@/views/SafetyBoundaryView.vue"), meta: { safetyStep: 3, needs: "comparisonAnswered" } },
  // Exploring the options and choosing between them were two screens showing
  // the same three columns. One screen, reached by both paths: `/futures` to
  // choose, `/futures/compare?returnTo=journey` to swap a choice already made.
  { path: "/futures", name: "futures-explore", component: () => import("@/views/FuturesCompareView.vue"), meta: { needs: "safetyBoundary" } },
  { path: "/futures/compare", name: "futures-compare", component: () => import("@/views/FuturesCompareView.vue"), meta: { needs: "safetyBoundary" } },
  { path: "/futures/result", name: "futures-result", component: () => import("@/views/FuturesResultView.vue"), meta: { needs: "futureSelected" } },
  { path: "/journey", name: "item-journey", component: () => import("@/views/ItemJourneyView.vue"), meta: { needs: "futureSelected" } },
  // Epic 6 is on-device and can be opened without an active investigation.
  { path: "/rescue-shelf", name: "rescue-shelf", component: () => import("@/views/RescueShelfView.vue"), meta: { standalone: true } },
  // Epic 4 stands on its own: it needs no open case, so it never waits on the API.
  { path: "/quiz", name: "mystery-hub", component: () => import("@/views/MysteryHubView.vue"), meta: { standalone: true } },
  {
    path: "/quiz/:id",
    name: "mystery",
    component: () => import("@/views/MysteryChallengeView.vue"),
    meta: { standalone: true },
    beforeEnter: to => (findMystery(to.params.id) ? true : { name: "mystery-hub" })
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { standalone: true }
  }
];

const router = createRouter({
  // Hash history keeps every client-side screen behind the real `/` document.
  // Static hosts therefore never receive `/problem`, `/safety`, etc. as file
  // requests when the child refreshes or opens a copied link.
  history: createWebHashHistory(),
  routes,
  scrollBehavior: to => to.hash
    ? { el: to.hash, top: 72, behavior: "smooth" }
    : { top: 0, behavior: "smooth" }
});

// The Definition of Done forbids any reachable screen that offers no way
// forward. Rather than render a broken step, send the child to the furthest
// point their case actually supports.
const GATES = {
  item: store => store.itemChosen,
  problems: store => store.problemsChosen,
  verdict: store => store.verdictRecorded,
  safetyReady: store => store.safetyReady,
  safetyAnswered: store => store.safetyAnswered,
  comparisonAnswered: store => store.comparisonAnswered,
  safetyBoundary: store => store.safetyBoundarySet,
  futureSelected: () => Boolean(useFutures().selected)
};

const FALLBACK = {
  item: "identify",
  problems: "problem",
  verdict: "clues",
  safetyReady: "identify",
  safetyAnswered: "safety-activity",
  comparisonAnswered: "safety-comparison",
  safetyBoundary: "safety-boundary",
  futureSelected: "futures-compare"
};

router.beforeEach(async to => {
  if (to.meta?.standalone) return true;
  const store = useInvestigation();
  if (!store.ready) {
    try { await store.start(); } catch { return { name: "welcome" }; }
  }
  const needs = to.meta?.needs;
  if (!needs) return true;
  if (GATES[needs](store)) return true;
  return { name: FALLBACK[needs] };
});

// A branch alias can switch to a new Vercel deployment while an older page is
// still open. Its next lazy route then points at an old hashed file that the
// alias no longer serves. Reload once at the requested route so the browser
// picks up the new index and matching assets instead of leaving a button stuck.
router.onError((error, to) => {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return;

  const target = to?.fullPath || window.location.hash.slice(1) || "/";
  let previousTarget = "";
  try {
    previousTarget = sessionStorage.getItem(CHUNK_RECOVERY_KEY) || "";
  } catch {
    // Storage may be unavailable; reloading the matching route is still safe.
  }

  if (previousTarget === target) {
    try { sessionStorage.removeItem(CHUNK_RECOVERY_KEY); } catch {}
    useInvestigation().say("This page could not finish updating. Please refresh and try again.", "warn");
    return;
  }

  try { sessionStorage.setItem(CHUNK_RECOVERY_KEY, target); } catch {}
  window.location.replace(chunkRecoveryUrl(window.location.href, target));
});

router.afterEach(() => {
  try { sessionStorage.removeItem(CHUNK_RECOVERY_KEY); } catch {}
});

export default router;
