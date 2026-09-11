<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import { useFutures } from "@/stores/futures";

const router = useRouter();
const investigation = useInvestigation();
const futures = useFutures();

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

const epic1Done = computed(() => Boolean(investigation.handover || investigation.safetyResponse || investigation.safetyResult));
const epic2Done = computed(() => investigation.safetyBoundarySet);
const epic3Done = computed(() => Boolean(futures.selected));
const epics = computed(() => [
  { icon: "🔎", tag: "EPIC 1 · AI IDENTIFY", title: "Investigate My Item", text: "Identify your item, look for clues and record your own verdict.", done: epic1Done.value, enabled: true, route: epic1Done.value ? "handover" : "identify", action: epic1Done.value ? "View result" : "Start challenge" },
  { icon: "🛡️", tag: "EPIC 2 · SAFETY", title: "Check What Is Safe", text: "Find the safety boundary before deciding what should happen next.", done: epic2Done.value, enabled: epic1Done.value, route: epic2Done.value ? "safety-boundary" : "safety-activity", action: epic2Done.value ? "View result" : "Start safety" },
  { icon: "🌱", tag: "EPIC 3 · RECOMMENDATION", title: "Explore Possible Futures", text: "Compare suitable futures, choose one and receive a clear next step.", done: epic3Done.value, enabled: epic2Done.value, route: epic3Done.value ? "futures-result" : "futures-explore", action: epic3Done.value ? "View my choice" : "Explore futures" }
]);
function openEpic(epic) { if (epic.enabled) router.push({ name: epic.route }); }

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
        <img
          class="ck-welcome__hero-image"
          src="/assets/circular-kids-hero.png"
          alt=""
        />
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
      <div class="ck-welcome__epic-heading">
        <p class="ck-eyebrow">Choose your next activity</p>
        <h2>One item. Three adventures.</h2>
        <p>Finish one activity, return here, then choose when you are ready for the next.</p>
      </div>
      <div class="ck-welcome__epics">
        <article v-for="epic in epics" :key="epic.tag" class="ck-epic" :class="{ 'is-done': epic.done, 'is-locked': !epic.enabled }">
          <span v-if="epic.done" class="ck-epic__done">✓ Done</span>
          <span class="ck-epic__icon" aria-hidden="true">{{ epic.icon }}</span>
          <p class="ck-epic__tag">{{ epic.tag }}</p>
          <h3>{{ epic.title }}</h3>
          <p class="ck-epic__text">{{ epic.text }}</p>
          <button type="button" :disabled="!epic.enabled" @click="openEpic(epic)">{{ epic.enabled ? epic.action : "Complete the previous Epic" }} <span v-if="epic.enabled">→</span></button>
        </article>
      </div>
    </div>

    <section class="ck-welcome__data" aria-labelledby="waste-data-title">
      <span class="ck-welcome__data-cloud cloud-one" aria-hidden="true">☁️</span>
      <span class="ck-welcome__data-cloud cloud-two" aria-hidden="true">☁️</span>
      <span class="ck-welcome__data-leaf leaf-one" aria-hidden="true">🍃</span>
      <span class="ck-welcome__data-leaf leaf-two" aria-hidden="true">🌿</span>
      <div class="ck-welcome__data-heading">
        <span class="ck-welcome__data-mascot" aria-hidden="true">🦘</span>
        <p class="ck-eyebrow">Australia’s waste story</p>
        <h2 id="waste-data-title">Plastic waste across Australia</h2>
        <p>Follow the map and timeline to discover where plastic waste went and how the story changed.</p>
      </div>
      <div class="ck-welcome__charts">
        <figure class="ck-welcome__chart ck-welcome__chart--map">
          <span class="ck-welcome__chart-badge" aria-hidden="true">🗺️</span>
          <div class="ck-kid-map" role="group" aria-label="Plastic waste disposal map of Australia">
            <div class="ck-kid-map__title"><strong>Which places sent away the most?</strong><span>Darker red means more plastic waste.</span></div>
            <div class="ck-kid-map__picture">
              <img src="/assets/waste-disposal-map.png" alt="Map of Australia showing plastic waste sent to disposal by state and territory in 2022–23" loading="lazy" />
              <span class="ck-kid-map__tip">👀 Darker red means more</span>
            </div>
          </div>
          <figcaption><strong>Big idea</strong><span>NSW, Queensland and Victoria sent away the largest amounts in 2022–23.</span></figcaption>
        </figure>
        <figure class="ck-welcome__chart">
          <span class="ck-welcome__chart-badge" aria-hidden="true">📈</span>
          <div class="ck-kid-trends" role="img" aria-label="Child-friendly summary showing that plastic waste changed differently across Australia over time">
            <div class="ck-kid-map__title"><strong>Did it always stay the same?</strong><span>No. Each place has its own waste story.</span></div>
            <div class="ck-kid-trends__path" aria-hidden="true"><span>2006</span><i>●</i><b>〰〰↗</b><i>●</i><span>2023</span></div>
            <div class="ck-kid-trends__cards">
              <div><span>📈</span><strong>Some went up</strong><p>More plastic was sent away in some states.</p></div>
              <div><span>📉</span><strong>Some went down</strong><p>Other states reduced their amount.</p></div>
              <div><span>🔄</span><strong>It can change</strong><p>Choices about reuse and recycling can change the story.</p></div>
            </div>
          </div>
          <figcaption><strong>Big idea</strong><span>The lines move up and down—waste amounts can change over time.</span></figcaption>
        </figure>
      </div>
      <p class="ck-welcome__data-source">Source: National Waste and Resource Recovery Database 2024. Map boundaries: ABS ASGS 2016.</p>
    </section>

    <div id="safety-first" class="ck-welcome__safety-band">
      <span aria-hidden="true">🛡️</span>
      <div><p class="ck-eyebrow">Safety first</p><h2>Unsure is always a valid answer.</h2></div>
      <p>If anything looks risky, the activity pauses and helps you involve a trusted adult.</p>
    </div>
  </section>
