<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import type { Lesson } from '../../lib/lesson/model';
  import { mergeAi, type Deck } from '../../lib/slides/deck';
  import { slidePrompt, parseSlideContent, AiError, type SlidePart } from '../../lib/ai/common';
  import { askSlides } from '../../lib/ai/ask';
  import { aiReady, aiName } from '../../lib/ai/settings.svelte';
  import { pwa } from '../../lib/pwa.svelte';
  import AiButtons from '../tools/AiButtons.svelte';

  /**
   * Extra slide content from AI: a reading or listening text, a dialogue, word meanings, more examples and questions.
   * With the AI assistant on, Claude (or Gemini) writes it here; otherwise the teacher copies the prompt to any AI chat and pastes the answer.
   * AI slides are marked "AI" so the teacher checks them, and can be removed in one tap.
   */
  let { lesson, deck = $bindable(), onchange }: { lesson: Lesson; deck: Deck; onchange: () => void } = $props();
  const PARTS: [SlidePart, string][] = [['text', tr('Reading or listening text')], ['dialogue', tr('Dialogue')], ['questions', tr('Questions with answers')], ['vocabulary', tr('Word meanings')], ['examples', tr('More example sentences')]];
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
    if (!added) { err = tr('The answer had nothing to add. Try again or tick other parts.'); return; }
    msg = tr('Added {added} AI slide{x}, marked "AI". Read them before the lesson: AI can make mistakes.', { added, x: added === 1 ? '' : 's' }); err = '';
    onchange();
  }
  async function run() {
    busy = true; msg = ''; err = '';
    try { apply(await askSlides(prompt), [...parts]); }
    catch (e) { err = e instanceof AiError ? e.message : tr('The AI request did not work. Try again.'); }
    busy = false;
  }
  function usePasted() { try { apply(pasted); pasted = ''; } catch (e) { err = e instanceof AiError ? e.message : tr('That answer could not be read.'); } }
  function removeAi() { deck = { ...deck, slides: deck.slides.filter((s) => !s.ai), aiAt: undefined }; msg = tr('AI slides removed.'); onchange(); }
</script>

<section class="card stack aibox" aria-labelledby="ai-h">
  <h2 id="ai-h">{tr('✨ Add more with AI')} <span class="chip">{tr('optional')}</span></h2>
  <p class="muted small">{tr('Adds a short reading or listening text, a dialogue, questions and more at Year {year} level, placed in the right part of the deck. Only the lesson\'s topic, key words, target sentence and objectives are used: never pupils\' names.', { year: lesson.curriculum.year })}</p>
  <fieldset class="row parts"><legend class="sr-only">{tr('What to add')}</legend>
    {#each PARTS as [k, label]}<label class="row tick"><input type="checkbox" value={k} bind:group={parts} />{label}</label>{/each}
  </fieldset>
  {#if aiReady()}
    <div class="row">
      <button class="btn btn-gold" type="button" onclick={run} disabled={busy || !parts.length || !pwa.online} id="ai-run">{busy ? tr('Asking {aiName}…', { aiName: aiName() }) : tr('Add with {aiName}', { aiName: aiName() })}</button>
      {#if aiCount}<button class="btn btn-text" type="button" onclick={removeAi} id="ai-remove">{tr('Remove {aiCount} AI slide{x}', { aiCount, x: aiCount === 1 ? '' : 's' })}</button>{/if}
      <a class="btn btn-text" href={href('me', 'ai')}>{tr('AI assistant settings')}</a>
    </div>
    {#if !pwa.online}<p class="muted small">{tr('You are offline. The AI assistant needs the internet; everything else on this page works offline.')}</p>{/if}
    <details><summary class="small">{tr('What is sent to {x}', { x: aiName() === 'Claude' ? tr('Anthropic') : tr('Google') })}</summary><pre class="sent">{prompt}</pre></details>
  {:else}
    <p class="small"><a href={href('me', 'ai')} id="ai-setup">{tr('Connect Claude')}</a> {tr('(or Gemini) with your own key to do this in one tap, or use any AI chat, such as the free Claude.ai:')}</p>
    <AiButtons prompt={chatPrompt} label={tr('Slide content')} />
    <label class="field">{tr('Paste the AI\'s answer here')}
      <textarea class="input" rows="4" bind:value={pasted} id="ai-paste" placeholder={tr('{ "text": { "title": "…", "body": "…" }, "dialogue": ["A: …", "B: …"], … }')}></textarea></label>
    <div class="row">
      <button class="btn btn-outline" type="button" onclick={usePasted} disabled={!pasted.trim()} id="ai-paste-use">{tr('Add to my slides')}</button>
      {#if aiCount}<button class="btn btn-text" type="button" onclick={removeAi} id="ai-remove">{tr('Remove {aiCount} AI slide{x}', { aiCount, x: aiCount === 1 ? '' : 's' })}</button>{/if}
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
