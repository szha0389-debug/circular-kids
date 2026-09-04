<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();
const boundary = computed(() => store.safetyResult?.boundary || store.safetyResult?.safetyBoundary);

onMounted(async () => {
  if (!store.safetyResult?.label) {
    try { await store.restoreSafetyResult(); }
    catch { store.say("Your safety boundary could not load. Ask a trusted adult and do not continue with the item.", "warn"); }
  }
});

async function goHome() {
  await store.closeCase();
  await store.start();
  router.push({ name: "welcome" });
}
</script>

<template>
  <section v-if="store.safetyResult?.label" class="ck-final">
    <p class="ck-eyebrow">Your safety boundary</p>
    <article class="ck-boundary" :class="`is-${boundary}`" role="status">
      <span aria-hidden="true">{{ store.safetyResult.icon }}</span>
      <h1>{{ store.safetyResult.label }}</h1>
      <p>{{ store.safetyResult.instruction }}</p>
    </article>

    <article class="ck-card ck-why">
      <h2>Why this boundary applies</h2>
      <p><strong>{{ store.safetyResult.warning.title }}:</strong> {{ store.safetyResult.warning.clue }}</p>
      <p>{{ store.safetyResult.comparisonExplanation }}</p>
    </article>

    <article class="ck-rule"><span aria-hidden="true">💡</span><div><small>A rule for another item</small><strong>{{ store.safetyResult.rule }}</strong></div></article>

    <article class="ck-card ck-pathways">
      <h2>What happens next</h2>
      <p v-if="store.safetyResult.pathways.childLed">🌱 A suitable child-led learning activity may continue, with an adult nearby.</p>
      <p v-if="store.safetyResult.pathways.adultRequired">🙋 A trusted adult must check the item before any later activity.</p>
      <p v-if="store.safetyResult.pathways.repairInstructionsBlocked">🔒 Repair and handling instructions are locked for this item.</p>
    </article>

    <p class="ck-finish-note">This boundary is saved with the investigation and cannot be bypassed by refreshing or opening a later page.</p>

    <div class="ck-actions ck-final-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'safety-comparison' })">
        ← Back
      </button>
      <button type="button" class="btn btn-primary btn--wide" @click="goHome">
        Return to Home →
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-final { text-align: center; }
.ck-boundary { padding: 28px 22px; margin-bottom: 20px; border-radius: var(--ck-radius-card); background: var(--ck-green-soft); border: 4px solid var(--ck-green); }
.ck-boundary > span { font-size: 50px; }
.ck-boundary h1 { margin: 4px 0; font-size: 32px; }
.ck-boundary p { max-width: 38ch; margin: 0 auto; }
.ck-boundary.is-ask-an-adult { background: var(--ck-yellow-soft); border-color: var(--ck-yellow); }
.ck-boundary.is-do-not-touch { background: var(--ck-coral-soft); border-color: var(--ck-coral); }
.ck-boundary.is-do-not-touch h1 { color: var(--ck-coral); }
.ck-why, .ck-pathways { text-align: left; margin-bottom: 16px; }
.ck-why { --ck-accent: var(--ck-blue); }
.ck-pathways { --ck-accent: var(--ck-purple); }
.ck-why h2, .ck-pathways h2 { font-size: var(--ck-size-h2); }
.ck-rule { display: flex; gap: 14px; align-items: center; padding: 18px; margin-bottom: 16px; border-radius: var(--ck-radius-card); background: var(--ck-teal-soft); text-align: left; }
.ck-rule > span { font-size: 30px; }
.ck-rule small, .ck-rule strong { display: block; }
.ck-rule strong { font-family: var(--ck-font-display); }
.ck-finish-note { color: var(--ck-muted); font-size: var(--ck-size-mini); }
.ck-final-actions { margin-top: 20px; }
</style>
