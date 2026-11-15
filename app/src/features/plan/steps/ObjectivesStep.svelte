<script lang="ts">
  import type { Lesson, Objective, Role } from '../../../lib/lesson/model';
  import { newObjective } from '../../../lib/lesson/model';
  import { compose, skillOfLs, successCriterion, verbsFor } from '../../../lib/lesson/objectives';
  import { criteria, objectiveLabels, smartFor } from '../../../lib/lesson/derive';

  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  const labels = $derived(objectiveLabels(lesson));
  const degrees = ['with at least 4 out of 5 correct', 'with at least 3 correct answers', 'with no more than 2 errors', 'in at least 4 complete sentences'];

  function add(role: Role) { lesson.objectives.push(newObjective(role, lesson.curriculum.year)); }
  function remove(o: Objective) {
    lesson.objectives = lesson.objectives.filter((x) => x.id !== o.id);
    lesson.successCriteria = lesson.successCriteria.filter((s) => s.objectiveId !== o.id);
    for (const s of lesson.stages) for (const a of s.activities) a.objectiveIds = a.objectiveIds.filter((id) => id !== o.id);
  }
  function toggleFree(o: Objective) { o.free = o.free === undefined ? compose(o) : undefined; }
  function setCriterion(o: Objective, text: string) {
    const sc = lesson.successCriteria.find((s) => s.objectiveId === o.id);
    if (sc) { sc.text = text; sc.edited = true; } else lesson.successCriteria.push({ objectiveId: o.id, text, edited: true });
  }
  function resetCriterion(o: Objective) { lesson.successCriteria = lesson.successCriteria.filter((s) => s.objectiveId !== o.id); }
  const skillFor = (o: Objective) => skillOfLs(lesson.standards[o.role].ls);
</script>

