<script setup>
import { computed, ref } from "vue";
import { SCENE_HEIGHT, SCENE_WIDTH } from "../../core/mysteries.js";
import BottleBinScene from "@/components/mysteries/BottleBinScene.vue";
import RunningTapScene from "@/components/mysteries/RunningTapScene.vue";
import LightsOnScene from "@/components/mysteries/LightsOnScene.vue";
import ParkLitterScene from "@/components/mysteries/ParkLitterScene.vue";
import OldBatteryScene from "@/components/mysteries/OldBatteryScene.vue";
import TShirtHoleScene from "@/components/mysteries/TShirtHoleScene.vue";

const props = defineProps({
  mystery: { type: Object, required: true },
  solved: { type: Boolean, default: false },
  // The last place the child tapped, in scene units, so they can see where
  // their guess landed (AC4.1.2).
  marker: { type: Object, default: null },
  nudge: { type: Boolean, default: false }
});

const emit = defineEmits(["tap", "choose-area"]);

const SCENES = {
  "bottle-bin": BottleBinScene,
  "running-tap": RunningTapScene,
  "lights-on": LightsOnScene,
  "park-litter": ParkLitterScene,
  "old-battery": OldBatteryScene,
  "tshirt-hole": TShirtHoleScene
};

const svg = ref(null);
const scene = computed(() => SCENES[props.mystery.id]);
const target = computed(() => {
  const [x, y, width, height] = props.mystery.target;
  return { x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
});
const CONFETTI = ["yellow", "coral", "teal", "purple", "green", "blue", "yellow", "coral"];

// Convert the pointer position into scene units through the SVG's own matrix,
// so the check stays correct at any rendered size or aspect ratio.
function onTap(event) {
  if (props.solved || !svg.value) return;
  const matrix = svg.value.getScreenCTM();
  if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  emit("tap", { x: point.x, y: point.y });
}

// A pointer click on an area button still goes through the tap check, so a
// finger landing just inside a named area is judged exactly like one landing
// beside it. Keyboard activation reports no click count, so it picks the area.
function onArea(event, area) {
  if (event.detail > 0) onTap(event);
  else emit("choose-area", area);
}

function areaStyle([x, y, width, height]) {
  return {
    left: `${(x / SCENE_WIDTH) * 100}%`,
    top: `${(y / SCENE_HEIGHT) * 100}%`,
    width: `${(width / SCENE_WIDTH) * 100}%`,
    height: `${(height / SCENE_HEIGHT) * 100}%`
  };
}
</script>

<template>
  <figure class="ck-scene" :class="{ 'is-solved': solved }">
    <svg
      ref="svg"
      :viewBox="`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`"
      aria-hidden="true"
      @click="onTap"
    >
      <component :is="scene" :solved="solved" />

      <!-- Shaped to the problem but a little larger, so it narrows the search
           without drawing an exact box around the answer. -->
      <ellipse
        v-if="nudge && !solved"
        class="ck-scene__nudge"
        :cx="target.cx"
        :cy="target.cy"
        :rx="target.width / 2 + 26"
        :ry="target.height / 2 + 20"
      />

      <g v-if="marker && !solved" class="ck-scene__marker">
        <circle :cx="marker.x" :cy="marker.y" r="22" />
        <circle :cx="marker.x" :cy="marker.y" r="8" />
      </g>

      <g v-if="solved" class="ck-scene__found">
        <rect :x="target.x - 6" :y="target.y - 6" :width="target.width + 12" :height="target.height + 12" rx="18" />
        <circle :cx="target.x + target.width + 2" :cy="target.y - 2" r="15" />
        <path :d="`M${target.x + target.width - 5} ${target.y - 2} l5 5 l9 -10`" />
      </g>
    </svg>

    <!-- Keyboard and screen-reader route to the same activity: each named part
         of the picture is a real button, invisible until it has focus. -->
    <div v-if="!solved" class="ck-scene__areas" role="group" :aria-label="`Parts of the picture: ${mystery.title}`">
      <button
        v-for="area in mystery.areas"
        :key="area.id"
        type="button"
        class="ck-scene__area"
        :style="areaStyle(area.rect)"
        :aria-label="area.label"
        @click="onArea($event, area)"
      />
    </div>

    <div v-if="solved" class="ck-scene__confetti" aria-hidden="true">
      <span
        v-for="(colour, index) in CONFETTI"
        :key="index"
        :style="{ '--x': `${10 + index * 11}%`, '--delay': `${index * 0.05}s`, background: `var(--ck-${colour})` }"
      />
    </div>
  </figure>
</template>

<style scoped>
.ck-scene {
  position: relative;
  margin: 0;
  border-radius: 22px;
  overflow: hidden;
  background: var(--ck-surface-warm);
  box-shadow: 0 0 0 1px var(--ck-border), 0 14px 36px rgba(51, 64, 71, .07);
  transition: box-shadow .4s ease;
}
.ck-scene.is-solved {
  box-shadow: 0 0 0 4px var(--ck-green), 0 18px 44px rgba(145, 214, 111, .22);
}
.ck-scene svg {
  display: block;
  width: 100%;
  height: auto;
  cursor: crosshair;
  touch-action: manipulation;
}
.ck-scene.is-solved svg { cursor: default; }

.ck-scene__marker circle:first-child { fill: var(--ck-coral); opacity: .22; }
.ck-scene__marker circle:last-child { fill: var(--ck-coral); stroke: #fff; stroke-width: 3; }
.ck-scene__marker { animation: ck-scene-pop .3s cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }

.ck-scene__nudge {
  fill: rgba(255, 220, 82, .12);
  stroke: var(--ck-yellow);
  stroke-width: 4;
  stroke-dasharray: 10 8;
  animation: ck-scene-breathe 2.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
  pointer-events: none;
}

.ck-scene__found rect { fill: rgba(145, 214, 111, .14); stroke: var(--ck-green); stroke-width: 4; stroke-dasharray: 13 7; }
.ck-scene__found circle { fill: var(--ck-green); }
.ck-scene__found path { fill: none; stroke: #fff; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.ck-scene__found { animation: ck-scene-pop .45s cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }

.ck-scene__areas { position: absolute; inset: 0; pointer-events: none; }
.ck-scene__area {
  position: absolute;
  pointer-events: auto;
  cursor: crosshair;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: transparent;
  opacity: 0;
}
.ck-scene__area:focus-visible {
  opacity: 1;
  outline: 3px solid var(--ck-coral);
  outline-offset: 2px;
  background: rgba(255, 146, 156, .12);
}

.ck-scene__confetti { position: absolute; inset: 0; pointer-events: none; }
.ck-scene__confetti span {
  position: absolute;
  top: 30%;
  left: var(--x);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  opacity: 0;
  animation: ck-scene-confetti 1.1s ease-out var(--delay) forwards;
}

@keyframes ck-scene-pop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ck-scene-breathe { 50% { transform: scale(1.06); opacity: .7; } }
@keyframes ck-scene-confetti {
  0% { transform: translateY(0) scale(.4); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-90px) scale(1); opacity: 0; }
}
</style>
