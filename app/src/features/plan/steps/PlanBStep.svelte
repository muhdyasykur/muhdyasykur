<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Lesson, PlanB } from '../../../lib/lesson/model';
  import { suggestPlanB, fillPlanB } from '../../../lib/lesson/planb';
  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  let note = $state('');
  function fill() { const n = fillPlanB(lesson); note = n ? tr('{n} card{x} filled from your lesson. Edit them to fit your class.', { n, x: n > 1 ? 's' : '' }) : tr('Every card already has your own plan.'); }
  function one(k: keyof PlanB) { lesson.planB[k] = suggestPlanB(lesson)[k]; }
  const cards: { k: keyof PlanB; title: string; hint: string }[] = [
    { k: 'early', title: tr('Finished early'), hint: tr('An extension task, usually the High tier of your production or post activity.') },
    { k: 'late', title: tr('Running late'), hint: tr('Which step will you shorten or set as homework? Keep the Post-lesson.') },
    { k: 'offline', title: tr('No internet or power'), hint: tr('A board, printed or spoken version of every slide, video or online game.') },
    { k: 'noisy', title: tr('Class too noisy'), hint: tr('Your attention signal and a quieter interaction pattern (pairs or individual).') },
    { k: 'absent', title: tr('Many pupils absent'), hint: tr('How you will regroup and what absent pupils catch up on.') }
  ];
</script>

<div class="stack">
  <p class="muted">{tr('Five ready answers to the "what ifs" that ruined Practicum 1 lessons. Consilia suggests each one from your lesson: the High tier, the longest stage, the online resources you listed.')}</p>
  <div class="row"><button id="pb-fill" class="btn btn-primary" type="button" onclick={fill}>{tr('Suggest for empty cards')}</button>{#if note}<span class="muted small" role="status">{note}</span>{/if}</div>
  <div class="grid">
    {#each cards as c}
      <div class="card field"><label class="field"><span class="t">{c.title}</span><small class="muted">{c.hint}</small><textarea class="input ta" rows="4" bind:value={lesson.planB[c.k]} data-planb={c.k}></textarea></label>
        <button class="btn btn-text sug" type="button" onclick={() => one(c.k)}>{lesson.planB[c.k].trim() ? tr('Replace with suggestion') : tr('Suggest')}</button></div>
    {/each}
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: var(--s-3); }
  .t { font: 700 var(--t-md) var(--f-display); }
  small { font-size: var(--t-xs); }
  .small { font-size: var(--t-sm); }
  .sug { justify-self: start; }
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); resize: vertical; }
</style>
