<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { tr, i18n } from '../../lib/i18n/index.svelte';
  import { href, go } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import Markdown from './Markdown.svelte';
  import { trapFocus } from '../../lib/ui/focus';
  import { toggleFull } from '../../lib/ui/fullscreen.svelte';
  import { notify } from '../../lib/ui/toast.svelte';
  import { toolMeta } from '../../lib/studio/catalogue';
  import { defOf, buildPrompt, refinePrompt, chipsFor, startValues, missingFields, type Values } from '../../lib/studio/tools';
  import { parseMarkdown, toPlain, toHtml, titleOf, wordCount } from '../../lib/studio/markdown';
  import { quizItems, wordsFrom } from '../../lib/studio/parse';
  import { namesIn, withoutNames } from '../../lib/studio/privacy';
  import { prefs, toggleFav, used } from '../../lib/studio/prefs.svelte';
  import { aiReady, aiName } from '../../lib/ai/settings.svelte';
  import { askStream } from '../../lib/ai/ask';
  import { AiError } from '../../lib/ai/common';
  import { AI_SITES } from '../../lib/recommend/prompts';
  import { pwa } from '../../lib/pwa.svelte';
  import { ctx, saveCtx, hasCtx, fromLesson } from '../../lib/tools/context.svelte';
  import { saveCreation, getCreation, pupilNames, saveLesson } from '../../lib/db/repo';
  import type { CreationVersion } from '../../lib/db/schema';
  import { appendAppendix } from '../../lib/tools/actions';
  import { uid } from '../../lib/lesson/model';
  import { profile } from '../../lib/profile.svelte';
  import { saveFile } from '../../lib/export/download';

  /**
   * One Studio tool (milestone 11): a form, one tap to generate, and a result to change, copy, print, read aloud, show
   * on the projector or save. With the AI assistant on, Claude (or Gemini) writes the result here as it goes; without
   * it, the teacher copies the prompt into any AI chat and pastes the answer back. Every result is kept in My creations.
   */
  let { id, cid = '' }: { id: string; cid?: string } = $props();
  // the page is re-created for each tool (keyed by the route), so reading the props once is intended
  // svelte-ignore state_referenced_locally
  const def = defOf(id);
  // svelte-ignore state_referenced_locally
  const meta = toolMeta(id);

  let values = $state<Values>(def ? startValues(def, ctx, i18n.locale) : {});
  let versions = $state<CreationVersion[]>([]);
  let vi = $state(0);
  let draft = $state('');
  let busy = $state(false);
  let err = $state('');
  let formErr = $state('');
  let announce = $state('');
  // svelte-ignore state_referenced_locally
  let creationId = $state(cid);
  let createdAt = 0;
  let saved = $state(false);
  let editing = $state(false); let editText = $state('');
  let changeText = $state('');
  let names = $state<string[]>([]); let namesOverride = false;
  let ctrl: AbortController | null = null;
  // the copy-and-paste route (no AI assistant connected)
  let pasteOpen = $state(false); let pasted = $state(''); let copiedPrompt = $state(false);
  let pending = $state<{ prompt: string; how: CreationVersion['how']; note?: string }>({ prompt: '', how: 'paste' });
  let resultEl = $state<HTMLElement>();
  let presentEl = $state<HTMLElement>();
  let presenting = $state(false); let scale = $state(1.6);
  let speaking = $state(false);

  const current = $derived(versions[vi]?.text ?? '');
  const blocks = $derived(parseMarkdown(busy ? draft : current));
  const shown = $derived(busy ? !!draft : !!current);
  const title = $derived(titleOf(parseMarkdown(current)) || String(values.topic || values.situation || values.task || values.point || values.sound || values.question || (meta ? meta.title : '')).slice(0, 80));
  const quizCount = $derived(def?.send?.includes('quiz') && current ? quizItems(current).length : 0);
  const wheelWords = $derived(def?.send?.includes('wheel') && current ? wordsFrom(parseMarkdown(current)) : []);
  const docLang = $derived(def?.audience === 'teacher' && /^Bahasa Melayu$/.test(values.lang ?? '') ? 'ms' : 'en');
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const sites = AI_SITES.filter((s) => s.id !== 'canva');

  onMount(async () => {
    if (!cid || !def) return;
    const c = await getCreation(cid);
    if (!c || c.tool !== id) { notify(tr('That saved result was not found.'), { kind: 'error' }); return; }
    values = { ...startValues(def, ctx, i18n.locale), ...c.inputs };
    versions = c.versions; vi = c.versions.length - 1; createdAt = c.createdAt; saved = true;
  });
  onDestroy(() => { ctrl?.abort(); if (speaking) speechSynthesis.cancel(); });

  // ---- generating
  async function namesOk(texts: string[]): Promise<boolean> {
    if (namesOverride) return true;
    names = namesIn(texts, await pupilNames().catch(() => []));
    return !names.length;
  }
  async function removeNames() {
    const all = await pupilNames().catch(() => []);
    for (const f of def!.fields) if (f.kind === 'text' || f.kind === 'area') values[f.id] = withoutNames(values[f.id] ?? '', all);
    changeText = withoutNames(changeText, all);
    names = [];
  }
  function sendAnyway() { namesOverride = true; names = []; }

  async function generate() {
    if (!def) return;
    formErr = ''; err = '';
    const miss = missingFields(def, values);
    if (miss.length) { formErr = tr('Please fill in: {x}', { x: miss.map((f) => tr(f.label)).join(', ') }); document.getElementById('sf-' + miss[0].id)?.focus(); return; }
    if (!(await namesOk(Object.values(values)))) return;
    used(id);
    const p = buildPrompt(def, values);
    if (aiReady()) await run(p, 'first'); else await startPaste(p, 'paste');
  }
  async function run(p: string, how: CreationVersion['how'], note?: string) {
    busy = true; draft = ''; err = ''; editing = false; announce = '';
    ctrl = new AbortController();
    await tick();
    if (matchMedia('(max-width: 999px)').matches) resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const text = await askStream(p, (soFar) => (draft = soFar), ctrl.signal);
      add(text, how, note);
    } catch (e) {
      if (e instanceof AiError && e.kind === 'stopped') { if (draft.trim()) add(draft, 'stopped', note); }
      else err = e instanceof AiError ? e.message : tr('The AI request did not work. Try again.');
    } finally { busy = false; ctrl = null; draft = ''; }
  }
  function stop() { ctrl?.abort(); }
  function add(text: string, how: CreationVersion['how'], note?: string) {
    versions = [...versions, { text: text.trim(), at: Date.now(), how, ...(note ? { note } : {}) }];
    vi = versions.length - 1;
    announce = tr('Ready: version {n}.', { n: versions.length });
    persist();
  }
  async function persist() {
    const now = Date.now();
    if (!creationId) { creationId = uid(); createdAt = now; }
    await saveCreation({ id: creationId, tool: id, title: title || meta!.title, inputs: $state.snapshot(values) as Values, versions: $state.snapshot(versions) as CreationVersion[], createdAt: createdAt || now, updatedAt: now });
    saved = true;
  }

  // ---- the copy-and-paste route
  async function startPaste(p: string, how: CreationVersion['how'], note?: string) {
    pending = { prompt: p, how, note }; pasteOpen = true; pasted = '';
    await copyPrompt();
    await tick();
    document.getElementById('st-paste-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(pending.prompt); copiedPrompt = true; } catch { copiedPrompt = false; }
  }
  function usePasted() {
    const t = pasted.trim(); if (!t) return;
    add(t, pending.how, pending.note);
    pasted = ''; pasteOpen = false;
  }

  // ---- changing a result
  async function change(instruction: string) {
    const c = instruction.trim();
    if (!c || !current || !def) return;
    if (!(await namesOk([c]))) return;
    const p = refinePrompt(def, values, current, c);
    changeText = '';
    if (aiReady()) await run(p, 'change', c); else await startPaste(p, 'change', c);
  }
  function startEdit() { editText = current; editing = true; tick().then(() => document.getElementById('st-edit')?.focus()); }
  function saveEdit() { if (editText.trim() && editText.trim() !== current.trim()) add(editText, 'edit'); editing = false; }
  const versionLabel = (v?: CreationVersion) => !v ? '' : v.how === 'change' ? tr('Changed: {x}', { x: v.note ? tr(v.note) : '' }) : v.how === 'edit' ? tr('Edited by you') : v.how === 'paste' ? tr('Pasted from an AI chat') : v.how === 'stopped' ? tr('Stopped before the end') : tr('First version');

  // ---- using a result
  async function copy() {
    const plain = toPlain(blocks), html = toHtml(blocks);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([plain], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
      else await navigator.clipboard.writeText(plain);
      notify(tr('Copied. Paste it into Word, Google Docs or WhatsApp.'), { kind: 'ok' });
    } catch {
      try { await navigator.clipboard.writeText(plain); notify(tr('Copied. Paste it into Word, Google Docs or WhatsApp.'), { kind: 'ok' }); }
      catch { notify(tr('Copying is blocked here: select the text and copy it.'), { kind: 'error' }); }
    }
  }
  async function word() {
    try {
      const { studioBlob } = await import('../../lib/studio/docx');
      const safe = (title || meta!.title).replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'Consilia';
      const how = await saveFile(await studioBlob(title || meta!.title, `${meta!.title} · Consilia · ${new Date().toLocaleDateString('en-GB')}`, parseMarkdown(current)), `${safe}.docx`);
      notify(how === 'shared' ? tr('Shared.') : tr('Saved to your downloads.'), { kind: 'ok' });
    } catch (e) { notify(tr('The Word file could not be made: ') + (e as Error).message, { kind: 'error' }); }
  }
  function read() {
    if (speaking) { speechSynthesis.cancel(); speaking = false; return; }
    const u = new SpeechSynthesisUtterance(toPlain(parseMarkdown(current)));
    u.lang = docLang === 'ms' ? 'ms-MY' : 'en-GB'; u.rate = 0.9;
    const voices = speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang.toLowerCase().startsWith(u.lang.toLowerCase())) ?? voices.find((x) => x.lang.toLowerCase().startsWith(docLang));
    if (v) u.voice = v;
    u.onend = () => (speaking = false); u.onerror = () => (speaking = false);
    speaking = true; speechSynthesis.speak(u);
  }
  async function present() { presenting = true; }
  function closePresent() { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); presenting = false; }
  function playQuiz() {
    const items = quizItems(current);
    if (!items.length) { notify(tr('No questions with answers were found in this result.'), { kind: 'error' }); return; }
    let saved: Record<string, unknown> = {};
    try { saved = JSON.parse(localStorage.getItem('consilia.games') || '{}'); } catch { /* fresh */ }
    try { localStorage.setItem('consilia.games', JSON.stringify({ ...saved, quiz: items.map((i) => `${i.q} | ${i.a}`).join('\n') })); } catch { /* private mode */ }
    go('tools', 'games', 'quiz');
  }
  function spinWheel() { ctx.words = wheelWords.join(', '); saveCtx(); go('tools', 'games', 'wheel'); }
  async function toBuilder() {
    try {
      const [{ parsePlan }, { lessonFromPlan }, { loadStandards }] = await Promise.all([import('../../lib/studio/parse'), import('../../lib/studio/lessonplan'), import('../../lib/curriculum/loader')]);
      const school = profile.value?.schoolType === 'SJK' ? 'SJK' : 'SK';
      const year = Number(values.year) || 4;
      const l = lessonFromPlan(parsePlan(current), { year, school, minutes: parseInt(values.minutes) || 60, skill: values.skill || 'Speaking', topic: values.topic ?? '', words: values.words ?? '', sentence: values.sentence ?? '' }, await loadStandards(year, school));
      await saveLesson(JSON.parse(JSON.stringify(l)));
      fromLesson(l);
      notify(tr('Lesson plan created. Check the standards and objectives, then print it.'), { kind: 'ok' });
      go('plan', 'edit', l.id, 'review');
    } catch (e) { notify(tr('The lesson plan could not be made: {x}', { x: (e as Error).message }), { kind: 'error' }); }
  }
  async function toAppendix() {
    const l = await appendAppendix(ctx.lessonId, title || meta!.title, toPlain(parseMarkdown(current)).split('\n'));
    if (l) notify(tr('Added to the appendix of {x}.', { x: ctx.lessonLabel || l.topic }), { kind: 'ok', action: { label: tr('Open'), run: () => go('plan', 'edit', l.id, 'materials') } });
    else notify(tr('That lesson plan no longer exists.'), { kind: 'error' });
  }
  function tryExample() { if (!def) return; values = { ...startValues(def, ctx, i18n.locale), ...def.example }; formErr = ''; names = []; }
  function fromBar() { if (!def) return; const s = startValues(def, ctx, i18n.locale); for (const f of def.fields) if (f.from || f.kind === 'year') values[f.id] = s[f.id]; }
