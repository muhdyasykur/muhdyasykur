<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { routinesFor, type Need } from '../../lib/recommend/manage';
  let needs = $state<Need[]>(['noisy']);
  const NEEDS: [Need, string][] = [['noisy', tr('Noisy')], ['energetic', tr('Very energetic')], ['shy', tr('Shy, quiet')], ['large', tr('Large class (30+)')], ['mixed', tr('Very mixed ability')], ['sen', tr('Pupils with special needs')], ['slow-start', tr('Slow to settle after recess')], ['transitions', tr('Messy transitions')]];
  const plan = $derived(routinesFor(needs));
  const toggle = (n: Need) => (needs = needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n]);
</script>
<div class="stack">
  <div class="chips" role="group" aria-label={tr('What is your class like?')}>{#each NEEDS as [v, t]}<button type="button" class="chip pick" aria-pressed={needs.includes(v)} data-need={v} onclick={() => toggle(v)}>{t}</button>{/each}</div>
  {#each plan as sec}
    <section class="card stack tight"><h3>{tr(sec.title)}</h3><ul>{#each sec.items as it}<li><b>{tr(it[0])}</b> {tr(it[1])}</li>{/each}</ul></section>
  {/each}
  <p class="muted small">{tr('Teach every routine on day one, practise it twice, and praise it when you see it. In Teach mode, the Attention, Noise, Timer and Points tools support these routines.')}</p>
</div>
<style>
  .pick { cursor: pointer; min-height: var(--tap); padding: 0 var(--s-3); border: 1px solid var(--line); background: var(--card); font: 600 var(--t-sm) var(--f-body); color: var(--ink-2); }
  .pick[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); }
  h3 { margin: 0; } ul { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; } .small { font-size: var(--t-sm); }
</style>
