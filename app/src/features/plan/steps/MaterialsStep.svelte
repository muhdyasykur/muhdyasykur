<script lang="ts">
  import Icon from '../../../lib/ui/Icon.svelte';
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Lesson } from '../../../lib/lesson/model';
  import { href } from '../../../router.svelte';
  import { pwa } from '../../../lib/pwa.svelte';
  import { slotFor, slotsForYear, type BookKind } from '../../../lib/textbook/books';
  import { lessonTextbook, suggestedPages, validPage, pageRange, bookTitle, shortLabel, type TextbookPage } from '../../../lib/textbook/lesson';
  import { listBooks } from '../../../lib/textbook/store';
  import { toolLinks, canvaPrompt, CANVA_AI } from '../../../lib/materials';
  import MaterialsStudio from './MaterialsStudio.svelte';
  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  let label = $state(''); let url = $state(''); let err = $state('');
  let shelf = $state<string[]>([]);
  let cKind = $state<'worksheet' | 'flashcards' | 'slides' | 'poster'>('worksheet');
  let cTier = $state<'low' | 'mod' | 'high' | 'all'>('all');
  let copied = $state('');
  $effect(() => { listBooks().then((b) => (shelf = b.map((x) => x.slot))); });
  function addLink() {
    const u = url.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) { err = tr('Paste a full link starting with https://'); return; }
    lesson.links.push({ label: label.trim() || u.replace(/^https?:\/\//, '').split('/')[0], url: u });
    label = ''; url = ''; err = '';
  }
  // the lesson's textbook pages: from the SoW until the teacher changes them
  const tb = $derived(lessonTextbook(lesson));
  const books = $derived(slotsForYear(lesson.curriculum.year).map((s) => ({ kind: s.kind, title: s.title })));
  let addKind = $state<BookKind>('SB'); let addFrom = $state<number | null>(null); let addTo = $state<number | null>(null); let tbErr = $state('');
  const own = () => (lesson.textbook ??= { pages: suggestedPages(lesson), pictures: false });
  function addPage() {
    const p: TextbookPage = addTo && addFrom && addTo > addFrom ? { kind: addKind, page: addFrom, to: addTo } : { kind: addKind, page: addFrom ?? 0 };
    if (!validPage(p)) { tbErr = tr('Type a page number (a range can be up to 20 pages).'); return; }
    const t = own();
    if (!t.pages.some((x) => x.kind === p.kind && x.page === p.page && x.to === p.to)) t.pages.push(p);
    addFrom = null; addTo = null; tbErr = '';
  }
  function removePage(i: number) { own().pages.splice(i, 1); }
  function setPictures(on: boolean) { own().pictures = on; }
  const prompt = $derived(canvaPrompt(lesson, cKind, cTier));
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); copied = tr('Prompt copied. Paste it into Canva AI.'); }
    catch { copied = tr('Copying is blocked here: select the text in the box and copy it.'); }
  }
</script>

