<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import type { PDFDocumentProxy } from 'pdfjs-dist';
  import { db, type Book } from '../../lib/db/schema';
  import { getBookFile } from '../../lib/textbook/store';
  import { openPdf, renderPage } from '../../lib/textbook/pdf';
  import { slotById, KIND_NAME } from '../../lib/textbook/books';

  /**
   * One textbook page with projector tools (blueprint F32): zoom, pen, highlighter, spotlight and an
   * answer cover. `page` is the number printed in the book; the PDF page is page + offset.
   */
  let { slot, page = $bindable(1), tools = true, onmissing }: { slot: string; page?: number; tools?: boolean; onmissing?: () => void } = $props();
  let book = $state<Book | null>(null);
  let doc = $state<PDFDocumentProxy | null>(null);
  let err = $state('');
  let zoom = $state(1);
  let mode = $state<'' | 'pen' | 'hl' | 'spot' | 'cover'>('');
  let wrap = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let ink = $state<HTMLCanvasElement>();
  let size = $state({ w: 0, h: 0 });
  let spot = $state({ x: 0.1, y: 0.2, w: 0.8, h: 0.25 });
  let cover = $state({ x: 0.05, y: 0.45, w: 0.9, h: 0.35 });

  $effect(() => {
    const s = slot; err = ''; doc = null;
    (async () => {
      const b = await db.books.where('slot').equals(s).first();
      if (!b) { book = null; onmissing?.(); return; }
      book = b;
      const f = await getBookFile(b);
      if (!f) { err = tr('The PDF for this book is missing from this device. Add it again from the Textbook Shelf.'); return; }
      try { doc = await openPdf(f); } catch { err = tr('This PDF could not be opened.'); }
    })();
  });
  const pdfPage = $derived(book ? Math.min(Math.max(1, page + book.offset), book.pages) : 1);
  const firstPrinted = $derived(book ? 1 - book.offset : 1);
  const lastPrinted = $derived(book ? book.pages - book.offset : 1);
  let token = 0;
  $effect(() => {
    if (!doc || !canvas || !wrap) return;
    // "Fit" shows the whole page on screen (projector); 1.5× and 2× zoom from the full width
    const n = pdfPage, z = zoom, w = wrap.clientWidth, me = ++token;
    const maxH = z === 1 ? Math.max(320, window.innerHeight * (tools ? 0.72 : 0.8)) : Infinity;
    renderPage(doc, n, canvas, Math.max(240, (w - 4) * (z === 1 ? 1 : z)), maxH).then((sz) => { if (me === token) { size = sz; clearInk(); } }).catch(() => (err = tr('This page could not be drawn.')));
  });
  function clearInk() { if (ink) { ink.width = size.w; ink.height = size.h; } }
  function turn(d: number) { page = Math.min(lastPrinted, Math.max(firstPrinted, page + d)); }

  // drawing
  let drawing = false;
  function down(e: PointerEvent) {
    if (mode !== 'pen' && mode !== 'hl') return;
    drawing = true; (e.target as Element).setPointerCapture(e.pointerId);
    const c = ink!.getContext('2d')!; const r = ink!.getBoundingClientRect();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = mode === 'pen' ? '#D2453D' : 'rgba(255, 214, 0, 0.35)'; c.lineWidth = mode === 'pen' ? 3 : 18;
    c.beginPath(); c.moveTo(e.clientX - r.left, e.clientY - r.top);
  }
  function move(e: PointerEvent) { if (!drawing) return; const c = ink!.getContext('2d')!; const r = ink!.getBoundingClientRect(); c.lineTo(e.clientX - r.left, e.clientY - r.top); c.stroke(); }
  function up() { drawing = false; }
  // drag spotlight / cover by their handle
  function drag(box: 'spot' | 'cover', e: PointerEvent) {
    const start = { x: e.clientX, y: e.clientY, b: { ...(box === 'spot' ? spot : cover) } };
    const mv = (ev: PointerEvent) => {
      const nb = { ...start.b, x: start.b.x + (ev.clientX - start.x) / size.w, y: start.b.y + (ev.clientY - start.y) / size.h };
      nb.x = Math.min(1 - nb.w, Math.max(0, nb.x)); nb.y = Math.min(1 - nb.h, Math.max(0, nb.y));
      if (box === 'spot') spot = nb; else cover = nb;
    };
    const stop = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', stop); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', stop);
  }
  function resize(box: 'spot' | 'cover', e: PointerEvent) {
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY, b: { ...(box === 'spot' ? spot : cover) } };
    const mv = (ev: PointerEvent) => {
      const nb = { ...start.b, w: Math.max(0.1, Math.min(1 - start.b.x, start.b.w + (ev.clientX - start.x) / size.w)), h: Math.max(0.05, Math.min(1 - start.b.y, start.b.h + (ev.clientY - start.y) / size.h)) };
      if (box === 'spot') spot = nb; else cover = nb;
    };
    const stop = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', stop); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', stop);
  }
  const meta = $derived(slotById(slot));
