<script setup>
import { ref } from "vue";
import { outcomeLabel, storyFor } from "../../core/rescueShelf.js";
import { useRescueShelf } from "@/stores/rescueShelf";

const shelf = useRescueShelf();
const status = ref("");

function updateOutcome(record, value) {
  if (!shelf.updateOutcome(record.id, value)) return;
  status.value = `${record.itemName} was updated to ${outcomeLabel(value)}.`;
}

function removeRecord(record) {
  if (!window.confirm(`Remove ${record.itemName} from My Rescue Shelf?`)) return;
  shelf.remove(record.id);
  status.value = `${record.itemName} was removed from this device.`;
}

function clearShelf() {
  if (!window.confirm("Clear every item from My Rescue Shelf on this device?")) return;
  shelf.clear();
  status.value = "My Rescue Shelf was cleared from this device.";
}
</script>

<template>
  <section class="ck-shelf">
    <header class="ck-shelf__heading">
      <span aria-hidden="true">🪴</span>
      <div>
        <p class="ck-eyebrow">My Rescue History · Stage 6</p>
        <h1>My Rescue Shelf</h1>
        <p>Return to an item story and record what actually happened.</p>
      </div>
    </header>

    <article class="ck-shelf__privacy">
      <strong>Saved only in this browser</strong>
      <p>No account, photo, score or free-text personal details are saved. Anyone using this shared device may see these item stories.</p>
    </article>
    <p class="visually-hidden" role="status" aria-live="polite">{{ status }}</p>

    <div v-if="!shelf.count" class="ck-shelf__empty">
      <span aria-hidden="true">🌱</span>
      <h2>Your shelf is ready for its first item.</h2>
      <p>Finish an investigation, choose a future, then select <strong>Save to My Rescue Shelf</strong>.</p>
      <RouterLink :to="{ name: 'identify' }" class="btn btn-primary">Investigate an item →</RouterLink>
    </div>

    <template v-else>
      <section v-for="group in shelf.groups" :key="group.label" class="ck-shelf__group">
        <h2>{{ group.label }}</h2>
        <div class="ck-shelf__cards">
          <details v-for="record in group.items" :key="record.id" class="ck-card ck-shelf-card">
            <summary>
              <span class="ck-shelf-card__icon" aria-hidden="true">♻️</span>
              <span><strong>{{ record.itemName }}</strong><small>{{ outcomeLabel(record.outcome) }}</small></span>
              <span aria-hidden="true">＋</span>
            </summary>
            <p class="ck-shelf-card__story">{{ storyFor(record) }}</p>
            <dl>
              <div><dt>What I noticed</dt><dd>{{ record.noticedProblem }}</dd></div>
              <div><dt>Safety boundary</dt><dd>{{ record.safetyBoundary }}</dd></div>
              <div><dt>Future I chose</dt><dd>{{ record.chosenFuture }}</dd></div>
            </dl>
            <label :for="`outcome-${record.id}`">What happened after that?</label>
            <select
              :id="`outcome-${record.id}`"
              :value="record.outcome"
              @change="updateOutcome(record, $event.target.value)"
            >
              <option v-for="option in shelf.outcomes" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
            <button type="button" class="ck-shelf-card__delete" @click="removeRecord(record)">Delete this item story</button>
          </details>
        </div>
      </section>

      <div class="ck-shelf__footer">
        <RouterLink :to="{ name: 'identify' }" class="btn btn-primary">Investigate another item →</RouterLink>
        <button type="button" class="btn btn-quiet" @click="clearShelf">Clear My Rescue Shelf</button>
      </div>
    </template>

    <RouterLink :to="{ name: 'welcome', hash: '#how-it-works' }" class="btn btn-link ck-shelf__back">
      ← Back to Stage Cards
    </RouterLink>
  </section>
</template>

<style scoped>
.ck-shelf__heading { display: flex; gap: 18px; align-items: center; margin-bottom: 18px; }
.ck-shelf__heading > span { display: grid; place-items: center; flex: 0 0 76px; width: 76px; height: 76px; border-radius: 24px; background: var(--ck-green-soft); font-size: 40px; }
.ck-shelf__heading h1 { margin: 0; font-size: var(--ck-size-h1); }
.ck-shelf__heading p:last-child { margin: 5px 0 0; color: var(--ck-muted); }
.ck-shelf__privacy { margin-bottom: 26px; padding: 16px 18px; border-radius: var(--ck-radius-ctrl); background: var(--ck-blue-soft); }
.ck-shelf__privacy p { margin: 3px 0 0; }
.ck-shelf__empty { display: grid; justify-items: center; gap: 10px; padding: 38px 22px; border: 2px dashed var(--ck-border); border-radius: var(--ck-radius-card); text-align: center; }
.ck-shelf__empty > span { font-size: 54px; }
.ck-shelf__empty h2, .ck-shelf__empty p { margin: 0; }
.ck-shelf__empty p { max-width: 48ch; color: var(--ck-muted); }
.ck-shelf__empty .btn { margin-top: 10px; padding-inline: 24px; }
.ck-shelf__group { margin-top: 28px; }
.ck-shelf__group > h2 { margin-bottom: 12px; font-size: 22px; }
.ck-shelf__cards { display: grid; gap: 12px; }
.ck-shelf-card { padding: 0; overflow: hidden; }
.ck-shelf-card summary { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; min-height: 78px; padding: 14px 18px; cursor: pointer; list-style: none; }
.ck-shelf-card summary::-webkit-details-marker { display: none; }
.ck-shelf-card summary > span:nth-child(2) { display: grid; }
.ck-shelf-card summary strong { font-family: var(--ck-font-display); font-size: 20px; }
.ck-shelf-card summary small { color: var(--ck-muted); font-weight: 800; }
.ck-shelf-card[open] summary > span:last-child { transform: rotate(45deg); }
.ck-shelf-card__icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 16px; background: var(--ck-teal-soft); font-size: 24px; }
.ck-shelf-card__story { margin: 0 18px 14px; padding: 13px 15px; border-radius: 14px; background: var(--ck-green-soft); font-weight: 800; }
.ck-shelf-card dl { display: grid; gap: 8px; margin: 0 18px 18px; }
.ck-shelf-card dl > div { padding: 10px 12px; border-radius: 12px; background: var(--ck-bg); }
.ck-shelf-card dt { color: var(--ck-muted); font-size: var(--ck-size-micro); font-weight: 900; text-transform: uppercase; }
.ck-shelf-card dd { margin: 2px 0 0; }
.ck-shelf-card label { display: block; margin: 0 18px 7px; font-weight: 900; }
.ck-shelf-card select { width: calc(100% - 36px); min-height: 48px; margin: 0 18px; padding: 8px 12px; border: 2px solid var(--ck-border); border-radius: 12px; background: #fff; color: var(--ck-ink); font: inherit; }
.ck-shelf-card__delete { min-height: 44px; margin: 12px 18px 18px; padding: 0; border: 0; background: none; color: var(--ck-muted); font-weight: 800; text-decoration: underline; text-underline-offset: 3px; }
.ck-shelf__footer { display: flex; gap: 12px; margin-top: 28px; }
.ck-shelf__footer .btn { flex: 1; }
.ck-shelf__back { display: block; width: fit-content; margin: 18px auto 0; }
@media (max-width: 600px) {
  .ck-shelf__heading { align-items: flex-start; }
  .ck-shelf__heading > span { flex-basis: 58px; width: 58px; height: 58px; border-radius: 18px; font-size: 30px; }
  .ck-shelf__footer { flex-direction: column; }
}
</style>
