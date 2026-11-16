<script lang="ts">
  import { AI_SITES } from '../../lib/recommend/prompts';
  import { ai, aiReady } from '../../lib/ai/settings.svelte';
  import { generate, AiError } from '../../lib/ai/gemini';
  import { pwa } from '../../lib/pwa.svelte';
  import { href } from '../../router.svelte';
  /** Copy a prompt, then open the AI the teacher prefers; or, with Cloud AI on, get the answer right here. */
  let { prompt, label = 'Improve with AI' }: { prompt: string; label?: string } = $props();
  let msg = $state('');
  let answer = $state(''); let busy = $state(false); let err = $state(''); let copiedAns = $state('');
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); msg = 'Prompt copied. Open an AI below and paste it (long-press → Paste).'; }
    catch { msg = 'Select the prompt text below and copy it.'; }
  }
  async function run() {
    busy = true; err = ''; answer = '';
    try { answer = (await generate(ai, prompt)).trim(); } catch (e) { err = e instanceof AiError ? e.message : 'The AI request did not work. Try again.'; }
    busy = false;
  }
  async function copyAnswer() { try { await navigator.clipboard.writeText(answer); copiedAns = 'Copied.'; } catch { copiedAns = 'Select the text and copy it.'; } }
</script>
<div class="ai stack tight">
  {#if aiReady()}
    <div class="row"><button class="btn btn-gold ai-run" type="button" onclick={run} disabled={busy || !pwa.online}>{busy ? 'Asking Gemini…' : `✨ ${label}: ask Gemini here`}</button>
      {#if !pwa.online}<span class="muted small">Needs the internet.</span>{/if}</div>
    {#if err}<p class="small bad" role="alert">{err}</p>{/if}
    {#if answer}
      <div class="answer card" aria-live="polite"><p class="eyebrow">Gemini's answer · check it before using it</p><div class="out">{answer}</div>
        <div class="row"><button class="btn btn-outline" type="button" onclick={copyAnswer}>Copy the answer</button><button class="btn btn-text" type="button" onclick={run} disabled={busy}>Try again</button>{#if copiedAns}<span class="muted small" role="status">{copiedAns}</span>{/if}</div></div>
    {/if}
  {/if}
  <div class="row"><button class="btn btn-primary ai-copy" type="button" onclick={copy}>🤖 {label}: copy prompt</button>
    {#each AI_SITES as s}<a class="btn btn-outline" href={s.url} target="_blank" rel="noopener">{s.name}</a>{/each}</div>
  {#if msg}<p class="muted small" role="status">{msg}</p>{/if}
  <details><summary class="small">See the prompt</summary><textarea class="input ta" rows="8" readonly value={prompt} aria-label="AI prompt"></textarea></details>
  <p class="muted small">AI answers can be wrong. Check them before using them with pupils, and never paste pupils' names.{#if !aiReady()} Want answers inside Consilia? <a href={href('me', 'ai')}>Turn on Cloud AI</a> (optional, free key).{/if}</p>
</div>
<style>.tight { gap: var(--s-2); } .small { font-size: var(--t-sm); } .ta { width: 100%; font-size: var(--t-sm); } summary { cursor: pointer; min-height: 32px; display: flex; align-items: center; }
  .answer { display: grid; gap: var(--s-2); } .out { white-space: pre-wrap; font-size: var(--t-sm); max-height: 24rem; overflow: auto; } .bad { color: var(--bad); }</style>