</script>

<div class="viewer">
  <div class="bar row">
    <b class="ttl">{meta?.title ?? tr('Book')}</b>
    <div class="row nav">
      <button class="btn btn-outline" type="button" onclick={() => turn(-1)} aria-label={tr('Previous page')}>‹</button>
      <label class="pg">p. <input class="input" type="number" bind:value={page} min={firstPrinted} max={lastPrinted} aria-label={tr('Page number printed in the book')} data-page /></label>
      <button class="btn btn-outline" type="button" onclick={() => turn(1)} aria-label={tr('Next page')}>›</button>
    </div>
    <div class="seg" role="group" aria-label={tr('Zoom')}>{#each [1, 1.5, 2] as z}<button type="button" aria-pressed={zoom === z} onclick={() => (zoom = z)}>{z === 1 ? tr('Fit') : `${z}×`}</button>{/each}</div>
    {#if tools}
      <div class="seg" role="group" aria-label={tr('Projector tools')}>
        <button type="button" aria-pressed={mode === 'pen'} onclick={() => (mode = mode === 'pen' ? '' : 'pen')}>{tr('Pen')}</button>
        <button type="button" aria-pressed={mode === 'hl'} onclick={() => (mode = mode === 'hl' ? '' : 'hl')}>{tr('Highlighter')}</button>
        <button type="button" aria-pressed={mode === 'spot'} onclick={() => (mode = mode === 'spot' ? '' : 'spot')} data-tool="spot">{tr('Spotlight')}</button>
        <button type="button" aria-pressed={mode === 'cover'} onclick={() => (mode = mode === 'cover' ? '' : 'cover')} data-tool="cover">{tr('Answer cover')}</button>
      </div>
      <button class="btn btn-text" type="button" onclick={clearInk}>{tr('Clear ink')}</button>
    {/if}
  </div>
  {#if !book}
    <p class="muted">{tr('This book is not on your shelf yet.')}</p>
  {:else if err}
    <p class="err">{err}</p>
  {:else}
    <div class="page" bind:this={wrap}>
      <div class="sheet" style="width:{size.w}px;height:{size.h}px">
        <canvas bind:this={canvas} aria-label={tr('{x}, page {page}', { x: meta?.title, page })}></canvas>
        <canvas class="ink" class:active={mode === 'pen' || mode === 'hl'} bind:this={ink} width={size.w} height={size.h} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}></canvas>
        {#if mode === 'spot'}
          <div class="spot" style="left:{spot.x * 100}%;top:{spot.y * 100}%;width:{spot.w * 100}%;height:{spot.h * 100}%" onpointerdown={(e) => drag('spot', e)} role="presentation">
            <span class="grip" onpointerdown={(e) => resize('spot', e)} role="presentation"></span>
          </div>
        {/if}
        {#if mode === 'cover'}
          <div class="cover" style="left:{cover.x * 100}%;top:{cover.y * 100}%;width:{cover.w * 100}%;height:{cover.h * 100}%" onpointerdown={(e) => drag('cover', e)} role="presentation">
            <span>{tr('Drag to reveal')}</span><span class="grip" onpointerdown={(e) => resize('cover', e)} role="presentation"></span>
          </div>
        {/if}
      </div>
    </div>
    <p class="muted small">{tr('{x} · printed page {page} (PDF page {pdfPage} of {pages})', { x: KIND_NAME[meta?.kind ?? 'SB'], page, pdfPage, pages: book.pages })}</p>
  {/if}
</div>

<style>
  .viewer { display: grid; gap: var(--s-2); min-width: 0; }
  .bar { gap: var(--s-2); align-items: center; }
  .ttl { font-family: var(--f-display); margin-right: auto; }
  .nav { gap: 4px; }
  .pg { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  .pg .input { width: 76px; min-height: 40px; }
  .seg button { min-height: 38px; font-size: var(--t-xs); }
  .page { overflow: auto; max-width: 100%; background: var(--sunken); border-radius: var(--r-ctl); padding: 2px; max-height: 82vh; }
  .sheet { position: relative; margin: 0 auto; touch-action: none; }
  .sheet canvas { position: absolute; inset: 0; display: block; }
  .ink { pointer-events: none; }
  .ink.active { pointer-events: auto; cursor: crosshair; }
  .spot { position: absolute; box-shadow: 0 0 0 9999px rgba(0, 0, 0, .72); border: 3px solid var(--gold-strong); border-radius: 6px; cursor: move; }
  .cover { position: absolute; background: #2B3A55; color: #fff; display: grid; place-items: center; border-radius: 6px; cursor: move; font: 700 1rem var(--f-body); box-shadow: 0 6px 20px rgba(0,0,0,.35); }
  .grip { position: absolute; right: -8px; bottom: -8px; width: 20px; height: 20px; border-radius: 50%; background: var(--gold-strong); cursor: nwse-resize; }
  .sheet { overflow: hidden; }

</style>
