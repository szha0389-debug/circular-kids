<script setup>
// US-1.5 — See the reasoning, then carry on.
//
// The child's verdict and the site's reasoning sit in two cards of equal size
// and equal weight; neither is presented as the answer. When they differ, the
// screen names the one clue that pulls the other way and stops — it does not
// argue, rank or resolve. No wording marks a verdict right, wrong, correct or
// incorrect: several of these judgements have more than one defensible answer.

import { computed } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();

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

const problemLabels = computed(() =>
  store.problems
    .map(id => store.problemOptions.find(p => p.id === id)?.label || "Not sure")
    .join(", ")
);

/** Answers as the child gave them, with no colour that implies a meaning. */
const answerRows = computed(() =>
  store.questions.map((q, i) => {
    const value = store.answers[i];
    const option = q.options.find(o => o.value === value);
    return {
      question: q.text,
      answer: value === "skipped" || value == null ? "Skipped" : option?.label || value
    };
  })
);

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
    <h1>Your verdict vs the evidence</h1>
    <p class="ck-lead">
      Here is how your verdict compares with what the clues suggest — and what they mean
      together.
    </p>

    <div class="ck-compare">
      <article class="ck-card ck-compare__card ck-compare__card--mine">
        <p class="ck-eyebrow">Your verdict</p>
        <span class="ck-compare__icon" aria-hidden="true">{{ ICONS[store.verdict] }}</span>
        <p class="ck-compare__value">{{ LABELS[store.verdict] }}</p>
      </article>

      <article class="ck-card ck-compare__card ck-compare__card--clues">
        <p class="ck-eyebrow">Evidence suggests</p>
        <span class="ck-compare__icon" aria-hidden="true">🔍</span>
        <p class="ck-compare__value ck-compare__value--text">{{ reveal.reasoning.conclusion }}</p>
      </article>
    </div>

    <article class="ck-card ck-block ck-block--teal">
      <p class="ck-eyebrow">What we investigated</p>
      <p class="ck-block__row"><span aria-hidden="true">📦</span> <strong>Item:</strong> {{ store.item?.name }}</p>
      <p class="ck-block__row"><span aria-hidden="true">🔎</span> <strong>Suspected problem:</strong> {{ problemLabels }}</p>
    </article>

    <article class="ck-card ck-block ck-block--blue">
      <p class="ck-eyebrow">Clue answers</p>
      <div v-for="(row, i) in answerRows" :key="i" class="ck-answer">
        <p class="ck-answer__q">{{ row.question }}</p>
        <span class="ck-answer__pill">{{ row.answer }}</span>
      </div>
    </article>

    <article class="ck-card ck-block" :class="comparison?.differs ? 'ck-block--yellow' : 'ck-block--green'">
      <p class="ck-eyebrow">
        {{ comparison?.differs ? "Your verdict and the evidence differ" : "Your verdict and the evidence line up" }}
      </p>
      <template v-if="comparison?.differs && comparison.clue">
        <p class="ck-block__lead">The clue pulling the other way is:</p>
        <p class="ck-block__quote">{{ comparison.clue.question }}</p>
        <p class="ck-block__answer">You said: <strong>{{ comparison.clue.answer }}</strong></p>
      </template>
      <p class="ck-block__foot">
        Both readings can be reasonable — there is not always one answer when you are
        investigating an item by looking at it. Your verdict stands exactly as you
        recorded it.
      </p>
    </article>

    <div v-if="tentative" class="ck-note">
      <span aria-hidden="true">🤔</span>
      <p>There was not much to go on this time, so what the clues suggest stays a guess.</p>
    </div>

    <p class="ck-boundary">
      No repair, reuse or disposal advice is given here. That comes next, in the safety check.
    </p>

    <button type="button" class="btn btn-primary w-100" :disabled="store.busy" @click="carryOn">
      Continue to Safety Check →
    </button>

    <button type="button" class="btn btn-link ck-again" @click="startAgain">
      Start a new investigation instead
    </button>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-lead { margin-bottom: var(--ck-gap-md); }

.ck-compare {
  display: grid;
  gap: var(--ck-gap-sm);
  margin-bottom: var(--ck-gap-sm);
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
  font-weight: 900;
  color: var(--ck-ink);
  line-height: 1.3;
}
.ck-compare__value--text {
  font-family: var(--ck-font-body);
  font-weight: 700;
  font-size: var(--ck-size-small);
}

.ck-block { margin-bottom: var(--ck-gap-sm); }
.ck-block--teal { --ck-accent: var(--ck-teal); }
.ck-block--blue { --ck-accent: var(--ck-blue); }
.ck-block--yellow { --ck-accent: var(--ck-yellow); }
.ck-block--green { --ck-accent: var(--ck-green); }

.ck-block__row {
  margin: 0 0 6px;
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
}
.ck-block__row:last-child { margin-bottom: 0; }

.ck-block__lead {
  margin: 0 0 4px;
  font-size: var(--ck-size-small);
  color: var(--ck-muted);
}
.ck-block__quote {
  margin: 0;
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
  font-weight: 700;
}
.ck-block__answer {
  margin: 2px 0 10px;
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
}
.ck-block__foot {
  margin: 0;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
  line-height: 1.6;
}

.ck-answer {
  padding-block: 10px;
  border-bottom: 1px solid var(--ck-border);
}
.ck-answer:last-child { border-bottom: 0; padding-bottom: 0; }
.ck-answer__q {
  margin: 0 0 6px;
  font-size: var(--ck-size-small);
  color: var(--ck-muted);
}
.ck-answer__pill {
  display: inline-block;
  padding: 2px 12px;
  border-radius: var(--ck-radius-pill);
  /* One neutral pill for every answer: the summary must not grade them either. */
  background: var(--ck-surface-warm);
  color: var(--ck-ink);
  font-size: var(--ck-size-mini);
  font-weight: 700;
}

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
</style>
