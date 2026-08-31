<script setup>
// The two-column tile grid from the prototype's item-list screens.
//
// `size: "large"` is the category treatment — a big emoji above the label.
// `size: "compact"` is the item treatment — label only, no icon.
// A chosen tile fills with ink and turns its label white, exactly as drawn.

const props = defineProps({
  choices: { type: Array, required: true },   // [{ value, label, icon? }]
  modelValue: { type: [String, null], default: null },
  size: { type: String, default: "large" }    // large | compact
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <ul class="ck-tiles" :class="`ck-tiles--${props.size}`" role="list">
    <li v-for="choice in props.choices" :key="choice.value">
      <button
        type="button"
        class="ck-tile"
        :class="{ 'is-chosen': props.modelValue === choice.value }"
        :aria-pressed="props.modelValue === choice.value"
        @click="$emit('update:modelValue', choice.value)"
      >
        <span v-if="props.size === 'large' && choice.icon" class="ck-tile__icon" aria-hidden="true">
          {{ choice.icon }}
        </span>
        <span class="ck-tile__label">{{ choice.label }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.ck-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ck-gap-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.ck-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ck-gap-sm);
  width: 100%;
  padding: 20px 12px;
  background: var(--ck-surface);
  border: 2px solid var(--ck-border);
  border-radius: var(--ck-radius-card);
  color: var(--ck-ink);
  font-weight: 700;
  text-align: center;
  transition: background-color 0.12s ease, border-color 0.12s ease, transform 0.12s ease;
}

.ck-tiles--large .ck-tile { min-height: 132px; }

.ck-tiles--compact .ck-tile {
  min-height: var(--ck-tap-min);
  padding: 16px 12px;
  border-radius: var(--ck-radius-ctrl);
}

.ck-tile:hover { border-color: var(--ck-coral); transform: translateY(-1px); }
.ck-tile:focus-visible { outline: 3px solid var(--ck-coral); outline-offset: 3px; }

/* The prototype fills a chosen tile with ink and reverses the label. */
.ck-tile.is-chosen {
  background: var(--ck-ink);
  border-color: var(--ck-ink);
  color: #fff;
}

.ck-tile__icon { font-size: 38px; line-height: 1; }
.ck-tile__label { font-size: var(--ck-size-body); }
.ck-tiles--compact .ck-tile__label { font-size: var(--ck-size-option); }

@media (max-width: 359px) {
  .ck-tiles { grid-template-columns: 1fr; }
}
</style>
