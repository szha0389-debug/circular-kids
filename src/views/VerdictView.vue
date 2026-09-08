<script setup>
// US-1.4 — Give my own verdict before the site gives one.
//
// This is the epic. Two criteria are load-bearing and both are guarded here as
// well as in core/investigation.js:
//
//   1. No assessment, hint, score or suggestion is visible anywhere on this
//      screen — hence no summary of the answers, no emphasis on any option, and
//      the reveal being fetched only after the verdict has been sent.
//   2. Nothing continues until a verdict is chosen.
//
// "Not sure" is a recorded answer here, not a skip.

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";
import QuestionMission from "@/components/QuestionMission.vue";

const store = useInvestigation();
const router = useRouter();
// A choice is never pre-filled: the child must actively make it on this screen.
const choice = ref(null);

// The icons name the option, never rank it: no ticks, crosses or traffic lights.
const options = [
  { value: "still-useful", label: "Still Useful", icon: "🟢", hint: "It works well enough to keep using" },
  { value: "partly-useful", label: "Partly Useful", icon: "🟠", hint: "Some parts still work, some do not" },
  { value: "unusable", label: "Completely Unusable", icon: "🔴", hint: "It does not work at all anymore" },
  { value: "not-sure", label: "Not Sure", icon: "🤔", hint: "I cannot tell from looking at it" }
];

const canContinue = computed(() => Boolean(choice.value));

async function record() {
  if (!canContinue.value) return;
  await store.recordVerdict(choice.value);
  router.push({ name: "reveal" });
}
</script>

<template>
  <section>
    <QuestionMission eyebrow="Your detective verdict" title="What do you think?" description="Based on what you noticed, choose the answer that feels right to you. There is no wrong answer." :icon="store.item?.icon || '🤔'" />

    <div class="ck-note ck-note--purple">
      <span aria-hidden="true">🔒</span>
      <p>
        You will see what the investigation evidence suggests <strong>after</strong> you
        submit your own verdict.
      </p>
    </div>

    <OptionList v-model="choice" :options="options" name="verdict" />

    <p class="ck-hint">“Not Sure” is always a valid choice.</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'clues' })">← Back</button>
      <button
        type="button"
        class="btn btn-primary btn--wide"
        :disabled="!canContinue || store.busy"
        @click="record"
      >
        Submit My Verdict →
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-note--purple {
  --ck-accent: var(--ck-purple);
  --ck-accent-soft: var(--ck-purple-soft);
  margin-bottom: var(--ck-gap-md);
}

.ck-hint {
  margin: var(--ck-gap-sm) 0 0;
  text-align: center;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
</style>
