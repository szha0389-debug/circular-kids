<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useShopping } from "@/stores/shopping";

const store = useShopping();
const lookupMode = ref("name");
const itemForm = reactive({ name: "", barcode: "" });
const inventoryForm = reactive({ name: "", quantity: 1, unit: "item", category: "" });

const availableInventory = computed(() => store.inventory.filter(item => item.status === "available"));

onMounted(() => store.load());

async function addToList() {
  if (lookupMode.value === "name" && !itemForm.name.trim()) return;
  if (lookupMode.value === "barcode" && !itemForm.barcode.trim()) return;
  await store.prepareItem({
    name: itemForm.name.trim(),
    barcode: itemForm.barcode.trim()
  });
  if (!store.pendingItem) Object.assign(itemForm, { name: "", barcode: "" });
}

function addInventory() {
  if (!inventoryForm.name.trim() || Number(inventoryForm.quantity) <= 0) return;
  store.addInventory(inventoryForm);
  Object.assign(inventoryForm, { name: "", quantity: 1, unit: "item", category: "" });
}

function finishDecision(keep) {
  if (keep) store.keepPending();
  else store.removePending();
  Object.assign(itemForm, { name: "", barcode: "" });
}
</script>

<template>
  <section class="ck-shopping">
    <header class="ck-shopping__intro">
      <p class="ck-eyebrow">Buy only what I need</p>
      <h1>Plan your shopping without buying doubles.</h1>
      <p>Build a list and we will check what is still available at home before each item is added.</p>
    </header>

    <p v-if="store.message" class="ck-shopping__message" role="status">{{ store.message }}</p>

    <div class="ck-shopping__layout">
      <section class="ck-card ck-shopping__panel" aria-labelledby="inventory-heading">
        <div class="ck-shopping__panel-title">
          <span aria-hidden="true">🏠</span>
          <div><p class="ck-eyebrow">At home now</p><h2 id="inventory-heading">My food inventory</h2></div>
        </div>

        <form class="ck-shopping__inventory-form" @submit.prevent="addInventory">
          <label class="ck-shopping__field ck-shopping__field--wide">
            <span>Food name</span>
            <input v-model="inventoryForm.name" required placeholder="e.g. Milk" autocomplete="off" />
          </label>
          <label class="ck-shopping__field">
            <span>Quantity</span>
            <input v-model.number="inventoryForm.quantity" required type="number" min="0.01" step="0.01" />
          </label>
          <label class="ck-shopping__field">
            <span>Unit</span>
            <select v-model="inventoryForm.unit">
              <option>item</option><option>g</option><option>kg</option><option>mL</option><option>L</option><option>pack</option>
            </select>
          </label>
          <label class="ck-shopping__field ck-shopping__field--wide">
            <span>Category (optional)</span>
            <input v-model="inventoryForm.category" placeholder="e.g. Dairy" autocomplete="off" />
          </label>
          <button class="btn btn-quiet ck-shopping__add-home" type="submit">+ Add to inventory</button>
        </form>

        <div v-if="availableInventory.length" class="ck-shopping__items">
          <article v-for="item in availableInventory" :key="item.id" class="ck-shopping__item">
            <span class="ck-shopping__item-icon" aria-hidden="true">🥫</span>
            <div><strong>{{ item.name }}</strong><small>{{ item.quantity }} {{ item.unit }} available</small></div>
            <button type="button" :aria-label="`Remove ${item.name} from inventory`" @click="store.removeInventory(item.id)">×</button>
          </article>
        </div>
        <div v-else class="ck-shopping__empty">
          <span aria-hidden="true">🧺</span>
          <p><strong>Your inventory is empty.</strong><br />Add what you have now. No waste history is needed.</p>
        </div>
      </section>

      <section class="ck-card ck-shopping__panel ck-shopping__panel--list" aria-labelledby="list-heading">
        <div class="ck-shopping__panel-title">
          <span aria-hidden="true">🛒</span>
          <div><p class="ck-eyebrow">Next shop</p><h2 id="list-heading">My shopping list</h2></div>
          <b class="ck-shopping__count">{{ store.shoppingList.length }}</b>
        </div>

        <form class="ck-shopping__lookup" @submit.prevent="addToList">
          <div class="ck-shopping__tabs" aria-label="How to find food">
            <button type="button" :class="{ active: lookupMode === 'name' }" @click="lookupMode = 'name'">Food name</button>
            <button type="button" :class="{ active: lookupMode === 'barcode' }" @click="lookupMode = 'barcode'">Barcode</button>
          </div>
          <label v-if="lookupMode === 'name'" class="ck-shopping__field">
            <span>What do you plan to buy?</span>
            <input v-model="itemForm.name" required placeholder="e.g. Milk" autocomplete="off" />
          </label>
          <label v-else class="ck-shopping__field">
            <span>Enter the barcode number</span>
            <input v-model="itemForm.barcode" required inputmode="numeric" pattern="[0-9 ]+" placeholder="e.g. 9300657000012" autocomplete="off" />
          </label>
          <button class="btn btn-primary" type="submit" :disabled="store.loading">
            {{ store.loading ? "Checking…" : "Check & add item" }}
          </button>
          <small>Product details are looked up with Open Food Facts when available.</small>
        </form>

        <div v-if="store.match && store.pendingItem" class="ck-shopping__warning" role="alert" aria-labelledby="duplicate-title">
          <span class="ck-shopping__warning-icon" aria-hidden="true">💡</span>
          <p class="ck-eyebrow">Check before you buy</p>
          <h3 id="duplicate-title">You still have {{ store.match.type === "exact" ? "this food" : "a similar food" }} at home</h3>
          <div class="ck-shopping__match">
            <strong>{{ store.match.item.quantity }} {{ store.match.item.unit }} {{ store.match.item.name }}</strong>
            <span>available now</span>
          </div>
          <p>Do you still want to add <strong>{{ store.pendingItem.name }}</strong>?</p>
          <div class="ck-actions">
            <button type="button" class="btn btn-primary" @click="finishDecision(true)">Keep Item</button>
            <button type="button" class="btn btn-quiet" @click="finishDecision(false)">Remove Item</button>
          </div>
        </div>

        <div v-if="store.shoppingList.length" class="ck-shopping__items ck-shopping__items--list">
          <article v-for="item in store.shoppingList" :key="item.id" class="ck-shopping__item">
            <input type="checkbox" :aria-label="`Mark ${item.name} as bought`" />
            <div>
              <strong>{{ item.name }}</strong>
              <small>{{ [item.brand, item.packageInfo].filter(Boolean).join(" · ") || "Ready to buy" }}</small>
            </div>
            <button type="button" :aria-label="`Remove ${item.name} from shopping list`" @click="store.removeShoppingItem(item.id)">×</button>
          </article>
        </div>
        <div v-else-if="!store.match" class="ck-shopping__empty">
          <span aria-hidden="true">📝</span>
          <p><strong>Your list is ready.</strong><br />Add a food name or barcode to begin.</p>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.ck-shopping { max-width: 1080px !important; }
