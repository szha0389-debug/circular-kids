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
import QuestionMission from "@/components/QuestionMission.vue";

const store = useInvestigation();
const router = useRouter();
const error = ref("");
const tones = ["blue", "purple", "coral", "teal", "green", "yellow"];
const parts = computed(() => store.breakdown?.elements || []);

const problemIcons = {
  leaks: "💧", "can-leaking": "💧", cracked: "⚡", "can-sharp-edge": "⚠️",
  stained: "🫧", stain: "🎨", "can-dirty": "🫧", "can-dented": "💥",
  "can-unknown-substance": "❓", "cap-broken": "🧢", "spout-worn": "🔎",
  "battery-odd": "🔋", "cable-damaged": "⚡", "screen-cracked": "📱",
  hole: "🕳️", "wheel-off": "🛞", "not-working": "🛠️"
};

const fallbackIcons = ["🔎", "🧩", "✨", "🛠️", "👀"];
const options = computed(() => [
  ...store.problemOptions.map((p, index) => ({
    value: p.id,
    label: p.label,
    icon: problemIcons[p.id] || fallbackIcons[index % fallbackIcons.length]
  })),
  { value: "no-problem", label: "I cannot see a problem", icon: "🌟" },
  { value: "not-sure", label: "I’m not sure what the problem is", icon: "💭" }
]);

const chosen = computed({
  get: () => store.problems,
  set: value => {
    // Complete/uncertain answers are exclusive: choosing either clears every
    // observation, while choosing an observation clears either special value.
    const latest = value.find(entry => !store.problems.includes(entry));
    const exclusive = new Set(["no-problem", "not-sure"]);
    store.problems = exclusive.has(latest)
      ? [latest]
      : value.filter(entry => !exclusive.has(entry));
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
    <div class="ck-parts-preview">
      <div class="ck-parts-preview__heading">
        <div>
          <p class="ck-eyebrow">Look at the whole item</p>
          <h2>Parts of your {{ store.item?.name }}</h2>
        </div>
        <span aria-hidden="true">🔎</span>
      </div>
      <ul class="ck-parts-preview__list" role="list">
        <li v-for="(part, index) in parts" :key="part.id" :style="{ '--part-colour': `var(--ck-${tones[index % tones.length]})` }">
          <i aria-hidden="true"></i>
          <span><strong>{{ part.name }}</strong><small v-if="part.material">{{ part.material }}</small></span>
        </li>
      </ul>
      <p class="ck-parts-preview__note">💡 Look only. You do not need to open, unscrew, or take anything apart.</p>
    </div>

    <QuestionMission eyebrow="Little detective mission" title="What seems to be the problem?" :description="`Tap what you notice on your ${store.item?.name || 'item'}. You can change your choices before continuing.`" :icon="store.item?.icon || '🔎'" />

    <OptionList v-model="chosen" :options="options" name="problems" multiple />

    <p v-if="error" class="ck-error" role="alert">{{ error }}</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'identify' })">
        ← Back
      </button>
      <button type="button" class="btn btn-primary btn--wide" :disabled="!store.problems.length || store.busy" @click="next">
        Continue →
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-parts-preview { margin-bottom: 34px; padding-bottom: 30px; border-bottom: 1px solid var(--ck-border); }
.ck-parts-preview__heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.ck-parts-preview__heading h2, .ck-parts-preview__heading p { margin: 0; }
.ck-parts-preview__heading > span { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 18px; background: var(--ck-teal-soft); font-size: 26px; }
.ck-parts-preview__list { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin: 0 0 14px; padding: 0; list-style: none; }
.ck-parts-preview__list li { display: flex; gap: 10px; align-items: center; min-height: 58px; padding: 10px 12px; border: 1px solid var(--ck-border); border-radius: 15px; background: #fff; }
.ck-parts-preview__list i { flex: 0 0 auto; width: 13px; height: 13px; border-radius: 50%; background: var(--part-colour); }
.ck-parts-preview__list strong, .ck-parts-preview__list small { display: block; }
.ck-parts-preview__list strong { font-size: var(--ck-size-small); }
.ck-parts-preview__list small { color: var(--ck-muted); font-size: var(--ck-size-micro); text-transform: capitalize; }
.ck-parts-preview__note { margin: 0; padding: 11px 14px; border-radius: 13px; background: var(--ck-yellow-soft); color: var(--ck-ink); font-size: var(--ck-size-mini); }
.ck-mission { margin-top: 0; }
.ck-error {
  margin: var(--ck-gap-sm) 0 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-yellow-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}
</style>
