<script lang="ts">
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
    Listening: [['answers', 'Answer questions'], ['drawing', 'Draw what they hear']], Reading: [['answers', 'Answer questions'], ['story', 'Put a story in order']],
    Speaking: [['sentences', 'Say sentences'], ['questions', 'Ask questions'], ['dialogue', 'Role-play'], ['report', 'Give a short talk']],
    Writing: [['sentences', 'Write sentences'], ['text', 'Write a paragraph']], 'Language Arts': [['performance', 'Perform'], ['story', 'Retell a story'], ['poster', 'Create a poster']]
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
  async function copy() { try { await navigator.clipboard.writeText(compose(o) + '\n' + successCriterion(o)); msg = 'Copied.'; } catch { msg = 'Select the text to copy it.'; } }
  async function use(role: 'main' | 'comp') { const l = await setObjective(ctx.lessonId, role, { verb: o.verb, content: o.content, condition: o.condition, degree: o.degree }); msg = l ? `Saved as the ${role === 'main' ? 'main' : 'complementary'} objective of ${l.topic || 'your lesson'}.` : 'That lesson could not be found.'; }
</script>
<div class="stack">
  <section class="card stack tight">
    <div class="grid">
      <label class="field"><span>Pupils will…</span><select class="select" bind:value={out}>{#each OUTS[skill] as [v, t]}<option value={v}>{t}</option>{/each}</select></label>
      <label class="field"><span>Class level</span><select class="select" bind:value={level}><option value="low">Mostly lower</option><option value="mixed">Mixed</option><option value="high">Mostly higher</option></select></label>
    </div>
  </section>
  <section class="card stack">
    <p class="obj" id="ow-out">{compose(o) || 'Add a topic in the bar above.'}</p>
    <ul class="smart" aria-label="SMART check">{#each smart as r}<li class:ok={r.ok} title={r.message}><b>{r.letter}</b></li>{/each}</ul>
    {#each smart.filter((r) => !r.ok) as r}<p class="fix small">{r.letter}: {r.message}</p>{/each}
    {#if o.verb}<p class="small"><b>Success criterion for pupils:</b> {successCriterion(o)}</p>{/if}
    <div class="row">
      {#if ctx.lessonId}<button id="ow-use" class="btn btn-gold" type="button" onclick={() => use('main')} disabled={!o.verb}>Use as main objective</button><button class="btn btn-outline" type="button" onclick={() => use('comp')} disabled={!o.verb}>Use as complementary</button>{/if}
      <button class="btn btn-outline" type="button" onclick={copy} disabled={!o.verb}>Copy</button>
      <button id="ow-suggest" class="btn btn-text" type="button" onclick={() => { touched = false; suggest(); }}>New suggestion</button>
    </div>
    {#if msg}<p class="muted small" role="status">{msg}{#if ctx.lessonId && msg.startsWith('Saved')} <a href={href('plan', 'edit', ctx.lessonId, 'objectives')}>Open</a>{/if}</p>{/if}
    <details><summary class="small">Edit the A-B-C-D parts</summary>
      <div class="grid parts" oninput={() => (touched = true)}>
        <label class="field"><span>B · Verb</span><input class="input" list="ow-verbs" bind:value={o.verb} /></label>
        <label class="field wide"><span>What pupils produce</span><input class="input" bind:value={o.content} /></label>
        <label class="field"><span>C · Condition</span><input class="input" bind:value={o.condition} /></label>
        <label class="field"><span>D · Degree (with a number)</span><input class="input" bind:value={o.degree} /></label>
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
  .small { font-size: var(--t-sm); }
  .tight { gap: var(--s-2); }
  summary { cursor: pointer; min-height: var(--tap); display: flex; align-items: center; }
</style>
