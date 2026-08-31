<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import StepBar from "@/components/StepBar.vue";
import BackdropShapes from "@/components/BackdropShapes.vue";
import AppFooter from "@/components/AppFooter.vue";

const store = useInvestigation();
const route = useRoute();
const router = useRouter();

const inFlow = computed(() => Boolean(route.meta?.step));

onMounted(async () => {
  try {
    await store.start();
  } catch {
    store.say("We could not open a new case. Check the site is running, then refresh.", "warn");
  }
  window.addEventListener("beforeunload", store.releasePhoto);
});

onBeforeUnmount(() => window.removeEventListener("beforeunload", store.releasePhoto));

// Clearing the notice between screens stops a message from one step reading as a
// reaction to the next — which on the clue screen would break US-1.3.
watch(() => route.name, () => store.say(""));

async function startOver() {
  await store.closeCase();
  await store.start();
  router.push({ name: "welcome" });
}
</script>

<template>
  <BackdropShapes />

  <a class="ck-skip" href="#main">Skip to the main part</a>

  <header class="ck-header">
    <!-- The header carries the product identity, not the name of this activity.
         Epic 2 and Epic 3 are different activities under the same product, so
         this stays put while the welcome screen's heading changes with them. -->
    <RouterLink to="/" class="ck-brand" aria-label="Circular Kids home">
      <span class="ck-brand__mark" aria-hidden="true">↻</span>
      <span class="ck-brand__text">Circular <b>Kids</b></span>
    </RouterLink>

    <!-- US-1.5 requires a visible way back to the beginning that closes the
         case. It is absolutely placed so the title stays optically centred. -->
    <button v-if="inFlow" type="button" class="ck-restart" @click="startOver">
      Start over
    </button>
  </header>

  <StepBar v-if="inFlow" :current="route.meta.step" />

  <main id="main" class="ck-main">
    <div class="ck-column">
      <p
        v-if="store.notice"
        class="ck-notice"
        :class="`ck-notice--${store.noticeTone}`"
        role="status"
        aria-live="polite"
      >
        {{ store.notice }}
      </p>

      <!-- A CSS entry animation, deliberately not a <Transition>: the view must
           mount the moment the route changes. A JS-driven transition needs
           requestAnimationFrame to finish its class swap, and anything that
           suspends rAF would leave the previous screen up with no way forward. -->
      <RouterView v-slot="{ Component, route: current }">
        <component :is="Component" :key="current.name" class="ck-view" />
      </RouterView>
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.ck-skip {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: 12px 20px;
  background: var(--ck-surface);
  border-radius: 0 0 var(--ck-radius-ctrl) 0;
  font-weight: 700;
}
.ck-skip:focus { left: 0; }

.ck-header {
  position: relative;
  z-index: 5;
  /* Three columns rather than a centred flex row with an absolutely placed
     button: the outer columns are equal, so the title stays optically centred
     while the restart control has reserved space and can never sit on top of
     it — which it did at 360 px. */
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  min-height: var(--ck-header-h);
  padding-inline: 12px;
  background: var(--ck-surface);
  border-bottom: 1px solid var(--ck-border);
}

.ck-brand {
  grid-column: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  min-height: var(--ck-tap-min);
  text-decoration: none;
  color: var(--ck-ink);
  font-family: var(--ck-font-display);
  font-weight: 900;
  font-size: 15px;
}
.ck-brand__mark {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--ck-coral-soft);
  color: var(--ck-coral);
  font-size: 13px;
  line-height: 1;
}
.ck-brand__text b { color: var(--ck-coral); }
.ck-brand__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ck-restart {
  grid-column: 3;
  justify-self: end;
  /* 44 px is the smallest tap target the Definition of Done allows, and it
     still clears the 51 px header. */
  min-height: 44px;
  padding-inline: 8px;
  border: 0;
  background: none;
  color: var(--ck-muted);
  font-size: var(--ck-size-mini);
  font-weight: 700;
  white-space: nowrap;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.ck-restart:hover { color: var(--ck-coral); }

.ck-main {
  position: relative;
  z-index: 2;
  padding-block: var(--ck-gap-lg) var(--ck-gap-xl);
}

.ck-notice {
  margin-bottom: var(--ck-gap-md);
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-teal-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}
.ck-notice--warn { background: var(--ck-yellow-soft); }

.ck-view {
  /* No fill-mode: a frozen animation must leave the view visible, not stuck at
     the `from` keyframe. */
  animation: ck-enter 0.2s ease;
  display: block;
}

@keyframes ck-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

@media (max-width: 480px) {
  .ck-brand { font-size: 12px; }
  .ck-brand__mark { font-size: 13px; }
  .ck-restart { font-size: 11px; padding-inline: 4px; }
}
</style>
