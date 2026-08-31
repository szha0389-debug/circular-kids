<script setup>
// The five-step indicator from the prototype: numbered circles joined by a rule,
// with the label under each. A finished step turns coral and shows a tick; the
// current step is filled in ink; the rest sit on the border tone.

const props = defineProps({ current: { type: Number, required: true } });

const steps = [
  { n: 1, label: "Identify Item" },
  { n: 2, label: "Find Problem" },
  { n: 3, label: "Clue Check" },
  { n: 4, label: "My Verdict" },
  { n: 5, label: "Compare" }
];
</script>

<template>
  <nav class="ck-steps" aria-label="Investigation progress">
    <ol class="ck-column ck-steps__list">
      <li
        v-for="(step, i) in steps"
        :key="step.n"
        class="ck-steps__item"
        :class="{ 'is-done': step.n < props.current, 'is-current': step.n === props.current }"
      >
        <span
          v-if="i > 0"
          class="ck-steps__rule"
          :class="{ 'is-done': step.n <= props.current }"
          aria-hidden="true"
        ></span>

        <span class="ck-steps__dot" aria-hidden="true">
          {{ step.n < props.current ? "✓" : step.n }}
        </span>

        <span class="ck-steps__label" :aria-current="step.n === props.current ? 'step' : undefined">
          {{ step.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ck-steps {
  background: var(--ck-surface);
  border-bottom: 1px solid var(--ck-border);
}

.ck-steps__list {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  list-style: none;
  /* margin-block, not the shorthand: .ck-column centres this with auto margins. */
  margin-block: 0;
  padding-block: 8px 10px;
}

.ck-steps__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1 1 0;
  min-width: 0;
}

/* The rule sits between this dot and the previous one. */
.ck-steps__rule {
  position: absolute;
  top: 15px;
  right: calc(50% + 20px);
  width: calc(100% - 40px);
  height: 2px;
  background: var(--ck-border);
}
.ck-steps__rule.is-done { background: var(--ck-coral); }

.ck-steps__dot {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--ck-border);
  color: var(--ck-muted);
  font-size: var(--ck-size-mini);
  font-weight: 800;
  line-height: 1;
}

.ck-steps__item.is-done .ck-steps__dot {
  background: var(--ck-coral);
  color: #fff;
}

.ck-steps__item.is-current .ck-steps__dot {
  background: var(--ck-ink);
  color: #fff;
}

.ck-steps__label {
  font-size: var(--ck-size-micro);
  font-weight: 700;
  color: var(--ck-muted);
  text-align: center;
  line-height: 1.25;
}

.ck-steps__item.is-current .ck-steps__label { color: var(--ck-ink); }

@media (max-width: 419px) {
  /* At the narrowest supported width the labels would wrap to three lines each,
     so only the current step keeps its words. */
  .ck-steps__item:not(.is-current) .ck-steps__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
  .ck-steps__item.is-current .ck-steps__label { white-space: nowrap; }
}
</style>
