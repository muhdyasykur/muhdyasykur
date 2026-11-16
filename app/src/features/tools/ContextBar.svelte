<script lang="ts">
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

<section class="ctx card" class:empty aria-label="The lesson these tools are for">
  {#if empty && !editing}
    <div class="stack tight">
      <b>Which lesson are these tools for?</b>
      <span class="muted small">Say it once: every tool fills in the year, topic and words for you.</span>
      <div class="row">
        {#if lessons.length}<button id="ctx-latest" class="btn btn-gold" type="button" onclick={() => fromLesson(lessons[0])}>Use my latest RPH ({lessons[0].topic || 'untitled'})</button>{/if}
        <button class="btn btn-outline" type="button" onclick={() => (editing = true)}>Type my topic</button>
        <button id="ctx-example" class="btn btn-text" type="button" onclick={example}>Try an example</button>
      </div>
    </div>
  {:else}
    <div class="row between">
      <div class="sum">
        <span class="lbl">For</span>
        <b id="ctx-summary">Year {ctx.year} · {ctx.skill}{ctx.topic ? ` · ${ctx.topic}` : ''}</b>
        {#if ctx.words && !compact}<span class="muted small">Words: {ctx.words}</span>{/if}
        {#if ctx.lessonId}<a class="small" href={href('plan', 'edit', ctx.lessonId, 'flow')}>Open {ctx.lessonLabel || 'the lesson'}</a>{/if}
      </div>
      <button id="ctx-change" class="btn btn-outline" type="button" aria-expanded={editing} onclick={() => (editing = !editing)}>{editing ? 'Done' : 'Change'}</button>
    </div>
  {/if}
  {#if editing}
    <div class="stack tight edit">
      {#if lessons.length}<label class="field"><span>Use one of my RPHs</span>
        <select id="ctx-lesson" class="select" onchange={pick} value={ctx.lessonId}>
          <option value="">Choose a lesson…</option>
          {#each lessons as l}<option value={l.id}>{[l.header.date, l.header.className, l.topic || 'Untitled'].filter(Boolean).join(' · ')}</option>{/each}
        </select></label>{/if}
      <div class="grid">
        <label class="field"><span>Year</span><select class="select" bind:value={ctx.year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
        <label class="field"><span>Skill</span><select class="select" bind:value={ctx.skill}>{#each SKILLS as s}<option>{s}</option>{/each}</select></label>
        <label class="field"><span>Topic</span><input id="ctx-topic" class="input" bind:value={ctx.topic} placeholder="e.g. Healthy habits" /></label>
        <label class="field"><span>Key words</span><input id="ctx-words" class="input" bind:value={ctx.words} placeholder="e.g. vegetables, water, sleep" /></label>
        <label class="field"><span>Target sentence</span><input id="ctx-sentence" class="input" bind:value={ctx.sentence} placeholder="e.g. I should … because …" /></label>
      </div>
      <div class="row"><button class="btn btn-text" type="button" onclick={() => { clearCtx(); editing = true; }}>Clear</button><button class="btn btn-text" type="button" onclick={example}>Fill an example</button></div>
    </div>
  {/if}
</section>

<style>
  .ctx { border-left: 4px solid var(--gold-strong); padding: var(--s-3) var(--s-4); }
  .ctx.empty { background: linear-gradient(135deg, var(--gold-soft), var(--card)); }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .between { justify-content: space-between; align-items: center; }
  .sum { display: flex; flex-wrap: wrap; gap: 4px var(--s-2); align-items: baseline; min-width: 0; }
  .lbl { font-size: var(--t-xs); text-transform: uppercase; letter-spacing: .1em; color: var(--gold); font-weight: 700; }
  .edit { margin-top: var(--s-3); border-top: 1px solid var(--line); padding-top: var(--s-3); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: var(--s-3); }
</style>
