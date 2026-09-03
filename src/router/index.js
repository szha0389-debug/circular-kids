import { createRouter, createWebHistory } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

// `step` drives the five-step indicator. Two screens share step 2 because the
// prototype splits US-1.2 into "look at the parts" and "say what's wrong".
const routes = [
  { path: "/", name: "welcome", component: () => import("@/views/WelcomeView.vue") },
  { path: "/identify", name: "identify", component: () => import("@/views/IdentifyView.vue"), meta: { step: 1 } },
  { path: "/breakdown", name: "breakdown", component: () => import("@/views/BreakdownView.vue"), meta: { step: 2, needs: "item" } },
  { path: "/problem", name: "problem", component: () => import("@/views/ProblemView.vue"), meta: { step: 2, needs: "item" } },
  { path: "/clues", name: "clues", component: () => import("@/views/CluesView.vue"), meta: { step: 3, needs: "problems" } },
  { path: "/verdict", name: "verdict", component: () => import("@/views/VerdictView.vue"), meta: { step: 4, needs: "problems" } },
  { path: "/reveal", name: "reveal", component: () => import("@/views/RevealView.vue"), meta: { step: 5, needs: "verdict" } },
  { path: "/handover", name: "handover", component: () => import("@/views/HandoverView.vue"), meta: { step: 5, needs: "handover" } },
  { path: "/safety", name: "safety-activity", component: () => import("@/views/SafetyActivityView.vue"), meta: { safetyStep: 1, needs: "safetyReady" } },
  { path: "/safety/reveal", name: "safety-reveal", component: () => import("@/views/SafetyRevealView.vue"), meta: { safetyStep: 2, needs: "safetyAnswered" } },
  { path: "/safety/compare", name: "safety-comparison", component: () => import("@/views/SafetyComparisonView.vue"), meta: { safetyStep: 3, needs: "safetyAnswered" } },
  { path: "/safety/boundary", name: "safety-boundary", component: () => import("@/views/SafetyBoundaryView.vue"), meta: { safetyStep: 4, needs: "comparisonAnswered" } },
  { path: "/:pathMatch(.*)*", redirect: "/" }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: "smooth" })
});

// The Definition of Done forbids any reachable screen that offers no way
// forward. Rather than render a broken step, send the child to the furthest
// point their case actually supports.
const GATES = {
  item: store => store.itemChosen,
  problems: store => store.problemsChosen,
  verdict: store => store.verdictRecorded,
  handover: store => Boolean(store.handover),
  safetyReady: store => store.safetyReady,
  safetyAnswered: store => store.safetyAnswered,
  comparisonAnswered: store => store.comparisonAnswered
};

const FALLBACK = {
  item: "identify",
  problems: "problem",
  verdict: "clues",
  handover: "reveal",
  safetyReady: "identify",
  safetyAnswered: "safety-activity",
  comparisonAnswered: "safety-comparison"
};

router.beforeEach(async to => {
  const store = useInvestigation();
  if (!store.ready) {
    try { await store.start(); } catch { return { name: "welcome" }; }
  }
  const needs = to.meta?.needs;
  if (!needs) return true;
  if (GATES[needs](store)) return true;
  return { name: FALLBACK[needs] };
});

export default router;
