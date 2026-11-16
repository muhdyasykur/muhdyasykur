<script lang="ts">
  import { planLesson, applyPlan, type Brief, type ClassProfile, type Plan } from '../../lib/recommend/engine';
  import { buildPrompt, planAsText } from '../../lib/recommend/prompts';
  import { compose } from '../../lib/lesson/objectives';
  import { newObjective, type Lesson } from '../../lib/lesson/model';
  import { runChecks } from '../../lib/lesson/checker';
  import { href } from '../../router.svelte';
  import BbmCard from '../tools/BbmCard.svelte';
  import AiButtons from '../tools/AiButtons.svelte';
  import ScoreRing from '../../lib/ui/ScoreRing.svelte';

  /** The lesson Consilia proposes: how it planned it, every stage step by step, aids, tools and preparation. */
  let { base, brief, profile, onuse, onback }: { base: Lesson; brief: Brief; profile: ClassProfile; onuse: (l: Lesson) => void; onback: () => void } = $props();

  let avoid = $state<Record<string, string[]>>({});
  let lock = $state<Record<string, string[]>>({});
  let plan = $state.raw<Plan>(planLesson(profile, brief, { seed: Date.now() % 9973 }));
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = $state(reduced ? 99 : 0);
  $effect(() => { if (shown < plan.log.length) { const t = setTimeout(() => (shown += 1), 260); return () => clearTimeout(t); } });
  const thinking = $derived(shown < plan.log.length);
  let have = $state<Record<string, boolean>>({});
  const prepLeft = $derived(plan.prep.items.filter((x) => !have[x.label]).reduce((a, x) => a + x.minutes, 0));

  // a preview lesson for objectives and the score
  const preview = $derived(applyPlan(structuredClone($state.snapshot(base)) as Lesson, plan, brief));
  const report = $derived(runChecks(preview));

  function another(key: string) {
    const cur = plan.stages.find((s) => s.key === key);
    if (!cur) return;
    avoid = { ...avoid, [key]: [...(avoid[key] ?? []), ...cur.picks.map((x) => x.recipe.id)] };
    lock = Object.fromEntries(plan.stages.filter((s) => s.key !== key).map((s) => [s.key, s.picks.map((x) => x.recipe.id)]));
    plan = planLesson(profile, brief, { seed: 7, avoid: $state.snapshot(avoid), lock: $state.snapshot(lock) });
    shown = 99;
  }
  function use() { onuse(applyPlan(structuredClone($state.snapshot(base)) as Lesson, plan, brief)); }
  const objs = $derived(preview.objectives);
  const prompt = $derived(buildPrompt('improve', { year: brief.year, topic: brief.topic, skill: brief.mainSkill, words: brief.words, sentence: brief.sentence, extra: planAsText(plan, brief, objs.length ? objs : [newObjective('main', brief.year)]) }));
  const pat = (p: string) => ({ pairs: 'Pairs', groups: 'Groups', individual: 'Individual', 'whole-class': 'Whole class' } as Record<string, string>)[p] ?? p;
</script>

