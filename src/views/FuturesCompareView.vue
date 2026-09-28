<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFutures } from "@/stores/futures";

const futures = useFutures();
const route = useRoute();
const router = useRouter();
const returningToJourney = computed(() => route.query.returnTo === "journey");
const hasNewChoice = computed(() =>
  Boolean(futures.selected) && (!returningToJourney.value || futures.selectedId !== futures.replayFromId)
);

function goBack() {
  if (returningToJourney.value) {
    futures.cancelReplay();
    router.push({ name: "item-journey" });
    return;
  }
  router.push({ name: "futures-explore" });
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
    <p class="ck-eyebrow">Possible futures · Step 2</p>
    <h1>{{ returningToJourney ? "Choose another future." : "Compare, then make your choice." }}</h1>
    <p class="ck-lead">
      {{ returningToJourney
        ? "Only options allowed by your safety boundary are shown. Pick a different one to replay what may happen."
        : "There is no right or wrong option selected for you. Choose what makes the most sense to you." }}
    </p>
    <div class="ck-grid">
      <button
        v-for="option in futures.options"
        :key="option.id"
        type="button"
        class="ck-card ck-choice"
        :class="{ selected: futures.selectedId === option.id, previous: returningToJourney && futures.replayFromId === option.id }"
        @click="futures.select(option.id)"
      >
        <span>{{ option.icon }}</span>
        <h2>{{ option.label }}</h2>
        <span v-if="returningToJourney && futures.replayFromId === option.id" class="ck-choice__previous">Current journey</span>
        <dl>
          <div><dt>Preserves</dt><dd>{{ option.preserves }}</dd></div>
          <div><dt>Changes</dt><dd>{{ option.changes }}</dd></div>
          <div><dt>Loses</dt><dd>{{ option.loses }}</dd></div>
        </dl>
        <p v-if="option.adultRequired">🙋 Adult help required</p>
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
.ck-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 24px; }
.ck-choice { padding: 20px; text-align: left; color: inherit; background: #fff; }
.ck-choice.selected { outline: 4px solid var(--ck-teal); background: var(--ck-teal-soft); }
.ck-choice.previous:not(.selected) { background: var(--ck-surface-warm); }
.ck-choice > span:first-child { font-size: 34px; }
.ck-choice h2 { margin: 6px 0 8px; }
.ck-choice__previous { display: inline-block; margin-bottom: 10px; padding: 4px 9px; border-radius: 999px; background: var(--ck-yellow-soft); font-size: var(--ck-size-micro); font-weight: 900; }
.ck-choice dl { display: grid; gap: 8px; }
.ck-choice dl div { padding: 10px; border-radius: 12px; background: #fff; }
.ck-choice dt { font-weight: 900; color: var(--ck-teal); }
.ck-choice dd { margin: 2px 0 0; }
.ck-choice > p { font-weight: 800; color: var(--ck-muted); }
.ck-actions { margin-top: 22px; }
@media (max-width: 650px) { .ck-grid { grid-template-columns: 1fr; } }
</style>
