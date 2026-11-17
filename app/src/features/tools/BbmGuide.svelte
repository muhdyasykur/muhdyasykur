<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { BBM, type BbmUse } from '../../lib/recommend/bbm';
  import BbmCard from './BbmCard.svelte';
  let q = $state(''); let use = $state<BbmUse | 'all'>('all'); let quick = $state(false);
  const USES: [BbmUse | 'all', string][] = [['all', tr('All')], ['vocabulary', tr('Vocabulary')], ['sentences', tr('Sentences')], ['phonics', tr('Phonics')], ['story', tr('Stories')], ['speaking', tr('Speaking')], ['reading', tr('Reading')], ['writing', tr('Writing')], ['assessment', tr('Assessment')], ['game', tr('Games')], ['movement', tr('Movement')]];
  const list = $derived(BBM.filter((b) => (use === 'all' || b.uses.includes(use)) && (!quick || b.minutes <= 10) && (!q.trim() || (b.name + b.ms + b.what).toLowerCase().includes(q.trim().toLowerCase()))));
</script>
<div class="stack">
  <p class="muted">{tr('Cheap teaching aids (bahan bantu mengajar) you can make from things at a kedai runcit or the school store. Tap one for what you need, how to make it and how to use it.')}</p>
  <div class="row"><input id="bbm-q" class="input grow" type="search" bind:value={q} placeholder={tr('Search: flashcards, dice, puppet…')} aria-label={tr('Search teaching aids')} />
    <label class="row small"><input type="checkbox" bind:checked={quick} />{tr('Ready in 10 minutes or less')}</label></div>
  <div class="chips" role="group" aria-label={tr('Use')}>{#each USES as [v, t]}<button type="button" class="chip pick" aria-pressed={use === v} onclick={() => (use = v)}>{t}</button>{/each}</div>
  <div class="grid">{#each list as b (b.id)}<BbmCard {b} />{/each}</div>
  {#if !list.length}<p class="muted">{tr('Nothing matches. Try another word.')}</p>{/if}
</div>
<style>
  .grow { flex: 1; min-width: 200px; }

  .pick { cursor: pointer; min-height: 36px; padding: 0 var(--s-3); border: 1px solid var(--line); background: var(--card); font: 600 var(--t-sm) var(--f-body); color: var(--ink-2); }
  .pick[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: var(--s-3); align-items: start; }
</style>
