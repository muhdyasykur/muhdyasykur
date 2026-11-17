<script lang="ts">
  import Icon from '../../lib/ui/Icon.svelte';
  import { tr } from '../../lib/i18n/index.svelte';
  import { AI_SITES } from '../../lib/recommend/prompts';
  import { aiReady, aiName } from '../../lib/ai/settings.svelte';
  import { askText } from '../../lib/ai/ask';
  import { AiError } from '../../lib/ai/common';
  import { pwa } from '../../lib/pwa.svelte';
  import { href } from '../../router.svelte';
  /** Copy a prompt, then open the AI the teacher prefers; or, with the AI assistant on, get the answer right here. */
  let { prompt, label = tr('Improve with AI') }: { prompt: string; label?: string } = $props();
  let msg = $state('');
  let answer = $state(''); let busy = $state(false); let err = $state(''); let copiedAns = $state('');
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); msg = tr('Prompt copied. Open an AI below and paste it (long-press → Paste).'); }
    catch { msg = tr('Select the prompt text below and copy it.'); }
  }
  async function run() {
    busy = true; err = ''; answer = '';
    try { answer = (await askText(prompt)).trim(); } catch (e) { err = e instanceof AiError ? e.message : tr('The AI request did not work. Try again.'); }
    busy = false;
  }
  async function copyAnswer() { try { await navigator.clipboard.writeText(answer); copiedAns = tr('Copied.'); } catch { copiedAns = tr('Select the text and copy it.'); } }
</script>
<div class="ai stack tight">
  {#if aiReady()}
    <div class="row"><button class="btn btn-gold ai-run" type="button" onclick={run} disabled={busy || !pwa.online}>{#if !busy}<Icon name="sparkle" size={18} />{/if}{busy ? tr('Asking {aiName}…', { aiName: aiName() }) : tr('{label}: ask {aiName} here', { label, aiName: aiName() })}</button>
      {#if !pwa.online}<span class="muted small">{tr('Needs the internet.')}</span>{/if}</div>
    {#if err}<p class="small bad" role="alert">{err}</p>{/if}
    {#if answer}
      <div class="answer card" aria-live="polite"><p class="eyebrow">{tr('{x}\'s answer · check it before using it', { x: aiName() })}</p><div class="out">{answer}</div>
        <div class="row"><button class="btn btn-outline" type="button" onclick={copyAnswer}>{tr('Copy the answer')}</button><button class="btn btn-text" type="button" onclick={run} disabled={busy}>{tr('Try again')}</button>{#if copiedAns}<span class="muted small" role="status">{copiedAns}</span>{/if}</div></div>
    {/if}
  {/if}
  <div class="row"><button class="btn btn-primary ai-copy" type="button" onclick={copy}><Icon name="prompt" size={18} />{tr('{label}: copy prompt', { label })}</button>
    {#each AI_SITES as s}<a class="btn btn-outline" href={s.url} target="_blank" rel="noopener">{s.name}</a>{/each}</div>
  {#if msg}<p class="muted small" role="status">{msg}</p>{/if}
  <details><summary class="small">{tr('See the prompt')}</summary><textarea class="input ta" rows="8" readonly value={prompt} aria-label="AI prompt"></textarea></details>
  <p class="muted small">{tr('AI answers can be wrong. Check them before using them with pupils, and never paste pupils\' names.')}{#if !aiReady()} {tr('Want answers inside Consilia?')} <a href={href('me', 'ai')}>{tr('Connect Claude')}</a> {tr('(optional, your own key).')}{/if}</p>
</div>
<style> .small { font-size: var(--t-sm); } .ta { width: 100%; font-size: var(--t-sm); } summary { cursor: pointer; min-height: 32px; display: flex; align-items: center; }
  .answer { display: grid; gap: var(--s-2); } .out { white-space: pre-wrap; font-size: var(--t-sm); max-height: 24rem; overflow: auto; } .bad { color: var(--bad); }</style>
