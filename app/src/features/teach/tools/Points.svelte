<script lang="ts">
  import { ding } from '../../../lib/audio/sfx';
  /** Team points for agreed behaviours: always groups, never individual rankings (blueprint F18). */
  let { teams, points = $bindable([]) }: { teams: string[]; points?: number[] } = $props();
  $effect(() => { if (points.length !== teams.length) points = teams.map((_, i) => points[i] ?? 0); });
  const colours = ['#13294B', '#1F6F63', '#8A6A12', '#6B4FB3', '#2B4E86', '#A23B3B', '#3E6B2E', '#5B6B8C'];
  function add(i: number, d: number) { points[i] = Math.max(0, (points[i] ?? 0) + d); if (d > 0) ding(); }
</script>
<div class="teams">
  {#each teams as t, i}
    <div class="team" style="--c:{colours[i % colours.length]}">
      <b>{t}</b>
      <span class="n" aria-live="polite">{points[i] ?? 0}</span>
      <div class="row"><button class="btn btn-text" type="button" aria-label="Remove a point from {t}" onclick={() => add(i, -1)}>−</button><button class="btn plus" type="button" onclick={() => add(i, 1)}>+1</button></div>
    </div>
  {/each}
</div>
<p class="muted small">Points go to teams for the behaviours you agreed with the class. Make groups first to use them as teams.</p>
<style>
  .teams { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: var(--s-3); }
  .team { display: grid; justify-items: center; gap: var(--s-1); padding: var(--s-3); border-radius: var(--r-card); border: 2px solid var(--c); background: var(--card); }
  .n { font: 800 3rem var(--f-display); color: var(--c); }
  .plus { background: var(--c); color: #fff; min-width: 64px; }
  .small { font-size: var(--t-sm); margin-top: var(--s-2); }
</style>
