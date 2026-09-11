<script setup>
// US-1.5 — See the reasoning, then carry on.
//
// The child's verdict and the site's reasoning sit in two cards of equal size
// and equal weight; neither is presented as the answer. When they differ, the
// screen names the one clue that pulls the other way and stops — it does not
// argue, rank or resolve. No wording marks a verdict right, wrong, correct or
// incorrect: several of these judgements have more than one defensible answer.

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();
const loadError = ref("");

onMounted(async () => {
  if (store.reveal) return;
  try {
    await store.restoreReveal();
  } catch {
    loadError.value = "Your result could not load. Go back and choose your verdict again.";
  }
});

const LABELS = {
  "still-useful": "Still Useful",
  "partly-useful": "Partly Useful",
  unusable: "Completely Unusable",
  "not-sure": "Not Sure"
};
const ICONS = {
  "still-useful": "🟢",
  "partly-useful": "🟠",
  unusable: "🔴",
  "not-sure": "🤔"
};

const reveal = computed(() => store.reveal);
const comparison = computed(() => reveal.value?.comparison);
const tentative = computed(() => reveal.value?.reasoning?.lowInformation);
const systemOutcome = computed(() => reveal.value?.reasoning?.outcome || {
  title: "Continue to the Safety Check",
  detail: reveal.value?.reasoning?.conclusion || "Check the item before deciding what to do next."
});

async function carryOn() {
  await store.handOver();
  router.push({ name: "handover" });
}

async function startAgain() {
  await store.closeCase();
  await store.start();
  router.push({ name: "welcome" });
}
</script>

<template>
  <section v-if="reveal">
    <h1>Your result and the next step</h1>
    <p class="ck-lead">
      First, see what you chose. Then follow the system suggestion below.
    </p>

    <div class="ck-compare">
      <article class="ck-card ck-compare__card ck-compare__card--mine">
        <p class="ck-eyebrow">Your verdict</p>
        <span class="ck-compare__icon" aria-hidden="true">{{ ICONS[store.verdict] }}</span>
        <p class="ck-compare__value">{{ LABELS[store.verdict] }}</p>
      </article>

      <article class="ck-card ck-compare__card ck-compare__card--clues">
        <p class="ck-eyebrow">System suggestion</p>
        <span class="ck-compare__icon" aria-hidden="true">💡</span>
        <p class="ck-compare__value">{{ systemOutcome.title }}</p>
        <p class="ck-compare__detail">{{ systemOutcome.detail }}</p>
      </article>
    </div>

    <article class="ck-simple-compare" :class="comparison?.differs ? 'is-different' : 'is-aligned'">
      <span class="ck-simple-compare__icon" aria-hidden="true">{{ comparison?.differs ? "↔️" : "✓" }}</span>
      <div>
        <p class="ck-eyebrow">Simple comparison</p>
        <h2>{{ comparison?.differs ? "You chose something different" : "Your choice is similar" }}</h2>
        <p>
          {{ comparison?.differs
            ? "That is okay. Keep your answer, then use the Safety Check before deciding what to do."
            : "Your answer and the system result point to the same next step." }}
        </p>
      </div>
    </article>

    <div v-if="tentative" class="ck-note">
      <span aria-hidden="true">🤔</span>
      <p>There was not much to go on this time, so what the clues suggest stays a guess.</p>
    </div>

    <p class="ck-boundary">
      Next: check whether the item is safe before anyone touches or uses it.
    </p>

    <button type="button" class="btn btn-primary w-100" :disabled="store.busy" @click="carryOn">
      Continue to Safety Check →
    </button>

    <button type="button" class="btn btn-link ck-again" @click="startAgain">
      Start a new investigation instead
    </button>
  </section>

  <section v-else class="ck-result-state">
    <span aria-hidden="true">{{ loadError ? "↩️" : "🔎" }}</span>
    <h1>{{ loadError ? "We could not open your result" : "Loading your result…" }}</h1>
    <p>{{ loadError || "Your answers are being checked." }}</p>
    <button v-if="loadError" type="button" class="btn btn-primary" @click="router.push({ name: 'verdict' })">
      Back to My Verdict
    </button>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-lead { margin-bottom: var(--ck-gap-md); }

.ck-compare {
  display: grid;
  gap: var(--ck-gap-sm);
  margin-bottom: 22px;
}
@media (min-width: 480px) {
  /* Equal width, equal weight: neither card is the answer. */
  .ck-compare { grid-template-columns: 1fr 1fr; }
}

.ck-compare__card { text-align: center; padding: 16px; }
.ck-compare__card--mine { --ck-accent: var(--ck-green); }
.ck-compare__card--clues { --ck-accent: var(--ck-yellow); }

.ck-compare__icon { display: block; font-size: 26px; margin-bottom: 6px; }
.ck-compare__value {
  margin: 0;
  font-family: var(--ck-font-display);
  font-size: var(--ck-size-body);
  font-weight: 700;
  color: var(--ck-ink);
  line-height: 1.3;
}
.ck-compare__value--text {
  font-family: var(--ck-font-body);
  font-weight: 700;
  font-size: var(--ck-size-small);
}
.ck-compare__detail { max-width: 34ch; margin: 8px auto 0; color: var(--ck-muted); font-size: var(--ck-size-mini); line-height: 1.5; }

.ck-simple-compare { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; margin-bottom: 22px; padding: 22px; border: 1px solid var(--ck-border); border-radius: 22px; background: #fff; }
.ck-simple-compare.is-aligned { border-top: 5px solid var(--ck-green); }
.ck-simple-compare.is-different { border-top: 5px solid var(--ck-yellow); }
.ck-simple-compare__icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 17px; background: var(--ck-yellow-soft); font-size: 25px; font-weight: 900; }
.ck-simple-compare h2 { margin: 0 0 5px; font-size: var(--ck-size-h2); }
.ck-simple-compare p { margin: 0; color: var(--ck-muted); font-size: var(--ck-size-small); }
.ck-simple-compare .ck-eyebrow { margin-bottom: 4px; }

.ck-boundary {
  margin: var(--ck-gap-md) 0;
  text-align: center;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}

.ck-again {
  display: block;
  margin: var(--ck-gap-sm) auto 0;
  color: var(--ck-muted);
  font-size: var(--ck-size-mini);
  font-weight: 700;
  text-underline-offset: 3px;
}
.ck-result-state { min-height: 310px; display: grid !important; place-content: center; justify-items: center; gap: 10px; text-align: center; }
.ck-result-state > span { font-size: 42px; }.ck-result-state h1, .ck-result-state p { margin: 0; }.ck-result-state p { color: var(--ck-muted); }
</style>
