<script setup>
// The end of Epic 1. It states what travelled onward and what did not, then
// offers the one control that starts a fresh case.
//
// Epic 1 assigns no safety level and gives no advice, so this screen names the
// next part without previewing its conclusion.

import { computed } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();

const payload = computed(() => store.handover?.payload);

const VERDICT_LABELS = {
  "still-useful": "Still Useful",
  "partly-useful": "Partly Useful",
  unusable: "Completely Unusable",
  "not-sure": "Not Sure"
};

const carried = computed(() => {
  const p = payload.value;
  if (!p) return [];
  return [
    { icon: "📦", label: "The item you confirmed", value: p.item?.name },
    { icon: "🔎", label: "What seemed wrong", value: p.suspectedProblems?.map(x => x.label).join(", ") || "—" },
    { icon: "💬", label: "Your clue answers", value: `${p.answers?.length || 0} recorded` },
    { icon: "📋", label: "Your own verdict", value: VERDICT_LABELS[p.verdict] || p.verdict },
    { icon: "⚖️", label: "What the clues suggested", value: p.reasoning }
  ];
});

async function again() {
  await store.closeCase();
  await store.start();
  router.push({ name: "welcome" });
}

function beginSafety() {
  router.push({ name: "safety-activity" });
}
</script>

<template>
  <section class="ck-done">
    <span class="ck-done__badge" aria-hidden="true">✓</span>
    <h1>Your case is ready</h1>
    <p class="ck-lead">
      Everything you worked out has been passed on. Your photo was not — it stayed on this
      device and has now been let go.
    </p>

    <article v-if="carried.length" class="ck-card ck-carried">
      <p class="ck-eyebrow">What travelled with your case</p>
      <div v-for="row in carried" :key="row.label" class="ck-carried__row">
        <span class="ck-carried__icon" aria-hidden="true">{{ row.icon }}</span>
        <span>
          <span class="ck-carried__label">{{ row.label }}</span>
          <strong class="ck-carried__value">{{ row.value }}</strong>
        </span>
      </div>
      <p v-if="payload?.lowInformation" class="ck-carried__flag">
        Marked as a case with little to go on, so the next part knows to stay careful.
      </p>
    </article>

    <article class="ck-card ck-next">
      <p class="ck-eyebrow">Coming next</p>
      <h2>What is safe for me to do?</h2>
      <p>
        Look for warning signs, choose what you would do first, and learn when a trusted
        adult needs to help.
      </p>
    </article>

    <button type="button" class="btn btn-primary w-100" @click="beginSafety">
      Start the safety activity →
    </button>
    <button type="button" class="btn btn-quiet w-100 ck-again" @click="again">
      Investigate something else
    </button>
  </section>
</template>

<style scoped>
.ck-done { text-align: center; }
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-done .ck-lead { max-width: 40ch; margin: 0 auto var(--ck-gap-lg); }

.ck-done__badge {
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  margin: 0 auto var(--ck-gap-md);
  border-radius: 50%;
  background: var(--ck-green);
  box-shadow: 0 0 0 12px rgba(82, 199, 124, 0.18);
  color: #fff;
  font-size: 30px;
  font-weight: 800;
}

.ck-carried {
  --ck-accent: var(--ck-teal);
  text-align: left;
  margin-bottom: var(--ck-gap-sm);
}

.ck-carried__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-block: 10px;
  border-bottom: 1px solid var(--ck-border);
}
.ck-carried__row:last-of-type { border-bottom: 0; }
.ck-carried__icon { flex: 0 0 auto; font-size: 16px; line-height: 1.4; }
.ck-carried__label {
  display: block;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
.ck-carried__value {
  display: block;
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
}

.ck-carried__flag {
  margin: var(--ck-gap-sm) 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--ck-purple-soft);
  font-size: var(--ck-size-mini);
  color: var(--ck-ink);
}

.ck-next {
  --ck-accent: var(--ck-purple);
  text-align: left;
  margin-bottom: var(--ck-gap-md);
}
.ck-next h2 { font-size: var(--ck-size-h2); margin-bottom: 4px; }
.ck-next p { margin: 0; font-size: var(--ck-size-small); color: var(--ck-muted); }
.ck-again { margin-top: 10px; }
</style>
