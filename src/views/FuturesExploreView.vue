<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import { useFutures } from "@/stores/futures";
import { futureContext } from "../../core/futures.js";

const investigation = useInvestigation();
const futures = useFutures();
const router = useRouter();
const openId = ref(null);
const boundary = computed(() => investigation.safetyResult?.label || "Safety check required");
const problems = computed(() => futureContext(investigation).problems.map(p => p.label).join(", ") || "No problem noticed");

onMounted(async () => {
  if (!investigation.safetyResult?.label) await investigation.restoreSafetyResult();
  futures.prepare(futureContext(investigation));
});
function open(option) { openId.value = openId.value === option.id ? null : option.id; futures.explore(option.id); }
</script>

<template>
  <section class="ck-futures">
    <p class="ck-eyebrow">Possible futures · Step 1</p>
    <h1>What could happen next?</h1>
    <p class="ck-lead">Explore each suitable option before you decide. The website will not choose for you.</p>
    <article class="ck-summary">
      <div><small>Item</small><strong>{{ investigation.item?.icon }} {{ investigation.item?.name }}</strong></div>
      <div><small>What you noticed</small><strong>{{ problems }}</strong></div>
      <div><small>Safety boundary</small><strong>{{ boundary }}</strong></div>
    </article>
    <div class="ck-option-list">
      <article v-for="option in futures.options" :key="option.id" class="ck-card ck-option" :class="{ open: openId === option.id }">
        <button type="button" @click="open(option)">
          <span>{{ option.icon }}</span><div><h2>{{ option.label }}</h2><p>{{ option.description }}</p></div><b>{{ openId === option.id ? '−' : '+' }}</b>
        </button>
        <div v-if="openId === option.id" class="ck-option__details">
          <p><strong>Preserves</strong>{{ option.preserves }}</p>
          <p><strong>Changes</strong>{{ option.changes }}</p>
          <p><strong>Loses</strong>{{ option.loses }}</p>
          <p v-if="option.adultRequired" class="ck-adult">🙋 A trusted adult must help with this option.</p>
        </div>
      </article>
    </div>
    <div class="ck-actions"><button class="btn btn-quiet" @click="router.push({ name: 'safety-boundary' })">← Back</button><button class="btn btn-primary" :disabled="!futures.hasExplored" @click="router.push({ name: 'futures-compare' })">Compare options →</button></div>
  </section>
</template>

<style scoped>
.ck-futures h1{font-size:var(--ck-size-h1);margin-bottom:8px}.ck-lead{color:var(--ck-muted);font-weight:700}.ck-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:24px 0;padding:16px;border-radius:18px;background:var(--ck-yellow-soft)}.ck-summary small,.ck-summary strong{display:block}.ck-summary small{color:var(--ck-muted);font-weight:800}.ck-option-list{display:grid;gap:12px}.ck-option{padding:0;overflow:hidden}.ck-option>button{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;width:100%;padding:18px;border:0;background:#fff;text-align:left;color:inherit}.ck-option>button>span{font-size:32px}.ck-option h2,.ck-option p{margin:0}.ck-option h2{font-size:22px}.ck-option p{color:var(--ck-muted)}.ck-option__details{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 18px 18px}.ck-option__details p{margin:0;padding:13px;border-radius:14px;background:var(--ck-bg)}.ck-option__details strong{display:block;color:var(--ck-teal)}.ck-option__details .ck-adult{grid-column:1/-1;background:var(--ck-yellow-soft);font-weight:800}.ck-actions{margin-top:22px}@media(max-width:650px){.ck-summary,.ck-option__details{grid-template-columns:1fr}}
</style>
