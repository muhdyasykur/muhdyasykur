<script lang="ts">
  import { href, go } from '../../router.svelte';
  import { db, type Book } from '../../lib/db/schema';
  import { SLOTS, KIND_NAME, slotsForYear, recognise, guessSlot, slotFor, type Slot } from '../../lib/textbook/books';
  import { putBookFile, getBookFile, removeBook, space, mb } from '../../lib/textbook/store';
  import { openPdf, renderPage, pageTexts } from '../../lib/textbook/pdf';
  import { loadSow } from '../../lib/curriculum/loader';
  import { unitIndex, lessonRefs, type UnitIndex } from '../../lib/textbook/refs';
  import type { SowLesson, School } from '../../lib/curriculum/types';

  let { year = 4, school = 'SK' }: { year?: number; school?: School } = $props();
  let books = $state<Book[]>([]);
  let disk = $state<{ used: number; quota: number } | null>(null);
  let busy = $state(''); let error = $state('');
  let pending = $state<{ file: File; slot: string; pages: number; offset: number; known: boolean } | null>(null);
  let calib = $state<HTMLCanvasElement>(); let printed = $state<number | null>(null);
  let lessons = $state<SowLesson[]>([]); let units = $state<UnitIndex[]>([]);
  let q = $state('');
  const CAL_PAGE = 20;

  async function refresh() { books = await db.books.toArray(); disk = await space(); }
  $effect(() => { refresh(); });
  $effect(() => { const y = year, s = school; loadSow(y, s).then((f) => { if (y === year) { lessons = f.lessons; units = unitIndex(f.lessons); } }); });
  const bookOf = (slot: string) => books.find((b) => b.slot === slot);

  async function choose(slot: Slot, e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    (e.currentTarget as HTMLInputElement).value = '';
    if (!file) return;
    error = '';
    if (file.type && file.type !== 'application/pdf') { error = 'Choose a PDF file.'; return; }
    if (disk && disk.quota && disk.used + file.size > disk.quota * 0.95) { error = `Not enough space on this device for ${mb(file.size)}. Remove a book you do not need first.`; return; }
    busy = `Reading ${file.name}…`;
    try {
      const doc = await openPdf(file);
      const fp = recognise(doc.numPages, file.size);
      const target = fp?.slot ?? slot.id;
      pending = { file, slot: target, pages: doc.numPages, offset: fp?.offset ?? 0, known: !!fp };
      if (fp) await save(doc); else {
        busy = ''; printed = null;
        queueMicrotask(async () => { if (calib) await renderPage(doc, Math.min(CAL_PAGE, doc.numPages), calib, 360); });
      }
    } catch { error = 'This file could not be opened as a PDF.'; busy = ''; }
  }
  async function save(doc?: Awaited<ReturnType<typeof openPdf>>) {
    if (!pending) return;
    const p = pending;
    busy = `Saving ${p.file.name} on this device (${mb(p.file.size)})…`;
    try {
      doc ??= await openPdf(p.file);
      const texts = await pageTexts(doc, (n) => (busy = `Indexing page ${n} of ${p.pages}…`));
      const hasText = texts.join('').length > p.pages * 40;
      const old = bookOf(p.slot); if (old) await removeBook(old);
      const storage = await putBookFile(p.slot, p.file);
      await db.books.put({ id: p.slot, slot: p.slot, name: p.file.name, pages: p.pages, bytes: p.file.size, offset: p.offset, recognised: p.known, storage, addedAt: Date.now(), text: hasText ? texts : undefined });
      pending = null; busy = '';
      await refresh();
    } catch (e) { error = 'Saving failed: ' + (e as Error).message; busy = ''; }
  }
  function confirmCalibration() { if (pending && printed != null) { pending.offset = Math.min(CAL_PAGE, pending.pages) - printed; save(); } }
  async function remove(b: Book) { await removeBook(b); await refresh(); }
  async function recalibrate(b: Book) {
    const f = await getBookFile(b); if (!f) return;
    pending = { file: new File([f], b.name, { type: 'application/pdf' }), slot: b.slot, pages: b.pages, offset: b.offset, known: false };
    printed = null;
    const doc = await openPdf(f);
    queueMicrotask(async () => { if (calib) await renderPage(doc, Math.min(CAL_PAGE, doc.numPages), calib, 360); });
  }

  // ---- search: page number, unit/topic, keyword (text-layer books only)
  const sb = $derived(slotFor(year, 'SB'));
  const results = $derived.by(() => {
    const s = q.trim(); if (!s) return null;
    if (/^\d{1,3}$/.test(s)) return { page: Number(s), units: [], lessons: [], words: [] };
    const low = s.toLowerCase();
    const u = units.filter((x) => (x.unit + ' ' + x.topic).toLowerCase().includes(low));
    const ls = lessons.filter((l) => (l.topic + ' ' + l.label + ' ' + l.focus).toLowerCase().includes(low) && lessonRefs(l).length).slice(0, 12);
    const words = books.filter((b) => b.text).flatMap((b) => b.text!.map((t, i) => ({ b, pdf: i + 1, t })).filter((x) => x.t.toLowerCase().includes(low)).slice(0, 8).map((x) => ({ slot: b.slot, page: x.pdf - b.offset, snippet: snippet(x.t, low) })));
    return { page: null, units: u, lessons: ls, words };
  });
  function snippet(t: string, w: string) { const i = t.toLowerCase().indexOf(w); return (i > 40 ? '…' : '') + t.slice(Math.max(0, i - 40), i + w.length + 60) + '…'; }
  const read = (slot: string, page: number) => href('library', 'read', slot, page);
  const scanned = $derived(books.filter((b) => !b.text).length);
