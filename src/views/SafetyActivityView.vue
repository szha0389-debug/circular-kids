<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import OptionList from "@/components/OptionList.vue";

const store = useInvestigation();
const router = useRouter();
const choice = ref(store.safetyResponse);
const error = ref("");

onMounted(async () => {
  try { await store.loadSafetyActivity(); }
  catch { store.say("The safety activity could not load. Please ask a trusted adult.", "warn"); }
});

async function submit() {
  if (!choice.value) {
    error.value = "Choose what you would do first, or choose I’m not sure.";
    return;
  }
  await store.recordSafetyResponse(choice.value);
  router.push({ name: "safety-reveal" });
}
</script>

<template>
  <section v-if="store.safetyActivity" class="ck-safety">
    <p class="ck-eyebrow">Epic 2 · Spot the warning sign</p>

    <article v-if="store.safetyActivity.immediateStop" class="ck-stop" role="alert">
      <span aria-hidden="true">✋</span>
      <div><strong>Do Not Touch</strong><p>Move away from the item and tell a trusted adult now.</p></div>
    </article>

    <h1>What warning sign can you see?</h1>
    <article class="ck-card ck-warning-scene">
      <span class="ck-warning-scene__icon" aria-hidden="true">{{ store.safetyActivity.warning.icon }}</span>
      <div>
        <h2>{{ store.safetyActivity.warning.title }}</h2>
        <p>Look at the clue on the screen only. Do not touch, smell, open or test the item.</p>
      </div>
    </article>

    <h2 class="ck-question">{{ store.safetyActivity.question }}</h2>
    <p class="ck-lead">Choose your first idea before we explain the warning sign.</p>
    <OptionList v-model="choice" :options="store.safetyActivity.choices" name="safety-action" />
    <p v-if="error" class="ck-error" role="alert">{{ error }}</p>
    <button class="btn btn-primary w-100 ck-submit" type="button" :disabled="store.busy" @click="submit">
      Show me the warning sign →
    </button>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: var(--ck-gap-md); }
.ck-stop { display: flex; gap: 14px; align-items: center; margin-bottom: 20px; padding: 16px; border-radius: var(--ck-radius-card); background: var(--ck-coral-soft); border: 3px solid var(--ck-coral); }
.ck-stop > span { font-size: 34px; }
.ck-stop strong { display: block; color: var(--ck-coral); font-family: var(--ck-font-display); font-size: 22px; }
.ck-stop p { margin: 2px 0 0; }
.ck-warning-scene { --ck-accent: var(--ck-yellow); display: flex; align-items: center; gap: 18px; margin-bottom: 24px; }
.ck-warning-scene__icon { display: grid; place-items: center; width: 76px; height: 76px; flex: 0 0 auto; border-radius: 50%; background: var(--ck-yellow-soft); font-size: 38px; }
.ck-warning-scene h2 { margin: 0 0 4px; font-size: var(--ck-size-h2); }
.ck-warning-scene p { margin: 0; color: var(--ck-muted); font-size: var(--ck-size-small); }
.ck-question { margin-bottom: 4px; font-size: var(--ck-size-h2); }
.ck-submit { margin-top: 20px; }
.ck-error { margin-top: 10px; color: var(--ck-coral); font-weight: 700; }
@media (max-width: 420px) { .ck-warning-scene { align-items: flex-start; } .ck-warning-scene__icon { width: 58px; height: 58px; font-size: 29px; } }
</style>

