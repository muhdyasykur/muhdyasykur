<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { ctx, saveCtx, fromLesson, example, clearCtx, hasCtx } from '../../lib/tools/context.svelte';
  import { listLessons } from '../../lib/db/repo';
  import type { Lesson } from '../../lib/lesson/model';
  import { href } from '../../router.svelte';

  /** "Working on" bar at the top of every tool: say the lesson once, every tool fills itself in. */
  let { compact = false }: { compact?: boolean } = $props();
  let lessons = $state<Lesson[]>([]);
  let editing = $state(false);
  $effect(() => { listLessons().then((l) => (lessons = l.slice(0, 15))); });
  $effect(() => { void [ctx.year, ctx.skill, ctx.topic, ctx.words, ctx.sentence]; saveCtx(); });
  const empty = $derived(!hasCtx());
  function pick(e: Event) {
    const id = (e.currentTarget as HTMLSelectElement).value;
    const l = lessons.find((x) => x.id === id);
    if (l) { fromLesson(l); editing = false; }
  }
  const SKILLS = ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'];
</script>

<section class="ctx card" class:empty aria-label={tr('The lesson these tools are for')}>
  {#if empty && !editing}
    <div class="stack tight">
      <b>{tr('Which lesson are these tools for?')}</b>
      <span class="muted small">{tr('Say it once: every tool fills in the year, topic and words for you.')}</span>
      <div class="row">
        {#if lessons.length}<button id="ctx-latest" class="btn btn-gold" type="button" onclick={() => fromLesson(lessons[0])}>{tr('Use my latest lesson plan ({x})', { x: lessons[0].topic || 'untitled' })}</button>{/if}
        <button class="btn btn-outline" type="button" onclick={() => (editing = true)}>{tr('Type my topic')}</button>
        <button id="ctx-example" class="btn btn-text" type="button" onclick={example}>{tr('Try an example')}</button>
      </div>
    </div>
  {:else}
    <div class="row between">
      <div class="sum">
        <span class="lbl">{tr('For')}</span>
        <b id="ctx-summary">{tr('Year {year} · {skill}{x}', { year: ctx.year, skill: ctx.skill, x: ctx.topic ? ` · ${ctx.topic}` : '' })}</b>
        {#if ctx.words && !compact}<span class="muted small">{tr('Words: {words}', { words: ctx.words })}</span>{/if}
        {#if ctx.lessonId}<a class="small" href={href('plan', 'edit', ctx.lessonId, 'flow')}>{tr('Open {x}', { x: ctx.lessonLabel || tr('the lesson') })}</a>{/if}
      </div>
      <button id="ctx-change" class="btn btn-outline" type="button" aria-expanded={editing} onclick={() => (editing = !editing)}>{editing ? tr('Done') : tr('Change')}</button>
    </div>
  {/if}
  {#if editing}
    <div class="stack tight edit">
      {#if lessons.length}<label class="field"><span>{tr('Use one of my lesson plans')}</span>
        <select id="ctx-lesson" class="select" onchange={pick} value={ctx.lessonId}>
          <option value="">{tr('Choose a lesson…')}</option>
          {#each lessons as l}<option value={l.id}>{[l.header.date, l.header.className, l.topic || tr('Untitled')].filter(Boolean).join(' · ')}</option>{/each}
        </select></label>{/if}
      <div class="grid">
        <label class="field"><span>{tr('Year')}</span><select class="select" bind:value={ctx.year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>{tr('Year {y}', { y })}</option>{/each}</select></label>
        <label class="field"><span>{tr('Skill')}</span><select class="select" bind:value={ctx.skill}>{#each SKILLS as s}<option>{s}</option>{/each}</select></label>
        <label class="field"><span>{tr('Topic')}</span><input id="ctx-topic" class="input" bind:value={ctx.topic} placeholder={tr('e.g. Healthy habits')} /></label>
        <label class="field"><span>{tr('Key words')}</span><input id="ctx-words" class="input" bind:value={ctx.words} placeholder={tr('e.g. vegetables, water, sleep')} /></label>
        <label class="field"><span>{tr('Target sentence')}</span><input id="ctx-sentence" class="input" bind:value={ctx.sentence} placeholder={tr('e.g. I should … because …')} /></label>
      </div>
      <div class="row"><button class="btn btn-text" type="button" onclick={() => { clearCtx(); editing = true; }}>{tr('Clear')}</button><button class="btn btn-text" type="button" onclick={example}>{tr('Fill an example')}</button></div>
    </div>
  {/if}
</section>

<style>
  .ctx { border-left: 4px solid var(--gold-strong); padding: var(--s-3) var(--s-4); }
  .ctx.empty { background: linear-gradient(135deg, var(--gold-soft), var(--card)); }

  .between { justify-content: space-between; align-items: center; }
  .sum { display: flex; flex-wrap: wrap; gap: 4px var(--s-2); align-items: baseline; min-width: 0; }
  .lbl { font-size: var(--t-xs); text-transform: uppercase; letter-spacing: .1em; color: var(--gold); font-weight: 700; }
  .edit { margin-top: var(--s-3); border-top: 1px solid var(--line); padding-top: var(--s-3); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: var(--s-3); }
</style>