<section class="stack proposal" aria-labelledby="pr-title">
  <div class="head card">
    <div class="stack tight">
      <p class="eyebrow">Consilia recommends</p>
      <h2 id="pr-title">{brief.topic || 'Your lesson'} · Year {brief.year} · {brief.durationMin} min</h2>
      <p><b>{plan.frameworkName}.</b> <span class="muted">{plan.frameworkReason}</span></p>
    </div>
    <div class="score" title="Alignment score of this plan"><ScoreRing score={report.score} /><span class="small">{report.failing.length ? `${report.failing.length} to check` : 'Aligned'}</span></div>
  </div>

  <details class="card log" open={thinking}>
    <summary><b>{thinking ? 'Consilia is planning…' : 'How Consilia planned this lesson'}</b></summary>
    <ol class="steps" aria-live="polite">
      {#each plan.log.slice(0, shown) as line, i}<li class:new={i === shown - 1 && thinking}>{line}</li>{/each}
    </ol>
  </details>

  {#if !thinking}
    <section class="card stack tight">
      <h3>Objectives and success criteria</h3>
      {#each objs as o}<p><span class="chip">{o.role === 'main' ? 'Main' : 'Complementary'}</span> {compose(o)}</p>{/each}
      <p class="muted small">Assessment: {plan.evidence} · {plan.method}. 21st-century skills: {plan.skills21}.</p>
    </section>

    {#each plan.stages as s (s.key)}
      <section class="card stage stack" data-stage={s.key}>
        <header class="row between">
          <div><h3>{s.title} <span class="muted mins">{s.minutes} min</span></h3><p class="muted small">{s.purpose}</p></div>
          <button class="btn btn-outline another" type="button" onclick={() => another(s.key)}>↻ Another idea</button>
        </header>
        {#each s.picks as x (x.recipe.id)}
          <article class="pick stack tight" data-recipe={x.recipe.id}>
            <div class="row title"><h4>{x.recipe.title}{x.recipe.wow ? ' ★' : ''}</h4>
              <span class="chip">{pat(x.recipe.pattern)}</span><span class="chip">{x.minutes} min</span><span class="chip">{x.recipe.energy === 'active' ? 'Active' : 'Calm'}</span>{#if x.role === 'comp'}<span class="chip comp">Complementary skill</span>{/if}</div>
            {#if x.why.length}<p class="why small">Why: {x.why.join(' · ')}.</p>{/if}
            <ol class="script">{#each x.steps as st}<li>{st}</li>{/each}</ol>
            <div class="tiers"><div><b>🌱 Low</b><p>{x.tiers.low}</p></div><div><b>🌿 Moderate</b><p>{x.tiers.mod}</p></div><div><b>🌳 High</b><p>{x.tiers.high}</p></div></div>
            {#if x.bbm.length}<div class="stack tight"><h5>Teaching aids (BBM) — tap for how to make them</h5><div class="bbms">{#each x.bbm as b (b.id)}<BbmCard {b} compact />{/each}</div></div>{/if}
            {#if x.digital.length}<div class="stack tight"><h5>Digital option</h5>
              {#each x.digital as d (d.id)}<div class="dig">
                <div><b>{d.name}</b> <span class="muted small">· {d.free}{d.needs.length ? ` · needs ${d.needs.join(', ')}` : ''}</span><p class="small">{d.what} Pupils: {d.pupils}</p>
                  <ol class="small">{#each d.setup as st}<li>{st}</li>{/each}</ol></div>
                {#if d.url}<a class="btn btn-outline" href={d.url(brief.topic || brief.mainSkill, brief.year)} target="_blank" rel="noopener">Open {d.name}</a>{:else if d.inApp}<a class="btn btn-outline" href={href('tools', 'games', d.inApp)}>Open {d.name}</a>{/if}
              </div>{/each}</div>{/if}
          </article>
        {/each}
      </section>
    {/each}

    <section class="card stack tight prep">
      <h3>Preparation checklist <span class="muted mins">about {prepLeft} min{prepLeft > plan.prep.limit ? ` · more than your ${plan.prep.limit} min` : ''}</span></h3>
      <p class="muted small">Tick what you already have; the time updates.</p>
      {#each plan.prep.items as it}<label class="row tick"><input type="checkbox" bind:checked={have[it.label]} /><span>{it.label} <span class="muted">({it.minutes} min)</span></span></label>{/each}
      {#if !plan.prep.items.length}<p class="muted">Nothing to make: this lesson needs only the board.</p>{/if}
    </section>

    <section class="card stack tight"><h3>Want even more ideas?</h3><AiButtons {prompt} label="Improve with AI" /></section>

    <div class="row actions">
      <button id="rc-use" class="btn btn-gold" type="button" onclick={use}>Use this plan</button>
      <button class="btn btn-outline" type="button" onclick={onback}>Change my answers</button>
    </div>
    <p class="muted small">You can change everything in the builder afterwards. Consilia's plan is a starting point: check it with your mentor and your school's requirements.</p>
  {/if}
</section>

<style>
  .head { display: flex; justify-content: space-between; gap: var(--s-4); align-items: center; border: 2px solid var(--gold-strong); }
  .head h2 { margin: 0; font-size: var(--t-xl); }
  .head p { margin: 0; }
  .score { display: grid; justify-items: center; gap: 2px; }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .log summary { cursor: pointer; min-height: var(--tap); display: flex; align-items: center; }
  .steps { margin: 0; padding-left: 1.4em; display: grid; gap: 6px; }
  .steps li.new { animation: rise .25s ease-out; }
  @keyframes rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .steps li.new { animation: none; } }
  .between { justify-content: space-between; align-items: flex-start; }
  .stage h3 { margin: 0; }
  .mins { font-weight: 500; font-size: var(--t-sm); }
  .pick { border-top: 1px solid var(--line); padding-top: var(--s-3); }
  .title { align-items: center; }
  .title h4 { margin: 0; font-size: var(--t-lg); }
  .why { margin: 0; color: var(--ok); }
  .script { margin: 0; padding-left: 1.4em; display: grid; gap: 6px; }
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-2); }
  .tiers > div { background: var(--sunken); border-radius: var(--r-ctl); padding: var(--s-2) var(--s-3); }
  .tiers p { margin: 4px 0 0; font-size: var(--t-sm); }
  h5 { margin: 0; font-size: var(--t-sm); text-transform: uppercase; letter-spacing: .06em; color: var(--gold); }
  .bbms { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: var(--s-2); }
  .dig { display: flex; justify-content: space-between; gap: var(--s-3); align-items: center; flex-wrap: wrap; background: var(--sunken); border-radius: var(--r-ctl); padding: var(--s-2) var(--s-3); }
  .dig p { margin: 2px 0; }
  .dig ol { margin: 4px 0 0; padding-left: 1.3em; }
  .comp { background: var(--comp); color: var(--comp-ink); }
  .tick { align-items: center; min-height: var(--tap); cursor: pointer; }
  .actions { gap: var(--s-3); }
</style>
