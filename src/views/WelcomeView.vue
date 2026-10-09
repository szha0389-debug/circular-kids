<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import { useFutures } from "@/stores/futures";
import { useRescueShelf } from "@/stores/rescueShelf";

const router = useRouter();
const investigation = useInvestigation();
const futures = useFutures();
const shelf = useRescueShelf();

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

// Same signal the journey menu uses, so the card and the menu never disagree.
const stage1Done = computed(() => Boolean(investigation.reveal));
const stage2Done = computed(() => investigation.safetyBoundarySet);
const stage3Done = computed(() => Boolean(futures.selected));
const stages = computed(() => [
  { icon: "🔎", tag: "STAGE 1 · MY VERDICT", title: "Investigate & Give My Verdict", text: "Identify your item, look for clues and record your own verdict.", done: stage1Done.value, enabled: true, route: stage1Done.value ? "reveal" : "identify", action: stage1Done.value ? "View result" : "Start challenge" },
  { icon: "🛡️", tag: "STAGE 2 · SAFETY", title: "Check What Is Safe", text: "Find the safety boundary before deciding what should happen next.", done: stage2Done.value, enabled: stage1Done.value, route: stage2Done.value ? "safety-boundary" : "safety-activity", action: stage2Done.value ? "View result" : "Start safety" },
  { icon: "🌱", tag: "STAGE 3 · RECOMMENDATION", title: "Explore Possible Futures", text: "Compare suitable futures, choose one and receive a clear next step.", done: stage3Done.value, enabled: stage2Done.value, route: stage3Done.value ? "futures-result" : "futures-explore", action: stage3Done.value ? "View my choice" : "Explore futures" },
  { icon: "🗺️", tag: "STAGE 4 · ITEM JOURNEY", title: "Follow My Item's Journey", text: "See the possible stages after your choice, then replay another safe future.", done: futures.journeySeen, enabled: stage3Done.value, route: "item-journey", action: futures.journeySeen ? "Replay my journey" : "Follow the journey" },
  { icon: "🪴", tag: "STAGE 5 · RESCUE HISTORY", title: "My Rescue Shelf", text: "Save item stories and return later to record what actually happened.", done: shelf.count > 0, enabled: true, route: "rescue-shelf", action: shelf.count > 0 ? "Open my shelf" : "See my shelf" }
]);
function openStage(stage) { if (stage.enabled) router.push({ name: stage.route }); }

const highlights = [
  { value: "5", label: "guided steps" },
  { value: "0", label: "photos stored" },
  { value: "3.0 Mt", label: "plastic waste generated · 2022–23" }
];
</script>

