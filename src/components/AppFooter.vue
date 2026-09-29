<template>
  <!-- Attribution for the open data sets this project uses is kept in
       db/README.md, alongside each dataset's licence terms. -->
  <footer class="ck-footer">
    <div class="ck-column">
      <p class="ck-footer__lead">
        <strong>Circular Kids</strong>
        <span>A learning activity for noticing clues, checking safety with a trusted adult and exploring what could happen next.</span>
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
  text-align: center;
}

/* The two notes sit side by side and stay centred as a pair. Wrapping rather
   than a fixed two-column grid, so a narrow screen stacks them with the same
   spacing instead of squeezing both. */
.ck-footer .ck-column {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: var(--ck-gap-md) clamp(32px, 6vw, 72px);
}

.ck-footer p {
  display: grid;
  gap: 5px;
  margin: 0;
  flex: 0 1 34ch;
  max-width: 44ch;
}
.ck-footer p > strong { color: var(--ck-ink); font-size: var(--ck-size-small); }
.ck-footer p > span { line-height: 1.55; }

.ck-footer__lead { color: var(--ck-ink); }
</style>