</script>

<div class="stack">
  <p class="muted">Add your own copies of the textbooks. They stay on this device only: they are never uploaded, shared or put in backup files.</p>
  {#if disk}<p class="small muted">Storage used on this device: {mb(disk.used)}{disk.quota ? ` of about ${mb(disk.quota)}` : ''}.</p>{/if}
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  {#if busy}<p class="busy" role="status">{busy}</p>{/if}

  {#if pending && !pending.known && !busy}
    <section class="card stack calib">
      <h3>One quick check for this PDF</h3>
      <p>This file is not one Consilia knows. Look at the page below and type the page number printed on it, so "page 18" in the Scheme of Work opens the right page.</p>
      <canvas bind:this={calib} class="cal"></canvas>
      <div class="row"><label class="field"><span>Printed page number (leave empty if none is printed)</span><input id="cal-page" class="input" type="number" bind:value={printed} /></label></div>
      <div class="row"><button id="cal-save" class="btn btn-gold" type="button" disabled={printed == null} onclick={confirmCalibration}>Save</button><button class="btn btn-text" type="button" onclick={() => { if (pending) { pending.offset = 0; save(); } }}>No number printed: save as is</button><button class="btn btn-text" type="button" onclick={() => (pending = null)}>Cancel</button></div>
    </section>
  {/if}

  <label class="search"><span class="sr-only">Search the books</span>
    <input id="shelf-search" class="input" type="search" bind:value={q} placeholder="Page number (18), unit or topic (Where are you from?), or a word" /></label>
  {#if results}
    <section class="card stack res">
      {#if results.page != null}
        {#if sb && bookOf(sb.id)}<a class="btn btn-primary" href={read(sb.id, results.page)}>Open {sb.title}, page {results.page}</a>{/if}
        {#each slotsForYear(year).filter((s) => s.kind !== 'SB' && bookOf(s.id)) as s}<a class="btn btn-outline" href={read(s.id, results.page)}>{s.title}, page {results.page}</a>{/each}
        {#if !books.some((b) => slotsForYear(year).some((s) => s.id === b.slot))}<p class="muted">Add a Year {year} book first.</p>{/if}
      {:else}
        {#each results.units as u}<div class="hit"><b>{u.unit}: {u.topic}</b>{#if u.sb != null && sb}<a class="btn btn-text" href={read(sb.id, u.sb)}>Student's Book p. {u.sb}</a>{/if}{#if u.tb != null && slotFor(year, 'TB')}<a class="btn btn-text" href={read(slotFor(year, 'TB')!.id, u.tb)}>Teacher's Book p. {u.tb}</a>{/if}</div>{/each}
        {#each results.lessons as l}<div class="hit"><span>Lesson {l.no} · {l.topic} <span class="muted">({l.label})</span></span>{#each lessonRefs(l) as r}{@const s = slotFor(year, r.kind)}{#if s}<a class="btn btn-text" href={read(s.id, r.page)}>{r.label}</a>{/if}{/each}</div>{/each}
        {#each results.words as w}<div class="hit"><a href={read(w.slot, w.page)}>{SLOTS.find((s) => s.id === w.slot)?.title}, p. {w.page}</a><span class="muted small">{w.snippet}</span></div>{/each}
        {#if !results.units.length && !results.lessons.length && !results.words.length}<p class="muted">Nothing found for "{q}".</p>{/if}
        {#if scanned}<p class="muted small">{scanned} of your books are scans without searchable text, so word search covers {books.length - scanned} book{books.length - scanned === 1 ? '' : 's'}. Units, topics and page numbers work for all of them.</p>{/if}
      {/if}
    </section>
  {/if}

  <div class="slots">
    {#each slotsForYear(year) as s (s.id)}
      {@const b = bookOf(s.id)}
      <section class="card slot" class:filled={b} data-slot={s.id}>
        <p class="eyebrow">{KIND_NAME[s.kind]}</p>
        <h3>{s.series}</h3>
        {#if b}
          <p class="small muted">{b.name} · {b.pages} pages · {mb(b.bytes)} · {b.recognised ? 'recognised edition' : `page offset ${b.offset}`}{b.text ? ' · searchable text' : ''}</p>
          <div class="row">
            <a class="btn btn-primary" href={read(s.id, 1 - b.offset > 0 ? 1 - b.offset : 1)}>Open</a>
            {#if !b.recognised}<button class="btn btn-text" type="button" onclick={() => recalibrate(b)}>Check page numbers</button>{/if}
            <button class="btn btn-text del" type="button" onclick={() => remove(b)}>Remove</button>
          </div>
        {:else}
          <label class="btn btn-outline add">Add PDF<input type="file" accept="application/pdf,.pdf" class="sr-only" onchange={(e) => choose(s, e)} data-add={s.id} /></label>
        {/if}
      </section>
    {/each}
  </div>
  <p class="muted small">Books are left out of backups because they are large. On a new device, add them again here.</p>
</div>

<style>
  .small { font-size: var(--t-sm); }
  .err { color: var(--bad); }
  .busy { font-weight: 600; color: var(--navy-2); }
  .cal { max-width: 360px; border: 1px solid var(--line); border-radius: 6px; }
  .slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--s-3); }
  .slot { border-style: dashed; }
  .slot.filled { border-style: solid; }
  .add { justify-self: start; }
  .del { color: var(--bad); }
  .hit { display: flex; flex-wrap: wrap; gap: var(--s-2); align-items: center; border-bottom: 1px solid var(--line); padding: 4px 0; }
  .hit .muted.small { flex-basis: 100%; }
</style>
