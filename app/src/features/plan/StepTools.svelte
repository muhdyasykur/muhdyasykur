<script lang="ts">
  import type { Lesson } from '../../lib/lesson/model';
  import { fromLesson } from '../../lib/tools/context.svelte';
  import { href } from '../../router.svelte';
  /** The tools that help with this builder step, opened already filled with this lesson. */
  let { lesson, step }: { lesson: Lesson; step: string } = $props();
  const BY: Record<string, [string, string, string][]> = {
    objectives: [['objectives', '🎯', 'Objective writer']],
    flow: [['ideas', '💡', 'Activity ideas'], ['differentiate', '🪜', 'Differentiation helper'], ['games', '🎮', 'Classroom games']],
    materials: [['bbm', '✂️', 'BBM guide'], ['games', '🎮', 'Classroom games'], ['chant', '🎵', 'Chant maker'], ['digital', '🌐', 'Digital tools'], ['ai', '🤖', 'AI prompts']],
    planb: [['ideas', '💡', 'Activity ideas']],
    review: [['ai', '🤖', 'Improve with AI']]
  };
  const list = $derived(BY[step] ?? []);
</script>
{#if list.length}
  <aside class="steptools no-print" aria-label="Tools for this step">
    <span class="lbl">🧰 Tools for this step</span>
    {#each list as [id, icon, name]}<a class="chip tool" href={href('tools', id)} data-steptool={id} onclick={() => fromLesson($state.snapshot(lesson) as Lesson)}>{icon} {name}</a>{/each}
    <span class="muted small">They open with this lesson's year, topic and words filled in.</span>
  </aside>
{/if}
<style>
  .steptools { display: flex; flex-wrap: wrap; gap: var(--s-2); align-items: center; padding: var(--s-3); border: 1px dashed var(--gold-strong); border-radius: var(--r-card); background: color-mix(in srgb, var(--gold-soft) 45%, transparent); }
  .lbl { font-weight: 700; font-size: var(--t-sm); }
  .tool { min-height: 40px; display: inline-flex; align-items: center; padding: 0 var(--s-3); text-decoration: none; color: var(--ink); background: var(--card); border: 1px solid var(--line); font-weight: 600; font-size: var(--t-sm); }
  .tool:hover { border-color: var(--gold-strong); }
  .small { font-size: var(--t-xs); flex-basis: 100%; }
</style>
