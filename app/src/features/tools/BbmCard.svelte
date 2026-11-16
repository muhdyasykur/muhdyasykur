<script lang="ts">
  import type { Bbm } from '../../lib/recommend/bbm';
  import BbmPic from '../../lib/ui/BbmPic.svelte';
  import { href } from '../../router.svelte';
  /** One teaching aid: picture, what it is, and (open) how to make and use it, step by step. */
  let { b, open = false, compact = false }: { b: Bbm; open?: boolean; compact?: boolean } = $props();
</script>
<details class="card bbm" {open} data-bbm={b.id}>
  <summary>
    <BbmPic id={b.id} label={b.name} size={compact ? 84 : 110} />
    <span class="txt"><b>{b.name}</b><span class="muted small"><i lang="ms">{b.ms}</i> · {b.minutes} min to make · {b.cost}</span>{#if !compact}<span class="small">{b.what}</span>{/if}</span>
  </summary>
  <div class="body stack tight">
    <div><h4>You need</h4><ul>{#each b.materials as m}<li>{m}</li>{/each}</ul></div>
    <div><h4>How to make it</h4><ol>{#each b.steps as s}<li>{s}</li>{/each}</ol></div>
    <div><h4>How to use it in class</h4><ul>{#each b.use as s}<li>{s}</li>{/each}</ul></div>
    <p class="tip small">💡 {b.tip}</p>
    {#if b.safety}<p class="safe small">⚠️ {b.safety}</p>{/if}
    {#if b.printable}<a class="btn btn-outline print" href={href('tools', 'worksheets')}>Print a template in the Worksheet maker</a>{/if}
  </div>
</details>
<style>
  .bbm summary { display: flex; gap: var(--s-3); align-items: center; cursor: pointer; list-style: none; }
  .bbm summary::-webkit-details-marker { display: none; }
  .txt { display: grid; gap: 2px; }
  .body { padding-top: var(--s-3); }
  h4 { margin: 0 0 4px; font-size: var(--t-sm); text-transform: uppercase; letter-spacing: .06em; color: var(--gold); }
  ul, ol { margin: 0; padding-left: 1.3em; display: grid; gap: 3px; }
  .tight { gap: var(--s-3); }
  .small { font-size: var(--t-sm); }
  .tip, .safe { margin: 0; }
  .safe { color: var(--warn); }
  .print { justify-self: start; }
</style>