<template>
  <section class="ck-welcome">
    <div class="ck-welcome__hero">
      <div class="ck-welcome__copy">
        <p class="ck-eyebrow">A smarter way to reuse</p>
        <h1 class="ck-welcome__title">Investigate before<br />you throw it away.</h1>
        <p class="ck-welcome__lead">
          Look closely, follow simple clues, and discover whether your item or one of
          its parts could still have a future.
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
    <p class="ck-welcome__metrics-source">
      Waste evidence: Australia generated about 3.0 million tonnes of plastic waste in 2022–23.
      <a href="https://www.dcceew.gov.au/environment/protection/waste/publications/national-waste-resource-recovery-reporting/glance-2024" target="_blank" rel="noopener noreferrer">View the Australian Government source</a>.
    </p>

    <div id="how-it-works" class="ck-welcome__section">
      <div class="ck-welcome__epic-heading">
        <p class="ck-eyebrow">Choose your next activity</p>
        <h2>One item. Five stages.</h2>
        <p>Finish one stage, return here, then choose when you are ready for the next.</p>
      </div>
      <div class="ck-welcome__epics">
        <article v-for="stage in stages" :key="stage.tag" class="ck-epic" :class="{ 'is-done': stage.done, 'is-locked': !stage.enabled }">
          <span v-if="stage.done" class="ck-epic__done">✓ Done</span>
          <span class="ck-epic__icon" aria-hidden="true">{{ stage.icon }}</span>
          <p class="ck-epic__tag">{{ stage.tag }}</p>
          <h3>{{ stage.title }}</h3>
          <p class="ck-epic__text">{{ stage.text }}</p>
          <button type="button" :disabled="!stage.enabled" @click="openStage(stage)">{{ stage.enabled ? stage.action : "Complete the previous Stage" }} <span v-if="stage.enabled">→</span></button>
        </article>
      </div>

      <aside class="ck-welcome__quiz">
        <span class="ck-welcome__quiz-icon" aria-hidden="true">🕵️</span>
        <div>
          <p class="ck-eyebrow">Anytime activity</p>
          <h3>Spot a Circular Mystery</h3>
          <p>Short picture challenges with no timer and no score. They need no item and no open case — play them whenever you like.</p>
        </div>
        <RouterLink :to="{ name: 'mystery-hub' }" class="btn btn-primary">Choose a mystery →</RouterLink>
      </aside>
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
        <p>See which states sent away the most plastic and how the story changed over time.</p>
      </div>
      <div class="ck-welcome__charts">
        <figure class="ck-welcome__chart ck-welcome__chart--map">
          <span class="ck-welcome__chart-badge" aria-hidden="true">🏆</span>
          <div class="ck-kid-ranking">
            <div class="ck-kid-map__title">
              <strong>Who sent away the most plastic?</strong>
              <span>Meet the top three in 2022–23.</span>
            </div>
            <p class="ck-kid-ranking__key"><span aria-hidden="true">👀</span> A longer line means more plastic.</p>
            <ol class="ck-kid-ranking__list" aria-label="Top three states for plastic waste sent to disposal in 2022–23">
              <li class="is-first">
                <span class="ck-kid-ranking__medal" aria-hidden="true">🥇</span>
                <span class="ck-kid-ranking__place"><strong>New South Wales</strong><small>1st place</small></span>
                <span class="ck-kid-ranking__amount"><strong>713</strong><small>thousand tonnes</small></span>
                <span class="ck-kid-ranking__track" aria-hidden="true"><i></i></span>
              </li>
              <li class="is-second">
                <span class="ck-kid-ranking__medal" aria-hidden="true">🥈</span>
                <span class="ck-kid-ranking__place"><strong>Queensland</strong><small>2nd place</small></span>
                <span class="ck-kid-ranking__amount"><strong>664</strong><small>thousand tonnes</small></span>
                <span class="ck-kid-ranking__track" aria-hidden="true"><i></i></span>
              </li>
              <li class="is-third">
                <span class="ck-kid-ranking__medal" aria-hidden="true">🥉</span>
                <span class="ck-kid-ranking__place"><strong>Victoria</strong><small>3rd place</small></span>
                <span class="ck-kid-ranking__amount"><strong>634</strong><small>thousand tonnes</small></span>
                <span class="ck-kid-ranking__track" aria-hidden="true"><i></i></span>
              </li>
            </ol>
          </div>
          <figcaption><strong>Remember this</strong><span>New South Wales sent away the most. Queensland and Victoria were close behind.</span></figcaption>
        </figure>
        <figure class="ck-welcome__chart">
          <span class="ck-welcome__chart-badge" aria-hidden="true">🎬</span>
          <div class="ck-kid-video">
            <div class="ck-kid-map__title">
              <strong>Can old things get a new life?</strong>
              <span>Watch this 12-second circular story play on repeat.</span>
            </div>
            <video
              class="ck-kid-video__player"
              autoplay
              loop
              muted
              playsinline
              preload="auto"
              poster="/assets/circular-economy-story-poster.png"
              aria-label="A twelve-second animation about Australia's waste. It shows national waste and recovery figures, then follows old electronics and clothing into reuse, repair, sharing and recycling."
            >
              <source src="/assets/circular-economy-story.mp4" type="video/mp4">
              Your browser cannot play this video.
            </video>
          </div>
          <figcaption><strong>Big idea</strong><span>Before binning an item, look for a safe way to share, repair, reuse or recycle it.</span></figcaption>
        </figure>
      </div>
      <p class="ck-welcome__data-source">
        Data: <a href="https://www.dcceew.gov.au/environment/protection/waste/publications/national-waste-resource-recovery-report-2026" target="_blank" rel="noopener noreferrer">Australian Government, National Waste and Resource Recovery Report 2026</a>.
        Community examples: ABC News on <a href="https://www.abc.net.au/news/2025-02-10/business-ewaste-recycling-reuse-microsoft-windows-10/104909752" target="_blank" rel="noopener noreferrer">e-waste reuse</a>,
        <a href="https://www.abc.net.au/news/2026-04-11/hobart-city-mission-repair-clothing-reduce-landfill/106551256" target="_blank" rel="noopener noreferrer">clothing repair</a>, and
        <a href="https://www.abc.net.au/news/2025-06-29/op-shops-recycling-circular-economy-repurpose-old-things-reuse/105457796" target="_blank" rel="noopener noreferrer">the circular economy</a>.
      </p>
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
.ck-welcome__metrics-source { max-width: 920px; margin: 12px auto 0; padding-inline: 18px; color: var(--ck-muted); font-size: 12px; text-align: center; }
.ck-welcome__metrics-source a, .ck-welcome__data-source a { color: inherit; font-weight: 900; text-underline-offset: 3px; }
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
.ck-welcome__epics { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; max-width: 1320px; margin: 0 auto; }
.ck-epic { position: relative; display: flex; flex: 1 1 320px; max-width: 420px; min-height: 420px; flex-direction: column; padding: 32px 28px 26px; border: 4px solid #3f86f7; border-radius: 32px; background: rgba(255,255,255,.96); box-shadow: 0 18px 40px rgba(49,76,115,.11); transition: transform .2s, opacity .2s, filter .2s; }
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
.ck-welcome__quiz {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  max-width: 1320px;
  margin: 34px auto 0;
  padding: 24px 28px;
  border: 3px dashed rgba(181,156,240,.55);
  border-radius: 28px;
  background: linear-gradient(120deg, var(--ck-purple-soft), #fffdf7);
}
.ck-welcome__quiz-icon { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 50%; background: #fff; box-shadow: 0 10px 22px rgba(96,87,51,.1); font-size: 36px; }
.ck-welcome__quiz h3 { margin: 2px 0 6px; font-family: var(--ck-font-display); font-size: 26px; }
.ck-welcome__quiz p:last-child { margin: 0; color: var(--ck-muted); font-weight: 700; }
.ck-welcome__quiz .btn { white-space: nowrap; }

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
.ck-kid-ranking,.ck-kid-video{display:flex;min-height:520px;flex-direction:column;padding:38px 28px 26px;background:linear-gradient(180deg,#f4fbff,#fffbea)}
.ck-kid-map__title{text-align:center}.ck-kid-map__title strong,.ck-kid-map__title span{display:block}.ck-kid-map__title strong{font-family:var(--ck-font-display);font-size:25px}.ck-kid-map__title span{margin-top:4px;color:var(--ck-muted);font-weight:700}
.ck-kid-ranking__key{align-self:center;margin:18px 0 14px;padding:8px 14px;border-radius:999px;background:#fff1a9;color:var(--ck-ink);font-size:13px;font-weight:900}.ck-kid-ranking__list{display:grid;gap:13px;margin:0;padding:0;list-style:none}.ck-kid-ranking__list li{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:16px;border:3px solid #fff;border-radius:22px;background:#ffe8ec;box-shadow:0 9px 18px rgba(65,89,90,.1)}.ck-kid-ranking__list li.is-second{background:#fff3c9}.ck-kid-ranking__list li.is-third{background:#e7f5ff}.ck-kid-ranking__medal{font-size:34px}.ck-kid-ranking__place,.ck-kid-ranking__amount{display:grid}.ck-kid-ranking__place strong{font-family:var(--ck-font-display);font-size:19px}.ck-kid-ranking__place small,.ck-kid-ranking__amount small{color:var(--ck-muted);font-size:11px;font-weight:800}.ck-kid-ranking__amount{text-align:right}.ck-kid-ranking__amount strong{font-family:var(--ck-font-display);font-size:27px;line-height:1}.ck-kid-ranking__track{grid-column:2 / -1;height:12px;overflow:hidden;border:2px solid #fff;border-radius:999px;background:rgba(255,255,255,.72)}.ck-kid-ranking__track i{display:block;width:100%;height:100%;border-radius:inherit;background:#ff8291}.ck-kid-ranking__list .is-second .ck-kid-ranking__track i{width:93%;background:#f3c84b}.ck-kid-ranking__list .is-third .ck-kid-ranking__track i{width:89%;background:#62b8e8}
.ck-kid-video{gap:18px}.ck-kid-video .ck-kid-map__title{padding:0 64px 0 8px}.ck-kid-video__player{display:block;width:100%;aspect-ratio:5 / 4;overflow:hidden;border:4px solid #fff;border-radius:24px;background:#f7fcff;box-shadow:0 12px 24px rgba(65,89,90,.13);object-fit:cover}
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
  .ck-epic { flex-basis: 100%; max-width: none; }
  .ck-welcome__quiz { grid-template-columns: 1fr; justify-items: start; padding: 22px; }
  .ck-welcome__data { padding: 58px 20px; }
  .ck-welcome__charts { grid-template-columns: 1fr; }
  .ck-kid-ranking, .ck-kid-video { min-height: 0; padding: 32px 18px 22px; }
  .ck-kid-ranking__list li { grid-template-columns: auto 1fr; }
  .ck-kid-ranking__amount { grid-column: 2; text-align: left; }
  .ck-kid-ranking__track { grid-column: 1 / -1; }
  .ck-kid-video__player { border-radius: 18px; }
  .ck-welcome__safety-band { grid-template-columns: auto 1fr; min-height: 0; margin: 0; padding: 52px 24px; }
  .ck-welcome__safety-band > p { grid-column: 1 / -1; }
}

@media (prefers-reduced-motion: reduce) {
  .ck-welcome__feature, .ck-welcome__visual-orbit { animation: none; }
}
</style>
