<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();

onMounted(async () => {
  if (!store.safetyReveal && store.safetyResponse) {
    try { await store.recordSafetyResponse(store.safetyResponse); }
    catch { store.say("The explanation could not load. Please ask a trusted adult.", "warn"); }
  }
});
</script>

<template>
  <section v-if="store.safetyReveal" class="ck-safety-reveal">
    <p class="ck-eyebrow">The important clue</p>
    <h1>{{ store.safetyReveal.warning.title }}</h1>

    <article class="ck-clue-card">
      <span aria-hidden="true">{{ store.safetyReveal.warning.icon }}</span>
      <div><strong>{{ store.safetyReveal.warning.clue }}</strong><p>{{ store.safetyReveal.warning.explanation }}</p></div>
    </article>

    <article class="ck-note" :style="{ '--ck-accent': 'var(--ck-teal)', '--ck-accent-soft': 'var(--ck-teal-soft)' }">
      <span aria-hidden="true">💬</span><p>{{ store.safetyReveal.responseNote }}</p>
    </article>

    <article class="ck-boundary-preview" :class="`is-${store.safetyReveal.boundary}`">
      <span aria-hidden="true">{{ store.safetyReveal.boundaryDetails.icon }}</span>
      <div><small>Safety boundary so far</small><strong>{{ store.safetyReveal.boundaryDetails.label }}</strong><p>{{ store.safetyReveal.boundaryDetails.instruction }}</p></div>
    </article>

    <button type="button" class="btn btn-primary w-100" @click="router.push({ name: 'safety-comparison' })">
      Compare two situations →
    </button>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 18px; }
.ck-clue-card { display: flex; gap: 18px; align-items: center; padding: 22px; margin-bottom: 16px; border-radius: var(--ck-radius-card); background: var(--ck-yellow-soft); border: 3px solid var(--ck-yellow); }
.ck-clue-card > span { font-size: 42px; }
.ck-clue-card strong { display: block; font-family: var(--ck-font-display); font-size: 18px; }
.ck-clue-card p { margin: 5px 0 0; }
.ck-note { margin-bottom: 18px; }
.ck-boundary-preview { display: flex; gap: 14px; align-items: center; margin-bottom: 20px; padding: 18px; border-radius: var(--ck-radius-card); background: var(--ck-purple-soft); }
.ck-boundary-preview > span { font-size: 32px; }
.ck-boundary-preview small, .ck-boundary-preview strong { display: block; }
.ck-boundary-preview strong { font-family: var(--ck-font-display); font-size: 22px; }
.ck-boundary-preview p { margin: 3px 0 0; font-size: var(--ck-size-small); }
.ck-boundary-preview.is-do-not-touch { background: var(--ck-coral-soft); border: 2px solid var(--ck-coral); }
</style>

