<script lang="ts">
  import type { Lesson } from '../../../lib/lesson/model';
  import { profile } from '../../../lib/profile.svelte';
  import { alignment, smartFor } from '../../../lib/lesson/derive';
  import { checkTiming } from '../../../lib/lesson/frameworks';
  import RphSchool from '../print/RphSchool.svelte';
  import RphBlueprint from '../print/RphBlueprint.svelte';

  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  const KEY = 'consilia.layout';
  let layout = $state<'school' | 'blueprint'>((() => { try { return localStorage.getItem(KEY) === 'blueprint' ? 'blueprint' : 'school'; } catch { return 'school'; } })());
  $effect(() => { try { localStorage.setItem(KEY, layout); } catch { /* ignore */ } });

  // A short readiness list. The full 29-rule alignment checker and score arrive in milestone 3.
  const todo = $derived.by(() => {
    const t: string[] = [];
    if (!lesson.topic) t.push('Add a topic (Setup).');
    if (!lesson.standards.main.ls.length) t.push('Choose the main Learning Standard (Standards).');
    if (!lesson.standards.comp.ls.length) t.push('Choose a complementary Learning Standard (Standards).');
    for (const o of lesson.objectives) { const bad = smartFor(lesson, o).filter((s) => !s.ok).map((s) => s.letter); if (bad.length) t.push(`Objective ${o.role === 'main' ? 'M' : 'C'}: fix ${bad.join(', ')} (Objectives).`); }
    for (const i of checkTiming(lesson.stages, lesson.header.durationMin)) if (i.level === 'error') t.push(i.message + ' (Lesson flow)');
    for (const r of alignment(lesson)) if (!r.ok) t.push(`LS ${r.ls}: ${r.problem.toLowerCase()}.`);
    return t;
  });
</script>

<div class="stack">
  <div class="no-print stack">
    <div class="row between">
      <div class="seg" role="group" aria-label="Layout">
        <button type="button" aria-pressed={layout === 'school'} onclick={() => (layout = 'school')}>School template</button>
        <button type="button" aria-pressed={layout === 'blueprint'} onclick={() => (layout = 'blueprint')}>Consilia Lesson Blueprint</button>
      </div>
      <div class="row">
        <label class="row small"><input id="rv-ready" type="checkbox" checked={lesson.status !== 'draft'} onchange={(e) => (lesson.status = e.currentTarget.checked ? 'ready' : 'draft')} />Mark as ready</label>
        <button id="rv-print" class="btn btn-gold" type="button" onclick={() => window.print()}>Print or save as PDF</button>
      </div>
    </div>
    {#if todo.length}
      <details class="card todo" open={todo.length <= 6}>
        <summary><b>{todo.length} thing{todo.length === 1 ? '' : 's'} to finish before you submit</b></summary>
        <ul>{#each todo as t}<li>{t}</li>{/each}</ul>
      </details>
    {:else}
      <p class="card ok">Every standard has an objective, every objective is SMART, and the timing adds up.</p>
    {/if}
    <p class="muted small">In the print dialog choose A4 and "Save as PDF" to get a file. Turn on "Background graphics" to keep the colours.</p>
  </div>
  <div class="paper-wrap">
    {#if layout === 'school'}<RphSchool {lesson} profile={profile.value} />{:else}<RphBlueprint {lesson} profile={profile.value} />{/if}
  </div>
</div>

<style>
  .between { justify-content: space-between; }
  .small { font-size: var(--t-sm); }
  .todo ul { margin: var(--s-2) 0 0; padding-left: 1.2em; display: grid; gap: 2px; font-size: var(--t-sm); }
  .todo summary { cursor: pointer; }
  .ok { color: var(--ok); font-weight: 600; }
  .paper-wrap { overflow-x: auto; background: var(--sunken); border-radius: var(--r-card); padding: var(--s-4); }
  @media print { .paper-wrap { overflow: visible; background: none; padding: 0; } }
</style>
