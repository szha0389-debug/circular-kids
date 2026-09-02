<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";

const store = useInvestigation();
const router = useRouter();
const choice = ref(store.comparisonResponse);
const error = ref("");

onMounted(async () => {
  try { await store.loadSafetyComparison(); }
  catch { store.say("The comparison could not load. Please ask a trusted adult.", "warn"); }
});

async function submit() {
  if (!choice.value) { error.value = "Choose a situation, or choose I’m not sure."; return; }
  await store.recordComparisonResponse(choice.value);
  router.push({ name: "safety-boundary" });
}
</script>

<template>
  <section v-if="store.safetyComparison">
    <p class="ck-eyebrow">Lower risk and higher risk</p>
    <h1>Compare these two situations</h1>
    <div class="ck-situations">
      <article v-for="situation in store.safetyComparison.situations" :key="situation.id" class="ck-card">
        <span aria-hidden="true">{{ situation.icon }}</span><h2>{{ situation.title }}</h2><p>{{ situation.detail }}</p>
      </article>
    </div>
    <h2 class="ck-question">{{ store.safetyComparison.question }}</h2>
    <p class="ck-lead">Choose your idea first. We will explain it calmly afterwards.</p>
    <OptionList v-model="choice" :options="store.safetyComparison.choices" name="safety-comparison" />
    <p v-if="error" class="ck-error" role="alert">{{ error }}</p>
    <button type="button" class="btn btn-primary w-100 ck-submit" :disabled="store.busy" @click="submit">
      Show my safety boundary →
    </button>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 18px; }
.ck-situations { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.ck-situations article:first-child { --ck-accent: var(--ck-green); }
.ck-situations article:last-child { --ck-accent: var(--ck-coral); }
.ck-situations span { font-size: 34px; }
.ck-situations h2 { margin: 8px 0 4px; font-size: 17px; }
.ck-situations p { margin: 0; font-size: var(--ck-size-mini); color: var(--ck-muted); }
.ck-question { margin-bottom: 4px; font-size: var(--ck-size-h2); }
.ck-submit { margin-top: 20px; }
.ck-error { margin-top: 10px; color: var(--ck-coral); font-weight: 700; }
@media (max-width: 420px) { .ck-situations { grid-template-columns: 1fr; } }
</style>

