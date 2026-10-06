<script setup>
// The journey menu that sits beside every screen of the guided flow.
//
// It answers three questions at a glance — where am I, what have I finished,
// what is still ahead — and it is a way to move, not only a picture: any step
// the case already supports can be tapped to jump straight back to it. Steps
// that depend on something not done yet stay locked, so the menu can never send
// a child to a screen the router would bounce them out of.

import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { flowCompletion, flowProgress, stepForRoute } from "../../core/flow.js";
import { useInvestigation } from "@/stores/investigation";
import { useFutures } from "@/stores/futures";
import { useRescueShelf } from "@/stores/rescueShelf";

const route = useRoute();
const router = useRouter();
const investigation = useInvestigation();
const futures = useFutures();
const shelf = useRescueShelf();

// One boolean per flag named in core/flow.js. Everything the menu knows about
// the case comes through here.
const caseState = computed(() => ({
  itemChosen: investigation.itemChosen,
  problemsChosen: investigation.problemsChosen,
  cluesAnswered:
    investigation.questions.length > 0 &&
    investigation.answers.filter(Boolean).length === investigation.questions.length,
  verdictRecorded: investigation.verdictRecorded,
  // The reasoning, not the hand-over: the hand-over is held in memory only and
  // is gone after a refresh, while the reasoning is fetched again with the case.
  // It is cleared whenever an answer it was worked out from changes, so it is
  // also the honest signal that this stage still stands.
  investigationDone: Boolean(investigation.reveal),
  safetyAnswered: investigation.safetyAnswered,
  comparisonAnswered: investigation.comparisonAnswered,
  safetyBoundarySet: investigation.safetyBoundarySet,
  futureSelected: Boolean(futures.selected),
  journeySeen: futures.journeySeen,
  journeyReplayed: Boolean(futures.lastJourneyFromId),
  shelfUsed: shelf.count > 0
}));

const here = computed(() => stepForRoute(String(route.name)));
const stages = computed(() => flowProgress(caseState.value, here.value?.step.id || null));
const completion = computed(() => flowCompletion(stages.value));
const currentStage = computed(() => stages.value.find(stage => stage.current) || null);
const stageNumber = computed(() => stages.value.findIndex(stage => stage.current) + 1);

// The stage being worked on is open; the child can open any other one to look
// ahead or back without leaving the screen they are on.
const openId = ref(here.value?.stage.id || null);
watch(here, value => {
  if (value) openId.value = value.stage.id;
});

// On a phone the whole menu starts folded away, so the task keeps the screen.
const showOnSmall = ref(false);

function toggleStage(stage) {
  openId.value = openId.value === stage.id ? null : stage.id;
}

function go(step) {
  if (!step.open || step.current) return;
  showOnSmall.value = false;
  router.push({ name: step.route, query: step.query });
}
</script>

<template>
  <nav class="ck-flow" :class="{ 'is-open': showOnSmall }" aria-label="Where I am in the activity">
    <div class="ck-flow__top">
      <div class="ck-flow__headline">
        <p class="ck-eyebrow">My progress</p>
        <strong v-if="currentStage">Stage {{ stageNumber }} · {{ currentStage.title }}</strong>
        <strong v-else>Pick up where you left off</strong>
      </div>
      <button
        type="button"
        class="ck-flow__toggle"
        :aria-expanded="showOnSmall"
        @click="showOnSmall = !showOnSmall"
      >
        {{ showOnSmall ? "Hide steps" : "All steps" }}
        <span aria-hidden="true">{{ showOnSmall ? "▴" : "▾" }}</span>
      </button>
    </div>

    <div class="ck-flow__meter" role="presentation">
      <i :style="{ width: `${completion}%` }"></i>
    </div>

    <ol class="ck-flow__stages">
      <li
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="ck-flow__stage"
        :class="{
          'is-done': stage.done,
          'is-current': stage.current,
          'is-locked': !stage.open,
          'is-expanded': openId === stage.id
        }"
        :style="{ '--ck-stage': `var(--ck-${stage.accent})`, '--ck-stage-soft': `var(--ck-${stage.accent}-soft)` }"
      >
        <button
          type="button"
          class="ck-flow__stage-row"
          :aria-expanded="openId === stage.id"
          :aria-label="`Stage ${index + 1}, ${stage.title}, ${stage.doneCount} of ${stage.steps.length} steps done`"
          @click="toggleStage(stage)"
        >
          <span class="ck-flow__bubble" aria-hidden="true">
            <template v-if="stage.done">✓</template>
            <template v-else-if="!stage.open">🔒</template>
            <template v-else>{{ stage.icon }}</template>
          </span>
          <span class="ck-flow__stage-text">
            <small>Stage {{ index + 1 }}</small>
            {{ stage.title }}
          </span>
          <span class="ck-flow__chevron" aria-hidden="true">▾</span>
        </button>

        <ul v-show="openId === stage.id" class="ck-flow__steps">
          <li v-for="step in stage.steps" :key="step.id">
            <button
              type="button"
              class="ck-flow__step"
              :class="{ 'is-done': step.done, 'is-current': step.current, 'is-locked': !step.open }"
              :disabled="!step.open"
              :aria-current="step.current ? 'step' : undefined"
              @click="go(step)"
            >
              <span class="ck-flow__tick" aria-hidden="true">{{ step.done ? "✓" : "" }}</span>
              {{ step.label }}
            </button>
          </li>
        </ul>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ck-flow {
  position: sticky;
  top: 84px;
  padding: 18px 16px 14px;
  border: 1px solid var(--ck-border);
  border-radius: 26px;
  background: rgba(255, 255, 255, .97);
  box-shadow: 0 18px 44px rgba(51, 64, 71, .07);
  backdrop-filter: blur(10px);
}

