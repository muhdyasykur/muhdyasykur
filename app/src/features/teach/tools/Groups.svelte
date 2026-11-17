<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import { makeGroups, groupCount } from '../../../lib/classroom/groups';
  import { TIER_ICON, type TeachPupil } from '../types';

  let { pupils, groups = $bindable([]), onsave }: { pupils: TeachPupil[]; groups?: string[][]; onsave?: (g: string[][]) => void } = $props();
  let size = $state(4);
  let mode = $state<'mixed' | 'tier'>('mixed');
  let broken = $state<string[]>([]);
  const name = (id: string) => pupils.find((p) => p.id === id);
  const colours = ['#13294B', '#1F6F63', '#8A6A12', '#6B4FB3', '#2B4E86', '#A23B3B', '#3E6B2E', '#5B6B8C'];

  function make() {
    const r = makeGroups(pupils.map((p) => ({ id: p.id, tier: p.tier, keepApart: p.keepApart, keepTogether: p.keepTogether })), mode === 'tier' ? Math.max(groupCount(pupils.length, size), 3) : groupCount(pupils.length, size), mode);
    groups = r.groups;
    broken = r.broken.map((b) => `${name(b.a)?.name} and ${name(b.b)?.name} ${b.kind === 'apart' ? tr('had to share a group') : tr('could not be kept together')}`);
    onsave?.(groups);
  }
  const live = $derived(groups.map((g) => g.filter((id) => name(id))).filter((g) => g.length));
</script>

<div class="stack">
  <div class="row controls">
    <label class="field"><span>{tr('Group size: {size}', { size })}</span><input id="grp-size" type="range" min="2" max="8" bind:value={size} /></label>
    <div class="seg" role="group" aria-label={tr('Grouping')}>
      <button type="button" aria-pressed={mode === 'mixed'} onclick={() => (mode = 'mixed')}>{tr('Mixed ability')}</button>
      <button type="button" aria-pressed={mode === 'tier'} onclick={() => (mode = 'tier')}>{tr('By level')}</button>
    </div>
    <button id="grp-make" class="btn btn-gold" type="button" onclick={make} disabled={pupils.length < 2}>{live.length ? tr('Make new groups') : tr('Make groups')}</button>
  </div>
  <p class="muted small">{tr('Absent pupils are left out. Keep-apart and keep-together pairs from the class list are respected.')}</p>
  {#each broken as b}<p class="warn" role="status">{tr('{b}. There were too many pairs for this number of groups.', { b })}</p>{/each}
  <div class="groups">
    {#each live as g, i}
      <section class="g" style="--c:{colours[i % colours.length]}">
        <h4>{tr('Group {x}', { x: i + 1 })}</h4>
        <ul>{#each g as id}{@const p = name(id)}<li class="pupil-font"><span class="t" title={p?.tier}>{p ? TIER_ICON[p.tier] : ''}</span>{p?.name}</li>{/each}</ul>
      </section>
    {/each}
  </div>
</div>

<style>
  .controls { align-items: end; gap: var(--s-4); }
  .controls .field { min-width: 180px; }
  .small { font-size: var(--t-sm); }
  .warn { color: var(--warn); font-weight: 600; font-size: var(--t-sm); }
  .groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }
  .g { border-radius: var(--r-card); border: 2px solid var(--c); background: var(--card); overflow: hidden; }
  .g h4 { background: var(--c); color: #fff; padding: 6px 12px; font-size: var(--t-md); }
  .g ul { list-style: none; margin: 0; padding: var(--s-2) var(--s-3); display: grid; gap: 4px; font-size: 1.15rem; }
  .t { display: inline-block; width: 1.5em; }
</style>
