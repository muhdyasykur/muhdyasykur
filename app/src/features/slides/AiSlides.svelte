<script lang="ts">
  import { href } from '../../router.svelte';
  import type { Lesson } from '../../lib/lesson/model';
  import { mergeAi, type Deck } from '../../lib/slides/deck';
  import { generate, slidePrompt, parseSlideContent, SLIDE_SCHEMA, AiError, type SlidePart } from '../../lib/ai/gemini';
  import { ai, aiReady } from '../../lib/ai/settings.svelte';
  import { pwa } from '../../lib/pwa.svelte';
  import AiButtons from '../tools/AiButtons.svelte';

  /**
   * Extra slide content from AI: a reading or listening text, a dialogue, word meanings, more examples and questions.
   * With Cloud AI on, Gemini writes it here; otherwise the teacher copies the prompt to any AI chat and pastes the answer.
   * AI slides are marked "AI" so the teacher checks them, and can be removed in one tap.
   */
  let { lesson, deck = $bindable(), onchange }: { lesson: Lesson; deck: Deck; onchange: () => void } = $props();
  const PARTS: [SlidePart, string][] = [['text', 'Reading or listening text'], ['dialogue', 'Dialogue'], ['questions', 'Questions with answers'], ['vocabulary', 'Word meanings'], ['examples', 'More example sentences']];
  let parts = $state<SlidePart[]>(['text', 'dialogue', 'questions']);
  let busy = $state(false);
  let msg = $state('');
  let err = $state('');
  let pasted = $state('');
  const prompt = $derived(slidePrompt(lesson, parts));
  const aiCount = $derived(deck.slides.filter((s) => s.ai).length);
  // the copy-and-paste route asks for the JSON shape in words
  const chatPrompt = $derived(prompt + '\nAnswer with one JSON object only, with the keys vocabulary [{word, meaning}], examples [..], text {title, body}, dialogue [..], questions [{q, a}].');

  function apply(raw: string, only?: SlidePart[]) {
    const c = parseSlideContent(raw);
    if (only) for (const k of Object.keys(c) as SlidePart[]) if (!only.includes(k)) delete c[k];
    const before = deck.slides.length - aiCount;
    deck = mergeAi(deck, c);
    const added = deck.slides.length - before;
    if (!added) { err = 'The answer had nothing to add. Try again or tick other parts.'; return; }
    msg = `Added ${added} AI slide${added === 1 ? '' : 's'}, marked "AI". Read them before the lesson: AI can make mistakes.`; err = '';
    onchange();
  }
  async function run() {
    busy = true; msg = ''; err = '';
    try { apply(await generate(ai, prompt, SLIDE_SCHEMA), [...parts]); }
    catch (e) { err = e instanceof AiError ? e.message : 'The AI request did not work. Try again.'; }
    busy = false;
  }
  function usePasted() { try { apply(pasted); pasted = ''; } catch (e) { err = e instanceof AiError ? e.message : 'That answer could not be read.'; } }
  function removeAi() { deck = { ...deck, slides: deck.slides.filter((s) => !s.ai), aiAt: undefined }; msg = 'AI slides removed.'; onchange(); }
</script>

<section class="card stack aibox" aria-labelledby="ai-h">
  <h2 id="ai-h">✨ Add more with AI <span class="chip">optional</span></h2>
  <p class="muted small">Adds a short reading or listening text, a dialogue, questions and more at Year {lesson.curriculum.year} level, placed in the right part of the deck. Only the lesson's topic, key words, target sentence and objectives are used: never pupils' names.</p>
  <fieldset class="row parts"><legend class="sr-only">What to add</legend>
    {#each PARTS as [k, label]}<label class="row tick"><input type="checkbox" value={k} bind:group={parts} />{label}</label>{/each}
  </fieldset>
  {#if aiReady()}
    <div class="row">
      <button class="btn btn-gold" type="button" onclick={run} disabled={busy || !parts.length || !pwa.online} id="ai-run">{busy ? 'Asking Gemini…' : 'Add with Gemini'}</button>
      {#if aiCount}<button class="btn btn-text" type="button" onclick={removeAi} id="ai-remove">Remove {aiCount} AI slide{aiCount === 1 ? '' : 's'}</button>{/if}
      <a class="btn btn-text" href={href('me', 'ai')}>Cloud AI settings</a>
    </div>
    {#if !pwa.online}<p class="muted small">You are offline. Cloud AI needs the internet; everything else on this page works offline.</p>{/if}
    <details><summary class="small">What is sent to Google</summary><pre class="sent">{prompt}</pre></details>
  {:else}
    <p class="small"><a href={href('me', 'ai')} id="ai-setup">Turn on Cloud AI</a> with your own free Google Gemini key to do this in one tap, or use any AI chat:</p>
    <AiButtons prompt={chatPrompt} label="Slide content" />
    <label class="field">Paste the AI's answer here
      <textarea class="input" rows="4" bind:value={pasted} id="ai-paste" placeholder={'{ "text": { "title": "…", "body": "…" }, "dialogue": ["A: …", "B: …"], … }'}></textarea></label>
    <div class="row">
      <button class="btn btn-outline" type="button" onclick={usePasted} disabled={!pasted.trim()} id="ai-paste-use">Add to my slides</button>
      {#if aiCount}<button class="btn btn-text" type="button" onclick={removeAi} id="ai-remove">Remove {aiCount} AI slide{aiCount === 1 ? '' : 's'}</button>{/if}
    </div>
  {/if}
  {#if msg}<p class="small ok" role="status" id="ai-msg">{msg}</p>{/if}
  {#if err}<p class="small bad" role="alert" id="ai-err">{err}</p>{/if}
</section>

<style>
  .aibox h2 { display: flex; gap: var(--s-2); align-items: center; font-size: var(--t-lg); }
  .small { font-size: var(--t-sm); }
  .parts { border: 0; margin: 0; padding: 0; gap: var(--s-2) var(--s-3); }
  .tick { gap: 6px; min-height: 44px; font-size: var(--t-sm); }
  .tick input { width: 20px; height: 20px; }
  .field { display: grid; gap: 4px; font-weight: 600; font-size: var(--t-sm); }
  .sent { white-space: pre-wrap; font-size: var(--t-xs, 12px); background: var(--paper-2, #f4f5f8); padding: var(--s-2); border-radius: var(--r-1, 6px); max-height: 14rem; overflow: auto; }
  summary { cursor: pointer; min-height: 44px; display: flex; align-items: center; }
  .ok { color: var(--ok, #2e7d4f); }
  .bad { color: var(--bad); }
</style>
