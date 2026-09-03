<script setup>
defineProps({ current: { type: Number, required: true } });

const steps = [
  { number: 1, label: "Spot the sign" },
  { number: 2, label: "Learn why" },
  { number: 3, label: "Compare" },
  { number: 4, label: "Safety boundary" }
];
</script>

<template>
  <nav class="ck-safety-steps" aria-label="Safety activity progress">
    <ol>
      <li v-for="step in steps" :key="step.number" :class="{ active: step.number === current, done: step.number < current }">
        <span>{{ step.number < current ? "✓" : step.number }}</span>
        <small>{{ step.label }}</small>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ck-safety-steps { position: relative; z-index: 4; background: var(--ck-surface); border-bottom: 1px solid var(--ck-border); }
ol { display: grid; grid-template-columns: repeat(4, 1fr); max-width: var(--ck-column); margin: 0 auto; padding: 12px 20px; list-style: none; }
li { position: relative; display: grid; justify-items: center; gap: 4px; color: var(--ck-muted); text-align: center; }
li:not(:last-child)::after { content: ""; position: absolute; left: 64%; right: -36%; top: 15px; height: 2px; background: var(--ck-border); }
li.done:not(:last-child)::after { background: var(--ck-teal); }
span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--ck-surface-warm); font-weight: 800; }
li.active span { background: var(--ck-coral); color: white; }
li.done span { background: var(--ck-teal); color: white; }
small { font-size: 10px; font-weight: 700; }
@media (max-width: 420px) { small { max-width: 64px; line-height: 1.15; } }
</style>
