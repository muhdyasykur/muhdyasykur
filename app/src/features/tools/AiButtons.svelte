<script lang="ts">
  import { AI_SITES } from '../../lib/recommend/prompts';
  /** Copy a prompt, then open the AI the teacher prefers. Consilia itself sends nothing. */
  let { prompt, label = 'Improve with AI' }: { prompt: string; label?: string } = $props();
  let msg = $state('');
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); msg = 'Prompt copied. Open an AI below and paste it (long-press → Paste).'; }
    catch { msg = 'Select the prompt text below and copy it.'; }
  }
</script>
<div class="ai stack tight">
  <div class="row"><button class="btn btn-primary ai-copy" type="button" onclick={copy}>🤖 {label}: copy prompt</button>
    {#each AI_SITES as s}<a class="btn btn-outline" href={s.url} target="_blank" rel="noopener">{s.name}</a>{/each}</div>
  {#if msg}<p class="muted small" role="status">{msg}</p>{/if}
  <details><summary class="small">See the prompt</summary><textarea class="input ta" rows="8" readonly value={prompt} aria-label="AI prompt"></textarea></details>
  <p class="muted small">AI answers can be wrong. Check them before using them with pupils, and never paste pupils' names.</p>
</div>
<style>.tight { gap: var(--s-2); } .small { font-size: var(--t-sm); } .ta { width: 100%; font-size: var(--t-sm); } summary { cursor: pointer; min-height: 32px; display: flex; align-items: center; }</style>
