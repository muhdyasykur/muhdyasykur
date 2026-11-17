<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Lesson } from '../../../lib/lesson/model';
  import { uid } from '../../../lib/lesson/model';
  import { TYPE_INFO, splitList, splitSentences, type Printable, type PrintType } from '../../../lib/materials';
  import { fileToDataUrl } from '../../../lib/ui/image';
  import { printOne } from '../../../lib/ui/printOne';
  import PrintableView from '../print/PrintableView.svelte';

  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  let type = $state<PrintType>('tiered');
  let words = $state(lesson.vocabulary);
  let sentences = $state('');
  let frame = $state('');
  let perPage = $state<2 | 4 | 8>(4);
  let open = $state<string>('');
  let err = $state('');
  const types = Object.keys(TYPE_INFO) as PrintType[];

  function create() {
    err = '';
    const w = splitList(words), s = splitSentences(sentences);
    if (['flashcards', 'matching', 'tiered'].includes(type) && w.length < 2) { err = tr('Add at least two key words, separated by commas.'); return; }
    if (['gapfill', 'strips'].includes(type) && s.length < 2) { err = tr('Add at least two sentences (one per line).'); return; }
    if (type === 'exit' && !lesson.objectives.some((o) => o.verb || o.free)) { err = tr('Write your objectives first; exit tickets use the success criteria.'); return; }
    const p: Printable = { id: uid(), type, title: '', words: w, sentences: s, frame, perPage, images: {}, inAppendix: true, seed: Math.floor(Math.random() * 1e6) };
    lesson.printables = [...(lesson.printables ?? []), p];
    if (!lesson.vocabulary.trim() && w.length) lesson.vocabulary = w.join(', ');
    open = p.id;
  }
  async function addImage(p: Printable, w: string, e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0]; if (!f) return;
    try { p.images = { ...p.images, [w]: await fileToDataUrl(f, 360) }; } catch (x) { err = (x as Error).message; }
  }
  function remove(id: string) { lesson.printables = (lesson.printables ?? []).filter((x) => x.id !== id); }
  const els: Record<string, HTMLElement> = {};
</script>

<section class="card stack">
  <h3>{tr('Materials studio')}</h3>
  <p class="muted small">{tr('Make printable materials from your own words. Everything is made on this device and works offline.')}</p>
  <div class="grid">
    <label class="field"><span>{tr('What to make')}</span><select id="ms-type" class="select" bind:value={type}>{#each types as t}<option value={t}>{tr(TYPE_INFO[t].name)}</option>{/each}</select></label>
    {#if type === 'flashcards'}<label class="field"><span>{tr('Cards per page')}</span><select class="select" bind:value={perPage}><option value={2}>2</option><option value={4}>4</option><option value={8}>8</option></select></label>{/if}
  </div>
  <p class="muted small">{tr('Needs: {needs}.', { needs: tr(TYPE_INFO[type].needs) })}</p>
  {#if ['flashcards', 'matching', 'tiered', 'gapfill'].includes(type)}<label class="field"><span>{tr('Key words (comma separated)')}</span><input id="ms-words" class="input" bind:value={words} placeholder={tr('e.g. vegetables, sweets, brush teeth, sleep early')} /></label>{/if}
  {#if ['gapfill', 'strips'].includes(type)}<label class="field"><span>{tr('Sentences (one per line{x})', { x: type === 'strips' ? tr(', in the right order') : '' })}</span><textarea id="ms-sent" class="input ta" rows="4" bind:value={sentences}></textarea></label>{/if}
  {#if type === 'tiered'}<label class="field"><span>{tr('Sentence frame')}</span><input id="ms-frame" class="input" bind:value={frame} placeholder={tr('e.g. I should ___ because ___.')} /></label>{/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  <button id="ms-make" class="btn btn-primary add" type="button" onclick={create}>{tr('Make it')}</button>

  {#each lesson.printables ?? [] as p (p.id)}
    <div class="item">
      <div class="row between">
        <b>{tr(TYPE_INFO[p.type].name)}{p.words.length ? `: ${p.words.slice(0, 3).join(', ')}${p.words.length > 3 ? '…' : ''}` : ''}</b>
        <div class="row">
          <label class="row small"><input type="checkbox" bind:checked={p.inAppendix} />{tr('In lesson plan appendix')}</label>
          <button class="btn btn-text" type="button" onclick={() => (open = open === p.id ? '' : p.id)}>{open === p.id ? tr('Hide') : tr('Preview')}</button>
          <button class="btn btn-outline" type="button" onclick={() => { open = p.id; queueMicrotask(() => printOne(els[p.id])); }} data-print-one={p.type}>{tr('Print')}</button>
          <button class="btn btn-text del" type="button" onclick={() => remove(p.id)}>{tr('Delete')}</button>
        </div>
      </div>
      {#if open === p.id}
        <label class="field"><span>{tr('Title on the sheet')}</span><input class="input" bind:value={p.title} placeholder={tr(TYPE_INFO[p.type].name)} /></label>
        {#if p.type === 'flashcards' || p.type === 'matching'}
          <div class="pics">{#each p.words as w}<label class="pic">{#if p.images[w]}<img src={p.images[w]} alt={w} />{/if}<span>{w}</span><span class="btn btn-text">{p.images[w] ? tr('Change') : tr('Add picture')}</span><input type="file" accept="image/*" class="sr-only" onchange={(e) => addImage(p, w, e)} /></label>{/each}</div>
          <p class="muted small">{tr('Pictures are your own (camera or files) and stay on this device.')}</p>
        {/if}
        <div class="prev" bind:this={els[p.id]}><PrintableView {p} {lesson} /></div>
      {/if}
    </div>
  {/each}
</section>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--s-3); }

  .ta { min-height: 90px; padding: var(--s-2) var(--s-3); }
  .err { color: var(--bad); font-size: var(--t-sm); }

  .item { border-top: 1px solid var(--line); padding-top: var(--s-3); display: grid; gap: var(--s-2); }

  .pics { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .pic { display: grid; justify-items: center; gap: 2px; width: 110px; padding: var(--s-2); border: 1px solid var(--line); border-radius: var(--r-ctl); cursor: pointer; font-size: var(--t-sm); }
  .pic img { width: 80px; height: 60px; object-fit: contain; }
  .prev { overflow-x: auto; background: var(--sunken); border-radius: var(--r-card); padding: var(--s-3); }
  @media print { .prev { background: none; padding: 0; overflow: visible; } }
</style>
