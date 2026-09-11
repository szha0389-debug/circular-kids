<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();
const payload = computed(() => store.handover?.payload);
const labels = { "still-useful": "Still Useful", "partly-useful": "Partly Useful", unusable: "Completely Unusable", "not-sure": "Not Sure" };
const problems = computed(() => payload.value?.suspectedProblems?.map(p => p.label).join(", ") || "No problem selected");

async function again() {
  await store.closeCase();
  await store.start();
  router.push({ name: "welcome" });
}
function beginSafety() {
  store.releasePhoto();
  router.push({ name: "welcome", hash: "#how-it-works" });
}
</script>

<template>
  <section class="ck-done">
    <div class="ck-done__headline">
      <span class="ck-done__badge" aria-hidden="true">✓</span>
      <div><p class="ck-eyebrow">Investigation complete</p><h1>Your key findings</h1></div>
    </div>

    <article class="ck-card ck-result">
      <div class="ck-result__picture" :class="{ 'ck-result__picture--empty': !store.hasPhoto }">
        <img v-if="store.hasPhoto" :src="store.photoUrl" alt="The item you investigated" />
        <span v-else aria-hidden="true">{{ store.item?.icon || "📦" }}</span>
      </div>
      <div class="ck-result__content">
        <p class="ck-eyebrow">{{ store.hasPhoto ? "Your picture" : "Chosen from the item list" }}</p>
        <h2>{{ payload?.item?.name || store.item?.name }}</h2>
        <dl>
          <div><dt>What you noticed</dt><dd>{{ problems }}</dd></div>
          <div class="ck-result__highlight"><dt>Your verdict</dt><dd>{{ labels[payload?.verdict] || payload?.verdict }}</dd></div>
        </dl>
      </div>
    </article>

    <p v-if="payload?.lowInformation" class="ck-done__note">Not many clues were recorded, so this result remains a careful guess.</p>
    <div class="ck-done__next">
      <div><span aria-hidden="true">🛡️</span><p><strong>Next: safety check</strong><br />Learn when to ask a trusted adult.</p></div>
      <button type="button" class="btn btn-primary" @click="beginSafety">Back to My Epic Cards →</button>
    </div>
    <button type="button" class="btn btn-link ck-again" @click="again">Investigate something else</button>
  </section>
</template>

<style scoped>
.ck-done { text-align: left; }
.ck-done__headline { display: flex; align-items: center; gap: 18px; margin-bottom: 22px; }
.ck-done__headline h1 { margin: 2px 0 0; font-size: var(--ck-size-h1); }
.ck-done__headline .ck-eyebrow { margin: 0; }
.ck-done__badge { display: grid; place-items: center; width: 58px; height: 58px; flex: 0 0 auto; border-radius: 50%; background: var(--ck-green); box-shadow: 0 0 0 9px rgba(82,199,124,.16); color: white; font-size: 27px; font-weight: 900; }
.ck-result { --ck-accent: var(--ck-teal); display: grid; grid-template-columns: minmax(180px,.82fr) 1.18fr; gap: 24px; padding: 20px; margin-bottom: 16px; }
.ck-result__picture { min-height: 245px; overflow: hidden; border-radius: 18px; background: var(--ck-teal-soft); }
.ck-result__picture img { width: 100%; height: 100%; min-height: 245px; display: block; object-fit: cover; }
.ck-result__picture--empty { display: grid; place-items: center; }
.ck-result__picture--empty span { font-size: 82px; filter: drop-shadow(0 8px 14px rgba(32,35,53,.12)); }
.ck-result__content { align-self: center; }
.ck-result__content h2 { margin: 4px 0 20px; font-size: clamp(27px,5vw,38px); }
.ck-result dl { display: grid; gap: 10px; margin: 0; }
.ck-result dl > div { padding: 12px 14px; border-radius: 12px; background: var(--ck-bg); }
.ck-result dt { color: var(--ck-muted); font-size: var(--ck-size-mini); font-weight: 800; }
.ck-result dd { margin: 2px 0 0; color: var(--ck-ink); font-weight: 800; }
.ck-result .ck-result__highlight { background: var(--ck-yellow-soft); border-left: 4px solid var(--ck-yellow); }
.ck-result__highlight dd { font-family: var(--ck-font-display); font-size: 21px; }
.ck-done__note { margin: 0 0 16px; padding: 12px 14px; border-radius: 12px; background: var(--ck-purple-soft); font-size: var(--ck-size-mini); }
.ck-done__next { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 20px; border-radius: var(--ck-radius-card); background: var(--ck-purple-soft); }
.ck-done__next > div { display: flex; align-items: center; gap: 12px; }
.ck-done__next span { font-size: 28px; }
.ck-done__next p { margin: 0; color: var(--ck-muted); font-size: var(--ck-size-small); }
.ck-done__next strong { color: var(--ck-ink); }
.ck-again { display: block; margin: 14px auto 0; }
@media (max-width: 600px) {
  .ck-result { grid-template-columns: 1fr; }
  .ck-result__picture, .ck-result__picture img { min-height: 210px; max-height: 290px; }
  .ck-done__next { align-items: stretch; flex-direction: column; }
}
</style>
