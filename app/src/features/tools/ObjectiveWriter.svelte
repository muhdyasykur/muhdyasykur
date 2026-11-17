<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { objectiveFor, type Level } from '../../lib/recommend/engine';
  import { checkSmart, compose, successCriterion, VERBS } from '../../lib/lesson/objectives';
  import { audienceFor, type Objective } from '../../lib/lesson/model';
  import type { Output } from '../../lib/recommend/activities';
  import { ctx } from '../../lib/tools/context.svelte';
  import { setObjective } from '../../lib/tools/actions';
  import { href } from '../../router.svelte';
  /** ABCD objectives that pass SMART: a suggestion appears at once from the lesson bar; edit freely, see the check live. */
  let level = $state<Level>('mixed'); let out = $state<Output>('sentences');
  const OUTS: Record<string, [Output, string][]> = {
    Listening: [['answers', tr('Answer questions')], ['drawing', tr('Draw what they hear')]], Reading: [['answers', tr('Answer questions')], ['story', tr('Put a story in order')]],
    Speaking: [['sentences', tr('Say sentences')], ['questions', tr('Ask questions')], ['dialogue', tr('Role-play')], ['report', tr('Give a short talk')]],
    Writing: [['sentences', tr('Write sentences')], ['text', tr('Write a paragraph')]], 'Language Arts': [['performance', tr('Perform')], ['story', tr('Retell a story')], ['poster', tr('Create a poster')]]
  };
  const skill = $derived(OUTS[ctx.skill] ? ctx.skill : 'Speaking');
  let o = $state<Objective>({ id: 'x', role: 'main', audience: audienceFor(4), verb: '', content: '', condition: '', degree: '' });
  function suggest() { const p = objectiveFor(skill, out, { year: ctx.year, topic: ctx.topic, mainSkill: skill, compSkill: '', focus: '', durationMin: 60, words: [], sentence: ctx.sentence, textRef: '', goals: [], prepMinutes: 30, pupils: null }, level, 'main'); o = { id: 'x', role: 'main', audience: audienceFor(ctx.year), free: '', ...p }; }
  $effect(() => { if (!OUTS[skill].some((x) => x[0] === out)) out = OUTS[skill][0][0]; });
  // a suggestion appears at once and follows the lesson bar, until the teacher edits the boxes
  let touched = $state(false);
  $effect(() => { void [ctx.year, ctx.topic, ctx.sentence, skill, out, level]; if (!touched) suggest(); });
  const smart = $derived(checkSmart(o, skill, ctx.year));
  let msg = $state('');
  let savedTo = $state(false); // show the Open link only after saving (the message itself is translated)
  async function copy() { try { await navigator.clipboard.writeText(compose(o) + '\n' + successCriterion(o)); msg = tr('Copied.'); savedTo = false; } catch { msg = tr('Select the text to copy it.'); savedTo = false; } }
  async function use(role: 'main' | 'comp') { const l = await setObjective(ctx.lessonId, role, { verb: o.verb, content: o.content, condition: o.condition, degree: o.degree }); savedTo = !!l; msg = l ? (role === 'main' ? tr('Saved as the main objective of {topic}.', { topic: l.topic || tr('your lesson') }) : tr('Saved as the complementary objective of {topic}.', { topic: l.topic || tr('your lesson') })) : tr('That lesson could not be found.'); }
</script>
<div class="stack">
  <section class="card stack tight">
    <div class="grid">
      <label class="field"><span>{tr('Pupils will…')}</span><select class="select" bind:value={out}>{#each OUTS[skill] as [v, t]}<option value={v}>{t}</option>{/each}</select></label>
      <label class="field"><span>{tr('Class level')}</span><select class="select" bind:value={level}><option value="low">{tr('Mostly lower')}</option><option value="mixed">{tr('Mixed')}</option><option value="high">{tr('Mostly higher')}</option></select></label>
    </div>
  </section>
  <section class="card stack">
    <p class="obj" id="ow-out">{compose(o) || tr('Add a topic in the bar above.')}</p>
    <ul class="smart" aria-label={tr('SMART check')}>{#each smart as r}<li class:ok={r.ok} title={r.message}><b>{r.letter}</b></li>{/each}</ul>
    {#each smart.filter((r) => !r.ok) as r}<p class="fix small">{r.letter}: {r.message}</p>{/each}
    {#if o.verb}<p class="small"><b>{tr('Success criterion for pupils:')}</b> {successCriterion(o)}</p>{/if}
    <div class="row">
      {#if ctx.lessonId}<button id="ow-use" class="btn btn-gold" type="button" onclick={() => use('main')} disabled={!o.verb}>{tr('Use as main objective')}</button><button class="btn btn-outline" type="button" onclick={() => use('comp')} disabled={!o.verb}>{tr('Use as complementary')}</button>{/if}
      <button class="btn btn-outline" type="button" onclick={copy} disabled={!o.verb}>{tr('Copy')}</button>
      <button id="ow-suggest" class="btn btn-text" type="button" onclick={() => { touched = false; suggest(); }}>{tr('New suggestion')}</button>
    </div>
    {#if msg}<p class="muted small" role="status">{msg}{#if ctx.lessonId && savedTo} <a href={href('plan', 'edit', ctx.lessonId, 'objectives')}>{tr('Open')}</a>{/if}</p>{/if}
    <details><summary class="small">{tr('Edit the A-B-C-D parts')}</summary>
      <div class="grid parts" oninput={() => (touched = true)}>
        <label class="field"><span>{tr('B · Verb')}</span><input class="input" list="ow-verbs" bind:value={o.verb} /></label>
        <label class="field wide"><span>{tr('What pupils produce')}</span><input class="input" bind:value={o.content} /></label>
        <label class="field"><span>{tr('C · Condition')}</span><input class="input" bind:value={o.condition} /></label>
        <label class="field"><span>{tr('D · Degree (with a number)')}</span><input class="input" bind:value={o.degree} /></label>
      </div>
      <datalist id="ow-verbs">{#each VERBS[skill] ?? [] as v}<option value={v}></option>{/each}</datalist>
    </details>
  </section>
</div>
<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .parts { padding-top: var(--s-2); }
  .wide { grid-column: span 2; } @media (max-width: 560px) { .wide { grid-column: auto; } }
  .obj { font-size: var(--t-lg); margin: 0; }
  .smart { display: flex; gap: 6px; list-style: none; padding: 0; margin: 0; }
  .smart li { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; border: 2px solid var(--bad); color: var(--bad); }
  .smart li.ok { background: var(--ok); border-color: var(--ok); color: #fff; }
  .fix { color: var(--bad); margin: 0; }

  summary { cursor: pointer; min-height: var(--tap); display: flex; align-items: center; }
</style>
