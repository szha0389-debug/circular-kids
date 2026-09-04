<script setup>
// US-1.2, second half — Point at what's wrong.
//
// Multi-select, because more than one thing may be wrong. "Not sure" sits inside
// the same list with the same styling as every other option, as the story
// requires — it is a choice, not an escape hatch styled as one.

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";

const store = useInvestigation();
const router = useRouter();
const error = ref("");

const options = computed(() => [
  ...store.problemOptions.map(p => ({ value: p.id, label: p.label })),
  { value: "no-problem", label: "I cannot see a problem" },
  { value: "not-sure", label: "I’m not sure what the problem is" }
]);

const chosen = computed({
  get: () => store.problems,
  set: value => {
    // "No problem" is a complete answer, so it cannot be combined with a
    // problem or uncertainty selection.
    const latest = value.find(entry => !store.problems.includes(entry));
    store.problems = latest === "no-problem"
      ? ["no-problem"]
      : value.filter(entry => entry !== "no-problem");
    if (value.length) error.value = "";
  }
});

async function next() {
  if (!store.problems.length) {
    error.value = "Please choose an option, or select “I’m not sure” to continue.";
    return;
  }
  await store.confirmProblems();
  router.push({ name: "clues" });
}
</script>

<template>
  <section>
    <h1>What seems to be the problem?</h1>
    <p class="ck-lead">
      Tap what you’ve noticed. You can pick more than one, and you can change your answer
      before you continue.
    </p>

    <OptionList v-model="chosen" :options="options" name="problems" multiple />

    <p v-if="error" class="ck-error" role="alert">{{ error }}</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'breakdown' })">
        ← Back
      </button>
      <button type="button" class="btn btn-primary btn--wide" :disabled="store.busy" @click="next">
        Continue →
      </button>
    </div>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-lead { margin-bottom: var(--ck-gap-md); }

.ck-error {
  margin: var(--ck-gap-sm) 0 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-yellow-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}
</style>
