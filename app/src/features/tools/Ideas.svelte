<script lang="ts">
  import { untrack } from 'svelte';
  import { RECIPES, type Recipe } from '../../lib/recommend/activities';
  import { stepsFor, type Brief } from '../../lib/recommend/engine';
  import { bbmById, type Bbm } from '../../lib/recommend/bbm';
  import { digitalById, type Digital } from '../../lib/recommend/digital';
  import { ctx, ctxWords } from '../../lib/tools/context.svelte';
  import { addActivityTo } from '../../lib/tools/actions';
  import { getLesson } from '../../lib/db/repo';
  import type { Stage } from '../../lib/lesson/model';
  import BbmPic from '../../lib/ui/BbmPic.svelte';
  import { href } from '../../router.svelte';

  /** Browse every activity Consilia knows, filtered by what the teacher needs right now. Filled from the lesson bar. */
  let { stageHint = '' }: { stageHint?: string } = $props();
  const STAGES: [string, string, string[]][] = [['any', 'Any stage', []], ['warm', 'Warm-up (Pre-lesson)', ['pre-lesson']], ['intro', 'Presentation / Pre-', ['presentation', 'pre', 'model', 'pre-task']], ['practice', 'Practice / While-', ['practice', 'while', 'focus', 'planning', 'drafting']], ['produce', 'Production / Post-', ['production', 'post', 'task-cycle', 'revising']], ['close', 'Closure (Post-lesson)', ['post-lesson']]];
  const SKILLS = ['Any', 'Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'];
  let skill = $state(untrack(() => (SKILLS.includes(ctx.skill) ? ctx.skill : 'Any')));
  let stage = $state(untrack(() => STAGES.find((s) => s[2].includes(stageHint))?.[0] ?? 'any'));
  let max = $state(20); let noNet = $state(true); let noProj = $state(false); let energy = $state<'any' | 'active' | 'calm'>('any');
  const list = $derived(RECIPES.filter((r) => (skill === 'Any' || r.skill === skill || (stage === 'warm' || stage === 'close')) && ctx.year >= r.years[0] && ctx.year <= r.years[1] && r.minutes <= max
    && (stage === 'any' || r.stages.some((s) => STAGES.find((x) => x[0] === stage)![2].includes(s)))
    && (energy === 'any' || r.energy === energy) && !(noNet && (r.needs.includes('internet') || r.needs.includes('devices'))) && !(noProj && r.needs.includes('projector')))
    .sort((a, b) => Number(!!b.signature) - Number(!!a.signature) || Number(b.wow) - Number(a.wow)));
  const brief = $derived<Brief>({ year: ctx.year, topic: ctx.topic, mainSkill: skill === 'Any' ? ctx.skill : skill, compSkill: '', focus: '', durationMin: 60, words: ctxWords(), sentence: ctx.sentence, textRef: 'text for this lesson', goals: [], prepMinutes: 30, pupils: null });
  const aids = (ids: string[]) => ids.map(bbmById).filter((x): x is Bbm => !!x);
  const digs = (ids: string[]) => ids.map(digitalById).filter((x): x is Digital => !!x);
  const pat = (p: string) => ({ pairs: 'Pairs', groups: 'Groups', individual: 'Individual', 'whole-class': 'Whole class' } as Record<string, string>)[p] ?? p;
  const fill = (s: string) => s.replaceAll('{topic}', ctx.topic || 'the topic').replaceAll('{words}', ctx.words || 'the key words').replaceAll('{first}', ctxWords()[0] ?? 'the first word').replaceAll('{sentence}', ctx.sentence || 'the target sentence').replaceAll('{text}', 'text for this lesson');

  // "Add to my lesson"
  let stages = $state<Stage[]>([]);
  $effect(() => { const id = ctx.lessonId; if (id) getLesson(id).then((l) => (stages = l?.stages ?? [])); else stages = []; });
  let target = $state<Record<string, string>>({});
  let added = $state<Record<string, string>>({});
  function defaultStage(r: Recipe) { return stages.find((s) => r.stages.includes(s.key))?.key ?? stages[1]?.key ?? ''; }
  async function add(r: Recipe) {
    const key = target[r.id] || defaultStage(r);
    const l = await addActivityTo(ctx.lessonId, key, r, { teacher: fill(r.teacher), pupils: fill(r.pupils), tiers: { low: fill(r.tiers.low), mod: fill(r.tiers.mod), high: fill(r.tiers.high) } });
    added = { ...added, [r.id]: l ? `Added to ${l.stages.find((s) => s.key === key)?.title}.` : 'That lesson could not be found.' };
  }
