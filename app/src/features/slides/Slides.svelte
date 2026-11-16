<script lang="ts">
  import { href } from '../../router.svelte';
  import { getLesson, saveLesson } from '../../lib/db/repo';
  import type { Lesson } from '../../lib/lesson/model';
  import { uid } from '../../lib/lesson/model';
  import { buildDeck, THEMES, type Deck, type Slide, type SlideKind, type Theme } from '../../lib/slides/deck';
  import { deckToPptx, slideFileName } from '../../lib/slides/pptx';
  import { saveFile } from '../../lib/export/download';
  import { profile } from '../../lib/profile.svelte';
  import { longDate } from '../../lib/lesson/derive';
  import Icon from '../../lib/ui/Icon.svelte';
  import SlideView from './SlideView.svelte';
  import SlideShow from './SlideShow.svelte';
  import AiSlides from './AiSlides.svelte';

  /** Lesson slides: made from the lesson plan on the device, edited here, presented in class or downloaded as PowerPoint. */
  let { id }: { id: string } = $props();
  let lesson = $state<Lesson | null>(null);
  let missing = $state(false);
  let deck = $state<Deck | null>(null);
  let sel = $state(0);
  let presenting = $state(false);
  let saved = $state('');
  let fileMsg = $state('');
  let confirmRemake = $state(false);
  let addKind = $state<SlideKind>('text');

  $effect(() => {
    getLesson(id).then((l) => {
      if (!l) { missing = true; return; }
      lesson = l;
      deck = l.slides ? structuredClone(l.slides) : null;
    });
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  function persist() {
    if (!lesson || !deck) return;
    deck.updatedAt = Date.now();
    saved = 'Saving…';
    clearTimeout(timer);
    const snap = $state.snapshot(deck) as Deck;
    const lid = lesson.id; // kept: the save may finish after this page closes
    timer = setTimeout(async () => {
      const l = await getLesson(lid); if (!l) return;
      l.slides = snap; await saveLesson(l); saved = 'Saved on this device';
    }, 400);
  }
  $effect(() => {
    const flush = () => { if (saved === 'Saving…' && lesson && deck) { clearTimeout(timer); const snap = $state.snapshot(deck) as Deck, lid = lesson.id; getLesson(lid).then((l) => { if (l) { l.slides = snap; saveLesson(l); } }); } };
    addEventListener('pagehide', flush);
    return () => removeEventListener('pagehide', flush);
  });
  function make(theme: Theme = deck?.theme ?? 'consilia') {
    if (!lesson) return;
    deck = buildDeck(lesson, theme); sel = 0; confirmRemake = false; persist();
  }
  function setTheme(t: Theme) { if (deck) { deck.theme = t; persist(); } }
  const cur = $derived(deck?.slides[sel]);
  function move(k: number, d: number) {
    if (!deck) return; const j = k + d; if (j < 0 || j >= deck.slides.length) return;
    const s = deck.slides; [s[k], s[j]] = [s[j], s[k]]; sel = j; persist();
  }
  function dup(k: number) { if (!deck) return; deck.slides.splice(k + 1, 0, { ...$state.snapshot(deck.slides[k]) as Slide, id: uid() }); sel = k + 1; persist(); }
  function remove(k: number) { if (!deck || deck.slides.length < 2) return; deck.slides.splice(k, 1); sel = Math.min(sel, deck.slides.length - 1); persist(); }
  const NEW: Record<string, { label: string; title: string; lines: string[]; notes: string; answer?: string }> = {
    text: { label: 'Text', title: 'New slide', lines: ['Type here'], notes: '' },
    question: { label: 'Question with answer', title: 'Quick check', lines: ['Type the question'], notes: 'Pupils answer, then reveal.', answer: 'Type the answer' },
    words: { label: 'Word list', title: 'Key words', lines: ['word'], notes: 'Say each word; pupils repeat.' },
    activity: { label: 'Activity steps', title: 'Activity', lines: ['First step', 'Second step'], notes: '' },
    dialogue: { label: 'Dialogue', title: 'Dialogue', lines: ['A: …', 'B: …'], notes: 'Model with a pupil, then pairs practise.' }
  };
  function add() {
    if (!deck) return; const n = NEW[addKind];
    deck.slides.splice(sel + 1, 0, { id: uid(), kind: addKind, title: n.title, lines: [...n.lines], notes: n.notes, ...(n.answer ? { answer: n.answer } : {}) });
    sel = sel + 1; persist();
  }
  async function download() {
    if (!deck || !lesson) return;
    fileMsg = 'Making the PowerPoint file…';
    try {
      const blob = await deckToPptx($state.snapshot(deck) as Deck, { title: lesson.topic || 'English lesson', author: profile.value?.name });
      const how = await saveFile(blob, slideFileName(lesson.topic, lesson.header.date));
      fileMsg = how === 'shared' ? 'Shared. Choose Canva, Google Slides or PowerPoint to open it.' : `Downloaded ${slideFileName(lesson.topic, lesson.header.date)}.`;
    } catch { fileMsg = 'Could not make the file. Try again; if it keeps failing, restart the app.'; }
  }
  const linesText = (s: Slide) => s.lines.join('\n');
  function setLines(s: Slide, v: string) { s.lines = v.split('\n'); persist(); }
  function tidy(s: Slide) { s.lines = s.lines.map((x) => x.trim()).filter(Boolean); if (!s.lines.length) s.lines = ['']; persist(); }
</script>

{#if missing}
  <div class="stack"><a class="btn btn-text" href={href('plan')}><Icon name="back" size={18} />Plan</a><p class="empty">This lesson plan no longer exists.</p></div>
{:else if lesson}
<div class="stack">
  <div class="row between">
    <a class="btn btn-text" href={href('plan', 'edit', lesson.id, 'materials')}><Icon name="back" size={18} />Back to the lesson plan</a>
    <span class="muted small" role="status">{saved}</span>
  </div>
  <header>
    <p class="eyebrow">Lesson slides · Year {lesson.curriculum.year}{lesson.header.className ? ` · ${lesson.header.className}` : ''} · {longDate(lesson.header.date)}</p>
    <h1>{lesson.topic || 'Untitled lesson'}</h1>
  </header>

  {#if !deck}
    <section class="card stack intro">
      <h2>Make slides from this lesson plan</h2>
      <p>Consilia turns the plan into a full deck for the projector: the topic, "I can" goals, warm-up, key words, the target sentence with examples, each activity with pupil steps, quick-check questions with answers, a thumbs check and an exit ticket. Your teacher notes go with every slide. It is made on this device and works offline.</p>
      <p class="muted small">Choose a look (you can change it later):</p>
      <div class="themes" role="group" aria-label="Look">
        {#each Object.entries(THEMES) as [k, th]}
          <button type="button" class="theme" onclick={() => make(k as Theme)} data-make={k} style="--bg:{th.bg};--ink:{th.ink};--accent:{th.accent}">
            <span class="sw"><span></span></span>{th.name}
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <section class="card stack">
      <div class="row tools">
        <button class="btn btn-gold" type="button" onclick={() => (presenting = true)} id="sl-present">▶ Present</button>
        <button class="btn btn-primary" type="button" onclick={download} id="sl-pptx">Download PowerPoint (.pptx)</button>
        <label class="row small">Look
          <select class="select" value={deck.theme} onchange={(e) => setTheme(e.currentTarget.value as Theme)} id="sl-theme">
            {#each Object.entries(THEMES) as [k, th]}<option value={k}>{th.name}</option>{/each}
          </select>
        </label>
        {#if confirmRemake}
          <span class="row small">Replace all {deck.slides.length} slides and your edits?
            <button class="btn btn-outline" type="button" onclick={() => make()} id="sl-remake-yes">Make again</button>
            <button class="btn btn-text" type="button" onclick={() => (confirmRemake = false)}>Keep</button></span>
        {:else}
          <button class="btn btn-text" type="button" onclick={() => (confirmRemake = true)} id="sl-remake">Make again from the plan…</button>
        {/if}
      </div>
      {#if fileMsg}<p class="small" role="status" id="sl-filemsg">{fileMsg}</p>{/if}
      <details class="help">
        <summary>Open in Canva, Google Slides or PowerPoint</summary>
        <ol>
          <li>Tap <b>Download PowerPoint (.pptx)</b>. On a phone you can send it straight to the Canva or Google Slides app.</li>
          <li><b>Canva:</b> on canva.com choose <b>Create a design → Import file</b> (or drag the file onto the Canva home page). Each slide becomes an editable Canva page; add pictures, Magic Design or animations there.</li>
          <li><b>Google Slides:</b> upload the file to Google Drive and open it with Google Slides, or in a deck choose <b>File → Import slides</b>.</li>
          <li><b>PowerPoint:</b> open the file. Your notes are in the speaker notes.</li>
        </ol>
        <p class="row">
          <a class="btn btn-text" href="https://www.canva.com/" target="_blank" rel="noopener noreferrer">Open Canva ↗</a>
          <a class="btn btn-text" href="https://docs.google.com/presentation/" target="_blank" rel="noopener noreferrer">Open Google Slides ↗</a>
        </p>
      </details>
    </section>

    <div class="editor">
      <ol class="thumbs" aria-label="Slides">
        {#each deck.slides as s, k (s.id)}
          <li>
            <button type="button" class="thumb" aria-current={k === sel ? 'true' : undefined} onclick={() => (sel = k)} aria-label="Slide {k + 1}: {s.title}" data-thumb={k}>
              <SlideView slide={s} theme={deck.theme} />
              <span class="tn">{k + 1}{s.ai ? ' · AI' : ''}</span>
            </button>
          </li>
        {/each}
      </ol>

      {#if cur}
        <section class="card stack edit" aria-label="Edit slide {sel + 1}">
          <SlideView slide={cur} theme={deck.theme} n={sel} total={deck.slides.length} reveal />
          <div class="row">
            <button class="btn btn-text" type="button" onclick={() => move(sel, -1)} disabled={sel === 0} aria-label="Move slide earlier">↑ Earlier</button>
            <button class="btn btn-text" type="button" onclick={() => move(sel, 1)} disabled={sel === deck.slides.length - 1} aria-label="Move slide later">↓ Later</button>
            <button class="btn btn-text" type="button" onclick={() => dup(sel)}>Duplicate</button>
            <button class="btn btn-text del" type="button" onclick={() => remove(sel)} disabled={deck.slides.length < 2} id="sl-delete">Delete slide</button>
          </div>
          <label class="field">Title<input class="input" id="sl-title" value={cur.title} oninput={(e) => { cur.title = e.currentTarget.value; persist(); }} /></label>
          <label class="field">On the slide (one line each)<textarea class="input" id="sl-lines" rows="5" value={linesText(cur)} oninput={(e) => setLines(cur, e.currentTarget.value)} onblur={() => tidy(cur)}></textarea></label>
          {#if cur.answer !== undefined || cur.kind === 'question'}
            <label class="field">Answer (shown when you tap)<input class="input" id="sl-answer" value={cur.answer ?? ''} oninput={(e) => { cur.answer = e.currentTarget.value; persist(); }} /></label>
          {/if}
          <label class="field">Teacher notes (not shown to pupils; in PowerPoint's speaker notes)<textarea class="input" id="sl-notes" rows="3" value={cur.notes} oninput={(e) => { cur.notes = e.currentTarget.value; persist(); }}></textarea></label>
        </section>
      {/if}
    </div>
    <div class="row">
      <label class="row small">Add after this slide
        <select class="select" bind:value={addKind} id="sl-addkind">{#each Object.entries(NEW) as [k, n]}<option value={k}>{n.label}</option>{/each}</select>
      </label>
      <button class="btn btn-outline" type="button" onclick={add} id="sl-add"><Icon name="plus" size={18} />Add slide</button>
    </div>

    <AiSlides {lesson} bind:deck onchange={persist} />
  {/if}
</div>
{#if presenting && deck}<SlideShow deck={$state.snapshot(deck) as Deck} start={sel} onclose={() => (presenting = false)} />{/if}
{/if}

<style>
  .between { justify-content: space-between; }
  .small { font-size: var(--t-sm); }
  .tools { align-items: center; }
  .tools .select { width: auto; }
  .themes { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .theme { display: grid; gap: 6px; justify-items: center; padding: var(--s-2); border: 1px solid var(--line); border-radius: var(--r-2); background: var(--paper); color: var(--ink); cursor: pointer; min-width: 9rem; font: inherit; }
  .theme:hover { border-color: var(--navy); }
  .sw { width: 8rem; aspect-ratio: 16/9; background: var(--bg); border-radius: 4px; display: grid; place-items: center; position: relative; overflow: hidden; }
  .sw span { width: 60%; height: 30%; background: var(--accent); border-radius: 3px; }
  .help summary { cursor: pointer; font-weight: 600; min-height: 44px; display: flex; align-items: center; }
  .help ol { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
  .editor { display: grid; gap: var(--s-3); grid-template-columns: minmax(9rem, 13rem) 1fr; align-items: start; }
  .thumbs { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); max-height: 80vh; overflow: auto; }
  .thumb { all: unset; display: grid; gap: 2px; cursor: pointer; width: 100%; border-radius: 6px; padding: 3px; border: 2px solid transparent; box-sizing: border-box; }
  .thumb[aria-current='true'] { border-color: var(--gold, #E2BC4F); }
  .thumb:focus-visible { outline: 3px solid var(--navy); }
  .tn { font-size: var(--t-xs, 12px); color: var(--ink-2); }
  .field { display: grid; gap: 4px; font-weight: 600; font-size: var(--t-sm); }
  .del { color: var(--bad); }
  @media (max-width: 720px) {
    .editor { grid-template-columns: 1fr; }
    .thumbs { grid-auto-flow: column; grid-auto-columns: 8.5rem; max-height: none; overflow-x: auto; padding-bottom: 4px; }
  }
</style>
