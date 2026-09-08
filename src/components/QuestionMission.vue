<script setup>
defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "🔎" }
});
</script>

<template>
  <header class="ck-mission">
    <div class="ck-mission__friend" aria-hidden="true">
      <span class="ck-mission__spark">✦</span>
      <span class="ck-mission__emoji">{{ icon }}</span>
      <span class="ck-mission__face">●‿●</span>
    </div>
    <div class="ck-mission__copy">
      <p class="ck-eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="ck-lead">{{ description }}</p>
    </div>
  </header>
</template>

<style scoped>
.ck-mission {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 22px;
  align-items: center;
  margin: -8px -8px 24px;
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(125deg, var(--ck-yellow-soft), var(--ck-teal-soft), var(--ck-purple-soft));
}
.ck-mission__copy h1 { margin: 0 0 6px; font-size: var(--ck-size-h1); }
.ck-mission__copy .ck-eyebrow { margin-bottom: 5px; color: var(--ck-coral); }
.ck-mission__copy .ck-lead { margin: 0; }
.ck-mission__friend { position: relative; display: grid; place-items: center; width: 104px; height: 104px; border-radius: 34px 48px 36px 44px; background: #fff; box-shadow: 0 10px 24px rgba(61,74,80,.10); animation: ck-mission-bob 3s ease-in-out infinite; }
.ck-mission__emoji { font-size: 46px; line-height: 1; }
.ck-mission__face { position: absolute; bottom: 9px; color: var(--ck-ink); font-size: 12px; font-weight: 900; letter-spacing: 2px; }
.ck-mission__spark { position: absolute; top: -8px; right: -6px; color: var(--ck-yellow); font-size: 27px; animation: ck-mission-spark 1.8s ease-in-out infinite; }
@keyframes ck-mission-bob { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-6px) rotate(2deg); } }
@keyframes ck-mission-spark { 0%, 100% { transform: scale(.75); opacity: .55; } 50% { transform: scale(1.15) rotate(18deg); opacity: 1; } }
@media (max-width: 520px) {
  .ck-mission { grid-template-columns: 76px 1fr; gap: 14px; padding: 16px; }
  .ck-mission__friend { width: 72px; height: 72px; border-radius: 24px 30px 24px 29px; }
  .ck-mission__emoji { font-size: 34px; }
  .ck-mission__face { display: none; }
}
@media (prefers-reduced-motion: reduce) { .ck-mission__friend, .ck-mission__spark { animation: none; } }
</style>