</script>

<div class="stack">
  <section class="card stack tight">
    <div class="grid">
      <label class="field"><span>Skill</span><select id="id-skill" class="select" bind:value={skill}>{#each SKILLS as s}<option>{s}</option>{/each}</select></label>
      <label class="field"><span>Stage</span><select id="id-stage" class="select" bind:value={stage}>{#each STAGES as [v, t]}<option value={v}>{t}</option>{/each}</select></label>
      <label class="field"><span>Up to {max} minutes</span><input class="range" type="range" min="4" max="25" bind:value={max} /></label>
    </div>
    <div class="row">
      <label class="row small"><input type="checkbox" bind:checked={noNet} />No internet or pupil devices</label>
      <label class="row small"><input type="checkbox" bind:checked={noProj} />No projector</label>
      <div class="seg" role="group" aria-label="Energy">{#each [['any', 'Any'], ['active', 'Active'], ['calm', 'Calm']] as [v, t]}<button type="button" aria-pressed={energy === v} onclick={() => (energy = v as typeof energy)}>{t}</button>{/each}</div>
    </div>
  </section>
  <p class="muted small" aria-live="polite">{list.length} activit{list.length === 1 ? 'y' : 'ies'} for Year {ctx.year}. ★ marks the most memorable ones.{ctx.lessonId ? ' Use "Add to my lesson" to put one straight into your RPH.' : ''}</p>
  {#each list.slice(0, 40) as r (r.id)}
    <details class="card idea" data-idea={r.id}>
      <summary><span class="t"><b>{r.title}{r.wow ? ' ★' : ''}</b><span class="muted small">{r.skill} · {pat(r.pattern)} · {r.minutes} min · {r.energy === 'active' ? 'Active' : 'Calm'}</span></span>
        <span class="pics">{#each aids(r.bbm).slice(0, 2) as b}<BbmPic id={b.id} label={b.name} size={56} />{/each}</span></summary>
      <div class="stack tight body">
        <ol>{#each stepsFor(r, brief, r.minutes, aids(r.bbm), digs(r.digital).slice(0, 1)) as s}<li>{s}</li>{/each}</ol>
        {#if r.bbm.length}<p class="small"><b>Teaching aids:</b> {#each aids(r.bbm) as b, i}{i ? ', ' : ''}<a href={href('tools', 'bbm')}>{b.name}</a>{/each}</p>{/if}
        {#if r.digital.length}<p class="small"><b>Digital option:</b> {digs(r.digital).map((d) => d.name).join(', ')}</p>{/if}
        {#if ctx.lessonId && stages.length}
          <div class="row add">
            <select class="select auto" aria-label="Stage" value={target[r.id] || defaultStage(r)} onchange={(e) => (target = { ...target, [r.id]: (e.currentTarget as HTMLSelectElement).value })}>{#each stages as s}<option value={s.key}>{s.title}</option>{/each}</select>
            <button class="btn btn-gold add-btn" type="button" onclick={() => add(r)}>＋ Add to my lesson</button>
            {#if added[r.id]}<span class="ok small" role="status">✓ {added[r.id]} <a href={href('plan', 'edit', ctx.lessonId, 'flow')}>Open</a></span>{/if}
          </div>
        {/if}
      </div>
    </details>
  {/each}
  {#if list.length > 40}<p class="muted small">Showing 40. Narrow the filters to see others.</p>{/if}
  {#if !list.length}<p class="muted">Nothing fits. Try a longer time or "Any stage".</p>{/if}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .range { width: 100%; min-height: var(--tap); accent-color: var(--navy); }
  .idea summary { display: flex; justify-content: space-between; gap: var(--s-3); align-items: center; cursor: pointer; min-height: var(--tap); }
  .t { display: grid; gap: 2px; }
  .pics { display: flex; gap: 4px; }
  .body { padding-top: var(--s-2); }
  ol { margin: 0; padding-left: 1.4em; display: grid; gap: 4px; }
  p { margin: 0; }
  .auto { width: auto; }
  .add { align-items: center; border-top: 1px solid var(--line); padding-top: var(--s-2); }
  .ok { color: var(--ok); font-weight: 600; }
</style>
