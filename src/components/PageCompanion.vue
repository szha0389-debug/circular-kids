<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const scenes = {
  breakdown: { main: "🔍", left: "🧩", right: "✨", text: "Look at one part at a time" },
  verdict: { main: "🤔", left: "💭", right: "📝", text: "Your own idea comes first" },
  handover: { main: "🌱", left: "♻️", right: "⭐", text: "One small clue can start a new future" },
  "safety-reveal": { main: "🛡️", left: "👀", right: "💡", text: "Look, pause, and learn why" },
  "safety-boundary": { main: "🙋", left: "🛡️", right: "🌈", text: "Asking an adult is a strong choice" }
};

const scene = computed(() => scenes[route.name] || null);
</script>

<template>
  <aside v-if="scene" class="ck-companion" aria-label="Learning moment">
    <span class="ck-companion__bubble ck-companion__bubble--left" aria-hidden="true">{{ scene.left }}</span>
    <span class="ck-companion__main" aria-hidden="true">{{ scene.main }}</span>
    <span class="ck-companion__bubble ck-companion__bubble--right" aria-hidden="true">{{ scene.right }}</span>
    <p>{{ scene.text }}</p>
  </aside>
</template>

<style scoped>
.ck-companion {
  position: relative;
  display: grid;
  grid-template-columns: 54px 82px 54px;
  grid-template-rows: 82px auto;
  place-content: center;
  align-items: center;
  gap: 0 10px;
  margin: 0 0 24px;
  padding: 22px 18px 18px;
  overflow: hidden;
  border: 1px solid rgba(121,199,240,.28);
  border-radius: 24px;
  background: linear-gradient(120deg, var(--ck-yellow-soft), var(--ck-teal-soft) 46%, var(--ck-purple-soft));
}
.ck-companion::before,
.ck-companion::after {
  content: "";
  position: absolute;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: rgba(255,255,255,.58);
}
.ck-companion::before { left: -28px; top: -36px; }
.ck-companion::after { right: -32px; bottom: -40px; }
.ck-companion__main {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(61,74,80,.09);
  font-size: 42px;
  animation: ck-companion-float 3s ease-in-out infinite;
}
.ck-companion__bubble {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,.78);
  font-size: 24px;
  animation: ck-companion-orbit 3.8s ease-in-out infinite;
}
.ck-companion__bubble--right { animation-delay: -.9s; }
.ck-companion p {
  grid-column: 1 / -1;
  margin: 12px 0 0;
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
  font-weight: 800;
  text-align: center;
}
@keyframes ck-companion-float {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-7px) rotate(2deg); }
}
@keyframes ck-companion-orbit {
  0%, 100% { transform: translateY(4px) rotate(-5deg); }
  50% { transform: translateY(-7px) rotate(7deg); }
}
@media (prefers-reduced-motion: reduce) {
  .ck-companion__main, .ck-companion__bubble { animation: none; }
}
</style>
