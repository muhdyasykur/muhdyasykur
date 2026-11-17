<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import { chime } from '../../../lib/audio/sfx';
  /** Short activity countdown, separate from the stage clock. Uses an end timestamp, so it stays right if the screen sleeps. */
  let end = $state<number | null>(null); let now = $state(Date.now()); let rang = $state(false);
  $effect(() => { const t = setInterval(() => (now = Date.now()), 250); return () => clearInterval(t); });
  const left = $derived(end ? Math.max(0, Math.ceil((end - now) / 1000)) : 0);
  $effect(() => { if (end && left === 0 && !rang) { rang = true; chime(); } });
  const set = (min: number) => { end = Date.now() + min * 60_000; rang = false; };
</script>
<div class="tool">
  <p class="time" class:done={end && left === 0} aria-live="polite">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</p>
  <div class="row">{#each [0.5, 1, 2, 3, 5, 10] as m}<button class="btn btn-outline" type="button" onclick={() => set(m)}>{m < 1 ? '30 s' : tr('{m} min', { m })}</button>{/each}</div>
  {#if end}<button class="btn btn-text" type="button" onclick={() => (end = null)}>{tr('Clear')}</button>{/if}
</div>
<style>
  .tool { display: grid; gap: var(--s-4); justify-items: center; padding: var(--s-6) 0; }
  .time { font: 800 clamp(3rem, 12vw, 7rem) var(--f-mono); }
  .time.done { color: var(--bad); }
  .row { justify-content: center; }
</style>
