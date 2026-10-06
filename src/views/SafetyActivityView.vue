<script setup>
// Epic 2, step 1 — spot the warning sign, then learn why it matters.
//
// The explanation used to be a screen of its own. It is the answer to the
// question asked here, so it now appears in place the moment the child commits
// to a choice: one screen, two states, nothing lost.

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";
import QuestionMission from "@/components/QuestionMission.vue";

const store = useInvestigation();
const router = useRouter();
// Do not carry an old response into a fresh visit to this question.
const choice = ref(null);
const error = ref("");

// The child has committed once the explanation is here.
const answered = computed(() => Boolean(store.safetyReveal));
const chosenLabel = computed(() =>
  store.safetyActivity?.choices.find(option => option.value === store.safetyResponse)?.label || ""
);

onMounted(async () => {
  try { await store.loadSafetyActivity(); }
  catch { store.say("The safety activity could not load. Please ask a trusted adult.", "warn"); }

  // Coming back to this step after a refresh: the answer is on the case, so the
  // explanation is fetched again rather than asking the question twice.
  if (!store.safetyReveal && store.safetyResponse) {
    try { await store.recordSafetyResponse(store.safetyResponse); }
    catch { store.say("The explanation could not load. Please ask a trusted adult.", "warn"); }
  }
});

/**
 * The journey menu can bring the child back to this step, so the answer has to
 * be changeable once they are here. Everything worked out from it goes with it.
 */
function answerAgain() {
  choice.value = null;
  store.safetyResponse = null;
  store.safetyReveal = null;
  store.forgetAfter("safetyResponse");
}

async function submit() {
  if (!choice.value) {
    error.value = "Choose what you would do first, or choose I’m not sure.";
    return;
  }
  error.value = "";
  await store.recordSafetyResponse(choice.value);
}
</script>

<template>
  <section v-if="store.safetyActivity" class="ck-safety">
    <QuestionMission
      eyebrow="Safety detective mission"
      title="What warning sign can you see?"
      :description="`Look closely at the ${store.item?.name || 'item'} before choosing what you would do.`"
      :icon="store.item?.icon || store.safetyActivity.warning.icon"
    />

    <article v-if="store.safetyActivity.immediateStop" class="ck-stop" role="alert">
      <span aria-hidden="true">✋</span>
      <div><strong>Do Not Touch</strong><p>Move away from the item and tell a trusted adult now.</p></div>
    </article>

    <article class="ck-card ck-warning-scene">
      <span class="ck-warning-scene__icon" aria-hidden="true">{{ store.safetyActivity.warning.icon }}</span>
      <div>
        <h2>{{ store.safetyActivity.warning.title }}</h2>
        <p>Look at the clue on the screen only. Do not touch, smell, open or test the item.</p>
      </div>
    </article>

    <!-- ──────────────────────────────────────────── the question -->
    <template v-if="!answered">
      <h2 class="ck-question">{{ store.safetyActivity.question }}</h2>
      <p class="ck-lead">Choose your first idea before we explain the warning sign.</p>
      <OptionList v-model="choice" :options="store.safetyActivity.choices" name="safety-action" />
      <p v-if="error" class="ck-error" role="alert">{{ error }}</p>
      <div class="ck-actions">
        <button class="btn btn-quiet" type="button" @click="router.push({ name: 'reveal' })">
          ← Back
        </button>
        <button class="btn btn-primary btn--wide ck-submit" type="button" :disabled="!choice || store.busy" @click="submit">
          Show me the warning sign →
        </button>
      </div>
    </template>

    <!-- ──────────────────────────────── the explanation, in place -->
    <template v-else>
      <p class="ck-chosen">
        <span aria-hidden="true">👉</span>
        <span>{{ store.safetyActivity.question }} <strong>{{ chosenLabel }}</strong></span>
        <button type="button" class="ck-chosen__again" @click="answerAgain">Answer again</button>
      </p>

      <article class="ck-clue-card">
        <span aria-hidden="true">{{ store.safetyReveal.warning.icon }}</span>
        <div>
          <strong>{{ store.safetyReveal.warning.clue }}</strong>
          <p>{{ store.safetyReveal.warning.explanation }}</p>
        </div>
      </article>

      <article class="ck-note ck-note--teal">
        <span aria-hidden="true">💬</span><p>{{ store.safetyReveal.responseNote }}</p>
      </article>

      <article class="ck-boundary-preview" :class="`is-${store.safetyReveal.boundary}`">
        <span aria-hidden="true">{{ store.safetyReveal.boundaryDetails.icon }}</span>
        <div>
          <small>Safety boundary so far</small>
          <strong>{{ store.safetyReveal.boundaryDetails.label }}</strong>
          <p>{{ store.safetyReveal.boundaryDetails.instruction }}</p>
        </div>
      </article>

      <button type="button" class="btn btn-primary w-100" @click="router.push({ name: 'safety-comparison' })">
        Compare two situations →
      </button>
    </template>
  </section>
