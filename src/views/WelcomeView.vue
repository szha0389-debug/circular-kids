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

const highlights = [
  { value: "5", label: "guided steps" },
  { value: "0", label: "photos stored" },
  { value: "100%", label: "look-only learning" }
];
</script>

<template>
  <section class="ck-welcome">
    <div class="ck-welcome__hero">
      <div class="ck-welcome__copy">
        <p class="ck-eyebrow">A smarter way to reuse</p>
        <h1 class="ck-welcome__title">Investigate before<br />you throw it away.</h1>
        <p class="ck-welcome__lead">
          Look closely, follow simple clues, and discover whether your item — or one of
          its parts — could still have a future.
        </p>
        <RouterLink :to="{ name: 'identify' }" class="btn btn-primary ck-welcome__cta">
          Start My Investigation →
        </RouterLink>
        <p class="ck-welcome__safety">
          Looking only — we never ask you to open, unscrew or take anything apart.
        </p>
      </div>

      <div class="ck-welcome__visual" aria-hidden="true">
        <div class="ck-welcome__visual-orbit one">♻️</div>
        <div class="ck-welcome__visual-orbit two">🌱</div>
        <article class="ck-welcome__feature">
          <span>🔍</span>
          <p>Look closer</p>
          <strong>Small clues can reveal a new future.</strong>
        </article>
      </div>
    </div>

    <div class="ck-welcome__metrics" aria-label="Activity highlights">
      <div v-for="item in highlights" :key="item.label">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div id="how-it-works" class="ck-welcome__section">
      <div class="ck-welcome__section-copy">
        <p class="ck-eyebrow">How it works</p>
        <h2>One item. Five simple steps.</h2>
        <p>Build your own opinion first, then compare it with the clues you collected.</p>
      </div>
      <div class="ck-card ck-welcome__plan">
        <ul class="ck-welcome__list" role="list">
          <li v-for="(step, i) in steps" :key="i">
            <b>{{ String(i + 1).padStart(2, "0") }}</b>
            <span class="ck-welcome__icon" aria-hidden="true">{{ step.icon }}</span>
            <span>{{ step.text }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div id="safety-first" class="ck-welcome__safety-band">
      <span aria-hidden="true">🛡️</span>
      <div><p class="ck-eyebrow">Safety first</p><h2>Unsure is always a valid answer.</h2></div>
      <p>If anything looks risky, the activity pauses and helps you involve a trusted adult.</p>
    </div>
  </section>
</template>

<style scoped>
.ck-welcome { text-align: left; }
.ck-welcome__hero { display: grid; grid-template-columns: 0.92fr 1.08fr; min-height: 560px; background: var(--ck-surface); overflow: hidden; }
.ck-welcome__copy { display: flex; flex-direction: column; justify-content: center; padding: clamp(44px, 7vw, 96px); padding-right: clamp(28px, 4vw, 60px); }

.ck-welcome__title {
  margin: 0 0 22px;
  font-family: var(--ck-font-body);
  font-size: clamp(42px, 5.2vw, 76px);
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

.ck-welcome__lead {
  max-width: 42ch;
  margin: 0 0 28px;
  color: var(--ck-ink);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}
.ck-welcome__visual { position: relative; display: grid; place-items: center; min-height: 500px; margin-left: -8vw; padding-left: 8vw; background: linear-gradient(145deg, var(--ck-teal-soft), var(--ck-yellow-soft)); clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%); }
.ck-welcome__feature { width: min(330px, 64%); padding: 34px; background: rgba(255,255,255,.92); border-radius: 28px; box-shadow: var(--ck-shadow-lift); transform: rotate(-2deg); }
.ck-welcome__feature > span { display: grid; place-items: center; width: 70px; height: 70px; margin-bottom: 24px; border-radius: 50%; background: var(--ck-yellow); font-size: 34px; }
.ck-welcome__feature p { margin: 0 0 5px; color: var(--ck-muted); font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
.ck-welcome__feature strong { display: block; font-family: var(--ck-font-display); font-size: 27px; line-height: 1.2; }
.ck-welcome__visual-orbit { position: absolute; display: grid; place-items: center; border-radius: 50%; box-shadow: var(--ck-shadow-card); }
.ck-welcome__visual-orbit.one { top: 13%; right: 12%; width: 86px; height: 86px; background: var(--ck-coral-soft); font-size: 38px; }
.ck-welcome__visual-orbit.two { bottom: 11%; left: 25%; width: 68px; height: 68px; background: var(--ck-green-soft); font-size: 30px; }

.ck-welcome__plan {
  --ck-accent: var(--ck-coral); padding: 30px;
}
.ck-welcome__list { display: grid; gap: 0; list-style: none; margin: 0; padding: 0; }
.ck-welcome__list li {
  display: grid; grid-template-columns: 34px 32px 1fr; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--ck-border);
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
}
.ck-welcome__list li:last-child { border-bottom: 0; }
.ck-welcome__list li b { color: var(--ck-coral); font-size: 11px; letter-spacing: .08em; }
.ck-welcome__icon { flex: 0 0 auto; font-size: 18px; line-height: 1.3; }

.ck-welcome__cta {
  display: inline-flex; align-self: flex-start;
  align-items: center;
  justify-content: center;
  padding-inline: 28px;
  border: 2px solid var(--ck-ink);
  box-shadow: 4px 4px 0 var(--ck-ink);
}
.ck-welcome__safety { max-width: 48ch; margin: 18px 0 0; font-size: var(--ck-size-mini); color: var(--ck-muted); }
.ck-welcome__metrics { display: grid; grid-template-columns: repeat(3, 1fr); max-width: 920px; margin: -42px auto 80px; position: relative; z-index: 2; background: var(--ck-surface); border-radius: 20px; box-shadow: var(--ck-shadow-lift); }
.ck-welcome__metrics div { padding: 24px; text-align: center; border-right: 1px solid var(--ck-border); }
.ck-welcome__metrics div:last-child { border: 0; }
.ck-welcome__metrics strong, .ck-welcome__metrics span { display: block; }
.ck-welcome__metrics strong { font-family: var(--ck-font-display); font-size: 28px; }
.ck-welcome__metrics span { color: var(--ck-muted); font-size: 12px; font-weight: 800; }
.ck-welcome__section { display: grid; grid-template-columns: .85fr 1.15fr; gap: clamp(32px, 7vw, 90px); align-items: center; padding: 20px clamp(24px, 7vw, 96px) 90px; }
.ck-welcome__section-copy h2, .ck-welcome__safety-band h2 { font-size: clamp(30px, 3vw, 44px); }
.ck-welcome__section-copy > p:last-child { color: var(--ck-muted); max-width: 36ch; }
.ck-welcome__safety-band { display: grid; grid-template-columns: auto 1fr 1fr; gap: 26px; align-items: center; margin: 0 clamp(24px, 7vw, 96px) 80px; padding: 34px; background: var(--ck-purple-soft); border-radius: 26px; }
.ck-welcome__safety-band > span { font-size: 46px; }
.ck-welcome__safety-band h2, .ck-welcome__safety-band p { margin: 0; }
.ck-welcome__safety-band > p { color: var(--ck-muted); }

@media (max-width: 760px) {
  .ck-welcome__hero, .ck-welcome__section { grid-template-columns: 1fr; }
  .ck-welcome__hero { min-height: 0; }
  .ck-welcome__copy { padding: 54px 24px 42px; }
  .ck-welcome__title { font-size: clamp(40px, 12vw, 58px); }
  .ck-welcome__visual { min-height: 340px; margin-left: 0; padding-left: 0; clip-path: polygon(0 12%, 100% 0, 100% 100%, 0 100%); }
  .ck-welcome__metrics { margin: -22px 16px 60px; }
  .ck-welcome__metrics div { padding: 18px 8px; }
  .ck-welcome__section { padding: 0 20px 64px; }
  .ck-welcome__safety-band { grid-template-columns: auto 1fr; margin: 0 20px 60px; padding: 24px; }
  .ck-welcome__safety-band > p { grid-column: 1 / -1; }
}
</style>
