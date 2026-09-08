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
    <QuestionMission eyebrow="Little detective mission" title="What seems to be the problem?" :description="`Tap what you notice on your ${store.item?.name || 'item'}. You can change your choices before continuing.`" :icon="store.item?.icon || '🔎'" />

    <OptionList v-model="chosen" :options="options" name="problems" multiple />

    <p v-if="error" class="ck-error" role="alert">{{ error }}</p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'breakdown' })">
        ← Back
      </button>
      <button type="button" class="btn btn-primary btn--wide" :disabled="!store.problems.length || store.busy" @click="next">
        Continue →
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-error {
  margin: var(--ck-gap-sm) 0 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-yellow-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}
</style>
