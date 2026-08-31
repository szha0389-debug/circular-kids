<script setup>
// A tap-only list of choices — problems (multi-select), clue answers, verdicts.
//
// Layout and shape come from the prototype: full-width white rows, 2 px border,
// 14 px radius, icon then label.
//
// One deliberate departure from the prototype, and the reason is the epic
// itself. In the Figma flow a chosen clue answer takes on a meaning colour —
// green for "Yes", coral for "No", purple for "Not Sure" — and the labels carry
// ✅ / ❌. US-1.3 says the site "gives no reaction, hint or encouragement about
// what the answer means", and its developer note explains why: a reaction leaks
// the conclusion before the child commits to a verdict in US-1.4, which is the
// point of the whole epic. So selection here is one neutral treatment — the
// prototype's coral accent — for every option, whatever it says.
//
// `tone` is still available for lists where colour carries no verdict meaning
// (the verdict list itself, where the child's own choice is the subject).
const props = defineProps({
  options: { type: Array, required: true },   // [{ value, label, icon?, hint? }]
  modelValue: { type: [String, Array, null], default: null },
  multiple: { type: Boolean, default: false },
  name: { type: String, required: true }
});
const emit = defineEmits(["update:modelValue"]);

const isChosen = value =>
  props.multiple ? (props.modelValue || []).includes(value) : props.modelValue === value;

function choose(value) {
  if (!props.multiple) return emit("update:modelValue", value);
  const current = [...(props.modelValue || [])];
  const at = current.indexOf(value);
  if (at === -1) current.push(value);
  else current.splice(at, 1);
  emit("update:modelValue", current);
}
</script>

<template>
  <ul class="ck-options" role="list">
    <li v-for="option in props.options" :key="option.value">
      <button
        type="button"
        class="ck-option"
        :class="{ 'is-chosen': isChosen(option.value) }"
        :aria-pressed="isChosen(option.value)"
        @click="choose(option.value)"
      >
        <span v-if="option.icon" class="ck-option__icon" aria-hidden="true">{{ option.icon }}</span>
        <span class="ck-option__body">
          <span class="ck-option__label">{{ option.label }}</span>
          <span v-if="option.hint" class="ck-option__hint">{{ option.hint }}</span>
        </span>
        <span v-if="isChosen(option.value)" class="ck-option__tick" aria-hidden="true">✓</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.ck-options {
  display: grid;
  gap: var(--ck-gap-sm);
  list-style: none;
  padding: 0;
  margin: 0;
}

.ck-option {
  display: flex;
  align-items: center;
  gap: var(--ck-gap);
  width: 100%;
  min-height: var(--ck-tap-min);
  padding: 14px 16px;
  text-align: left;
  background: var(--ck-surface);
  border: 2px solid var(--ck-border);
  border-radius: var(--ck-radius-ctrl);
  color: var(--ck-ink);
  font-size: var(--ck-size-option);
  font-weight: 600;
  transition: border-color 0.12s ease, background-color 0.12s ease, transform 0.12s ease;
}

.ck-option:hover { border-color: var(--ck-coral); transform: translateY(-1px); }
.ck-option:focus-visible { outline: 3px solid var(--ck-coral); outline-offset: 3px; }

/* One selection treatment for every option — see the note in <script>. */
.ck-option.is-chosen {
  border-color: var(--ck-coral);
  background: var(--ck-coral-soft);
}

.ck-option__icon { flex: 0 0 auto; font-size: 20px; line-height: 1; }

.ck-option__body { flex: 1 1 auto; display: grid; gap: 2px; min-width: 0; }
.ck-option__label { display: block; }
.ck-option__hint {
  display: block;
  font-size: var(--ck-size-mini);
  font-weight: 400;
  color: var(--ck-muted);
}

.ck-option__tick {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ck-coral);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}
</style>