.ck-shopping__intro { max-width: 710px; margin-bottom: 28px; }
.ck-shopping__intro h1 { margin-bottom: 12px; font-size: clamp(30px, 4vw, 48px); }
.ck-shopping__intro > p:last-child { margin: 0; color: var(--ck-muted); font-weight: 700; }
.ck-shopping__layout { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
.ck-shopping__panel { --ck-accent: var(--ck-teal); padding: 24px; }
.ck-shopping__panel--list { --ck-accent: var(--ck-purple); }
.ck-shopping__panel-title { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; margin-bottom: 20px; }
.ck-shopping__panel-title > span { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 16px; background: var(--ck-teal-soft); font-size: 24px; }
.ck-shopping__panel-title h2, .ck-shopping__panel-title p { margin: 0; }
.ck-shopping__count { display: grid; place-items: center; min-width: 34px; height: 34px; border-radius: 50%; background: var(--ck-purple-soft); }
.ck-shopping__inventory-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; border-radius: 18px; background: var(--ck-surface-warm); }
.ck-shopping__field { display: grid; gap: 6px; margin: 0; color: var(--ck-ink); font-size: 12px; font-weight: 800; }
.ck-shopping__field--wide, .ck-shopping__add-home { grid-column: 1 / -1; }
.ck-shopping__field input, .ck-shopping__field select { width: 100%; min-height: 46px; padding: 10px 12px; border: 2px solid var(--ck-border); border-radius: 13px; background: #fff; color: var(--ck-ink); font: inherit; font-size: 15px; }
.ck-shopping__field input:focus, .ck-shopping__field select:focus { outline: 3px solid rgba(255,146,156,.35); border-color: var(--ck-coral); }
.ck-shopping__lookup { display: grid; gap: 12px; padding: 16px; border-radius: 18px; background: var(--ck-purple-soft); }
.ck-shopping__lookup > small { color: var(--ck-muted); text-align: center; }
.ck-shopping__tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 12px; background: rgba(255,255,255,.75); }
.ck-shopping__tabs button { min-height: 40px; border: 0; border-radius: 9px; background: transparent; color: var(--ck-muted); font-weight: 800; }
.ck-shopping__tabs button.active { background: #fff; color: var(--ck-ink); box-shadow: 0 3px 12px rgba(61,74,80,.08); }
.ck-shopping__items { display: grid; gap: 9px; margin-top: 18px; }
.ck-shopping__item { display: grid; grid-template-columns: auto 1fr auto; gap: 11px; align-items: center; min-height: 62px; padding: 10px 12px; border: 1px solid var(--ck-border); border-radius: 15px; background: #fff; }
.ck-shopping__item-icon { font-size: 23px; }
.ck-shopping__item div { min-width: 0; }
.ck-shopping__item strong, .ck-shopping__item small { display: block; }
.ck-shopping__item strong { overflow-wrap: anywhere; }
.ck-shopping__item small { color: var(--ck-muted); }
.ck-shopping__item > button { width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--ck-coral-soft); color: var(--ck-ink); font-size: 22px; }
.ck-shopping__item > input { width: 22px; height: 22px; accent-color: var(--ck-teal); }
.ck-shopping__empty { display: flex; gap: 12px; align-items: center; margin-top: 18px; padding: 18px; border: 2px dashed var(--ck-border); border-radius: 17px; color: var(--ck-muted); }
.ck-shopping__empty span { font-size: 27px; }.ck-shopping__empty p { margin: 0; }
.ck-shopping__warning { margin-top: 18px; padding: 20px; border: 2px solid #efd067; border-radius: 20px; background: var(--ck-yellow-soft); }
.ck-shopping__warning-icon { float: right; font-size: 30px; }
.ck-shopping__warning h3 { margin-bottom: 14px; font-size: 22px; }
.ck-shopping__match { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 14px; padding: 14px; border-radius: 14px; background: #fff; }
.ck-shopping__match span { color: var(--ck-muted); white-space: nowrap; }
.ck-shopping__message { padding: 12px 16px; border-radius: 14px; background: var(--ck-blue-soft); font-weight: 700; }
@media (max-width: 820px) { .ck-shopping__layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .ck-shopping__inventory-form { grid-template-columns: 1fr; } .ck-shopping__field, .ck-shopping__add-home { grid-column: 1; } .ck-shopping__match { flex-direction: column; } }
</style>