</template>

<style scoped>
.ck-stop { display: flex; gap: 14px; align-items: center; margin-bottom: 20px; padding: 16px; border-radius: var(--ck-radius-card); background: #f7eaea; border: 1px solid rgba(190,104,102,.25); box-shadow: inset 4px 0 0 #be6866; }
.ck-stop > span { font-size: 34px; }
.ck-stop strong { display: block; color: #9f5553; font-family: var(--ck-font-display); font-size: 22px; }
.ck-stop p { margin: 2px 0 0; }
.ck-warning-scene { --ck-accent: var(--ck-yellow); display: flex; align-items: center; gap: 18px; margin-bottom: 24px; }
.ck-warning-scene__icon { display: grid; place-items: center; width: 76px; height: 76px; flex: 0 0 auto; border-radius: 50%; background: var(--ck-yellow-soft); font-size: 38px; }
.ck-warning-scene h2 { margin: 0 0 4px; font-size: var(--ck-size-h2); }
.ck-warning-scene p { margin: 0; color: var(--ck-muted); font-size: var(--ck-size-small); }
.ck-question { margin-bottom: 4px; font-size: var(--ck-size-h2); }
.ck-actions { margin-top: 20px; }
.ck-submit { margin-top: 0; }
.ck-error { margin-top: 10px; color: var(--ck-coral); font-weight: 700; }

/* What the child answered, kept in view so the explanation below reads as a
   reply to it rather than as a new topic. */
.ck-chosen {
  display: flex;
  gap: 9px;
  margin: 0 0 18px;
  padding: 12px 15px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-surface-warm);
  color: var(--ck-muted);
  font-size: var(--ck-size-small);
}
.ck-chosen strong { color: var(--ck-ink); }
.ck-chosen__again {
  flex: 0 0 auto;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ck-muted);
  font-size: var(--ck-size-mini);
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
}
.ck-chosen__again:hover { color: var(--ck-coral); }

.ck-clue-card { display: flex; gap: 18px; align-items: center; padding: 22px; margin-bottom: 16px; border-radius: var(--ck-radius-card); background: var(--ck-yellow-soft); border: 1px solid rgba(232,201,104,.35); box-shadow: inset 4px 0 0 var(--ck-yellow); }
.ck-clue-card > span { font-size: 42px; }
.ck-clue-card strong { display: block; font-family: var(--ck-font-display); font-size: 18px; }
.ck-clue-card p { margin: 5px 0 0; }
.ck-note { margin-bottom: 18px; }
.ck-note--teal { --ck-accent: var(--ck-teal); --ck-accent-soft: var(--ck-teal-soft); }
.ck-boundary-preview { display: flex; gap: 14px; align-items: center; margin-bottom: 20px; padding: 18px; border-radius: var(--ck-radius-card); background: var(--ck-purple-soft); }
.ck-boundary-preview > span { font-size: 32px; }
.ck-boundary-preview small, .ck-boundary-preview strong { display: block; }
.ck-boundary-preview strong { font-family: var(--ck-font-display); font-size: 22px; }
.ck-boundary-preview p { margin: 3px 0 0; font-size: var(--ck-size-small); }
.ck-boundary-preview.is-do-not-touch { background: #f7eaea; border: 1px solid rgba(190,104,102,.28); box-shadow: inset 4px 0 0 #be6866; }

@media (max-width: 420px) {
  .ck-warning-scene { align-items: flex-start; }
  .ck-warning-scene__icon { width: 58px; height: 58px; font-size: 29px; }
}
</style>