<div class="stack">
  {#if lesson.sowNotes.materials}<aside class="card note"><b>{tr('SoW materials and references')}</b><p class="small">{lesson.sowNotes.materials}</p></aside>{/if}
  <section class="card stack" id="mt-textbook" aria-labelledby="tb-h">
    <h3 id="tb-h"><Icon name="book" size={20} /> {tr('Textbook')}</h3>
    <p class="muted small">{tr('These pages are printed on the lesson plan and open in Teach mode. They come from the Scheme of Work; change them if you use other pages.')}</p>
    {#if tb.pages.length}
      <ul class="tb-list">
        {#each tb.pages as p, i (p.kind + p.page + '-' + (p.to ?? ''))}
          {@const s = slotFor(lesson.curriculum.year, p.kind)}
          <li data-tb-page={shortLabel(p)}>
            <span class="tb-name"><b>{bookTitle(lesson.curriculum.year, p.kind)}</b> <span class="nw">{pageRange(p)}</span></span>
            {#if s && shelf.includes(s.id)}<a class="btn btn-text" href={href('library', 'read', s.id, p.page)} data-ref={shortLabel(p)}>{tr('Open')}</a>
            {:else}<span class="chip" title={tr('Add this book on the Textbook Shelf to open it')}>{tr('Not on your shelf')}</span>{/if}
            <button class="btn btn-text del" type="button" onclick={() => removePage(i)} aria-label={tr('Remove {x}', { x: shortLabel(p) })}><Icon name="close" size={18} /></button>
          </li>
        {/each}
      </ul>
    {:else}<p class="small">{tr('No textbook pages in this lesson plan yet.')}</p>{/if}
    <div class="row tb-add">
      <label class="field"><span>{tr('Book')}</span><select id="tb-book" class="select" bind:value={addKind}>{#each books as b}<option value={b.kind}>{b.title}</option>{/each}</select></label>
      <label class="field"><span>{tr('Page')}</span><input id="tb-from" class="input num" type="number" min="1" max="999" inputmode="numeric" bind:value={addFrom} /></label>
      <label class="field"><span>{tr('to page (optional)')}</span><input id="tb-to" class="input num" type="number" min="1" max="999" inputmode="numeric" bind:value={addTo} /></label>
      <button id="tb-add" class="btn btn-outline" type="button" onclick={addPage} disabled={!addFrom}><Icon name="plus" size={18} />{tr('Add page')}</button>
    </div>
    {#if tbErr}<p class="small err" role="alert">{tbErr}</p>{/if}
    <label class="row tick"><input id="tb-pictures" type="checkbox" checked={tb.pictures} onchange={(e) => setPictures((e.currentTarget as HTMLInputElement).checked)} />{tr('Print pictures of these pages with the lesson plan (and in the Word file)')}</label>
    {#if tb.pages.some((p) => { const s = slotFor(lesson.curriculum.year, p.kind); return !s || !shelf.includes(s.id); })}<p class="muted small">{tr('Pages marked "Not on your shelf" need the book on your')} <a href={href('library', lesson.curriculum.year, lesson.curriculum.school.toLowerCase(), 'books')}>{tr('Textbook Shelf')}</a> {tr('to open them or print their pictures. Your own copy stays on this device.')}</p>{/if}
  </section>
  <section class="card grid">
    <label class="field wide"><span>{tr('Teaching aids and materials')}</span><textarea id="mt-aids" class="input ta" rows="3" bind:value={lesson.aids} placeholder="e.g. Picture flashcards, worksheet, writing paper"></textarea></label>
    <label class="field wide"><span>{tr('Key vocabulary')}</span><input id="mt-vocab" class="input" bind:value={lesson.vocabulary} placeholder={tr('e.g. healthy, unhealthy, brush, junk food')} /></label>
    <label class="field wide"><span>{tr('Target sentence or structure (used by Tools: games, chants, prompts)')}</span><input id="mt-sentence" class="input" bind:value={lesson.sentence} placeholder={tr('e.g. You should … because …')} /></label>
  </section>
  <section class="card grid">
    <h3 class="wide">{tr('Assessment (PBD)')}</h3>
    <label class="field"><span>{tr('Evidence: what pupils produce')}</span><input id="mt-evidence" class="input" bind:value={lesson.assessment.evidence} placeholder={tr('e.g. Paragraph, exit ticket')} /></label>
    <label class="field"><span>{tr('Method: how you check')}</span><input id="mt-method" class="input" bind:value={lesson.assessment.method} placeholder={tr('e.g. Checklist while monitoring, questioning')} /></label>
  </section>

  <section class="card stack slides-card">
    <h3><Icon name="slides" size={20} /> {tr('Lesson slides')}</h3>
    <p class="muted small">{tr('{x} Present them here or in Teach mode, or download PowerPoint for Canva, Google Slides or PowerPoint. Works offline.', { x: lesson.slides ? tr('{length} slides made from this plan.', { length: lesson.slides.slides.length }) : tr('Turn this plan into a full slide deck for the projector, with your notes on every slide.') })}</p>
    <div class="row"><a id="mt-slides" class="btn btn-gold" href={href('plan', 'slides', lesson.id)}>{lesson.slides ? tr('Open lesson slides') : tr('Make lesson slides')}</a></div>
  </section>

  <MaterialsStudio bind:lesson />

  <section class="card stack">
    <h3>{tr('Find ready-made materials')}</h3>
    <p class="muted small">{tr('Opens a search for "{x}" in a new tab. Needs internet. Remember the offline version in Plan B.', { x: lesson.topic || lesson.mainSkill })}</p>
    {#if !pwa.online}<p class="offline-note" role="status">{tr('You are offline. These sites will open once you are connected; your lesson is saved meanwhile.')}</p>{/if}
    <div class="row">{#each toolLinks(lesson) as t}<a class="btn btn-outline" href={t.url} target="_blank" rel="noopener">{t.name}</a>{/each}</div>
  </section>

  <section class="card stack">
    <h3>{tr('Design with Canva AI')}</h3>
    <div class="row">
      <select class="select auto" bind:value={cKind} aria-label={tr('Material type')}><option value="worksheet">{tr('Worksheet')}</option><option value="flashcards">{tr('Flashcards')}</option><option value="slides">{tr('Slides')}</option><option value="poster">{tr('Poster')}</option></select>
      <select class="select auto" bind:value={cTier} aria-label={tr('Level')}><option value="all">{tr('All levels')}</option><option value="low">{tr('🌱 Low')}</option><option value="mod">{tr('🌿 Moderate')}</option><option value="high">{tr('🌳 High')}</option></select>
    </div>
    <textarea id="canva-prompt" class="input ta" rows="4" readonly value={prompt} aria-label="Prompt for Canva AI"></textarea>
    <div class="row"><button id="canva-copy" class="btn btn-primary" type="button" onclick={copyPrompt}>{tr('Copy prompt')}</button><a class="btn btn-gold" href={CANVA_AI} target="_blank" rel="noopener">{tr('Open Canva AI')}</a>{#if copied}<span class="muted small" role="status">{copied}</span>{/if}</div>
    <p class="muted small">{tr('Paste the finished design\'s link below so it opens from Teach mode.')}</p>
  </section>

  <section class="card stack">
    <h3>{tr('Links')}</h3>
    <p class="muted small">{tr('Your Canva designs, Wordwall games or videos. They print with a QR code and open from Teach mode.')}</p>
    {#each lesson.links as l, i}
      <div class="row"><span class="chip">{l.label}</span><span class="muted small url">{l.url}</span><button class="btn btn-text" type="button" onclick={() => lesson.links.splice(i, 1)}>{tr('Remove')}</button></div>
    {/each}
    <div class="grid">
      <label class="field"><span>{tr('Name')}</span><input id="mt-lname" class="input" bind:value={label} placeholder={tr('e.g. Healthy habits game')} /></label>
      <label class="field"><span>{tr('Link')}</span><input id="mt-url" class="input" type="url" bind:value={url} placeholder={tr('https://')} /></label>
    </div>
    {#if err}<p class="bad">{err}</p>{/if}
    <button class="btn btn-outline add" type="button" onclick={addLink}>{tr('Add link')}</button>
  </section>
  <section class="card">
    <label class="field"><span>{tr('Appendices (worksheet text, model paragraph, song lyrics)')}</span><textarea id="mt-app" class="input ta big" rows="8" bind:value={lesson.appendices}></textarea></label>
  </section>
</div>

<style>
  h3 { display: flex; align-items: center; gap: var(--s-2); margin: 0; }
  .tb-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-1); }
  .tb-list li { display: flex; align-items: center; gap: var(--s-2); flex-wrap: wrap; padding: var(--s-1) var(--s-2); border-radius: var(--r-ctl); background: var(--sunken); }
  .tb-name { flex: 1 1 14rem; }
  .tb-add { align-items: flex-end; }
  .num { width: 6.5rem; }
  .tick { gap: var(--s-2); min-height: 44px; font-size: var(--t-sm); flex-wrap: nowrap; align-items: flex-start; }
  .tick input { width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; }
  .nw { white-space: nowrap; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .wide { grid-column: 1 / -1; }
  .ta { min-height: 72px; padding: var(--s-2) var(--s-3); resize: vertical; }
  .big { min-height: 160px; }
  .note { border-style: dashed; }

  .url { overflow-wrap: anywhere; min-width: 0; }
  .bad { color: var(--bad); font-size: var(--t-sm); }

  .offline-note { color: var(--warn); font-weight: 600; font-size: var(--t-sm); }
</style>
