<script setup>
// The Definition of Done requires the licence attribution for the open data
// this project uses to appear in the footer.
const sources = [
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
        Circular Kids is a learning activity. It reports what you noticed — it does not tell
        you what is safe to do next.
      </p>
      <p class="ck-footer__sources">
        Open data:
        <template v-for="(source, i) in sources" :key="source.name">
          <a :href="source.href" target="_blank" rel="noopener noreferrer">{{ source.name }}</a
          ><span v-if="i < sources.length - 1">, </span>
        </template>
      </p>
      <p class="ck-footer__privacy">
        Your photo stays on this device and is never uploaded or saved.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.ck-footer {
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--ck-border);
  background: var(--ck-surface);
  padding-block: var(--ck-gap-lg);
  font-size: var(--ck-size-mini);
  color: var(--ck-muted);
  text-align: center;
}

.ck-footer__lead {
  max-width: 46ch;
  margin: 0 auto var(--ck-gap-sm);
  color: var(--ck-ink);
  font-size: var(--ck-size-small);
}

.ck-footer__sources { margin-bottom: 6px; }
.ck-footer__sources a {
  color: var(--ck-muted);
  text-underline-offset: 2px;
}
.ck-footer__sources a:hover { color: var(--ck-coral); }

.ck-footer__privacy { margin: 0; }
</style>
