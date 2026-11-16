<script lang="ts">
  import { untrack } from 'svelte';
  import type { Deck } from '../../lib/slides/deck';
  import SlideView from './SlideView.svelte';
  /**
   * Presenting the deck: → / Space / Page Down / a presentation clicker for next (a question shows its answer first),
   * ← / Page Up for back, F for full screen, N for the teacher's notes, Esc to stop. Tap the right or left side on a touch screen.
   */
  let { deck, start = 0, onclose, embedded = false }: { deck: Deck; start?: number; onclose?: () => void; embedded?: boolean } = $props();
  let i = $state(untrack(() => Math.max(0, Math.min(start, deck.slides.length - 1))));
  let reveal = $state(false);
  let notes = $state(false);
  let el = $state<HTMLElement>();
  const slide = $derived(deck.slides[i]);
  function next() { if (slide?.answer && !reveal) { reveal = true; return; } if (i < deck.slides.length - 1) { i++; reveal = false; } }
  function prev() { if (reveal) { reveal = false; return; } if (i > 0) { i--; reveal = false; } }
  function goTo(n: number) { i = Math.max(0, Math.min(n, deck.slides.length - 1)); reveal = false; }
  function full() { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); else el?.requestFullscreen?.().catch(() => {}); }
  function key(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t?.closest?.('input, textarea, select, [contenteditable]')) return;
    if (embedded && !el?.contains(document.activeElement) && document.fullscreenElement !== el) return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { if (e.key === 'Enter' && t?.closest?.('button, a')) return; e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(deck.slides.length - 1);
    else if (e.key === 'f' || e.key === 'F') full();
    else if (e.key === 'n' || e.key === 'N') notes = !notes;
    else if (e.key === 'Escape' && !document.fullscreenElement && onclose) onclose();
  }
  function tap(e: MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - r.left > r.width * 0.35) next(); else prev();
  }
  $effect(() => { untrack(() => el?.focus({ preventScroll: embedded })); });
</script>

<svelte:window onkeydown={key} />
<div class="show" class:embedded bind:this={el} tabindex="-1" role="region" aria-label="Lesson slides" aria-roledescription="slide show">
  {#if slide}
    <button class="stage" type="button" onclick={tap} aria-label="Next slide (tap the left side to go back)">
      <SlideView {slide} theme={deck.theme} n={i} total={deck.slides.length} {reveal} />
    </button>
    <p class="sr-only" aria-live="polite">Slide {i + 1} of {deck.slides.length}: {slide.title}. {slide.lines.join('. ')}{reveal && slide.answer ? ` Answer: ${slide.answer}` : ''}</p>
    {#if notes}<div class="notes"><b>Notes{slide.stage ? ` · ${slide.stage}` : ''}</b>{#each slide.notes.split('\n') as n}<p>{n}</p>{/each}{#if slide.answer}<p>Answer: {slide.answer}</p>{/if}</div>{/if}
    <div class="ctrl">
      <button class="btn btn-text" type="button" onclick={prev} disabled={i === 0 && !reveal} aria-label="Previous slide">◀</button>
      <label class="jump"><span class="sr-only">Go to slide</span>
        <select class="select" value={i} onchange={(e) => goTo(+e.currentTarget.value)} data-slide-jump>
          {#each deck.slides as s, k}<option value={k}>{k + 1}. {s.title}</option>{/each}
        </select>
      </label>
      <button class="btn btn-text" type="button" onclick={next} disabled={i === deck.slides.length - 1 && (!slide.answer || reveal)} aria-label="Next slide" data-next>▶</button>
      <button class="btn btn-text" type="button" aria-pressed={notes} onclick={() => (notes = !notes)} data-notes>Notes</button>
      <button class="btn btn-text" type="button" onclick={full}>⛶ Full screen</button>
      {#if onclose}<button class="btn btn-outline" type="button" onclick={onclose} data-close>Close</button>{/if}
    </div>
  {/if}
</div>

<style>
  .show { display: grid; gap: var(--s-2); outline: none; }
  .show:not(.embedded) { position: fixed; inset: 0; z-index: 60; background: #0b1528; padding: 2vh 2vw; grid-template-rows: 1fr auto auto; align-items: center; justify-items: center; }
  .show:fullscreen { background: #0b1528; padding: 1vh 1vw; grid-template-rows: 1fr auto auto; align-items: center; justify-items: center; }
  .stage { all: unset; display: block; width: 100%; cursor: pointer; }
  .show:not(.embedded) .stage, .show:fullscreen .stage { width: min(96vw, calc((100vh - 140px) * 16 / 9)); }
  .stage:focus-visible { outline: 3px solid var(--gold, #E2BC4F); outline-offset: 3px; }
  .ctrl { display: flex; flex-wrap: wrap; gap: var(--s-1); align-items: center; justify-content: center; }
  .show:not(.embedded) .ctrl .btn, .show:fullscreen .ctrl .btn { color: #fff; }
  .show:not(.embedded) .btn-outline, .show:fullscreen .btn-outline { border-color: #fff; }
  .jump .select { width: auto; max-width: 16rem; }
  .notes { width: min(96vw, 60rem); max-height: 22vh; overflow: auto; background: var(--paper, #fff); color: var(--ink, #1E2B40); border-radius: var(--r-2, 8px); padding: var(--s-2) var(--s-3); font-size: var(--t-sm); }
  .notes p { margin: 2px 0; }
</style>
