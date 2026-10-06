<script setup>
// US-1.5 — See the reasoning, then carry on.
//
// The child's verdict and the site's reasoning sit in two cards of equal size
// and equal weight; neither is presented as the answer. When they differ, the
// screen names the one clue that pulls the other way and stops — it does not
// argue, rank or resolve. No wording marks a verdict right, wrong, correct or
// incorrect: several of these judgements have more than one defensible answer.
//
// The findings used to follow on a second screen that repeated the item, the
// observations and the verdict under the heading "Investigation complete". It
// was the same case said twice, so it is folded in here: one end to the stage,
// one button out of it.

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();
const loadError = ref("");

onMounted(async () => {
  try {
    if (!store.reveal) await store.restoreReveal();
  } catch {
    loadError.value = "Your result could not load. Go back and choose your verdict again.";
    return;
  }
  // Handing the case to Epic 2 is what closes this stage. It used to wait for a
  // button on the next screen; with that screen gone it happens as the findings
  // appear, which is the same moment in the child's eyes.
  if (store.reveal && !store.handover) {
    try { await store.handOver(); } catch { /* the findings below do not depend on it */ }
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
const EXTRA_PROBLEMS = { "no-problem": "No problem noticed", "not-sure": "Not sure" };

const reveal = computed(() => store.reveal);
const comparison = computed(() => reveal.value?.comparison);
const tentative = computed(() => reveal.value?.reasoning?.lowInformation);
const systemOutcome = computed(() => reveal.value?.reasoning?.outcome || {
  title: "Continue to the Safety Check",
  detail: reveal.value?.reasoning?.conclusion || "Check the item before deciding what to do next."
});
const noticed = computed(() =>
  store.problems
    .map(id => store.problemOptions.find(problem => problem.id === id)?.label || EXTRA_PROBLEMS[id] || id)
    .join(", ") || "No problem selected"
);

function carryOn() {
  store.releasePhoto();
  router.push({ name: "safety-activity" });
}

async function startAgain() {
  await store.closeCase();
  await store.start();
  router.push({ name: "welcome" });
}
</script>

<template>
  <section v-if="reveal">
    <div class="ck-done__headline">
      <span class="ck-done__badge" aria-hidden="true">✓</span>
      <div>
        <p class="ck-eyebrow">Investigation complete</p>
        <h1>Your findings</h1>
      </div>
    </div>

    <article class="ck-card ck-result">
      <div class="ck-result__picture" :class="{ 'ck-result__picture--empty': !store.hasPhoto }">
        <img v-if="store.hasPhoto" :src="store.photoUrl" alt="The item you investigated" />
        <span v-else aria-hidden="true">{{ store.item?.icon || "📦" }}</span>
      </div>
      <div class="ck-result__content">
        <p class="ck-eyebrow">{{ store.hasPhoto ? "Your picture" : "Chosen from the item list" }}</p>
        <h2>{{ store.item?.name }}</h2>
        <dl>
          <div><dt>What you noticed</dt><dd>{{ noticed }}</dd></div>
        </dl>
      </div>
    </article>

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
h1 { font-size: var(--ck-size-h1); margin-bottom: 0; }

.ck-done__headline { display: flex; align-items: center; gap: 18px; margin-bottom: 20px; }
.ck-done__headline .ck-eyebrow { margin: 0; }
.ck-done__badge {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--ck-green);
  box-shadow: 0 0 0 9px rgba(145, 214, 111, .16);
  color: white;
  font-size: 25px;
  font-weight: 900;
}

.ck-result { --ck-accent: var(--ck-teal); display: grid; grid-template-columns: minmax(150px,.8fr) 1.2fr; gap: 20px; padding: 18px; margin-bottom: 18px; }
.ck-result__picture { min-height: 170px; overflow: hidden; border-radius: 18px; background: var(--ck-teal-soft); }
.ck-result__picture img { width: 100%; height: 100%; min-height: 170px; display: block; object-fit: cover; }
.ck-result__picture--empty { display: grid; place-items: center; }
.ck-result__picture--empty span { font-size: 64px; filter: drop-shadow(0 8px 14px rgba(32,35,53,.12)); }
.ck-result__content { align-self: center; }
.ck-result__content h2 { margin: 4px 0 14px; font-size: clamp(24px,4vw,32px); }
.ck-result dl { display: grid; gap: 10px; margin: 0; }
.ck-result dl > div { padding: 12px 14px; border-radius: 12px; background: var(--ck-ground); }
.ck-result dt { color: var(--ck-muted); font-size: var(--ck-size-mini); font-weight: 800; }
.ck-result dd { margin: 2px 0 0; color: var(--ck-ink); font-weight: 800; }

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
.ck-result-state > span { font-size: 42px; }
.ck-result-state h1, .ck-result-state p { margin: 0; }
.ck-result-state p { color: var(--ck-muted); }

@media (max-width: 600px) {
  .ck-result { grid-template-columns: 1fr; }
  .ck-result__picture, .ck-result__picture img { min-height: 190px; max-height: 260px; }
}
</style>
