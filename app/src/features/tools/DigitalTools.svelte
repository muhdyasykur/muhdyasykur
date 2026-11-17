<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { DIGITAL } from '../../lib/recommend/digital';
  import { href } from '../../router.svelte';
  import { pwa } from '../../lib/pwa.svelte';
  import { ctx } from '../../lib/tools/context.svelte';
  const topic = $derived(ctx.topic); const year = $derived(ctx.year);
</script>
<div class="stack">
  {#if !pwa.online}<p class="warn" role="status">{tr('You are offline. Consilia\'s own games work now; the other sites open once you are connected.')}</p>{/if}
  <div class="grid">
    {#each DIGITAL as d (d.id)}
      <article class="card stack tight" data-digital={d.id}>
        <div><b>{tr(d.name)}</b> <span class="chip">{d.kind === 'built-in' ? tr('Consilia · offline') : d.kind}</span></div>
        <p class="small">{tr(d.what)}</p>
        <p class="small"><b>{tr('Pupils:')}</b> {tr(d.pupils)}</p>
        <ol class="small">{#each d.setup as s}<li>{tr(s)}</li>{/each}</ol>
        <p class="muted small">{tr(d.free)}{d.needs.length ? tr(' · needs {x}', { x: d.needs.map((n) => tr(n)).join(', ') }) : ''}</p>
        {#if d.inApp}<a class="btn btn-gold" href={href('tools', 'games', d.inApp)}>{tr('Open')}</a>
        {:else if d.url}<a class="btn btn-outline" href={d.url(topic.trim() || 'english', year)} target="_blank" rel="noopener">{tr('Find ready-made {x} activities', { x: topic.trim() ? `"${topic.trim()}"` : '' })}</a>{/if}
      </article>
    {/each}
  </div>
  <p class="muted small">{tr('Outside sites belong to other companies: preview everything before class, and check adverts on video sites.')}</p>
</div>
<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: var(--s-3); }

  p, ol { margin: 0; } ol { padding-left: 1.3em; }
  .warn { color: var(--warn); font-weight: 600; }
  .btn { justify-self: start; }
</style>
