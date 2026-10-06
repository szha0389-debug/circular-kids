<script setup>
// Epic 3 — compare the possible futures and choose one.
//
// Exploring and choosing used to be two screens, and both listed every option
// with the same "preserves / changes / loses" columns. The child read the same
// three columns twice before anything happened, so the screens are one: the
// details are open on the cards, and picking a card is the choice.
//
// The same screen serves the replay path from the item journey. It is the same
// question asked about the same options, so it is the same screen — only the
// wording and the way out change.

import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { futureContext } from "../../core/futures.js";
import { useFutures } from "@/stores/futures";
import { useInvestigation } from "@/stores/investigation";

const investigation = useInvestigation();
const futures = useFutures();
const route = useRoute();
const router = useRouter();

const returningToJourney = computed(() => route.query.returnTo === "journey");
const hasNewChoice = computed(() =>
  Boolean(futures.selected) && (!returningToJourney.value || futures.selectedId !== futures.replayFromId)
);
const boundary = computed(() => investigation.safetyResult?.label || "Safety check required");
const noticed = computed(
  () => futureContext(investigation).problems.map(problem => problem.label).join(", ") || "No problem noticed"
);

onMounted(async () => {
  if (!investigation.safetyResult?.label) await investigation.restoreSafetyResult();
  futures.prepare(futureContext(investigation));
});

// Choosing is also how an option is explored: the details are already open, so
// there is nothing left to unfold before a child can decide.
function choose(option) {
  futures.explore(option.id);
  futures.select(option.id);
}

function goBack() {
  if (returningToJourney.value) {
    futures.cancelReplay();
    router.push({ name: "item-journey" });
    return;
  }
  router.push({ name: "safety-boundary" });
}

function continueWithChoice() {
  if (!hasNewChoice.value) return;
  if (returningToJourney.value) {
    futures.completeReplay();
    router.push({ name: "item-journey" });
    return;
  }
  router.push({ name: "futures-result" });
}
</script>

<template>
  <section class="ck-compare">
    <p class="ck-eyebrow">Possible futures</p>
    <h1>{{ returningToJourney ? "Choose another future." : "What could happen next?" }}</h1>
    <p class="ck-lead">
      {{ returningToJourney
        ? "Only options allowed by your safety boundary are shown. Pick a different one to replay what may happen."
        : "Only options your safety boundary allows are shown. Read them, then pick the one that makes the most sense to you — the website will not choose for you." }}
    </p>

    <article v-if="!returningToJourney" class="ck-summary">
      <div><small>Item</small><strong>{{ investigation.item?.icon }} {{ investigation.item?.name }}</strong></div>
      <div><small>What you noticed</small><strong>{{ noticed }}</strong></div>
      <div><small>Safety boundary</small><strong>{{ boundary }}</strong></div>
    </article>

    <div class="ck-grid">
      <button
        v-for="option in futures.options"
        :key="option.id"
        type="button"
        class="ck-card ck-choice"
        :class="{ selected: futures.selectedId === option.id, previous: returningToJourney && futures.replayFromId === option.id }"
        :aria-pressed="futures.selectedId === option.id"
        @click="choose(option)"
      >
        <span class="ck-choice__icon" aria-hidden="true">{{ option.icon }}</span>
        <h2>{{ option.label }}</h2>
        <span v-if="returningToJourney && futures.replayFromId === option.id" class="ck-choice__previous">Current journey</span>
        <p class="ck-choice__text">{{ option.description }}</p>
        <dl>
          <div><dt>Preserves</dt><dd>{{ option.preserves }}</dd></div>
          <div><dt>Changes</dt><dd>{{ option.changes }}</dd></div>
          <div><dt>Loses</dt><dd>{{ option.loses }}</dd></div>
        </dl>
        <p v-if="option.adultRequired" class="ck-choice__adult">🙋 A trusted adult must help with this option.</p>
      </button>
    </div>

    <div class="ck-actions">
      <button class="btn btn-quiet" @click="goBack">← Back</button>
      <button class="btn btn-primary" :disabled="!hasNewChoice" @click="continueWithChoice">
        {{ returningToJourney ? "Replay this journey →" : "Choose this future →" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-compare h1 { margin-bottom: 8px; font-size: var(--ck-size-h1); }
.ck-lead { color: var(--ck-muted); }

.ck-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 22px 0 0; padding: 16px; border-radius: 18px; background: var(--ck-yellow-soft); }
.ck-summary small, .ck-summary strong { display: block; }
.ck-summary small { color: var(--ck-muted); font-size: var(--ck-size-micro); font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
.ck-summary strong { font-size: var(--ck-size-small); }

.ck-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 22px; }
.ck-choice { padding: 20px; text-align: left; color: inherit; background: #fff; transition: outline-color .2s ease, background-color .2s ease, transform .2s ease; }
.ck-choice:hover:not(.selected) { transform: translateY(-3px); }
.ck-choice.selected { outline: 4px solid var(--ck-teal); background: var(--ck-teal-soft); }
.ck-choice.previous:not(.selected) { background: var(--ck-surface-warm); }
.ck-choice__icon { font-size: 34px; }
.ck-choice h2 { margin: 6px 0 6px; font-size: 22px; }
.ck-choice__text { margin: 0 0 12px; color: var(--ck-muted); font-size: var(--ck-size-small); }
.ck-choice__previous { display: inline-block; margin-bottom: 10px; padding: 4px 9px; border-radius: 999px; background: var(--ck-yellow-soft); font-size: var(--ck-size-micro); font-weight: 900; }
.ck-choice dl { display: grid; gap: 8px; margin: 0; }
.ck-choice dl div { padding: 10px; border-radius: 12px; background: var(--ck-ground); }
.ck-choice dt { font-weight: 900; color: var(--ck-teal); font-size: var(--ck-size-mini); }
.ck-choice dd { margin: 2px 0 0; font-size: var(--ck-size-small); }
.ck-choice__adult { margin: 10px 0 0; padding: 9px 12px; border-radius: 12px; background: var(--ck-yellow-soft); font-size: var(--ck-size-mini); font-weight: 800; }
.ck-actions { margin-top: 22px; }

@media (max-width: 650px) {
  .ck-summary, .ck-grid { grid-template-columns: 1fr; }
}
</style>
