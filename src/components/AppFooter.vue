<script setup>
// The Definition of Done requires the licence attribution for the open data
// this project uses to appear in the footer.
const sources = [
  { name: "Australian Government Waste Data", href: "https://www.dcceew.gov.au/environment/protection/waste/publications/national-waste-resource-recovery-reporting" },
  { name: "Open Repair Alliance", href: "https://openrepair.org/open-data/" },
  { name: "Wikidata", href: "https://www.wikidata.org/" },
  { name: "ACCC Product Safety", href: "https://www.productsafety.gov.au/" },
  { name: "Open Images", href: "https://storage.googleapis.com/openimages/web/index.html" }
];
</script>

<template>
  <footer class="ck-footer">
    <div class="ck-column">
      <p class="ck-footer__lead">
        <strong>Circular Kids</strong>
        <span>A learning activity for noticing clues, checking safety with a trusted adult and exploring what could happen next.</span>
      </p>
      <p class="ck-footer__sources">
        <strong>Evidence and open data</strong>
        <span>
          <template v-for="(source, i) in sources" :key="source.name">
            <a :href="source.href" target="_blank" rel="noopener noreferrer">{{ source.name }}</a
            ><span v-if="i < sources.length - 1">, </span>
          </template>
        </span>
      </p>
      <p class="ck-footer__privacy">
        <strong>Photo privacy</strong>
        <span>If you add a photo, it is used only to recognise your item. It is never saved or shared.</span>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.ck-footer {
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--ck-border);
  background: rgba(255,254,252,.74);
  backdrop-filter: blur(14px);
  padding-block: 24px;
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
  text-align: left;
}

.ck-footer__lead {
  margin: 0;
  color: var(--ck-ink);
}

.ck-footer p { display: grid; gap: 5px; }
.ck-footer p > strong { color: var(--ck-ink); font-size: var(--ck-size-small); }
.ck-footer p > span { line-height: 1.55; }
.ck-footer__sources { margin: 0; }
.ck-footer__sources a {
  color: var(--ck-muted);
  text-underline-offset: 2px;
}
.ck-footer__sources a:hover { color: var(--ck-coral); }

.ck-footer__privacy { margin: 0; }

@media (min-width: 760px) {
  .ck-footer .ck-column { display: grid; grid-template-columns: 1.05fr 1.4fr 1fr; gap: 42px; align-items: start; }
}

@media (max-width: 759px) {
  .ck-footer .ck-column { display: grid; gap: 18px; }
}
</style>
