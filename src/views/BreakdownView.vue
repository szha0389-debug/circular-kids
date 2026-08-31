<script setup>
// US-1.2, first half — See what's still good.
//
// The parts come before the question, on their own screen, because the point of
// the story is that the child sees the whole item before naming the broken bit.

import { computed } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";

const store = useInvestigation();
const router = useRouter();

const MODE_LABEL = {
  components: "Component view",
  sections: "Section view",
  qualities: "Qualities view"
};

const MODE_TITLE = {
  components: "Parts of your",
  sections: "Areas of your",
  qualities: "Looking at your"
};

const mode = computed(() => store.breakdown?.mode || "qualities");
const elements = computed(() => store.breakdown?.elements || []);
const tones = ["blue", "purple", "coral", "teal", "green", "yellow"];
</script>

<template>
  <section>
    <p class="ck-eyebrow">{{ MODE_LABEL[mode] }}</p>
    <h1>{{ MODE_TITLE[mode] }} {{ store.item?.name }}</h1>
    <p class="ck-lead">
      Here are the main things to look at. Several of them may still be perfectly useful —
      even if one has a problem.
    </p>

    <ul class="ck-parts" role="list">
      <li
        v-for="(element, i) in elements"
        :key="element.id"
        class="ck-part"
        :style="{ '--dot': `var(--ck-${tones[i % tones.length]})` }"
      >
        <span class="ck-part__dot" aria-hidden="true"></span>
        <p class="ck-part__name">{{ element.name }}</p>
        <p v-if="element.material" class="ck-part__meta">Made of {{ element.material }}</p>
      </li>
    </ul>

    <div class="ck-note">
      <span aria-hidden="true">💡</span>
      <p>
        <strong>Remember:</strong> just look at your item on screen or in front of you.
        You do not need to open, unscrew, or take anything apart.
      </p>
    </div>

    <div class="ck-actions">
      <button type="button" class="btn btn-quiet" @click="router.push({ name: 'identify' })">
        ← Back
      </button>
      <button type="button" class="btn btn-primary btn--wide" @click="router.push({ name: 'problem' })">
        I’ve had a look →
      </button>
    </div>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-lead { margin-bottom: var(--ck-gap-md); }

.ck-parts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--ck-gap-sm);
  list-style: none;
  margin: 0 0 var(--ck-gap-md);
  padding: 0;
}

.ck-part {
  padding: 14px;
  background: var(--ck-surface);
  border: 1px solid var(--ck-border);
  border-radius: var(--ck-radius-ctrl);
}

.ck-part__dot {
  display: block;
  width: 18px;
  height: 18px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: var(--dot);
  opacity: 0.65;
}

.ck-part__name {
  margin: 0;
  font-weight: 700;
  font-size: var(--ck-size-small);
  color: var(--ck-ink);
}

.ck-part__meta {
  margin: 2px 0 0;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
</style>
