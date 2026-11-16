<script lang="ts">
  import { objectiveFor, type Level } from '../../lib/recommend/engine';
  import { checkSmart, compose, successCriterion, VERBS } from '../../lib/lesson/objectives';
  import { audienceFor, type Objective } from '../../lib/lesson/model';
  import type { Output } from '../../lib/recommend/activities';
  /** ABCD objectives that pass SMART: start from a suggestion, edit freely, see the check live. */
  let year = $state(4); let skill = $state('Speaking'); let topic = $state(''); let sentence = $state(''); let level = $state<Level>('mixed'); let out = $state<Output>('sentences');
  const OUTS: Record<string, [Output, string][]> = {
    Listening: [['answers', 'Answer questions'], ['drawing', 'Draw what they hear']], Reading: [['answers', 'Answer questions'], ['story', 'Put a story in order']],
    Speaking: [['sentences', 'Say sentences'], ['questions', 'Ask questions'], ['dialogue', 'Role-play'], ['report', 'Give a short talk']],
    Writing: [['sentences', 'Write sentences'], ['text', 'Write a paragraph']], 'Language Arts': [['performance', 'Perform'], ['story', 'Retell a story'], ['poster', 'Create a poster']]
  };
  let o = $state<Objective>({ id: 'x', role: 'main', audience: audienceFor(4), verb: '', content: '', condition: '', degree: '' });
  function suggest() { const p = objectiveFor(skill, out, { year, topic, mainSkill: skill, compSkill: '', focus: '', durationMin: 60, words: [], sentence, textRef: '', goals: [], prepMinutes: 30, pupils: null }, level, 'main'); o = { ...o, audience: audienceFor(year), ...p }; }
  $effect(() => { if (!OUTS[skill].some((x) => x[0] === out)) out = OUTS[skill][0][0]; });
  const smart = $derived(checkSmart(o, skill, year));
  let copied = $state('');
  async function copy() { try { await navigator.clipboard.writeText(compose(o) + '\n' + successCriterion(o)); copied = 'Copied.'; } catch { copied = 'Select the text to copy it.'; } }
</script>
<div class="stack">
  <section class="card stack">
    <div class="grid">
      <label class="field"><span>Year</span><select class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
      <label class="field"><span>Skill</span><select id="ow-skill" class="select" bind:value={skill}>{#each Object.keys(OUTS) as s}<option>{s}</option>{/each}</select></label>
      <label class="field"><span>Pupils will…</span><select class="select" bind:value={out}>{#each OUTS[skill] as [v, t]}<option value={v}>{t}</option>{/each}</select></label>
      <label class="field"><span>Class level</span><select class="select" bind:value={level}><option value="low">Mostly lower</option><option value="mixed">Mixed</option><option value="high">Mostly higher</option></select></label>
      <label class="field"><span>Topic</span><input id="ow-topic" class="input" bind:value={topic} placeholder="e.g. My family" /></label>
      <label class="field"><span>Target sentence (optional)</span><input class="input" bind:value={sentence} placeholder="e.g. This is my …" /></label>
    </div>
    <button id="ow-suggest" class="btn btn-gold" type="button" onclick={suggest}>Suggest an objective</button>
  </section>
  <section class="card stack">
    <div class="grid">
      <label class="field"><span>B · Verb</span><input class="input" list="ow-verbs" bind:value={o.verb} /></label>
      <label class="field wide"><span>What pupils produce</span><input class="input" bind:value={o.content} /></label>
      <label class="field"><span>C · Condition</span><input class="input" bind:value={o.condition} /></label>
      <label class="field"><span>D · Degree (with a number)</span><input class="input" bind:value={o.degree} /></label>
    </div>
    <datalist id="ow-verbs">{#each VERBS[skill] ?? [] as v}<option value={v}></option>{/each}</datalist>
    <p class="obj" id="ow-out">{compose(o) || 'Press Suggest, or fill in the boxes.'}</p>
    <ul class="smart" aria-label="SMART check">{#each smart as r}<li class:ok={r.ok} title={r.message}><b>{r.letter}</b></li>{/each}</ul>
    {#each smart.filter((r) => !r.ok) as r}<p class="fix small">{r.letter}: {r.message}</p>{/each}
    {#if o.verb}<p class="small"><b>Success criterion for pupils:</b> {successCriterion(o)}</p>{/if}
    <div class="row"><button class="btn btn-outline" type="button" onclick={copy} disabled={!o.verb}>Copy</button>{#if copied}<span class="muted small" role="status">{copied}</span>{/if}</div>
  </section>
</div>
<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .wide { grid-column: span 2; } @media (max-width: 560px) { .wide { grid-column: auto; } }
  .obj { font-size: var(--t-lg); margin: 0; }
  .smart { display: flex; gap: 6px; list-style: none; padding: 0; margin: 0; }
  .smart li { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; border: 2px solid var(--bad); color: var(--bad); }
  .smart li.ok { background: var(--ok); border-color: var(--ok); color: #fff; }
  .fix { color: var(--bad); margin: 0; }
  .small { font-size: var(--t-sm); }
  .btn-gold { justify-self: start; }
</style>
