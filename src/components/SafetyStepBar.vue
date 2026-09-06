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
.ck-safety-steps { position: relative; z-index: 4; background: rgba(255,255,255,.92); backdrop-filter: blur(14px); border-bottom: 1px solid var(--ck-border); }
ol { display: grid; grid-template-columns: repeat(4, 1fr); max-width: var(--ck-column); margin: 0 auto; padding: 12px 20px; list-style: none; }
li { position: relative; display: grid; justify-items: center; gap: 4px; color: var(--ck-muted); text-align: center; }
li:not(:last-child)::after { content: ""; position: absolute; left: 64%; right: -36%; top: 15px; height: 2px; background: var(--ck-border); }
li.done:not(:last-child)::after { background: var(--ck-teal); }
span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--ck-surface-warm); font-weight: 800; transition: transform .3s cubic-bezier(.2,1.35,.4,1), box-shadow .3s ease; }
li.active span { background: var(--ck-coral); color: var(--ck-ink); transform: scale(1.08); box-shadow: 0 0 0 6px rgba(183,148,48,.12); }
li.done span { background: var(--ck-teal); color: white; animation: ck-safety-pop .38s cubic-bezier(.2,1.35,.4,1); }
@keyframes ck-safety-pop { from { transform: scale(.7); } to { transform: scale(1); } }
small { font-size: 10px; font-weight: 700; }
@media (max-width: 420px) { small { max-width: 64px; line-height: 1.15; } }
</style>
