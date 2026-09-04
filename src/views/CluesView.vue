<script setup>
// US-1.3 — Follow the clues.
//
// The most important rule on this screen is a negative one: **nothing here
// reacts to an answer.** No tick of approval, no colour that means anything, no
// running summary, no encouragement. A reaction would leak the conclusion before
// the child commits to a verdict in US-1.4, which is the point of the epic.
//
// This is the one place the build departs from the Figma prototype, which gives
// a chosen "Yes" a green fill, "No" a coral fill, and "Not Sure" a purple one,
// and labels them ✅ / ❌. That is a reaction — it tells the child which answer
// is the good one. The layout, spacing and shape below are the prototype's; the
// selected state is a single neutral treatment for all four choices.

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";

const store = useInvestigation();
const router = useRouter();
const index = ref(0);

const total = computed(() => store.questions.length);
const question = computed(() => store.questions[index.value]);
const progress = computed(() => ((index.value + 1) / Math.max(total.value, 1)) * 100);
const isLast = computed(() => index.value === total.value - 1);

// Skip is offered as a choice in the same list, exactly as the prototype does.
const options = computed(() => [
  ...(question.value?.options || []).map(o => ({ value: o.value, label: o.label })),
  { value: "skipped", label: "Skip this one" }
]);

const current = computed({
  get: () => store.answers[index.value],
  set: value => store.answer(index.value, value)   // recorded, and nothing else
});

async function advance() {
  if (!isLast.value) {
    index.value += 1;
    return;
  }
  await store.saveAnswers();
  router.push({ name: "verdict" });
}

function back() {
  if (index.value > 0) index.value -= 1;
  else router.push({ name: "problem" });
}
</script>

<template>
  <section v-if="question">
    <div class="ck-clue__head">
      <p class="ck-eyebrow">Clue {{ index + 1 }} of {{ total }}</p>
      <div class="ck-bar" role="presentation"><i :style="{ width: `${progress}%` }"></i></div>
    </div>

    <h1>{{ question.text }}</h1>

    <div class="ck-note">
      <span aria-hidden="true">💡</span>
      <p>Just look at your item. You do not need to touch or move anything.</p>
    </div>

    <OptionList v-model="current" :options="options" :name="`clue-${index}`" :key="question.id" />

    <p class="ck-hint">Choose an answer, choose no problem, or tap Skip.</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="back">← Back</button>
      <button type="button" class="btn btn-primary btn--wide" :disabled="!current" @click="advance">
        {{ isLast ? "Finish Clues →" : "Next Clue →" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-clue__head {
  display: flex;
  align-items: center;
  gap: var(--ck-gap);
  margin-bottom: var(--ck-gap-sm);
}
.ck-clue__head .ck-eyebrow { margin: 0; white-space: nowrap; }

.ck-bar {
  flex: 1 1 auto;
  height: 6px;
  border-radius: var(--ck-radius-pill);
  background: var(--ck-border);
  overflow: hidden;
}
.ck-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  /* Progress through the questions — never progress towards a verdict. */
  background: var(--ck-coral);
  transition: width 0.2s ease;
}

h1 { font-size: var(--ck-size-h1); margin-bottom: var(--ck-gap); }

.ck-note { margin-bottom: var(--ck-gap-md); }

.ck-hint {
  margin: var(--ck-gap-sm) 0 0;
  text-align: center;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
</style>