</script>

<svelte:window onkeydown={(e) => { if (presenting && e.key === 'Escape') { e.preventDefault(); closePresent(); } }} />

{#if !def || !meta}
  <EmptyState icon="tools" title={tr('This tool was not found.')}>
    {#snippet actions()}<a class="btn btn-primary" href={href('tools')}>{tr('Back to Tools')}</a>{/snippet}
  </EmptyState>
{:else}
<div class="studio cat-{meta.cat}">
  <a class="btn btn-text back no-print" href={href('tools')}><Icon name="back" size={18} />{tr('Tools')}</a>
  <header class="head">
    <span class="tile" aria-hidden="true"><Icon name={meta.icon} size={30} /></span>
    <div class="ht"><h1>{tr(meta.title)}</h1><p class="muted">{tr(meta.about)}</p></div>
    <button class="btn btn-text fav no-print" type="button" aria-pressed={prefs.fav.includes(id)} onclick={() => toggleFav(id)} data-fav={id}><Icon name="star" size={20} />{prefs.fav.includes(id) ? tr('In favourites') : tr('Add to favourites')}</button>
  </header>

  <div class="layout">
    <div class="stack left no-print">
      <form class="card stack form" onsubmit={(e) => { e.preventDefault(); generate(); }} novalidate aria-label={tr('What you need')}>
        {#each def.fields as f (f.id)}
          {#if f.kind === 'year'}
            <div class="field"><span id="sf-{f.id}-l">{tr('Year')}</span>
              <div class="seg years" role="group" aria-labelledby="sf-{f.id}-l">{#each ['1', '2', '3', '4', '5', '6'] as y}<button type="button" aria-pressed={values[f.id] === y} onclick={() => (values[f.id] = y)}>{y}</button>{/each}</div>
            </div>
          {:else}
            <label class="field" for="sf-{f.id}">
              <span>{tr(f.label)}{#if f.required}<span class="req" aria-hidden="true"> *</span>{/if}</span>
              {#if f.kind === 'select'}
                <select id="sf-{f.id}" class="select" bind:value={values[f.id]}>{#each f.options ?? [] as o}<option value={o}>{tr(o)}</option>{/each}</select>
              {:else if f.kind === 'area'}
                <textarea id="sf-{f.id}" class="input ta" rows={f.rows ?? 3} bind:value={values[f.id]} placeholder={f.placeholder ? tr(f.placeholder) : ''} aria-required={f.required} aria-describedby={f.hint ? `sf-${f.id}-h` : undefined}></textarea>
              {:else}
                <input id="sf-{f.id}" class="input" bind:value={values[f.id]} placeholder={f.placeholder ? tr(f.placeholder) : ''} aria-required={f.required} aria-describedby={f.hint ? `sf-${f.id}-h` : undefined} />
              {/if}
              {#if f.hint}<small id="sf-{f.id}-h" class="muted">{tr(f.hint)}</small>{/if}
            </label>
          {/if}
        {/each}
        {#if formErr}<p class="small err" role="alert" id="st-form-err">{formErr}</p>{/if}
        {#if names.length}
          <div class="namecheck" role="alert" id="st-names">
            <p><b>{tr('These look like your pupils\' names: {x}.', { x: names.join(', ') })}</b> {tr('Consilia does not send pupils\' names to an AI.')}</p>
            <div class="row"><button class="btn btn-primary" type="button" onclick={removeNames} id="st-names-fix">{tr('Remove the names for me')}</button><button class="btn btn-text" type="button" onclick={sendAnyway}>{tr('They are not pupils\' names')}</button></div>
          </div>
        {/if}
        <div class="row go">
          <button class="btn btn-gold" type="submit" disabled={busy || (aiReady() && !pwa.online)} id="st-go"><Icon name="sparkle" size={18} />{aiReady() ? tr('Generate with {x}', { x: aiName() }) : tr('Copy the prompt')}</button>
          <button class="btn btn-outline" type="button" onclick={tryExample} id="st-example"><Icon name="bulb" size={18} />{tr('Try an example')}</button>
          {#if hasCtx() && def.fields.some((f) => f.from)}<button class="btn btn-text" type="button" onclick={fromBar}>{tr('Fill from my lesson bar')}</button>{/if}
        </div>
        {#if aiReady() && !pwa.online}<p class="small muted">{tr('You are offline. The AI assistant needs the internet; your saved results still open.')}</p>{/if}
        <p class="muted small privacy"><Icon name="check" size={14} /> {aiReady() ? tr('Only what you type here is sent to {x}, when you press Generate. Pupils\' names are never sent.', { x: aiName() === 'Claude' ? tr('Anthropic') : tr('Google') }) : tr('Consilia sends nothing: you paste the prompt into the AI chat you choose.')}</p>
        {#if !aiReady()}<p class="small"><a href={href('me', 'ai')} id="st-connect">{tr('Connect Claude')}</a> {tr('(or Gemini) with your own key to get results here in one tap.')}</p>{/if}
      </form>

      {#if pasteOpen}
        <section class="card stack paste" id="st-paste-card" aria-labelledby="paste-h">
          <h2 id="paste-h">{tr('Use any AI chat')}</h2>
          <ol class="steps">
            <li>{copiedPrompt ? tr('The prompt is copied.') : tr('Copy the prompt below.')} <button class="btn btn-text" type="button" onclick={copyPrompt} id="st-copy-prompt"><Icon name="copy" size={16} />{tr('Copy it again')}</button></li>
            <li>{tr('Open an AI chat, paste it and send it:')}
              <span class="row sites">{#each sites as s}<a class="btn btn-outline" href={s.url} target="_blank" rel="noopener">{s.name}</a>{/each}</span></li>
            <li><label class="field" for="st-paste">{tr('Paste the answer here')}</label>
              <textarea id="st-paste" class="input ta" rows="6" bind:value={pasted}></textarea>
              <button class="btn btn-primary" type="button" onclick={usePasted} disabled={!pasted.trim()} id="st-paste-use">{tr('Show the answer')}</button></li>
          </ol>
          <details><summary class="small">{tr('See the prompt')}</summary><pre class="prompt">{pending.prompt}</pre></details>
        </section>
      {/if}
    </div>

    <section class="card result" bind:this={resultEl} aria-labelledby="res-h" id="st-result">
      <h2 id="res-h" class="sr-only">{tr('Result')}</h2>
      <p class="sr-only" role="status">{announce}</p>
      {#if !shown && !busy}
        <EmptyState icon={meta.icon} title={tr('Your result appears here')} compact>
          {aiReady() ? tr('Fill in the form and press Generate. Then change it, copy it, print it or save it as a Word file. Every result is kept in My creations.') : tr('Fill in the form, copy the prompt into any AI chat, then paste the answer here to tidy, change, print and keep it.')}
          {#snippet actions()}<a class="btn btn-text" href={href('tools', 'creations')}><Icon name="folder" size={18} />{tr('My creations')}</a>{/snippet}
        </EmptyState>
      {:else}
        <div class="toolbar no-print" role="toolbar" aria-label={tr('Result')}>
          {#if versions.length > 1}
            <div class="ver">
              <button class="btn btn-text" type="button" onclick={() => (vi = Math.max(0, vi - 1))} disabled={vi === 0 || busy} aria-label={tr('Previous version')}><Icon name="back" size={18} /></button>
              <span class="small" id="st-version">{tr('Version {n} of {total}', { n: vi + 1, total: versions.length })}</span>
              <button class="btn btn-text" type="button" onclick={() => (vi = Math.min(versions.length - 1, vi + 1))} disabled={vi === versions.length - 1 || busy} aria-label={tr('Next version')}><Icon name="chevron" size={18} /></button>
            </div>
          {/if}
          <span class="grow"></span>
          {#if !busy && current}
            <button class="btn btn-text" type="button" onclick={copy} id="st-copy"><Icon name="copy" size={18} />{tr('Copy')}</button>
            <button class="btn btn-text" type="button" onclick={startEdit} disabled={editing} id="st-edit-btn"><Icon name="edit" size={18} />{tr('Edit')}</button>
            <button class="btn btn-text" type="button" onclick={() => window.print()}><Icon name="print" size={18} />{tr('Print')}</button>
            <button class="btn btn-text" type="button" onclick={word} id="st-word"><Icon name="download" size={18} />{tr('Word')}</button>
            {#if def.read && canSpeak}<button class="btn btn-text" type="button" onclick={read} aria-pressed={speaking} id="st-read"><Icon name={speaking ? 'stop' : 'volume'} size={18} />{speaking ? tr('Stop reading') : tr('Read aloud')}</button>{/if}
            {#if def.read}<button class="btn btn-text" type="button" onclick={present} id="st-present"><Icon name="expand" size={18} />{tr('Projector')}</button>{/if}
          {/if}
        </div>
        {#if !busy && versions[vi]}<p class="muted small vnote no-print">{versionLabel(versions[vi])}{#if saved}{' · '}<a href={href('tools', 'creations')}>{tr('Saved in My creations')}</a>{/if}</p>{/if}
        {#if editing}
          <label class="sr-only" for="st-edit">{tr('Edit the result')}</label>
          <textarea id="st-edit" class="input ta edit no-print" rows="18" bind:value={editText}></textarea>
          <p class="muted small no-print">{tr('Use ## for headings, - for lists and **bold** for key words.')}</p>
          <div class="row no-print"><button class="btn btn-primary" type="button" onclick={saveEdit} id="st-edit-save">{tr('Save as a new version')}</button><button class="btn btn-text" type="button" onclick={() => (editing = false)}>{tr('Cancel')}</button></div>
        {:else}
          <article class="doc" lang={docLang} aria-busy={busy} id="st-doc"><Markdown {blocks} />{#if busy}<span class="caret" aria-hidden="true"></span>{/if}</article>
        {/if}
        {#if busy}
          <div class="row no-print writing"><span class="muted small">{draft ? tr('Writing… {n} words so far', { n: wordCount(draft) }) : tr('{x} is thinking…', { x: aiName() })}</span><button class="btn btn-outline" type="button" onclick={stop} id="st-stop"><Icon name="stop" size={16} />{tr('Stop')}</button></div>
        {/if}
        {#if !busy && current && !editing}
          <p class="muted small ai-note no-print">{tr('{n} words. Check it before using it with pupils: AI can make mistakes.', { n: wordCount(current) })}</p>
          {#if quizCount || wheelWords.length || def.send?.includes('builder') || ctx.lessonId}
            <div class="sendto no-print" aria-label={tr('Use it')} role="group">
              {#if def.send?.includes('builder')}<button class="btn btn-gold" type="button" onclick={toBuilder} id="st-builder"><Icon name="plan" size={18} />{tr('Open in the lesson plan builder')}</button>{/if}
              {#if quizCount}<button class="btn btn-primary" type="button" onclick={playQuiz} id="st-quiz"><Icon name="trophy" size={18} />{tr('Play as a Quiz show ({n} questions)', { n: quizCount })}</button>{/if}
              {#if wheelWords.length >= 2}<button class="btn btn-primary" type="button" onclick={spinWheel} id="st-wheel"><Icon name="wheel" size={18} />{tr('Spin wheel with these words')}</button>{/if}
              {#if ctx.lessonId}<button class="btn btn-outline" type="button" onclick={toAppendix} id="st-appendix"><Icon name="plus" size={18} />{tr('Add to my lesson plan')}</button>{/if}
            </div>
          {/if}
          <section class="refine no-print" aria-labelledby="ref-h">
            <h3 id="ref-h">{id === 'ask' ? tr('Ask a follow-up') : tr('Change it')}</h3>
            <div class="chips">{#each chipsFor(def) as c}<button type="button" class="chip pickable" onclick={() => change(c)} data-chip={c}>{tr(c)}</button>{/each}</div>
            <form class="row ask" onsubmit={(e) => { e.preventDefault(); change(changeText); }}>
              <label class="sr-only" for="st-change">{id === 'ask' ? tr('Ask a follow-up') : tr('What should change?')}</label>
              <input id="st-change" class="input grow" bind:value={changeText} placeholder={id === 'ask' ? tr('Ask another question…') : tr('e.g. add a game, use Year 2 words, make it rhyme')} />
              <button class="btn btn-primary" type="submit" disabled={!changeText.trim()} id="st-change-go"><Icon name="send" size={18} />{tr('Send')}</button>
            </form>
          </section>
        {/if}
      {/if}
      {#if err}<p class="err" role="alert" id="st-err">{err}</p>{/if}
    </section>
  </div>
</div>

{#if presenting}
  <div class="present" role="dialog" tabindex="-1" aria-modal="true" aria-label={tr('Projector view')} bind:this={presentEl} use:trapFocus>
    <div class="pbar">
      <button class="btn btn-outline" type="button" onclick={() => (scale = Math.max(1, scale - 0.2))} aria-label={tr('Smaller text')}>A−</button>
      <button class="btn btn-outline" type="button" onclick={() => (scale = Math.min(3.2, scale + 0.2))} aria-label={tr('Larger text')}>A+</button>
      <button class="btn btn-outline" type="button" onclick={() => toggleFull(presentEl)}><Icon name="expand" size={18} />{tr('Full screen')}</button>
      <button class="btn btn-primary" type="button" onclick={closePresent} id="st-present-close"><Icon name="close" size={18} />{tr('Close')}</button>
    </div>
    <div class="pbody pupil-font" lang={docLang} style="font-size:{scale}rem"><Markdown blocks={parseMarkdown(current)} /></div>
  </div>
{/if}
{/if}

<style>
  .studio { display: grid; gap: var(--s-4); }
  .head { display: grid; grid-template-columns: auto 1fr auto; gap: var(--s-3); align-items: center; }
  .head h1 { margin: 0; }
  .head p { margin: 2px 0 0; }
  .tile { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; background: var(--tile-bg); color: var(--tile-ink); }
  .fav[aria-pressed='true'] { color: var(--gold); }
  .fav[aria-pressed='true'] :global(svg path) { fill: currentColor; }
  .layout { display: grid; gap: var(--s-4); align-items: start; }
  @media (min-width: 1000px) { .layout { grid-template-columns: minmax(330px, 420px) minmax(0, 1fr); } .left { position: sticky; top: var(--s-4); } }
  @media (max-width: 599px) { .head { grid-template-columns: auto 1fr; } .fav { grid-column: 1 / -1; justify-self: start; } }
  .form .field { display: grid; gap: 6px; font-weight: 600; font-size: var(--t-sm); }
  .form .ta { min-height: 64px; padding: var(--s-2) var(--s-3); resize: vertical; font-weight: 400; }
  .form small { font-weight: 400; }
  .req { color: var(--bad); }
  .years button { min-width: 44px; }
  .go { gap: var(--s-2); }
  .privacy { display: flex; gap: 6px; align-items: flex-start; }
  .namecheck { border: 2px solid var(--warn); border-radius: var(--r-ctl); padding: var(--s-3); background: var(--card); display: grid; gap: var(--s-2); }
  .namecheck p { margin: 0; }
  .paste h2 { font-size: var(--t-lg); margin: 0; }
  .steps { margin: 0; padding-left: 1.3em; display: grid; gap: var(--s-3); }
  .steps li { display: grid; gap: var(--s-2); }
  .sites { gap: var(--s-2); }
  .prompt { white-space: pre-wrap; font-size: var(--t-xs); background: var(--sunken); padding: var(--s-2); border-radius: var(--r-ctl); max-height: 16rem; overflow: auto; }
  summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }
  .result { min-height: 320px; display: grid; gap: var(--s-3); align-content: start; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 2px var(--s-1); align-items: center; border-bottom: 1px solid var(--line); padding-bottom: var(--s-2); }
  .grow { flex: 1; }
  .ver { display: flex; align-items: center; gap: 2px; }
  .vnote { margin: 0; }
  .doc { font-size: var(--t-md); }
  .caret { display: inline-block; width: 8px; height: 1.1em; background: var(--gold-strong); vertical-align: text-bottom; animation: blink 1s steps(2) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .caret { animation: none; } }
  .writing { justify-content: space-between; }
  .edit { min-height: 22rem; font-family: var(--f-mono); font-size: var(--t-sm); }
  .ai-note { margin: 0; }
  .sendto { display: flex; flex-wrap: wrap; gap: var(--s-2); padding: var(--s-3); border-radius: var(--r-ctl); background: var(--sunken); }
  .refine { display: grid; gap: var(--s-2); border-top: 1px solid var(--line); padding-top: var(--s-3); }
  .refine h3 { margin: 0; font-size: var(--t-md); }
  .chips { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .chips .chip { min-height: 36px; cursor: pointer; font: inherit; font-size: var(--t-sm); }
  .chips .chip:hover { border-color: var(--gold-strong); }
  .ask .input { flex: 1 1 14rem; }
  .present { position: fixed; inset: 0; z-index: 60; background: var(--card); color: var(--ink); display: grid; grid-template-rows: auto 1fr; }
  .pbar { display: flex; flex-wrap: wrap; gap: var(--s-2); justify-content: flex-end; padding: var(--s-2) var(--s-3); border-bottom: 1px solid var(--line); }
  .pbody { overflow: auto; padding: var(--s-6) clamp(var(--s-4), 6vw, var(--s-16)); line-height: 1.5; }
  .cat-plan { --tile-bg: var(--gold-soft); --tile-ink: var(--gold); }
  .cat-create { --tile-bg: var(--main); --tile-ink: var(--main-ink); }
  .cat-assess { --tile-bg: var(--comp); --tile-ink: var(--comp-ink); }
  .cat-support { --tile-bg: var(--tint-green); --tile-ink: var(--tint-green-ink); }
  .cat-classroom { --tile-bg: var(--sunken); --tile-ink: var(--navy-2); }
  .cat-fun { --tile-bg: var(--tint-rose); --tile-ink: var(--tint-rose-ink); }
  .cat-write { --tile-bg: var(--tint-purple); --tile-ink: var(--tint-purple-ink); }
  @media print {
    .studio { display: block; }
    .head .tile { display: none; }
    .head p { display: none; }
    .layout { display: block; }
    .result { border: 0; box-shadow: none; padding: 0; min-height: 0; }
    .doc { color: #000; }
  }
</style>
