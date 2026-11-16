<script lang="ts">
  import { DIGITAL } from '../../lib/recommend/digital';
  import { href } from '../../router.svelte';
  import { pwa } from '../../lib/pwa.svelte';
  let topic = $state(''); let year = $state(4);
</script>
<div class="stack">
  <div class="row"><label class="field grow"><span>Your topic</span><input id="dt-topic" class="input" bind:value={topic} placeholder="e.g. Where are you from?" /></label>
    <label class="field"><span>Year</span><select class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label></div>
  {#if !pwa.online}<p class="warn" role="status">You are offline. Consilia's own games work now; the other sites open once you are connected.</p>{/if}
  <div class="grid">
    {#each DIGITAL as d (d.id)}
      <article class="card stack tight" data-digital={d.id}>
        <div><b>{d.name}</b> <span class="chip">{d.kind === 'built-in' ? 'Consilia · offline' : d.kind}</span></div>
        <p class="small">{d.what}</p>
        <p class="small"><b>Pupils:</b> {d.pupils}</p>
        <ol class="small">{#each d.setup as s}<li>{s}</li>{/each}</ol>
        <p class="muted small">{d.free}{d.needs.length ? ` · needs ${d.needs.join(', ')}` : ''}</p>
        {#if d.inApp}<a class="btn btn-gold" href={href('tools', 'games', d.inApp)}>Open</a>
        {:else if d.url}<a class="btn btn-outline" href={d.url(topic.trim() || 'english', year)} target="_blank" rel="noopener">Find ready-made {topic.trim() ? `"${topic.trim()}"` : ''} activities</a>{/if}
      </article>
    {/each}
  </div>
  <p class="muted small">Outside sites belong to other companies: preview everything before class, and check adverts on video sites.</p>
</div>
<style>
  .grow { flex: 1; min-width: 220px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: var(--s-3); }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  p, ol { margin: 0; } ol { padding-left: 1.3em; }
  .warn { color: var(--warn); font-weight: 600; }
  .btn { justify-self: start; }
</style>
