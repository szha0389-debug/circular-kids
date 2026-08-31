<script setup>
// The pastel shapes scattered behind the content in the prototype. Purely
// decorative: fixed, non-interactive, and hidden from assistive technology.
// Positions are in viewport units so they stay off the 540 px content column
// at every width; below 900 px they are dropped entirely rather than crowding
// a phone screen.
const shapes = [
  { cls: "diamond", tone: "teal", top: "14%", left: "2%", size: 46 },
  { cls: "circle", tone: "yellow", top: "2%", right: "6%", size: 70 },
  { cls: "bar", tone: "coral", top: "28%", left: "0%", size: 30 },
  { cls: "diamond sm", tone: "green", top: "20%", right: "3%", size: 16 },
  { cls: "triangle", tone: "purple", top: "42%", right: "2%", size: 20 },
  { cls: "square", tone: "coral", top: "82%", right: "6%", size: 44 },
  { cls: "circle sm", tone: "purple", top: "88%", left: "5%", size: 16 }
];
</script>

<template>
  <div class="ck-backdrop" aria-hidden="true">
    <span
      v-for="(s, i) in shapes"
      :key="i"
      class="ck-shape"
      :class="[s.cls, `tone-${s.tone}`]"
      :style="{ top: s.top, left: s.left, right: s.right, '--size': `${s.size}px` }"
    ></span>
  </div>
</template>

<style scoped>
.ck-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.ck-shape {
  position: absolute;
  width: var(--size);
  height: var(--size);
  opacity: 0.5;
}

.tone-teal { background: var(--ck-teal); }
.tone-yellow { background: var(--ck-yellow); }
.tone-coral { background: var(--ck-coral); }
.tone-green { background: var(--ck-green); }
.tone-purple { background: var(--ck-purple); }

.circle { border-radius: 50%; }
.square { border-radius: 6px; transform: rotate(12deg); }
.diamond { border-radius: 6px; transform: rotate(45deg); }
.bar { width: 10px; height: var(--size); border-radius: 0 6px 6px 0; }

.triangle {
  background: none;
  width: 0;
  height: 0;
  border-left: calc(var(--size) / 2) solid transparent;
  border-right: calc(var(--size) / 2) solid transparent;
  border-bottom: var(--size) solid var(--ck-purple);
}

@media (max-width: 899px) {
  .ck-backdrop { display: none; }
}
</style>
