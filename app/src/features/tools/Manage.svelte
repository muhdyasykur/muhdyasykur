<script lang="ts">
  import { routinesFor, type Need } from '../../lib/recommend/manage';
  let needs = $state<Need[]>(['noisy']);
  const NEEDS: [Need, string][] = [['noisy', 'Noisy'], ['energetic', 'Very energetic'], ['shy', 'Shy, quiet'], ['large', 'Large class (30+)'], ['mixed', 'Very mixed ability'], ['sen', 'Pupils with special needs'], ['slow-start', 'Slow to settle after recess'], ['transitions', 'Messy transitions']];
  const plan = $derived(routinesFor(needs));
  const toggle = (n: Need) => (needs = needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n]);
</script>
<div class="stack">
  <div class="chips" role="group" aria-label="What is your class like?">{#each NEEDS as [v, t]}<button type="button" class="chip pick" aria-pressed={needs.includes(v)} data-need={v} onclick={() => toggle(v)}>{t}</button>{/each}</div>
  {#each plan as sec}
    <section class="card stack tight"><h3>{sec.title}</h3><ul>{#each sec.items as it}<li><b>{it[0]}</b> {it[1]}</li>{/each}</ul></section>
  {/each}
  <p class="muted small">Teach every routine on day one, practise it twice, and praise it when you see it. In Teach mode, the Attention, Noise, Timer and Points tools support these routines.</p>
</div>
<style>
  .chips { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .pick { cursor: pointer; min-height: var(--tap); padding: 0 var(--s-3); border: 1px solid var(--line); background: var(--card); font: 600 var(--t-sm) var(--f-body); color: var(--ink-2); }
  .pick[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); }
  h3 { margin: 0; } ul { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; } .tight { gap: var(--s-2); } .small { font-size: var(--t-sm); }
</style>
