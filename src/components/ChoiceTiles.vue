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
  border: 1px solid var(--ck-border);
  border-radius: var(--ck-radius-card);
  color: var(--ck-ink);
  font-weight: 700;
  text-align: center;
  box-shadow: 0 3px 12px rgba(26,26,46,.035);
  transition: background-color .2s ease, border-color .2s ease, transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease;
}

.ck-tiles--large .ck-tile { min-height: 132px; }

.ck-tiles--compact .ck-tile {
  min-height: var(--ck-tap-min);
  padding: 16px 12px;
  border-radius: var(--ck-radius-ctrl);
}

.ck-tile:hover { border-color: rgba(201,166,38,.5); transform: translateY(-3px); box-shadow: 0 16px 34px rgba(32,54,61,.075); }
.ck-tile:focus-visible { outline: 3px solid var(--ck-coral); outline-offset: 3px; }

/* A quiet tinted selection keeps the page soft while remaining unmistakable. */
.ck-tile.is-chosen {
  background: var(--ck-coral-soft);
  border-color: var(--ck-coral);
  color: var(--ck-ink);
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(201,166,38,.14);
}

.ck-tile__icon { display: grid; place-items: center; width: 62px; height: 62px; border-radius: 20px; background: var(--ck-yellow-soft); font-size: 34px; line-height: 1; transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.ck-tiles li:nth-child(2) .ck-tile__icon { background: var(--ck-blue-soft); }
.ck-tiles li:nth-child(3) .ck-tile__icon { background: var(--ck-green-soft); }
.ck-tiles li:nth-child(4) .ck-tile__icon { background: var(--ck-purple-soft); }
.ck-tiles li:nth-child(5) .ck-tile__icon { background: var(--ck-teal-soft); }
.ck-tiles li:nth-child(6) .ck-tile__icon { background: #fbecef; }
.ck-tile:hover .ck-tile__icon { transform: scale(1.13) rotate(4deg); }
.ck-tile__label { font-size: var(--ck-size-body); }
.ck-tiles--compact .ck-tile__label { font-size: var(--ck-size-option); }

@media (max-width: 359px) {
  .ck-tiles { grid-template-columns: 1fr; }
}
</style>
