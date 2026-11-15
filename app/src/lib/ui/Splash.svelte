<script lang="ts">
  /**
   * Launch animation (blueprint F26): the book opens, the gold C draws itself, the star twinkles and the
   * tagline fades in. About 2 seconds, at most once a day, skippable, never with reduced motion.
   */
  let { ondone }: { ondone: () => void } = $props();
  let leaving = $state(false);
  function done() { if (leaving) return; leaving = true; setTimeout(ondone, 300); }
  $effect(() => { const t = setTimeout(done, 2300); return () => clearTimeout(t); });
</script>

<button class="splash" class:leaving type="button" onclick={done} aria-label="Skip the opening animation">
  <svg viewBox="0 0 160 160" width="168" height="168" aria-hidden="true">
    <rect width="160" height="160" rx="36" class="bg" />
    <path class="c" d="M112 52 A44 44 0 1 0 112 108" pathLength="100" />
    <g class="book">
      <path class="pl" d="M80 70 Q70 63 58 70 L58 100 Q70 93 80 100 Z" />
      <path class="pr" d="M80 70 Q90 63 102 70 L102 100 Q90 93 80 100 Z" />
      <path class="spine" d="M80 70 L80 100" />
    </g>
    <path class="star" d="M112 20 l4.5 10 10 4.5 -10 4.5 -4.5 10 -4.5 -10 -10 -4.5 10 -4.5z" />
  </svg>
  <span class="word">Consilia</span>
  <span class="tag">Consilium: wise planning, meaningful learning.</span>
  <span class="skip">Tap to skip</span>
</button>

<style>
  .splash { position: fixed; inset: 0; z-index: 100; border: 0; display: grid; place-content: center; justify-items: center; gap: 10px; background: #0E1E38; color: #fff; cursor: pointer; font: inherit; transition: opacity .3s; }
  .splash.leaving { opacity: 0; }
  .bg { fill: #13294B; }
  .c { fill: none; stroke: #E2BC4F; stroke-width: 11; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; animation: draw .9s .35s cubic-bezier(.6,.1,.3,1) forwards; }
  .pl, .pr { fill: #fff; transform-box: fill-box; }
  .pl { transform-origin: right center; animation: openL .55s .1s ease-out both; }
  .pr { transform-origin: left center; animation: openR .55s .1s ease-out both; }
  .spine { stroke: #13294B; stroke-width: 2; }
  .star { fill: #E2BC4F; transform-origin: 112px 34.5px; transform: scale(0); animation: star .6s 1.1s cubic-bezier(.3,1.6,.5,1) forwards, twinkle 1.6s 1.7s ease-in-out infinite; }
  .word { font: 800 2.4rem "Bricolage Grotesque", system-ui, sans-serif; letter-spacing: -.02em; opacity: 0; animation: fade .5s 1s forwards; }
  .tag { font: italic 500 1rem "Plus Jakarta Sans", system-ui, sans-serif; color: #E9D9A6; opacity: 0; animation: fade .5s 1.35s forwards; }
  .skip { position: absolute; bottom: max(24px, env(safe-area-inset-bottom, 0px)); font-size: .8rem; color: #8FA0C0; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes openL { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes openR { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes star { to { transform: scale(1); } }
  @keyframes twinkle { 50% { transform: scale(1.2) rotate(12deg); } }
  @keyframes fade { to { opacity: 1; } }
</style>