</template>

<style scoped>
.ck-welcome { text-align: left; background: var(--ck-surface); }
.ck-welcome__hero { display: grid; grid-template-columns: 0.92fr 1.08fr; min-height: 560px; background: linear-gradient(125deg, #fffdf7 0%, var(--ck-teal-soft) 45%, var(--ck-blue-soft) 100%); overflow: hidden; }
.ck-welcome__copy { display: flex; flex-direction: column; justify-content: center; padding: clamp(44px, 7vw, 96px); padding-right: clamp(28px, 4vw, 60px); background: radial-gradient(circle at 18% 22%, rgba(243,216,111,.22), transparent 15rem), radial-gradient(circle at 75% 82%, rgba(243,170,165,.15), transparent 17rem); }

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
.ck-welcome__visual { position: relative; display: grid; place-items: end start; min-height: 500px; margin: 28px 28px 28px -5vw; padding: 0 0 32px 9vw; background: linear-gradient(145deg, var(--ck-teal-soft), var(--ck-yellow-soft)); border-radius: 34px; overflow: hidden; isolation: isolate; }
.ck-welcome__hero-image {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}
.ck-welcome__feature { width: min(290px, 60%); padding: 28px; background: rgba(255,255,255,.94); border-radius: 28px; box-shadow: var(--ck-shadow-lift); transform: rotate(-2deg); animation: card-float 4.5s ease-in-out infinite; }
.ck-welcome__feature > span { display: grid; place-items: center; width: 70px; height: 70px; margin-bottom: 24px; border-radius: 50%; background: linear-gradient(145deg, #ffe878, var(--ck-yellow)); box-shadow: 0 8px 22px rgba(255,220,82,.28); font-size: 34px; }
.ck-welcome__feature p { margin: 0 0 5px; color: var(--ck-muted); font-weight: 800; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
.ck-welcome__feature strong { display: block; font-family: var(--ck-font-display); font-size: 27px; line-height: 1.2; }
.ck-welcome__visual-orbit { position: absolute; display: grid; place-items: center; border-radius: 50%; box-shadow: var(--ck-shadow-card); }
.ck-welcome__visual-orbit.one { top: 13%; right: 12%; width: 86px; height: 86px; background: var(--ck-coral-soft); font-size: 38px; animation: orbit-float 3.8s ease-in-out infinite; }
.ck-welcome__visual-orbit.two { bottom: 11%; right: 8%; width: 68px; height: 68px; background: var(--ck-green-soft); font-size: 30px; animation: orbit-float 4.6s .4s ease-in-out infinite reverse; }

@keyframes card-float { 0%, 100% { transform: rotate(-2deg) translateY(0); } 50% { transform: rotate(-1deg) translateY(-9px); } }
@keyframes orbit-float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-10px) rotate(8deg); } }

.ck-welcome__cta {
  display: inline-flex; align-self: flex-start;
  align-items: center;
  justify-content: center;
  padding-inline: 28px;
  border: 1px solid rgba(37,49,46,.08);
  box-shadow: 0 12px 30px rgba(104,169,185,.22);
}
.ck-welcome__safety { max-width: 48ch; margin: 18px 0 0; font-size: var(--ck-size-mini); color: var(--ck-muted); }
.ck-welcome__metrics { display: grid; grid-template-columns: repeat(3, 1fr); max-width: 920px; margin: -42px auto 0; position: relative; z-index: 2; overflow: hidden; background: var(--ck-surface); border-radius: 20px; box-shadow: var(--ck-shadow-lift); }
.ck-welcome__metrics::before { content: ""; position: absolute; inset: 0 0 auto; height: 4px; background: linear-gradient(90deg, var(--ck-yellow), var(--ck-teal), var(--ck-blue), var(--ck-purple), var(--ck-green)); }
.ck-welcome__metrics div { padding: 24px; text-align: center; border-right: 1px solid var(--ck-border); }
.ck-welcome__metrics div:nth-child(1) { background: var(--ck-yellow-soft); }
.ck-welcome__metrics div:nth-child(2) { background: var(--ck-teal-soft); }
.ck-welcome__metrics div:nth-child(3) { background: var(--ck-purple-soft); }
.ck-welcome__metrics div:last-child { border: 0; }
.ck-welcome__metrics strong, .ck-welcome__metrics span { display: block; }
.ck-welcome__metrics strong { font-family: var(--ck-font-display); font-size: 28px; }
.ck-welcome__metrics span { color: var(--ck-muted); font-size: 12px; font-weight: 800; }
.ck-welcome__section {
  scroll-margin-top: 68px;
  min-height: 620px;
  margin-top: 64px;
  padding: 84px clamp(24px, 7vw, 96px);
  background: linear-gradient(135deg, #fff4f5 0%, #fffaf0 48%, #eef9ff 100%);
  border-top: 2px solid rgba(255,146,156,.34);
  border-bottom: 2px solid rgba(121,199,240,.30);
}
.ck-welcome__epic-heading { max-width: 720px; margin: 0 auto 34px; text-align: center; }
.ck-welcome__epic-heading h2, .ck-welcome__safety-band h2 { margin-bottom: 10px; font-size: clamp(30px, 3vw, 44px); }
.ck-welcome__epic-heading > p:last-child { color: var(--ck-muted); }
.ck-welcome__epics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1320px; margin: 0 auto; }
.ck-epic { position: relative; display: flex; min-height: 420px; flex-direction: column; padding: 32px 28px 26px; border: 4px solid #3f86f7; border-radius: 32px; background: rgba(255,255,255,.96); box-shadow: 0 18px 40px rgba(49,76,115,.11); transition: transform .2s, opacity .2s, filter .2s; }
.ck-epic:hover:not(.is-locked):not(.is-done) { transform: translateY(-7px); }
.ck-epic__done { position: absolute; top: 18px; right: 18px; padding: 7px 12px; border-radius: 999px; background: #dff5e5; color: #237342; font-weight: 900; }
.ck-epic__icon { display: grid; place-items: center; width: 92px; height: 92px; margin: 24px 0; border-radius: 50%; background: var(--ck-yellow-soft); font-size: 48px; }
.ck-epic__tag { align-self: flex-start; margin: 0 0 16px; padding: 7px 12px; border-radius: 999px; background: #e8f0ff; color: #367dea; font-size: 12px; font-weight: 900; letter-spacing: .05em; }
.ck-epic h3 { margin: 0 0 12px; font-family: var(--ck-font-display); font-size: 28px; line-height: 1.16; }
.ck-epic__text { color: var(--ck-muted); font-weight: 700; }
.ck-epic button { margin-top: auto; padding: 0; border: 0; background: transparent; color: #367dea; text-align: left; font-weight: 900; }
.ck-epic.is-done { filter: saturate(.45); opacity: .58; background: rgba(244,247,246,.95); }
.ck-epic.is-locked { filter: grayscale(.8); opacity: .42; }
.ck-epic.is-locked button { color: var(--ck-muted); }
.ck-welcome__data { position: relative; isolation: isolate; overflow: hidden; padding: 92px clamp(24px, 6vw, 96px); background: linear-gradient(180deg, #fff6d8 0%, #eafcff 48%, #e9f8dc 100%); }
.ck-welcome__data::before { content:""; position:absolute; inset:auto -5% -120px; z-index:-1; height:270px; border-radius:50% 50% 0 0; background:linear-gradient(155deg,#bce5a4,#eaf7b5); opacity:.78; }
.ck-welcome__data::after { content:""; position:absolute; inset:0; z-index:-2; background:radial-gradient(circle at 16% 16%,rgba(255,224,103,.5),transparent 18%),radial-gradient(circle at 86% 28%,rgba(128,220,233,.32),transparent 19%); }
.ck-welcome__data-heading { position:relative; max-width:720px; margin:0 auto 42px; text-align:center; }
.ck-welcome__data-mascot { display:grid; place-items:center; width:76px; height:76px; margin:0 auto 14px; border:5px solid #fff; border-radius:50%; background:linear-gradient(145deg,#ffe782,#ffbd79); box-shadow:0 12px 24px rgba(96,87,51,.17); font-size:42px; transform:rotate(-5deg); }
.ck-welcome__data-cloud,.ck-welcome__data-leaf { position:absolute; z-index:-1; filter:drop-shadow(0 8px 10px rgba(74,104,105,.1)); }
.ck-welcome__data-cloud { color:#fff; font-size:76px; opacity:.85; }
.cloud-one { top:55px; left:5%; }.cloud-two { top:130px; right:4%; font-size:98px; }.ck-welcome__data-leaf { font-size:42px; }.leaf-one { top:23%; left:2%; transform:rotate(-18deg); }.leaf-two { right:3%; bottom:18%; transform:rotate(12deg); }
.ck-welcome__data-heading h2 { margin-bottom: 12px; font-size: clamp(30px, 3vw, 44px); }
.ck-welcome__data-heading > p:last-child { margin: 0; color: var(--ck-muted); }
.ck-welcome__charts { display: grid; grid-template-columns: .9fr 1.1fr; gap: 24px; max-width: 1320px; margin-inline: auto; align-items: stretch; }
.ck-welcome__chart { position:relative; display:flex; flex-direction:column; margin:0; overflow:hidden; background:rgba(255,255,255,.96); border:5px solid #79c7f0; border-radius:34px; box-shadow:0 22px 0 rgba(95,178,204,.12),0 28px 50px rgba(55,96,100,.13); transform:rotate(.35deg); }
.ck-welcome__chart:first-child { border-color:#ff9da7; transform:rotate(-.45deg); }
.ck-welcome__chart-badge { position:absolute; top:14px; right:15px; z-index:2; display:grid; place-items:center; width:52px; height:52px; border:4px solid #fff; border-radius:50%; background:var(--ck-yellow-soft); box-shadow:0 8px 18px rgba(70,80,90,.14); font-size:26px; }
.ck-welcome__chart img { display:block; width:100%; aspect-ratio:1.72 / 1; padding:18px; object-fit:contain; background:#fffdf8; }
.ck-welcome__chart--map img { aspect-ratio: 1.2 / 1; }
.ck-kid-map,.ck-kid-trends{display:flex;min-height:520px;flex-direction:column;padding:38px 28px 26px;background:linear-gradient(180deg,#f4fbff,#fffbea)}
.ck-kid-map__title{text-align:center}.ck-kid-map__title strong,.ck-kid-map__title span{display:block}.ck-kid-map__title strong{font-family:var(--ck-font-display);font-size:25px}.ck-kid-map__title span{margin-top:4px;color:var(--ck-muted);font-weight:700}
.ck-kid-map__picture{position:relative;display:grid;place-items:center;flex:1;margin-top:14px;overflow:hidden;border:4px solid #fff;border-radius:26px;background:#edf6fa;box-shadow:inset 0 0 0 2px rgba(121,199,240,.18)}.ck-kid-map__picture img{width:100%;height:100%;max-height:430px;padding:8px;object-fit:contain;background:#edf6fa}.ck-kid-map__tip{position:absolute;right:14px;bottom:14px;padding:9px 13px;border:3px solid #fff;border-radius:999px;background:#fff1a9;box-shadow:0 7px 18px rgba(54,72,80,.14);font-size:12px;font-weight:900}
.ck-kid-trends__path{display:flex;align-items:center;justify-content:center;gap:14px;margin:58px 0 38px;color:#3488de;font-size:18px;font-weight:900}.ck-kid-trends__path b{color:#ff8291;font-size:42px;letter-spacing:-8px}.ck-kid-trends__cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.ck-kid-trends__cards>div{padding:20px 15px;border:3px solid #fff;border-radius:24px;background:#eaf5ff;box-shadow:0 10px 18px rgba(65,89,90,.1);text-align:center}.ck-kid-trends__cards>div:nth-child(2){background:#fff0dc}.ck-kid-trends__cards>div:nth-child(3){background:#e6f7df}.ck-kid-trends__cards span,.ck-kid-trends__cards strong{display:block}.ck-kid-trends__cards span{font-size:40px}.ck-kid-trends__cards strong{margin:8px 0;font-family:var(--ck-font-display);font-size:18px}.ck-kid-trends__cards p{margin:0;color:var(--ck-muted);font-size:13px;font-weight:700}
.ck-welcome__chart figcaption { display:flex; flex-direction:column; gap:4px; padding:19px 24px 23px; border-top:2px dashed #d7e3dd; background:linear-gradient(90deg,#fffdf5,#f2fbff); }
.ck-welcome__chart figcaption strong { font-family:var(--ck-font-display); font-size:22px; color:var(--ck-ink); }
.ck-welcome__chart figcaption span, .ck-welcome__data-source { color: var(--ck-muted); font-size: var(--ck-size-mini); }
.ck-welcome__data-source { max-width: 1320px; margin: 18px auto 0; text-align: center; }
.ck-welcome__safety-band {
  scroll-margin-top: 68px;
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 32px;
  align-items: center;
  min-height: 330px;
  margin: 0;
  padding: 72px clamp(24px, 8vw, 130px);
  background: linear-gradient(120deg, #eafbf8 0%, #eaf7fe 50%, #f3eeff 100%);
  border-bottom: 2px solid rgba(181,156,240,.28);
  border-radius: 0;
}
.ck-welcome__safety-band > span { font-size: 46px; }
.ck-welcome__safety-band h2, .ck-welcome__safety-band p { margin: 0; }
.ck-welcome__safety-band > p { color: var(--ck-muted); }

@media (max-width: 760px) {
  .ck-welcome__hero { grid-template-columns: 1fr; }
  .ck-welcome__hero { min-height: 0; }
  .ck-welcome__copy { padding: 54px 24px 42px; }
  .ck-welcome__title { font-size: clamp(40px, 12vw, 58px); }
  .ck-welcome__visual { min-height: 380px; margin: 0 16px 24px; padding: 0 20px 24px; border-radius: 26px; }
  .ck-welcome__metrics { margin: -22px 16px 60px; }
  .ck-welcome__metrics div { padding: 18px 8px; }
  .ck-welcome__section { min-height: 0; margin-top: 42px; padding: 58px 20px; }
  .ck-welcome__epics { grid-template-columns: 1fr; }
  .ck-welcome__data { padding: 58px 20px; }
  .ck-welcome__charts { grid-template-columns: 1fr; }
  .ck-kid-trends__cards { grid-template-columns: 1fr; }
  .ck-welcome__safety-band { grid-template-columns: auto 1fr; min-height: 0; margin: 0; padding: 52px 24px; }
  .ck-welcome__safety-band > p { grid-column: 1 / -1; }
}

@media (prefers-reduced-motion: reduce) {
  .ck-welcome__feature, .ck-welcome__visual-orbit { animation: none; }
}
</style>
