<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tr } from '../i18n/index.svelte';
  import Icon from './Icon.svelte';
  /**
   * A row of cards that scrolls sideways (swipe on a phone, arrow buttons on a laptop), like the travel sites'
   * destination rows. The items are a list, so screen readers announce how many there are.
   */
  let { label, children }: { label: string; children: Snippet } = $props();
  let track = $state<HTMLUListElement>();
  let atStart = $state(true); let atEnd = $state(false);
  const update = () => { if (!track) return; atStart = track.scrollLeft < 8; atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8; };
  const go = (dir: number) => { if (!track) return; track.scrollBy({ left: dir * Math.max(240, track.clientWidth * 0.8), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  $effect(() => { update(); });
</script>
<div class="carousel">
  <button class="arrow back-arrow" type="button" onclick={() => go(-1)} disabled={atStart} aria-label={tr('Previous: {x}', { x: label })}><Icon name="back" size={20} /></button>
  <ul bind:this={track} onscroll={update} aria-label={label}>{@render children()}</ul>
  <button class="arrow fwd-arrow" type="button" onclick={() => go(1)} disabled={atEnd} aria-label={tr('Next: {x}', { x: label })}><Icon name="chevron" size={20} /></button>
</div>
<style>
  .carousel { position: relative; }
  ul { list-style: none; margin: 0; padding: 4px 2px 18px; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(220px, 1fr); gap: var(--s-3); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
  ul::-webkit-scrollbar { display: none; }
  ul :global(> li) { scroll-snap-align: start; min-width: 0; }
  @media (min-width: 900px) { ul { grid-auto-columns: calc((100% - 3 * var(--s-3)) / 4); } }
  @media (max-width: 599px) { ul { grid-auto-columns: 74%; } }
  .arrow { position: absolute; top: calc(50% - 32px); z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line); background: var(--card); color: var(--ink); display: grid; place-items: center; box-shadow: var(--shadow-raised); cursor: pointer; }
  .arrow[disabled] { opacity: 0; pointer-events: none; }
  .back-arrow { left: -14px; } .fwd-arrow { right: -14px; }
  @media (max-width: 599px) { .arrow { display: none; } }
</style>
