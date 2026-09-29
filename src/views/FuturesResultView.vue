<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { futureContext } from "../../core/futures.js";
import { useFutures } from "@/stores/futures";
import { useInvestigation } from "@/stores/investigation";
import { useRescueShelf } from "@/stores/rescueShelf";

const investigation = useInvestigation();
const futures = useFutures();
const shelf = useRescueShelf();
const router = useRouter();
const saved = ref(false);
const boundary = computed(() => investigation.safetyResult?.label || "Ask an Adult");
const problems = computed(() => futureContext(investigation).problems);

function saveToShelf() {
  const record = shelf.saveCurrent({
    item: investigation.item,
    problems: problems.value,
    boundary: investigation.safetyResult,
    future: futures.selected
  });
  saved.value = Boolean(record);
}

function finish() {
  router.push({ name: "welcome", hash: "#how-it-works" });
}
</script>

<template>
  <section v-if="futures.selected" class="ck-result">
    <p class="ck-eyebrow">Possible futures · Your decision</p>
    <article class="ck-card ck-result__hero">
      <span>{{ futures.selected.icon }}</span>
      <div><small>You chose</small><h1>{{ futures.selected.label }}</h1><p>This is your choice — it is not marked right or wrong.</p></div>
    </article>
    <article class="ck-card">
      <h2>Why this may make sense</h2>
      <p>{{ futures.selected.reason }}</p>
      <p><strong>Safety boundary:</strong> {{ boundary }}</p>
    </article>
    <article class="ck-next">
      <small>One clear next step</small>
      <strong>{{ futures.selected.nextStep }}</strong>
    </article>

    <article class="ck-journey-link">
      <span aria-hidden="true">🗺️</span>
      <div><h2>See what may happen after this choice</h2><p>Follow a short learning journey beyond this first step.</p></div>
      <button type="button" class="btn btn-primary" @click="router.push({ name: 'item-journey' })">See This Item's Journey →</button>
    </article>

    <div class="ck-actions">
      <button class="btn btn-quiet" @click="router.push({ name: 'futures-compare' })">← Change my choice</button>
      <button class="btn btn-primary" :disabled="saved" @click="saveToShelf">
        {{ saved ? "Saved to My Rescue Shelf ✓" : "Save to My Rescue Shelf" }}
      </button>
    </div>
    <div class="ck-result__finish">
      <RouterLink v-if="saved" :to="{ name: 'rescue-shelf' }">Open My Rescue Shelf →</RouterLink>
      <button type="button" @click="finish">Back to Stage Cards</button>
    </div>
  </section>
</template>

<style scoped>
.ck-result__hero { display: flex; gap: 20px; align-items: center; margin-bottom: 16px; background: var(--ck-purple-soft); }
.ck-result__hero > span { font-size: 60px; }
.ck-result__hero small { color: var(--ck-muted); font-weight: 900; }
.ck-result__hero h1 { margin: 2px 0; font-size: var(--ck-size-h1); }
.ck-result > .ck-card { margin-bottom: 16px; }
.ck-next { padding: 22px; border-left: 6px solid var(--ck-yellow); border-radius: var(--ck-radius-card); background: var(--ck-yellow-soft); }
.ck-next small, .ck-next strong { display: block; }
.ck-next small { color: var(--ck-muted); font-weight: 900; text-transform: uppercase; }
.ck-next strong { margin-top: 5px; font-size: 20px; }
.ck-journey-link { display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; align-items: center; margin-top: 16px; padding: 20px; border-radius: var(--ck-radius-card); background: var(--ck-green-soft); }
.ck-journey-link > span { grid-row: 1 / 3; font-size: 42px; }
.ck-journey-link h2, .ck-journey-link p { margin: 0; }
.ck-journey-link h2 { font-size: 21px; }
.ck-journey-link p { color: var(--ck-muted); }
.ck-journey-link .btn { grid-column: 1 / -1; margin-top: 8px; }
.ck-actions { margin-top: 22px; }
.ck-result__finish { display: flex; justify-content: space-between; gap: 14px; margin-top: 14px; }
.ck-result__finish a, .ck-result__finish button { border: 0; background: none; color: var(--ck-muted); font-weight: 800; text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 600px) { .ck-actions, .ck-result__finish { flex-direction: column; text-align: center; } }
</style>
