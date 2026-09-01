<script setup>
// US-1.1 — Show my item and find out what it is.
//
// Four panels on one screen, because the photo has to stay available across all
// of them: a child who says "no, that isn't it" keeps their picture while they
// browse the list. Every unhappy path lands on the list and says the photo did
// not work — never that an error occurred.

import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInvestigation } from "@/stores/investigation";
import ChoiceTiles from "@/components/ChoiceTiles.vue";

const store = useInvestigation();
const router = useRouter();

const panel = ref("photo"); // photo | looking | confirm | list
const fileError = ref("");
const openCategory = ref(null);
const pickedItem = ref(null);
const listMessage = ref("");
const MAX_ATTEMPTS = 2;

const categoryLabel = computed(
  () => store.categories.find(c => c.id === openCategory.value)?.label || ""
);

const categoryOptions = computed(() =>
  store.categories.map(c => ({ value: c.id, label: c.label, icon: c.icon }))
);

const itemOptions = computed(() => {
  const category = store.categories.find(c => c.id === openCategory.value);
  if (!category) return [];
  // Labels are capitalised to read as names on the tiles, as the prototype does.
  return category.items.map(item => ({
    value: item.id,
    label: item.isGeneral
      ? "Something else"
      : item.name.charAt(0).toUpperCase() + item.name.slice(1)
  }));
});

function pickFile(event) {
  const file = event.target.files?.[0];
  fileError.value = store.attachPhoto(file) || "";
  event.target.value = "";
}

async function identify() {
  panel.value = "looking";
  const { suggested } = await store.identify();
  if (suggested) {
    panel.value = "confirm";
    return;
  }
  goToList(messageFor(store.recognitionReason));
}

/** Never "an error occurred" — always what happened, in the child's terms. */
function messageFor(reason) {
  if (reason === "unsupported") return "That kind of picture did not work. Pick your item below instead.";
  if (reason === "timeout") return "The picture is taking too long. Pick your item below instead.";
  if (reason === "unavailable") return "The image model could not load. Pick your item below instead.";
  return "I could not tell what that is from the photo. Pick your item below instead.";
}

function goToList(message = "") {
  listMessage.value = message;
  panel.value = "list";
}

async function confirmSuggestion() {
  await store.chooseItem(store.suggestion.itemId);
  router.push({ name: "breakdown" });
}

function rejectSuggestion() {
  store.suggestion = null;
  goToList(
    store.attempts >= MAX_ATTEMPTS
      ? "No problem — let’s find it in the list instead."
      : "No problem. Pick your item from the list."
  );
}

function openCategoryList(categoryId) {
  openCategory.value = categoryId;
  pickedItem.value = null;
}

/** US-1.1: the case only proceeds on a confirmed choice, never a tapped one. */
async function confirmItem() {
  if (!pickedItem.value) return;
  await store.chooseItem(pickedItem.value);
  router.push({ name: "breakdown" });
}
</script>

<template>
  <section>
    <!-- ───────────────────────────────────────────── panel 1: the photo -->
    <template v-if="panel === 'photo'">
      <h1>Show me your item</h1>
      <p class="ck-lead">Take a photo or upload a picture so we can start the investigation.</p>

      <div class="ck-card ck-shot" :class="{ 'has-photo': store.hasPhoto }">
        <img v-if="store.hasPhoto" :src="store.photoUrl" alt="The item you chose" />
        <div v-else class="ck-shot__empty">
          <span aria-hidden="true">📷</span>
          <p>No image selected yet</p>
        </div>
      </div>

      <p v-if="fileError" class="ck-error" role="alert">{{ fileError }}</p>

      <div class="ck-stack">
        <label class="btn btn-primary ck-file">
          📷 {{ store.hasPhoto ? "Take another photo" : "Take a Photo" }}
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden @change="pickFile" />
        </label>
        <label class="btn btn-quiet ck-file">
          📁 Upload an Image
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="pickFile" />
        </label>
      </div>

      <p class="ck-or">— or pick your item from a list —</p>
      <button type="button" class="btn btn-quiet w-100" @click="goToList('')">
        📋 Choose from a list instead
      </button>

      <div class="ck-note ck-note--teal">
        <span aria-hidden="true">🔒</span>
        <p>
          <strong>Privacy:</strong> your picture stays on this device for this investigation
          only. It is never uploaded or saved.
        </p>
      </div>

      <div class="ck-actions">
        <RouterLink to="/" class="btn btn-quiet">← Back</RouterLink>
        <button
          type="button"
          class="btn btn-primary btn--wide"
          :disabled="!store.hasPhoto || store.busy"
          @click="identify"
        >
          Continue →
        </button>
      </div>
    </template>

    <!-- ──────────────────────────────────────── panel 2: while it looks -->
    <template v-else-if="panel === 'looking'">
      <div class="ck-looking">
        <span class="ck-looking__badge" aria-hidden="true">🔍</span>
        <h1>Looking at your image…</h1>
        <p class="ck-lead">
          {{ store.recognitionProgress || "I’m checking what kind of item this might be." }}
        </p>
        <p class="ck-model-note">This uses the small CNN trained for Circular Kids.</p>
      </div>
    </template>

    <!-- ───────────────────────────────────── panel 3: check the guess -->
    <template v-else-if="panel === 'confirm'">
      <h1>I think I recognise this!</h1>
      <p class="ck-lead">Have a look at my suggestion and let me know if I got it right.</p>

      <div class="ck-card ck-guess">
        <img v-if="store.hasPhoto" :src="store.photoUrl" alt="The photo you took" class="ck-guess__photo" />
        <div class="ck-guess__row">
          <span class="ck-guess__icon" aria-hidden="true">{{ store.suggestion?.icon }}</span>
          <span>
            <span class="ck-guess__label">I think this is…</span>
            <strong class="ck-guess__name">{{ store.suggestion?.name }}</strong>
          </span>
        </div>
      </div>

      <p class="ck-or">Your choice won’t be saved until you confirm it.</p>

      <!-- Both answers are explicit, and no control continues without one, so
           nothing downstream can run on an unconfirmed guess. -->
      <div class="ck-stack">
        <button type="button" class="btn btn-primary" :disabled="store.busy" @click="confirmSuggestion">
          ✅ Yes, this is my item!
        </button>
        <button type="button" class="btn btn-quiet" @click="rejectSuggestion">
          🔄 Choose a different item
        </button>
      </div>
    </template>

    <!-- ─────────────────────────────────────── panel 4: pick from list -->
    <template v-else>
      <!-- ── 4a: the category grid ── -->
      <template v-if="!openCategory">
        <h1>What kind of item is it?</h1>
        <p v-if="listMessage" class="ck-lead">{{ listMessage }}</p>
        <p v-else class="ck-lead">Choose the category that best fits your item.</p>

        <div v-if="store.hasPhoto" class="ck-thumb">
          <img :src="store.photoUrl" alt="The photo you took" />
          <p>Your photo is still here</p>
        </div>

        <ChoiceTiles
          :choices="categoryOptions"
          :model-value="null"
          size="large"
          @update:model-value="openCategoryList"
        />

        <div class="ck-actions">
          <button type="button" class="btn btn-quiet w-100" @click="panel = 'photo'">
            ← Back
          </button>
        </div>
      </template>

      <!-- ── 4b: the item grid, with an explicit confirm ── -->
      <template v-else>
        <h1>Which one is it?</h1>
        <p class="ck-lead">
          Pick the closest match from {{ categoryLabel }}. If nothing is exactly right,
          choose the nearest option.
        </p>

        <ChoiceTiles v-model="pickedItem" :choices="itemOptions" size="compact" />

        <p class="ck-hint">
          {{ pickedItem ? "Tap Confirm when you’re happy with that." : "Please select an item to continue." }}
        </p>

        <div class="ck-actions">
          <button type="button" class="btn btn-quiet" @click="openCategory = null">← Back</button>
          <button
            type="button"
            class="btn btn-primary btn--wide"
            :disabled="!pickedItem || store.busy"
            @click="confirmItem"
          >
            Confirm Item →
          </button>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
