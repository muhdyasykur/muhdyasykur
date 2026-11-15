<script lang="ts">
  import type { Lesson, PlanB } from '../../../lib/lesson/model';
  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  const cards: { k: keyof PlanB; title: string; hint: string }[] = [
    { k: 'early', title: 'Finished early', hint: 'An extension task, usually the High tier of your production or post activity.' },
    { k: 'late', title: 'Running late', hint: 'Which step will you shorten or set as homework? Keep the Post-lesson.' },
    { k: 'offline', title: 'No internet or power', hint: 'A board, printed or spoken version of every slide, video or online game.' },
    { k: 'noisy', title: 'Class too noisy', hint: 'Your attention signal and a quieter interaction pattern (pairs or individual).' },
    { k: 'absent', title: 'Many pupils absent', hint: 'How you will regroup and what absent pupils catch up on.' }
  ];
</script>

<div class="stack">
  <p class="muted">Five ready answers to the "what ifs" that ruined Practicum 1 lessons. Automatic suggestions arrive in milestone 3; for now write your own.</p>
  <div class="grid">
    {#each cards as c}
      <label class="card field"><span class="t">{c.title}</span><small class="muted">{c.hint}</small><textarea class="input ta" rows="3" bind:value={lesson.planB[c.k]} data-planb={c.k}></textarea></label>
    {/each}
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: var(--s-3); }
  .t { font: 700 var(--t-md) var(--f-display); }
  small { font-size: var(--t-xs); }
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); resize: vertical; }
</style>
