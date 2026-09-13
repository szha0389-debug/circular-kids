<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { MYSTERIES, nextMystery } from "../../core/mysteries.js";
import { useMysteries } from "@/stores/mysteries";
import QuestionMission from "@/components/QuestionMission.vue";

const router = useRouter();
const progress = useMysteries();

// Presentation only: each category keeps one colour everywhere it appears.
const ACCENTS = {
  "bottle-bin": "blue",
  "running-tap": "teal",
  "lights-on": "yellow",
  "park-litter": "green",
  "old-battery": "purple",
  "tshirt-hole": "coral"
};

const allSolved = computed(() => progress.doneCount === MYSTERIES.length);
// Start the child on something new rather than the first card every time.
const suggested = computed(() => nextMystery(null, progress.done));

function open(id) {
  router.push({ name: "mystery", params: { id } });
}
</script>

<template>
  <section class="ck-mystery-hub">
    <QuestionMission
      eyebrow="Circular mystery quiz"
      title="Spot the circular mystery"
      description="Look closely at each picture and tap the part that shows the problem. There is no timer and no score — just careful looking."
      icon="🕵️"
    />

    <div class="ck-hub-progress" aria-live="polite">
      <div class="ck-hub-progress__dots" aria-hidden="true">
        <span
          v-for="mystery in MYSTERIES"
          :key="mystery.id"
          :class="{ 'is-done': progress.isDone(mystery.id) }"
          :style="{ '--ck-dot': `var(--ck-${ACCENTS[mystery.id]})` }"
        >{{ mystery.icon }}</span>
      </div>
      <p>
        <strong>{{ progress.doneCount }} of {{ MYSTERIES.length }}</strong>
        {{ allSolved ? "mysteries solved — you have explored every category!" : "mysteries solved" }}
      </p>
    </div>

    <ul class="ck-hub-grid">
      <li v-for="mystery in MYSTERIES" :key="mystery.id">
        <button
          type="button"
          class="ck-card ck-hub-card"
          :class="{ 'is-done': progress.isDone(mystery.id) }"
          :style="{ '--ck-accent': `var(--ck-${ACCENTS[mystery.id]})`, '--ck-accent-soft': `var(--ck-${ACCENTS[mystery.id]}-soft)` }"
          @click="open(mystery.id)"
        >
          <span class="ck-hub-card__icon" aria-hidden="true">{{ mystery.icon }}</span>
          <span class="ck-hub-card__category">{{ mystery.category }}</span>
          <strong class="ck-hub-card__title">{{ mystery.title }}</strong>
          <span class="ck-hub-card__status">
            {{ progress.isDone(mystery.id) ? "Solved ✓ · Look again" : "Start →" }}
          </span>
        </button>
      </li>
    </ul>

    <button v-if="suggested" type="button" class="btn btn-primary w-100 ck-hub-start" @click="open(suggested.id)">
      {{ allSolved ? `Look again: ${suggested.title}` : `Start with ${suggested.category} →` }}
    </button>
  </section>
</template>

<style scoped>
.ck-hub-progress {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 18px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-surface-warm);
  border: 1px solid var(--ck-border);
}
.ck-hub-progress p { margin: 0; font-size: var(--ck-size-small); color: var(--ck-muted); font-weight: 700; }
.ck-hub-progress strong { color: var(--ck-ink); font-family: var(--ck-font-display); font-size: 18px; }
.ck-hub-progress__dots { display: flex; gap: 6px; }
.ck-hub-progress__dots span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fff;
  border: 2px dashed var(--ck-border);
  font-size: 16px;
  filter: grayscale(1);
  opacity: .55;
  transition: all .3s ease;
}
.ck-hub-progress__dots span.is-done {
  border: 2px solid var(--ck-dot);
  filter: none;
  opacity: 1;
}

.ck-hub-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ck-hub-grid li { display: flex; }

.ck-hub-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 176px;
  padding: 18px 16px 16px;
  text-align: left;
  color: var(--ck-ink);
  cursor: pointer;
}
.ck-hub-card:hover { transform: translateY(-3px); }
.ck-hub-card__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 4px;
  border-radius: 16px;
  background: var(--ck-accent-soft);
  font-size: 28px;
  transition: transform .3s cubic-bezier(.2,.8,.2,1);
}
.ck-hub-card:hover .ck-hub-card__icon { transform: rotate(-6deg) scale(1.06); }
.ck-hub-card__category {
  padding: 2px 10px;
  border-radius: var(--ck-radius-pill);
  background: var(--ck-accent-soft);
  font-size: var(--ck-size-micro);
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.ck-hub-card__title { font-family: var(--ck-font-display); font-size: 17px; line-height: 1.25; }
.ck-hub-card__status { margin-top: auto; padding-top: 6px; font-size: var(--ck-size-mini); font-weight: 800; color: var(--ck-muted); }
.ck-hub-card:not(.is-done) .ck-hub-card__status { color: var(--ck-ink); }
.ck-hub-card.is-done { background: var(--ck-surface-warm); }
.ck-hub-card.is-done .ck-hub-card__status { color: #5c9c3e; }

.ck-hub-start { margin-top: 22px; }

@media (max-width: 640px) {
  .ck-hub-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 400px) {
  .ck-hub-grid { grid-template-columns: 1fr; }
  .ck-hub-card { min-height: 0; }
}
</style>
