<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { futureContext } from "../../core/futures.js";
import { journeyChange, journeyFor } from "../../core/journeys.js";
import { useFutures } from "@/stores/futures";
import { useInvestigation } from "@/stores/investigation";
import { useRescueShelf } from "@/stores/rescueShelf";

const router = useRouter();
const investigation = useInvestigation();
const futures = useFutures();
const shelf = useRescueShelf();
const saved = ref(false);

const context = computed(() => futureContext(investigation));
const boundaryLabel = computed(() => investigation.safetyResult?.label || "Ask a trusted adult");
const journey = computed(() => journeyFor({
  item: investigation.item,
  problems: context.value.problems,
  boundary: context.value.boundary,
  boundaryLabel: boundaryLabel.value,
  future: futures.selected
}));
const change = computed(() => journeyChange(
  futures.lastJourneyFrom,
  futures.selected,
  investigation.item?.name || "item"
));

onMounted(() => futures.markJourneySeen());

function changeChoice() {
  futures.beginReplay();
  router.push({ name: "futures-compare", query: { returnTo: "journey" } });
}

function saveToShelf() {
  const record = shelf.saveCurrent({
    item: investigation.item,
    problems: context.value.problems,
    boundary: investigation.safetyResult,
    future: futures.selected
  });
  saved.value = Boolean(record);
}
</script>

<template>
  <section v-if="journey" class="ck-journey">
    <p class="ck-eyebrow">My item's journey · Epic 5</p>
    <header class="ck-journey__heading">
      <span aria-hidden="true">{{ journey.icon }}</span>
      <div>
        <h1>What may happen to my {{ journey.itemName }}?</h1>
        <p>{{ journey.title }} after choosing <strong>{{ futures.selected.label }}</strong>.</p>
      </div>
    </header>

    <p class="ck-journey__simulation">
      <strong>This is a learning journey, not live tracking.</strong>
      It shows one possible pathway. The real result can be different.
    </p>

    <article v-if="change" class="ck-journey__change" aria-live="polite">
      <span aria-hidden="true">🔄</span>
      <div><strong>Here is the main change</strong><p>{{ change }}</p></div>
    </article>

    <dl class="ck-journey__context">
      <div><dt>What I noticed</dt><dd>{{ journey.noticed }}</dd></div>
      <div><dt>Safety boundary</dt><dd>{{ boundaryLabel }}</dd></div>
    </dl>

    <ol class="ck-journey__steps" aria-label="Possible item journey">
      <li v-for="step in journey.steps" :key="step.number">
        <span class="ck-journey__number">{{ step.number }}</span>
        <span class="ck-journey__icon" aria-hidden="true">{{ step.icon }}</span>
        <div><h2>{{ step.title }}</h2><p>{{ step.text }}</p></div>
      </li>
    </ol>

    <article class="ck-journey__outcome">
      <span aria-hidden="true">🌏</span>
      <div><h2>Possible outcome</h2><p>{{ journey.consequence }}</p></div>
    </article>
    <p class="ck-journey__uncertain"><strong>Why we say “may”:</strong> {{ journey.uncertainty }}</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="changeChoice">← Change my choice</button>
      <button type="button" class="btn btn-primary" :disabled="saved" @click="saveToShelf">
        {{ saved ? "Saved to My Rescue Shelf ✓" : "Save to My Rescue Shelf" }}
      </button>
    </div>
    <div class="ck-journey__finish">
      <RouterLink v-if="saved" :to="{ name: 'rescue-shelf' }">Open My Rescue Shelf →</RouterLink>
      <button type="button" @click="router.push({ name: 'welcome', hash: '#how-it-works' })">Finish Without Saving</button>
    </div>
  </section>
</template>

<style scoped>
.ck-journey__heading { display: flex; gap: 18px; align-items: center; margin-bottom: 18px; }
.ck-journey__heading > span { display: grid; place-items: center; flex: 0 0 74px; width: 74px; height: 74px; border-radius: 24px; background: var(--ck-green-soft); font-size: 40px; }
.ck-journey__heading h1 { margin: 0 0 4px; font-size: var(--ck-size-h1); }
.ck-journey__heading p { margin: 0; color: var(--ck-muted); }
.ck-journey__simulation, .ck-journey__uncertain { padding: 14px 17px; border-radius: var(--ck-radius-ctrl); background: var(--ck-yellow-soft); }
.ck-journey__change { display: flex; gap: 14px; margin: 16px 0; padding: 17px; border-radius: var(--ck-radius-ctrl); background: var(--ck-purple-soft); }
.ck-journey__change > span { font-size: 28px; }
.ck-journey__change p { margin: 3px 0 0; }
.ck-journey__context { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 18px 0 24px; }
.ck-journey__context div { padding: 13px 15px; border-radius: 14px; background: var(--ck-bg); }
.ck-journey__context dt { color: var(--ck-muted); font-size: var(--ck-size-micro); font-weight: 900; text-transform: uppercase; }
.ck-journey__context dd { margin: 3px 0 0; font-weight: 800; }
.ck-journey__steps { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.ck-journey__steps li { position: relative; display: grid; grid-template-columns: 32px 58px 1fr; gap: 12px; align-items: center; min-height: 104px; padding: 15px 0; }
.ck-journey__steps li:not(:last-child)::after { content: ""; position: absolute; left: 15px; top: 68px; bottom: -20px; width: 3px; border-radius: 3px; background: linear-gradient(var(--ck-teal), var(--ck-green)); }
.ck-journey__number { display: grid; place-items: center; z-index: 1; width: 32px; height: 32px; border-radius: 50%; background: var(--ck-ink); color: #fff; font-weight: 900; }
.ck-journey__icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 18px; background: var(--ck-teal-soft); font-size: 27px; }
.ck-journey__steps h2 { margin: 0 0 3px; font-size: 20px; }
.ck-journey__steps p { margin: 0; color: var(--ck-muted); }
.ck-journey__outcome { display: flex; gap: 14px; align-items: center; margin: 20px 0 12px; padding: 20px; border-radius: var(--ck-radius-card); background: var(--ck-green-soft); }
.ck-journey__outcome > span { font-size: 38px; }
.ck-journey__outcome h2, .ck-journey__outcome p { margin: 0; }
.ck-journey__finish { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-top: 14px; }
.ck-journey__finish a, .ck-journey__finish button { border: 0; background: none; color: var(--ck-muted); font-weight: 800; text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 600px) {
  .ck-journey__context { grid-template-columns: 1fr; }
  .ck-journey__steps li { grid-template-columns: 32px 1fr; }
  .ck-journey__icon { display: none; }
  .ck-actions, .ck-journey__finish { flex-direction: column; align-items: stretch; }
  .ck-journey__finish { text-align: center; }
}
</style>
