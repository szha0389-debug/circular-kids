<template>
  <section class="ck-not-found" aria-labelledby="not-found-title">
    <div class="ck-not-found__art" aria-hidden="true">
      <span class="ck-not-found__number">404</span>
      <span class="ck-not-found__magnifier">🔎</span>
      <span class="ck-not-found__trail">· · · · ·</span>
    </div>

    <p class="ck-eyebrow">Oops — this trail ends here</p>
    <h1 id="not-found-title">We could not find that page.</h1>
    <p class="ck-not-found__copy">
      The address may have an extra letter, or the page may have moved.
      Let’s head back and start from somewhere familiar.
    </p>

    <RouterLink :to="{ name: 'welcome' }" class="btn btn-primary ck-not-found__home">
      ← Back to Home
    </RouterLink>
  </section>
</template>

<style scoped>
.ck-not-found {
  position: relative;
  isolation: isolate;
  display: grid;
  justify-items: center;
  max-width: 820px;
  min-height: min(680px, calc(100vh - 180px));
  margin: clamp(32px, 7vw, 84px) auto;
  padding: clamp(46px, 8vw, 82px) clamp(24px, 7vw, 76px);
  overflow: hidden;
  border: 3px solid #fff;
  border-radius: clamp(30px, 5vw, 52px);
  background:
    radial-gradient(circle at 9% 14%, rgba(255, 241, 169, .92) 0 74px, transparent 75px),
    radial-gradient(circle at 92% 84%, rgba(210, 240, 255, .9) 0 92px, transparent 93px),
    linear-gradient(145deg, #fffdf5, #edf9ff 54%, #effbe9);
  box-shadow: 0 22px 60px rgba(54, 78, 88, .14);
  text-align: center;
}

.ck-not-found::before,
.ck-not-found::after {
  content: "";
  position: absolute;
  z-index: -1;
  width: 170px;
  height: 170px;
  border: 6px dashed rgba(255, 130, 145, .25);
  border-radius: 50%;
}
.ck-not-found::before { top: -86px; right: 18%; }
.ck-not-found::after { bottom: -98px; left: 12%; }

.ck-not-found__art {
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 510px);
  min-height: 220px;
  margin-bottom: 22px;
}

.ck-not-found__number {
  font-family: var(--ck-font-display);
  font-size: clamp(92px, 21vw, 176px);
  font-weight: 900;
  line-height: .9;
  letter-spacing: -.08em;
  color: var(--ck-coral);
  text-shadow: 7px 8px 0 #fff1a9;
}

.ck-not-found__magnifier {
  position: absolute;
  right: clamp(8px, 5vw, 42px);
  bottom: 8px;
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  border: 5px solid #fff;
  border-radius: 50%;
  background: #dff4ff;
  box-shadow: 0 10px 22px rgba(54, 78, 88, .15);
  font-size: 38px;
  transform: rotate(-8deg);
}

.ck-not-found__trail {
  position: absolute;
  left: 7%;
  bottom: 0;
  color: var(--ck-blue);
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 5px;
  transform: rotate(8deg);
}

.ck-not-found h1 {
  max-width: 650px;
  margin: 8px 0 16px;
  font-family: var(--ck-font-display);
  font-size: clamp(34px, 6vw, 56px);
  line-height: 1.05;
  color: var(--ck-ink);
}

.ck-not-found__copy {
  max-width: 600px;
  margin: 0 0 30px;
  color: var(--ck-muted);
  font-size: clamp(17px, 2.2vw, 20px);
  font-weight: 700;
  line-height: 1.65;
}

.ck-not-found__home {
  min-width: 210px;
  min-height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

@media (max-width: 560px) {
  .ck-not-found { min-height: 0; margin: 22px auto; }
  .ck-not-found__art { min-height: 170px; }
  .ck-not-found__magnifier { width: 62px; height: 62px; font-size: 30px; }
  .ck-not-found__trail { font-size: 22px; }
}
</style>