<div class="stack">
  <p class="muted">Write each objective in four parts: <b class="a-a">Audience</b>, <b class="a-b">Behaviour</b> (one observable verb and what pupils produce), <b class="a-c">Condition</b> and <b class="a-d">Degree</b>. Every Learning Standard, main and complementary, needs at least one objective.</p>

  {#each lesson.objectives as o (o.id)}
    {@const smart = smartFor(lesson, o)}
    {@const skill = skillFor(o)}
    <section class="card stack obj">
      <div class="row between">
        <div class="row"><span class={o.role === 'main' ? 'pill-m' : 'pill-c'}>{o.role === 'main' ? 'M' : 'C'}</span><b>{labels.get(o.id)}</b>
          <span class="muted small">{lesson.standards[o.role].ls.map((l) => 'LS ' + l.code).join(', ') || 'No standard chosen'}{skill ? ` · ${skill}` : ''}</span></div>
        <div class="row">
          <button class="btn btn-text" type="button" onclick={() => toggleFree(o)}>{o.free === undefined ? 'Type it myself' : 'Use the ABCD builder'}</button>
          {#if lesson.objectives.filter((x) => x.role === o.role).length > 1 || o.role === 'comp'}<button class="btn btn-text del" type="button" onclick={() => remove(o)}>Remove</button>{/if}
        </div>
      </div>

      {#if o.free === undefined}
        <div class="abcd">
          <label class="field a"><span>A · Audience</span><input class="input" bind:value={o.audience} /></label>
          <label class="field b"><span>B · Verb</span><input class="input" list={'verbs-' + o.id} bind:value={o.verb} placeholder="e.g. write" data-field="verb" /></label>
          <label class="field b2"><span>B · What pupils will produce</span><input class="input" bind:value={o.content} placeholder="e.g. 5 sentences using should and shouldn't about healthy routines" data-field="content" /></label>
          <label class="field c"><span>C · Condition</span><input class="input" bind:value={o.condition} placeholder="e.g. based on a picture worksheet" data-field="condition" /></label>
          <label class="field d"><span>D · Degree</span><input class="input" list="degrees" bind:value={o.degree} placeholder="e.g. with at least 4 out of 5 correct" data-field="degree" /></label>
        </div>
        <datalist id={'verbs-' + o.id}>{#each verbsFor(skill) as v}<option value={v}></option>{/each}</datalist>
        <p class="sentence"><span class="a-a">{o.audience}</span> <span class="a-b">{o.verb || '…'}</span> {o.content} <span class="a-c">{o.condition}</span> <span class="a-d">{o.degree}</span></p>
      {:else}
        <label class="field"><span>Objective</span><textarea class="input ta" rows="3" bind:value={o.free}></textarea></label>
      {/if}

      <ul class="smart" aria-label="SMART check">
        {#each smart as s}<li class:ok={s.ok} title={s.message}><span class="l">{s.letter}</span><span class="sr-only">{s.ok ? 'passes' : 'needs work'}: {s.message}</span></li>{/each}
      </ul>
      {#each smart.filter((s) => !s.ok) as s}<p class="fix"><b>{s.letter}</b> {s.message}</p>{/each}
    </section>
  {/each}

  <div class="row">
    <button class="btn btn-outline" type="button" onclick={() => add('main')}>+ Main objective</button>
    <button class="btn btn-outline" type="button" onclick={() => add('comp')}>+ Complementary objective</button>
  </div>

  <section class="card stack">
    <h3>Success criteria</h3>
    <p class="muted small">Written for pupils as "I can…". Shown in Teach mode and used for self-checks. Generated from each objective; edit if you like.</p>
    {#each criteria(lesson) as c (c.objective.id)}
      <div class="sc">
        <span class="lbl">{labels.get(c.objective.id)}</span>
        <input class="input pupil" value={c.text} onchange={(e) => setCriterion(c.objective, e.currentTarget.value)} aria-label="Success criterion" />
        {#if c.edited && successCriterion(c.objective)}<button class="btn btn-text" type="button" onclick={() => resetCriterion(c.objective)}>Reset</button>{/if}
      </div>
    {/each}
  </section>
</div>
<datalist id="degrees">{#each degrees as d}<option value={d}></option>{/each}</datalist>

<style>
  .between { justify-content: space-between; }
  .small { font-size: var(--t-sm); }
  .del { color: var(--bad); }
  .abcd { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--s-3); }
  .abcd .a { grid-column: span 6; } .abcd .b { grid-column: span 2; } .abcd .b2 { grid-column: span 4; } .abcd .c, .abcd .d { grid-column: span 3; }
  @media (max-width: 640px) { .abcd > * { grid-column: 1 / -1 !important; } }
  .a-a { background: color-mix(in srgb, var(--navy) 14%, transparent); border-radius: 5px; padding: 0 4px; }
  .a-b { background: color-mix(in srgb, var(--gold) 28%, transparent); border-radius: 5px; padding: 0 4px; font-weight: 700; }
  .a-c { background: color-mix(in srgb, var(--low) 22%, transparent); border-radius: 5px; padding: 0 4px; }
  .a-d { background: color-mix(in srgb, var(--high) 22%, transparent); border-radius: 5px; padding: 0 4px; }
  .sentence { line-height: 2; }
  .sentence span:empty { display: none; }
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); }
  .smart { list-style: none; margin: 0; padding: 0; display: flex; gap: 6px; }
  .smart li { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; border: 2px solid var(--bad); color: var(--bad); font: 800 var(--t-sm) var(--f-display); }
  .smart li.ok { border-color: var(--ok); color: var(--on-navy); background: var(--ok); }
  .fix { font-size: var(--t-sm); color: var(--ink-2); }
  .fix b { color: var(--bad); margin-right: 4px; }
  .sc { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: var(--s-2); align-items: center; }
  .lbl { font: 500 var(--t-sm) var(--f-mono); color: var(--gold); }
  .pupil { font-family: var(--f-pupil); font-size: 1.05rem; }
</style>
