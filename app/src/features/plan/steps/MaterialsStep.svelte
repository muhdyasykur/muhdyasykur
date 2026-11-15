<script lang="ts">
  import type { Lesson } from '../../../lib/lesson/model';
  import { href } from '../../../router.svelte';
  import { findRefs } from '../../../lib/textbook/refs';
  import { slotFor } from '../../../lib/textbook/books';
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
    if (!/^https?:\/\/\S+\.\S+/.test(u)) { err = 'Paste a full link starting with https://'; return; }
    lesson.links.push({ label: label.trim() || u.replace(/^https?:\/\//, '').split('/')[0], url: u });
    label = ''; url = ''; err = '';
  }
  const refs = $derived(findRefs([lesson.sowNotes.materials, lesson.aids, ...lesson.stages.flatMap((s) => s.activities.map((a) => a.teacher))].join('\n')));
  const prompt = $derived(canvaPrompt(lesson, cKind, cTier));
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); copied = 'Prompt copied. Paste it into Canva AI.'; }
    catch { copied = 'Copying is blocked here: select the text in the box and copy it.'; }
  }
</script>

<div class="stack">
  {#if lesson.sowNotes.materials}<aside class="card note"><b>SoW materials and references</b><p class="small">{lesson.sowNotes.materials}</p></aside>{/if}
  {#if refs.length}
    <section class="card stack">
      <h3>Textbook pages for this lesson</h3>
      <div class="row">
        {#each refs as r}
          {@const s = slotFor(lesson.curriculum.year, r.kind)}
          {#if s && shelf.includes(s.id)}<a class="btn btn-outline" href={href('library', 'read', s.id, r.page)} data-ref={r.label}>📖 {r.label}</a>
          {:else}<span class="chip" title="Add this book on the Textbook Shelf to open it">{r.label}</span>{/if}
        {/each}
      </div>
      {#if refs.some((r) => { const s = slotFor(lesson.curriculum.year, r.kind); return !s || !shelf.includes(s.id); })}<p class="muted small">Grey pages need the book on your <a href={href('library', lesson.curriculum.year, lesson.curriculum.school.toLowerCase(), 'books')}>Textbook Shelf</a>.</p>{/if}
    </section>
  {/if}
  <section class="card grid">
    <label class="field wide"><span>Teaching aids and materials</span><textarea id="mt-aids" class="input ta" rows="3" bind:value={lesson.aids} placeholder="e.g. Picture flashcards, worksheet, writing paper"></textarea></label>
    <label class="field wide"><span>Key vocabulary</span><input id="mt-vocab" class="input" bind:value={lesson.vocabulary} placeholder="e.g. healthy, unhealthy, brush, junk food" /></label>
  </section>
  <section class="card grid">
    <h3 class="wide">Assessment (PBD)</h3>
    <label class="field"><span>Evidence: what pupils produce</span><input id="mt-evidence" class="input" bind:value={lesson.assessment.evidence} placeholder="e.g. Paragraph, exit ticket" /></label>
    <label class="field"><span>Method: how you check</span><input id="mt-method" class="input" bind:value={lesson.assessment.method} placeholder="e.g. Checklist while monitoring, questioning" /></label>
  </section>

  <MaterialsStudio bind:lesson />

  <section class="card stack">
    <h3>Find ready-made materials</h3>
    <p class="muted small">Opens a search for "{lesson.topic || lesson.mainSkill}" in a new tab. Needs internet. Remember the offline version in Plan B.</p>
    <div class="row">{#each toolLinks(lesson) as t}<a class="btn btn-outline" href={t.url} target="_blank" rel="noopener">{t.name}</a>{/each}</div>
  </section>

  <section class="card stack">
    <h3>Design with Canva AI</h3>
    <div class="row">
      <select class="select auto" bind:value={cKind} aria-label="Material type"><option value="worksheet">Worksheet</option><option value="flashcards">Flashcards</option><option value="slides">Slides</option><option value="poster">Poster</option></select>
      <select class="select auto" bind:value={cTier} aria-label="Level"><option value="all">All levels</option><option value="low">🌱 Low</option><option value="mod">🌿 Moderate</option><option value="high">🌳 High</option></select>
    </div>
    <textarea id="canva-prompt" class="input ta" rows="4" readonly value={prompt}></textarea>
    <div class="row"><button id="canva-copy" class="btn btn-primary" type="button" onclick={copyPrompt}>Copy prompt</button><a class="btn btn-gold" href={CANVA_AI} target="_blank" rel="noopener">Open Canva AI</a>{#if copied}<span class="muted small" role="status">{copied}</span>{/if}</div>
    <p class="muted small">Paste the finished design's link below so it opens from Teach mode.</p>
  </section>

  <section class="card stack">
    <h3>Links</h3>
    <p class="muted small">Your Canva designs, Wordwall games or videos. They print with a QR code and open from Teach mode.</p>
    {#each lesson.links as l, i}
      <div class="row"><span class="chip">{l.label}</span><span class="muted small url">{l.url}</span><button class="btn btn-text" type="button" onclick={() => lesson.links.splice(i, 1)}>Remove</button></div>
    {/each}
    <div class="grid">
      <label class="field"><span>Name</span><input id="mt-lname" class="input" bind:value={label} placeholder="e.g. Healthy habits game" /></label>
      <label class="field"><span>Link</span><input id="mt-url" class="input" type="url" bind:value={url} placeholder="https://" /></label>
    </div>
    {#if err}<p class="bad">{err}</p>{/if}
    <button class="btn btn-outline add" type="button" onclick={addLink}>Add link</button>
  </section>
  <section class="card">
    <label class="field"><span>Appendices (worksheet text, model paragraph, song lyrics)</span><textarea id="mt-app" class="input ta big" rows="8" bind:value={lesson.appendices}></textarea></label>
  </section>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .wide { grid-column: 1 / -1; }
  .ta { min-height: 72px; padding: var(--s-2) var(--s-3); resize: vertical; }
  .big { min-height: 160px; }
  .note { border-style: dashed; }
  .small { font-size: var(--t-sm); }
  .url { overflow-wrap: anywhere; min-width: 0; }
  .bad { color: var(--bad); font-size: var(--t-sm); }
  .add { justify-self: start; }
  .auto { width: auto; }
</style>
