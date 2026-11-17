<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { getLesson, saveLesson } from '../../lib/db/repo';
  import { loadStandards, loadSow } from '../../lib/curriculum/loader';
  import type { Lesson } from '../../lib/lesson/model';
  import type { Standards, SowFile } from '../../lib/curriculum/types';
  import Icon from '../../lib/ui/Icon.svelte';
  import ScoreRing from '../../lib/ui/ScoreRing.svelte';
  import { runChecks } from '../../lib/lesson/checker';
  import { confetti } from '../../lib/ui/confetti';
  import SetupStep from './steps/SetupStep.svelte';
  import StandardsStep from './steps/StandardsStep.svelte';
  import ObjectivesStep from './steps/ObjectivesStep.svelte';
  import FlowStep from './steps/FlowStep.svelte';
  import MaterialsStep from './steps/MaterialsStep.svelte';
  import PlanBStep from './steps/PlanBStep.svelte';
  import ReviewStep from './steps/ReviewStep.svelte';
  import StepTools from './StepTools.svelte';

  let { id, step }: { id: string; step: string } = $props();
  const STEPS = [
    { key: 'setup', label: tr('Setup') }, { key: 'standards', label: tr('Standards') }, { key: 'objectives', label: tr('Objectives') },
    { key: 'flow', label: tr('Lesson flow') }, { key: 'materials', label: tr('Materials') }, { key: 'planb', label: tr('Plan B') }, { key: 'review', label: tr('Review & print') }
  ];
  let lesson = $state<Lesson | null>(null);
  let standards = $state<Standards | null>(null);
  let sow = $state<SowFile | null>(null);
  let missing = $state(false);
  let saved = $state<'saved' | 'saving' | 'error'>('saved');
  let loadedId = '';

  $effect(() => {
    const want = id;
    if (want === loadedId) return;
    loadedId = want;
    getLesson(want).then(async (l) => {
      if (!l) { missing = true; return; }
      l.checkNotes ??= {};
      lesson = l;
      [standards, sow] = await Promise.all([loadStandards(l.curriculum.year, l.curriculum.school), loadSow(l.curriculum.year, l.curriculum.school)]);
    });
  });

  // Autosave: 600 ms after the last change.
  let timer: ReturnType<typeof setTimeout> | undefined;
  let first = true;
  $effect(() => {
    if (!lesson) return;
    const snap = $state.snapshot(lesson) as Lesson;
    JSON.stringify(snap); // track every field
    if (first) { first = false; return; }
    saved = 'saving';
    clearTimeout(timer);
    timer = setTimeout(() => saveLesson(snap).then(() => (saved = 'saved')).catch(() => (saved = 'error')), 600);
  });
  // Save at once if the page is hidden or closed mid-edit.
  $effect(() => {
    const flush = () => { if (lesson && saved === 'saving') { clearTimeout(timer); saveLesson($state.snapshot(lesson) as Lesson); } };
    document.addEventListener('visibilitychange', flush);
    return () => { flush(); document.removeEventListener('visibilitychange', flush); };
  });

  const idx = $derived(Math.max(0, STEPS.findIndex((s) => s.key === step)));
  const cur = $derived(STEPS[idx]);
  const report = $derived(lesson ? runChecks(lesson) : { score: 0, failing: [] });
  // a small celebration the first time a lesson reaches 100
  let lastScore = -1;
  $effect(() => {
    const s = report.score, l = lesson;
    if (!l) return;
    if (s === 100 && lastScore >= 0 && lastScore < 100) {
      const KEY = 'consilia.celebrated';
      try { const done: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]'); if (!done.includes(l.id)) { confetti(); localStorage.setItem(KEY, JSON.stringify([...done, l.id].slice(-300))); } } catch { /* ignore */ }
    }
    lastScore = s;
  });
  // keep the current step visible in the step bar on narrow screens
  $effect(() => { void idx; queueMicrotask(() => document.querySelector('.steps [aria-current="step"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })); });
</script>

{#if missing}
  <div class="stack"><a class="btn btn-text" href={href('plan')}><Icon name="back" size={18} />{tr('Plan')}</a><p class="empty">{tr('This lesson plan no longer exists.')}</p></div>
{:else if lesson && standards && sow}
<div class="stack builder">
  <div class="no-print bar">
    <a class="btn btn-text" href={href('plan')}><Icon name="back" size={18} />{tr('Plan')}</a>
    <a class="btn btn-gold teachbtn" href={href('teach', lesson.id)}>{tr('▶ Teach')}</a>
    <span class="save" role="status">{saved === 'saving' ? tr('Saving…') : saved === 'error' ? tr('Not saved. Check storage space.') : tr('Saved on this device')}</span>
  </div>
  <header class="no-print head">
    <div>
    <p class="eyebrow">{tr('Year {year} {school}{x}{x2}', { year: lesson.curriculum.year, school: lesson.curriculum.school, x: lesson.curriculum.sowLesson ? tr(' · SoW lesson {sowLesson}', { sowLesson: lesson.curriculum.sowLesson }) : '', x2: lesson.header.className ? ` · ${lesson.header.className}` : '' })}</p>
    <h1>{lesson.topic || tr('Untitled lesson')}</h1>
    </div>
    <a class="score" href={href('plan', 'edit', lesson.id, 'review')} title={tr('See what to fix')}><ScoreRing score={report.score} /><span>{report.failing.length ? tr('{length} to fix', { length: report.failing.length }) : tr('Aligned')}</span></a>
  </header>
  <nav class="steps no-print" aria-label={tr('Builder steps')}>
    <ol>
      {#each STEPS as s, i}
        <li><a href={href('plan', 'edit', lesson.id, s.key)} aria-current={i === idx ? 'step' : undefined}><span class="n">{i + 1}</span>{s.label}</a></li>
      {/each}
    </ol>
  </nav>

  <section aria-label={cur.label}>
    {#if cur.key === 'setup'}<SetupStep bind:lesson />
    {:else if cur.key === 'standards'}<StandardsStep bind:lesson {standards} />
    {:else if cur.key === 'objectives'}<ObjectivesStep bind:lesson />
    {:else if cur.key === 'flow'}<FlowStep bind:lesson support={sow.support} />
    {:else if cur.key === 'materials'}<MaterialsStep bind:lesson />
    {:else if cur.key === 'planb'}<PlanBStep bind:lesson />
    {:else}<ReviewStep bind:lesson />{/if}
  </section>

  <StepTools {lesson} step={cur.key} />

  <div class="row nav no-print">
    {#if idx > 0}<a class="btn btn-outline" href={href('plan', 'edit', lesson.id, STEPS[idx - 1].key)}><Icon name="back" size={18} />{STEPS[idx - 1].label}</a>{/if}
    {#if idx < STEPS.length - 1}<a class="btn btn-primary next" href={href('plan', 'edit', lesson.id, STEPS[idx + 1].key)}>{STEPS[idx + 1].label}<Icon name="chevron" size={18} /></a>{/if}
  </div>
</div>
{:else}
  <p class="muted">{tr('Loading…')}</p>
{/if}

<style>
  .bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--s-2); }
  .head { display: flex; justify-content: space-between; align-items: center; gap: var(--s-4); }
  .score { display: grid; justify-items: center; gap: 2px; text-decoration: none; color: var(--ink-2); font-size: var(--t-xs); font-weight: 600; }
  .save { font-size: var(--t-xs); color: var(--ink-3); }
  .steps { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--paper); margin: 0 calc(-1 * var(--s-2)); padding: var(--s-2); overflow-x: auto; }
  .steps ol { list-style: none; margin: 0; padding: 0; display: flex; gap: var(--s-1); }
  .steps a { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; padding: 6px 12px 6px 6px; border-radius: 99px; text-decoration: none; color: var(--ink-2); font-weight: 600; font-size: var(--t-sm); border: 1px solid var(--line); background: var(--card); min-height: 40px; }
  .steps .n { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--sunken); font-size: var(--t-xs); }
  .steps a[aria-current='step'] { border-color: var(--navy); color: var(--ink); }
  .steps a[aria-current='step'] .n { background: var(--navy); color: var(--on-navy); }
  .nav { justify-content: space-between; border-top: 1px solid var(--line); padding-top: var(--s-4); }
  .next { margin-left: auto; }
</style>