.ck-flow__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.ck-flow__headline .ck-eyebrow { margin: 0 0 2px; }
.ck-flow__headline strong { display: block; font-family: var(--ck-font-display); font-size: 17px; line-height: 1.25; }
.ck-flow__toggle { display: none; }

.ck-flow__meter {
  height: 6px;
  margin: 12px 0 14px;
  border-radius: var(--ck-radius-pill);
  background: var(--ck-border);
  overflow: hidden;
}
.ck-flow__meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--ck-teal), var(--ck-green));
  transition: width .45s cubic-bezier(.2,.8,.2,1);
}

.ck-flow__stages { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }

.ck-flow__stage { position: relative; }
/* One line threaded through the bubbles, so the stages read as a single path. */
.ck-flow__stage:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 32px;
  top: 40px;
  bottom: -2px;
  width: 2px;
  border-radius: 2px;
  background: var(--ck-border);
}
.ck-flow__stage.is-done:not(:last-child)::before { background: var(--ck-green); }

.ck-flow__stage-row {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 11px;
  align-items: center;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: inherit;
  text-align: left;
}
.ck-flow__stage-row:hover { background: var(--ck-surface-warm); }
.ck-flow__stage.is-current .ck-flow__stage-row { background: var(--ck-stage-soft); }

.ck-flow__bubble {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--ck-surface-warm);
  box-shadow: inset 0 0 0 2px var(--ck-border);
  font-size: 16px;
  line-height: 1;
  transition: transform .3s cubic-bezier(.2,1.35,.4,1), background-color .3s ease;
}
.ck-flow__stage.is-current .ck-flow__bubble {
  background: var(--ck-stage);
  box-shadow: inset 0 0 0 2px var(--ck-stage), 0 0 0 5px var(--ck-stage-soft);
  transform: scale(1.06);
}
.ck-flow__stage.is-done .ck-flow__bubble {
  background: var(--ck-green);
  box-shadow: inset 0 0 0 2px var(--ck-green);
  color: #fff;
  font-size: 17px;
  font-weight: 900;
}
.ck-flow__stage.is-locked .ck-flow__bubble { filter: grayscale(1); opacity: .6; font-size: 13px; }

.ck-flow__stage-text { min-width: 0; font-size: var(--ck-size-small); font-weight: 800; line-height: 1.25; }
.ck-flow__stage-text small {
  display: block;
  color: var(--ck-muted);
  font-size: var(--ck-size-micro);
  font-weight: 900;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.ck-flow__stage.is-locked .ck-flow__stage-text { color: var(--ck-muted); }

.ck-flow__chevron { color: var(--ck-muted); font-size: 12px; transition: transform .25s ease; }
.ck-flow__stage.is-expanded .ck-flow__chevron { transform: rotate(180deg); }

.ck-flow__steps { display: grid; gap: 1px; margin: 2px 0 6px; padding: 0 0 0 45px; list-style: none; }

.ck-flow__step {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ck-muted);
  font-size: var(--ck-size-mini);
  font-weight: 700;
  text-align: left;
}
.ck-flow__step:hover:not(:disabled) { background: var(--ck-surface-warm); color: var(--ck-ink); }
.ck-flow__step.is-done { color: var(--ck-ink); }
.ck-flow__step.is-current { background: var(--ck-stage-soft); color: var(--ck-ink); font-weight: 900; }
.ck-flow__step:disabled { opacity: .5; cursor: not-allowed; }

.ck-flow__tick {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--ck-border);
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}
.ck-flow__step.is-done .ck-flow__tick { background: var(--ck-green); box-shadow: none; }
.ck-flow__step.is-current .ck-flow__tick { background: var(--ck-stage); box-shadow: none; }

@media (max-width: 1023px) {
  /* The menu folds into a single bar so the task keeps the screen. */
  .ck-flow { position: static; padding: 12px 14px; border-radius: 20px; }
  .ck-flow__toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 38px;
    flex: 0 0 auto;
    padding: 0 13px;
    border: 1px solid var(--ck-border);
    border-radius: var(--ck-radius-pill);
    background: var(--ck-surface-warm);
    color: var(--ck-ink);
    font-size: var(--ck-size-mini);
    font-weight: 800;
  }
  .ck-flow__meter { margin-bottom: 0; }
  .ck-flow__stages { display: none; }
  .ck-flow.is-open .ck-flow__stages { display: grid; margin-top: 14px; }
}

@media (prefers-reduced-motion: reduce) {
  .ck-flow__meter i, .ck-flow__bubble, .ck-flow__chevron { transition: none; }
}
</style>
