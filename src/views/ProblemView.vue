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
    <div class="ck-problem-hero">
      <div class="ck-problem-hero__item" aria-hidden="true">
        <span class="ck-problem-hero__spark">✦</span>
        <span class="ck-problem-hero__emoji">{{ store.item?.icon || "🔎" }}</span>
        <span class="ck-problem-hero__eyes">●‿●</span>
      </div>
      <div>
        <p class="ck-eyebrow">Little detective mission</p>
        <h1>What seems to be the problem?</h1>
        <p class="ck-lead">Tap what you notice on your {{ store.item?.name || "item" }}. You can change your choices before continuing.</p>
      </div>
    </div>

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
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-lead { margin-bottom: var(--ck-gap-md); }
.ck-problem-hero { display: grid; grid-template-columns: 112px 1fr; gap: 22px; align-items: center; margin: -8px -8px 24px; padding: 20px; border-radius: 24px; background: linear-gradient(125deg, var(--ck-yellow-soft), var(--ck-teal-soft), var(--ck-purple-soft)); }
.ck-problem-hero .ck-eyebrow { margin-bottom: 5px; color: var(--ck-coral); }
.ck-problem-hero .ck-lead { margin: 0; }
.ck-problem-hero__item { position: relative; display: grid; place-items: center; width: 104px; height: 104px; border-radius: 34px 48px 36px 44px; background: #fff; box-shadow: 0 10px 24px rgba(61,74,80,.10); animation: ck-item-bob 3s ease-in-out infinite; }
.ck-problem-hero__emoji { font-size: 46px; line-height: 1; }
.ck-problem-hero__eyes { position: absolute; bottom: 9px; color: var(--ck-ink); font-size: 12px; font-weight: 900; letter-spacing: 2px; }
.ck-problem-hero__spark { position: absolute; top: -8px; right: -6px; color: var(--ck-yellow); font-size: 27px; animation: ck-sparkle 1.8s ease-in-out infinite; }
:deep(.ck-options li:nth-child(4n + 1) .ck-option) { background: linear-gradient(90deg, #fff, var(--ck-teal-soft)); }
:deep(.ck-options li:nth-child(4n + 2) .ck-option) { background: linear-gradient(90deg, #fff, var(--ck-yellow-soft)); }
:deep(.ck-options li:nth-child(4n + 3) .ck-option) { background: linear-gradient(90deg, #fff, var(--ck-purple-soft)); }
:deep(.ck-options li:nth-child(4n) .ck-option) { background: linear-gradient(90deg, #fff, var(--ck-coral-soft)); }
:deep(.ck-option__icon) { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; background: rgba(255,255,255,.86); box-shadow: 0 3px 10px rgba(61,74,80,.07); font-size: 22px; }
:deep(.ck-option:hover .ck-option__icon) { transform: rotate(-7deg) scale(1.08); }
@keyframes ck-item-bob { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-6px) rotate(2deg); } }
@keyframes ck-sparkle { 0%, 100% { transform: scale(.75) rotate(0); opacity: .55; } 50% { transform: scale(1.15) rotate(18deg); opacity: 1; } }
@media (max-width: 520px) { .ck-problem-hero { grid-template-columns: 76px 1fr; gap: 14px; padding: 16px; } .ck-problem-hero__item { width: 72px; height: 72px; border-radius: 24px 30px 24px 29px; } .ck-problem-hero__emoji { font-size: 34px; } .ck-problem-hero__eyes { display: none; } }
@media (prefers-reduced-motion: reduce) { .ck-problem-hero__item, .ck-problem-hero__spark { animation: none; } }

.ck-error {
  margin: var(--ck-gap-sm) 0 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-yellow-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}
</style>