h1 { font-size: var(--ck-size-h1); margin-bottom: 6px; }
.ck-lead { margin-bottom: var(--ck-gap-md); }

.ck-shot {
  --ck-accent: var(--ck-blue);
  display: grid;
  place-items: center;
  min-height: 190px;
  margin-bottom: var(--ck-gap);
  overflow: hidden;
}
.ck-shot.has-photo { padding: 0; }
.ck-shot img {
  display: block;
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  background: var(--ck-surface-warm);
}
.ck-shot__empty { text-align: center; color: var(--ck-muted); }
.ck-shot__empty span { font-size: 34px; display: block; margin-bottom: 8px; }
.ck-shot__empty p { margin: 0; font-size: var(--ck-size-small); }

.ck-stack { display: grid; gap: var(--ck-gap-sm); }
.ck-file {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.ck-or {
  margin: var(--ck-gap) 0;
  text-align: center;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}

.ck-note--teal {
  --ck-accent: var(--ck-teal);
  --ck-accent-soft: var(--ck-teal-soft);
  margin-top: var(--ck-gap-md);
}

.ck-error {
  margin: var(--ck-gap-sm) 0 0;
  padding: 12px 16px;
  border-radius: var(--ck-radius-ctrl);
  background: var(--ck-coral-soft);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}

.ck-looking { text-align: center; padding-block: var(--ck-gap-xl); }
.ck-model-note { color: var(--ck-muted); font-size: var(--ck-size-mini); }
.ck-looking__badge {
  display: grid;
  place-items: center;
  width: 66px; height: 66px;
  margin: 0 auto var(--ck-gap-md);
  border-radius: 50%;
  background: var(--ck-yellow);
  font-size: 30px;
  animation: ck-pulse 1.4s ease-in-out infinite;
}
@keyframes ck-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 230, 109, 0.55); }
  50% { box-shadow: 0 0 0 16px rgba(255, 230, 109, 0); }
}

.ck-guess { --ck-accent: var(--ck-blue); padding: 12px; }
.ck-guess__photo {
  display: block;
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  background: var(--ck-surface-warm);
  border-radius: 12px;
  margin-bottom: 12px;
}
.ck-guess__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--ck-surface-warm);
}
.ck-guess__icon {
  display: grid; place-items: center;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--ck-surface);
  font-size: 20px;
}
.ck-guess__label {
  display: block;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
.ck-guess__name {
  display: block;
  font-family: var(--ck-font-display);
  font-size: var(--ck-size-h2);
  font-weight: 900;
}

.ck-thumb {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--ck-gap-md);
}
.ck-thumb img {
  width: 64px; height: 64px;
  object-fit: cover;
  border-radius: 12px;
  background: var(--ck-surface-warm);
}
.ck-thumb p { margin: 0; font-size: var(--ck-size-mini); color: var(--ck-muted); }

.ck-hint {
  margin: var(--ck-gap) 0 0;
  text-align: center;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
}
</style>
