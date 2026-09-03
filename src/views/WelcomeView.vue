<script setup>
import { onMounted } from "vue";

const AI_WARMUP_SESSION_KEY = "circular-kids-ai-warmup-triggered";
let aiWarmupTriggered = false;

onMounted(() => {
  if (aiWarmupTriggered) return;

  try {
    if (sessionStorage.getItem(AI_WARMUP_SESSION_KEY)) {
      aiWarmupTriggered = true;
      return;
    }
    sessionStorage.setItem(AI_WARMUP_SESSION_KEY, "true");
  } catch {
    // The in-memory flag still prevents repeats if session storage is unavailable.
  }

  aiWarmupTriggered = true;
  void fetch("/api/ai/health").catch(() => {});
});

const steps = [
  { icon: "📷", text: "Take a photo or upload a picture of your item" },
  { icon: "🔍", text: "Look at the parts or qualities of the item" },
  { icon: "💬", text: "Answer a few simple look-at clue questions" },
  { icon: "📋", text: "Record your own opinion as a verdict" },
  { icon: "⚖️", text: "Compare your thoughts with the collected evidence" }
];
</script>

<template>
  <section class="ck-welcome">
    <span class="ck-welcome__badge" aria-hidden="true">🔍</span>

    <h1 class="ck-welcome__title">Investigate Before<br />I Throw It Away</h1>

    <p class="ck-welcome__lead">
      Let’s look at your item together and work out whether it — or any part of it —
      might still be useful.
    </p>

    <div class="ck-card ck-welcome__plan">
      <p class="ck-eyebrow">What we’ll do together</p>
      <ul class="ck-welcome__list" role="list">
        <li v-for="(step, i) in steps" :key="i">
          <span class="ck-welcome__icon" aria-hidden="true">{{ step.icon }}</span>
          <span>{{ step.text }}</span>
        </li>
      </ul>
    </div>

    <RouterLink :to="{ name: 'identify' }" class="btn btn-primary ck-welcome__cta">
      Start My Investigation →
    </RouterLink>

    <p class="ck-welcome__safety">
      Looking only — we will never ask you to open, unscrew or take anything apart.
    </p>
  </section>
</template>

<style scoped>
.ck-welcome { text-align: center; }

.ck-welcome__badge {
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  margin: 0 auto var(--ck-gap-md);
  border-radius: 50%;
  background: var(--ck-yellow);
  box-shadow: 0 0 0 14px rgba(255, 230, 109, 0.2);
  font-size: 34px;
}

.ck-welcome__title {
  margin: 0 0 var(--ck-gap);
  font-size: var(--ck-size-hero);
  line-height: 1.2;
}

.ck-welcome__lead {
  max-width: 34ch;
  margin: 0 auto var(--ck-gap-lg);
  color: var(--ck-muted);
  font-size: var(--ck-size-small);
  line-height: 1.6;
}

.ck-welcome__plan {
  --ck-accent: var(--ck-coral);
  text-align: left;
  margin-bottom: var(--ck-gap-lg);
}

.ck-welcome__list {
  display: grid;
  gap: var(--ck-gap);
  list-style: none;
  margin: 0;
  padding: 0;
}
.ck-welcome__list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
}
.ck-welcome__icon { flex: 0 0 auto; font-size: 18px; line-height: 1.3; }

.ck-welcome__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: 28px;
}

.ck-welcome__safety {
  margin: var(--ck-gap-md) 0 0;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
</style>
