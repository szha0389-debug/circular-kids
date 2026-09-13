<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  MYSTERIES,
  findMystery,
  hintFor,
  isCorrectArea,
  isHit,
  nextMystery,
  shouldNudge
} from "../../core/mysteries.js";
import { useMysteries } from "@/stores/mysteries";
import QuestionMission from "@/components/QuestionMission.vue";
import MysteryScene from "@/components/MysteryScene.vue";

const route = useRoute();
const router = useRouter();
const progress = useMysteries();

const mystery = computed(() => findMystery(route.params.id));
const position = computed(() => MYSTERIES.findIndex(item => item.id === mystery.value?.id) + 1);

const misses = ref(0);
const solved = ref(false);
const marker = ref(null);
const successCard = ref(null);

const hint = computed(() => hintFor(mystery.value, misses.value));
const nudge = computed(() => shouldNudge(misses.value));
// Worked out once the mystery is solved, so it never offers the same scene back.
const next = computed(() => (solved.value ? nextMystery(mystery.value.id, progress.done) : null));

// "Next mystery" reuses this view with a new id, so the attempt starts clean.
watch(() => route.params.id, () => {
  misses.value = 0;
  solved.value = false;
  marker.value = null;
});

function settle(correct, point = null) {
  if (solved.value || !mystery.value) return;
  marker.value = point;
  if (!correct) {
    misses.value += 1;
    return;
  }
  solved.value = true;
  progress.markDone(mystery.value.id);
  // The picked area disappears once solved, so hand focus to the explanation
  // rather than letting it fall back to the top of the page.
  nextTick(() => {
    const card = successCard.value;
    if (!card) return;
    card.focus({ preventScroll: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  });
}

function onTap(point) {
  settle(isHit(mystery.value, point), point);
}

function onChooseArea(area) {
  const [x, y, width, height] = area.rect;
  settle(isCorrectArea(mystery.value, area.id), { x: x + width / 2, y: y + height / 2 });
}
</script>

<template>
  <section v-if="mystery" class="ck-mystery">
    <QuestionMission
      :eyebrow="`Mystery ${position} of ${MYSTERIES.length} · ${mystery.category}`"
      :title="mystery.title"
      :description="mystery.prompt"
      :icon="mystery.icon"
    />

    <!-- Feedback sits above the picture so the hint and the next try are both in
         view on a laptop and on a phone. -->
    <div class="ck-mystery__feedback" aria-live="polite">
      <article
        v-if="solved"
        ref="successCard"
        class="ck-mystery__success"
        tabindex="-1"
      >
        <span class="ck-mystery__badge" aria-hidden="true">🎉</span>
        <div>
          <h2>{{ mystery.success.title }}</h2>
          <p>{{ mystery.success.text }}</p>
          <p class="ck-mystery__lesson"><span aria-hidden="true">🌱</span> {{ mystery.lesson }}</p>
          <p v-if="mystery.safetyNote" class="ck-mystery__safety">
            <span aria-hidden="true">🙋</span> {{ mystery.safetyNote }}
          </p>
        </div>
      </article>

      <article v-else-if="hint" :key="misses" class="ck-mystery__hint">
        <strong>{{ hint.title }}</strong>
        <p>{{ hint.text }}</p>
      </article>

      <p v-else class="ck-mystery__instruction">
        <span aria-hidden="true">👆</span> Tap the part of the picture that shows the problem.
      </p>
    </div>

    <MysteryScene
      :mystery="mystery"
      :solved="solved"
      :marker="marker"
      :nudge="nudge"
      @tap="onTap"
      @choose-area="onChooseArea"
    />

    <p v-if="!solved" class="ck-mystery__tip">
      {{ nudge ? "Look inside the glowing ring 🔍" : "No need to be exact — tapping close by counts." }}
    </p>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'mystery-hub' })">
        ← All mysteries
      </button>
      <button
        v-if="solved && next"
        type="button"
        class="btn btn-primary btn--wide"
        @click="router.push({ name: 'mystery', params: { id: next.id } })"
      >
        Next: {{ next.category }} {{ next.icon }} →
      </button>
    </div>
  </section>
</template>

<style scoped>
.ck-mystery__feedback { margin-bottom: 16px; }

/* The instruction and the hint share a height, so the picture does not move
   between one tap and the next. */
.ck-mystery__instruction,
.ck-mystery__hint { min-height: 62px; }

.ck-mystery__instruction {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-blue-soft);
  font-size: var(--ck-size-small);
  font-weight: 700;
}

.ck-mystery__hint {
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-yellow-soft);
  box-shadow: inset 4px 0 0 var(--ck-yellow);
  animation: ck-mystery-wiggle .45s cubic-bezier(.2,.8,.2,1);
}
.ck-mystery__hint strong { display: block; font-family: var(--ck-font-display); font-size: 17px; }
.ck-mystery__hint p { margin: 2px 0 0; font-size: var(--ck-size-small); }

.ck-mystery__success {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: var(--ck-radius-card);
  background: var(--ck-green-soft);
  box-shadow: inset 4px 0 0 var(--ck-green);
  animation: ck-mystery-rise .5s cubic-bezier(.2,.8,.2,1);
  outline: none;
}
.ck-mystery__badge { font-size: 34px; line-height: 1; animation: ck-mystery-bounce .8s cubic-bezier(.2,.8,.2,1); }
.ck-mystery__success h2 { margin: 0 0 4px; font-size: var(--ck-size-h2); }
.ck-mystery__success p { margin: 0; font-size: var(--ck-size-small); line-height: 1.6; }
.ck-mystery__lesson { margin-top: 10px !important; font-weight: 800; }
.ck-mystery__safety {
  margin-top: 10px !important;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--ck-yellow-soft);
  font-weight: 700;
}

.ck-mystery__tip {
  margin: 10px 0 0;
  text-align: center;
  color: var(--ck-muted);
  font-size: var(--ck-size-mini);
  font-weight: 700;
}

@media (max-width: 520px) {
  .ck-mystery__success { flex-direction: column; gap: 6px; }
  .ck-mystery__badge { font-size: 28px; }
}

@keyframes ck-mystery-wiggle {
  0% { transform: translateX(0); }
  30% { transform: translateX(-5px); }
  60% { transform: translateX(4px); }
  100% { transform: none; }
}
@keyframes ck-mystery-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes ck-mystery-bounce { 0% { transform: scale(.3) rotate(-20deg); } 60% { transform: scale(1.2) rotate(8deg); } 100% { transform: none; } }
</style>
