<script lang="ts">
  import type { Snippet } from 'svelte';
  import { trapFocus } from './focus';
  import { tr } from '../i18n/index.svelte';
  /**
   * A modal panel: slides up from the bottom on a phone, a centred dialog on a laptop. Keeps keyboard focus inside,
   * returns it when closed, and closes with Esc, the Close button or a tap outside. The parent decides when it is shown.
   */
  let { title, onclose, children, wide = false }: { title: string; onclose: () => void; children: Snippet; wide?: boolean } = $props();
  function key(e: KeyboardEvent) { if (e.key === 'Escape') { e.stopPropagation(); onclose(); } }
</script>

<!-- Esc also closes it when focus is not inside (just opened, or after a click on blank space in the panel) -->
<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); onclose(); } }} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="sheet" onclick={(e) => { if (e.target === e.currentTarget) onclose(); }} onkeydown={key}>
  <div class="sheet-in" class:wide role="dialog" aria-modal="true" aria-label={title} use:trapFocus>
    <div class="row head"><h2>{title}</h2><button class="btn btn-outline" type="button" onclick={onclose}>{tr('Close')}</button></div>
    {@render children()}
  </div>
</div>

<style>
  .sheet { position: fixed; inset: 0; z-index: 70; background: color-mix(in srgb, var(--ink) 40%, transparent); display: grid; align-items: end; }
  .sheet-in { background: var(--paper); border-radius: var(--r-card) var(--r-card) 0 0; max-height: 92dvh; overflow-y: auto; padding: var(--s-4) max(var(--s-4), env(safe-area-inset-right, 0px)) max(var(--s-6), env(safe-area-inset-bottom, 0px)) max(var(--s-4), env(safe-area-inset-left, 0px)); display: grid; gap: var(--s-3); box-shadow: var(--shadow-overlay); }
  .head { justify-content: space-between; }
  @media (min-width: 900px) { .sheet { align-items: center; justify-items: center; } .sheet-in { width: min(720px, 92vw); border-radius: var(--r-card); } .sheet-in.wide { width: min(960px, 92vw); } }
  @media (prefers-reduced-motion: no-preference) {
    .sheet { animation: fade var(--dur) ease-out; }
    .sheet-in { animation: rise var(--dur-slow) cubic-bezier(.2, .8, .2, 1); }
    @keyframes fade { from { opacity: 0; } }
    @keyframes rise { from { transform: translateY(24px); opacity: 0; } }
  }
</style>
