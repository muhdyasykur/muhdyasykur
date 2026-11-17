<script lang="ts">
  import { tr, i18n } from '../../lib/i18n/index.svelte';
  import type { Bbm } from '../../lib/recommend/bbm';
  import BbmPic from '../../lib/ui/BbmPic.svelte';
  import { href } from '../../router.svelte';
  /** One teaching aid: picture, what it is, and (open) how to make and use it, step by step. */
  let { b, open = false, compact = false }: { b: Bbm; open?: boolean; compact?: boolean } = $props();
</script>
<details class="card bbm" {open} data-bbm={b.id}>
  <summary>
    <BbmPic id={b.id} label={b.name} size={compact ? 84 : 110} />
    <span class="txt">{#if i18n.locale === 'ms'}<b lang="ms">{b.ms}</b><span class="muted small"><i lang="en">{b.name}</i> {tr('· {minutes} min to make · {cost}', { minutes: b.minutes, cost: tr(b.cost) })}</span>{:else}<b>{b.name}</b><span class="muted small"><i lang="ms">{b.ms}</i> {tr('· {minutes} min to make · {cost}', { minutes: b.minutes, cost: tr(b.cost) })}</span>{/if}{#if !compact}<span class="small">{tr(b.what)}</span>{/if}</span>
  </summary>
  <div class="body stack tight">
    <div><h4>{tr('You need')}</h4><ul>{#each b.materials as m}<li>{tr(m)}</li>{/each}</ul></div>
    <div><h4>{tr('How to make it')}</h4><ol>{#each b.steps as s}<li>{tr(s)}</li>{/each}</ol></div>
    <div><h4>{tr('How to use it in class')}</h4><ul>{#each b.use as s}<li>{tr(s)}</li>{/each}</ul></div>
    <p class="tip small">💡 {tr(b.tip)}</p>
    {#if b.safety}<p class="safe small">⚠️ {tr(b.safety)}</p>{/if}
    {#if b.printable}<a class="btn btn-outline print" href={href('tools', 'worksheets')}>{tr('Print a template in the Worksheet maker')}</a>{/if}
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
