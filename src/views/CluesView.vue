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
//
// All three clues live on one screen. One question per screen meant three waits
// and three page loads for three taps, which read as a long interrogation; here
// the child can see how short it is and answer at their own pace. The old
// "your answers are recorded" screen between the clues and the verdict is gone
// with it — finishing the clues is not news, so it goes straight on.

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";
import QuestionMission from "@/components/QuestionMission.vue";

const store = useInvestigation();
const router = useRouter();
const error = ref("");

const total = computed(() => store.questions.length);
const answered = computed(() => store.answers.filter(Boolean).length);
const complete = computed(() => total.value > 0 && answered.value === total.value);

// Skip is offered as a choice in the same list, exactly as the prototype does.
function optionsFor(question) {
  return [
    ...(question.options || []).map((option, i) => ({
      value: option.value,
      label: option.label,
      icon: ["🔍", "💬", "✨", "🤔"][i % 4]
    })),
    { value: "skipped", label: "Skip this one", icon: "⏭️" }
  ];
}

async function finish() {
  if (!complete.value) {
    error.value = "Answer each clue, or tap Skip on the ones you cannot tell.";
    return;
  }
  error.value = "";
  await store.saveAnswers();
  router.push({ name: "verdict" });
}

function back() {
  router.push({ name: "problem" });
}
</script>

<template>
  <section v-if="total">
    <QuestionMission
      eyebrow="Clue detective mission"
      :title="`${total} quick clues about your ${store.item?.name || 'item'}`"
      description="Look carefully with your eyes only. You never need to touch or move the item."
      :icon="store.item?.icon || '🔎'"
    />

    <div class="ck-note">
      <span aria-hidden="true">💡</span>
      <p>No answer is right or wrong here. Tap Skip on anything you cannot tell by looking.</p>
    </div>

    <!-- Progress through the questions — never progress towards a verdict. -->
    <div class="ck-clue__head">
      <p class="ck-eyebrow">{{ answered }} of {{ total }} answered</p>
      <div class="ck-bar" role="presentation">
        <i :style="{ width: `${(answered / total) * 100}%` }"></i>
      </div>
    </div>

    <ol class="ck-clue__list">
      <li v-for="(question, index) in store.questions" :key="question.id" class="ck-clue">
        <h2 class="ck-clue__question">
          <span class="ck-clue__number" aria-hidden="true">{{ index + 1 }}</span>
          {{ question.text }}
        </h2>
        <OptionList
          :model-value="store.answers[index]"
          :options="optionsFor(question)"
          :name="`clue-${index}`"
          @update:model-value="store.answer(index, $event)"
        />
      </li>
    </ol>

    <p v-if="error" class="ck-error" role="alert">{{ error }}</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="back">← Back</button>
      <button type="button" class="btn btn-primary btn--wide" :disabled="!complete" @click="finish">
        Give My Verdict →
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-clue__head {
  display: flex;
  align-items: center;
  gap: var(--ck-gap);
  margin: var(--ck-gap-md) 0 var(--ck-gap-sm);
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
  background: var(--ck-coral);
  transition: width 0.25s ease;
}

.ck-clue__list { display: grid; gap: var(--ck-gap-md); margin: 0; padding: 0; list-style: none; }

/* Each clue is its own card, so three questions on one screen still read as
   three separate things to look at rather than one long form. */
.ck-clue {
  padding: 18px 18px 14px;
  border: 1px solid var(--ck-border);
  border-radius: var(--ck-radius-card);
  background: var(--ck-surface);
}

.ck-clue__question {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  margin: 0 0 12px;
  font-size: var(--ck-size-h2);
  line-height: 1.25;
}
.ck-clue__number {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--ck-surface-warm);
  box-shadow: inset 0 0 0 2px var(--ck-border);
  font-family: var(--ck-font-body);
  font-size: var(--ck-size-mini);
  font-weight: 900;
  color: var(--ck-muted);
}

.ck-note { margin-bottom: var(--ck-gap-sm); }

.ck-error {
  margin: var(--ck-gap-sm) 0 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-yellow-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}
</style>
