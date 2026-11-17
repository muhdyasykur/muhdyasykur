<script lang="ts">
  import { STAGE_COLOURS } from '../../../lib/ui/palette';
  import './paper.css';
  import type { Lesson } from '../../../lib/lesson/model';
  import type { Profile, Reflection } from '../../../lib/db/schema';
  import Qr from '../../../lib/ui/Qr.svelte';
  import { endTime } from '../../../lib/lesson/model';
  import { FRAMEWORKS } from '../../../lib/lesson/frameworks';
  import { alignment, criteria, objectiveLabels, smartFor, longDate, weekday } from '../../../lib/lesson/derive';

  let { lesson, profile, reflection = null }: { lesson: Lesson; profile: Profile | null; reflection?: Reflection | null } = $props();
  const labels = $derived(objectiveLabels(lesson));
  const colours = STAGE_COLOURS;
  const rows = $derived(alignment(lesson));
  const tiered = $derived(lesson.stages.flatMap((s) => s.activities.filter((a) => a.tiers.low || a.tiers.mod || a.tiers.high).map((a) => ({ s, a }))));
  const planB = $derived([['Finished early', lesson.planB.early], ['Running late', lesson.planB.late], ['No internet / power', lesson.planB.offline], ['Class too noisy', lesson.planB.noisy], ['Many absent', lesson.planB.absent]].filter(([, v]) => v.trim()));
</script>

<article class="paper bp" aria-label="Lesson plan, Consilia Lesson Blueprint">
  <header class="head">
    <div>
      <p class="kicker">Consilia Lesson Blueprint · KSSR Semakan 2017{lesson.curriculum.sowLesson ? ` · SoW Y${lesson.curriculum.year} ${lesson.curriculum.school} Lesson ${lesson.curriculum.sowLesson}` : ''}</p>
      <h2>{lesson.topic || 'Untitled lesson'}</h2>
      <p class="meta">{lesson.header.subject} · {lesson.header.className || `Year ${lesson.curriculum.year}`}{lesson.header.pupils ? ` (${lesson.header.pupils} pupils${lesson.header.levelLabel ? `, ${lesson.header.levelLabel}` : ''})` : ''} · {weekday(lesson.header.date)} {longDate(lesson.header.date)} · {lesson.header.start}–{endTime(lesson.header.start, lesson.header.durationMin)} · {lesson.header.durationMin} min</p>
      <p class="meta">Theme: {lesson.theme || '–'} · Focus: {lesson.mainSkill || '–'} · Framework: <b>{FRAMEWORKS[lesson.framework].short}</b>{lesson.frameworkReason ? ` (${lesson.frameworkReason})` : ''}</p>
    </div>
    {#if profile?.logo}<img src={profile.logo} alt="" class="logo" />{/if}
  </header>

  <div class="two">
    <section class="blk keep"><h4>1 · Standards</h4>
      {#each [['main', 'M'], ['comp', 'C']] as [r, k]}
        {@const st = lesson.standards[r as 'main' | 'comp']}
        <div class="mcrow"><span class={k.toLowerCase()}>{k}</span><div>{#each st.cs as c}<p><b>CS {c.code}</b> {c.text}</p>{/each}{#each st.ls as c}<p class="pre"><b>LS {c.code}</b> {c.text}</p>{/each}{#if !st.ls.length}<p>–</p>{/if}</div></div>
      {/each}
    </section>
    <section class="blk keep"><h4>2 · Learner snapshot</h4>
      <p><b>Class:</b> {lesson.header.className || '–'}{lesson.header.levelLabel ? `, ${lesson.header.levelLabel} level` : ''}{lesson.header.pupils ? `, ${lesson.header.pupils} pupils` : ''}</p>
      <p><b>Prior learning:</b> {lesson.priorKnowledge || '–'}</p>
      <p><b>Language focus:</b> {lesson.focus || '–'}</p>
      <p><b>CCE:</b> {lesson.cce || '–'} · <b>Values:</b> {lesson.values || '–'}</p>
      <p><b>21st-century skills:</b> {lesson.skills21 || '–'}</p>
    </section>
  </div>

  <section class="blk keep"><h4>3 · Objectives (ABCD) and success criteria</h4>
    {#each criteria(lesson) as c}
      {@const smart = smartFor(lesson, c.objective)}
      <div class="mcrow"><span class={c.objective.role === 'main' ? 'm' : 'c'}>{labels.get(c.objective.id)}</span>
        <div>
          {#if c.objective.free}<p>{c.objective.free}</p>{:else}<p><span class="ha">{c.objective.audience}</span> <span class="hb">{c.objective.verb}</span> {c.objective.content} <span class="hc">{c.objective.condition}</span> <span class="hd">{c.objective.degree}</span></p>{/if}
          <p class="sm">{#each smart as s}<span class:okk={s.ok} class:no={!s.ok}>{s.letter}{s.ok ? '✔' : '✘'}</span> {/each}· <i class="pupil">{c.text}</i></p>
        </div>
      </div>
    {/each}
  </section>

  <section class="blk"><h4>4 · Lesson flow (planned {lesson.stages.reduce((a, s) => a + s.minutes, 0)} min)</h4>
    <div class="ribbon">{#each lesson.stages as s, i}<div style="flex:{Math.max(1, s.minutes)};background:{colours[i % colours.length]}">{s.title.split(' ')[0]} {s.minutes}</div>{/each}</div>
    <table>
      <colgroup><col style="width:17%" /><col style="width:30%" /><col style="width:24%" /><col style="width:12%" /><col style="width:17%" /></colgroup>
      <thead><tr><th>Stage · min</th><th>Teacher does</th><th>Pupils do</th><th>Interaction · Obj</th><th>Aids, values</th></tr></thead>
      <tbody>
        {#each lesson.stages as s}
          {#each s.activities as a, i}
            <tr>
              {#if i === 0}<td rowspan={s.activities.length}><b>{s.title}</b><br />{s.minutes} min</td>{/if}
              <td class="pre">{a.teacher}</td><td class="pre">{a.pupils}</td>
              <td>{a.pattern}{a.objectiveIds.length ? ` · ${a.objectiveIds.map((id) => labels.get(id)).filter(Boolean).join(', ')}` : ''}</td>
              <td>{[a.aids, a.values].filter(Boolean).join(' · ')}</td>
            </tr>
          {/each}
        {/each}
      </tbody>
    </table>
  </section>

  {#if tiered.length}
    <section class="blk"><h4>5 · Differentiation</h4>
      <table><colgroup><col style="width:19%" /><col /><col /><col /></colgroup>
        <thead><tr><th>Activity</th><th>Low (support)</th><th>Moderate (core)</th><th>High (challenge)</th></tr></thead>
        <tbody>{#each tiered as { s, a }}<tr class="keep"><td>{s.title}</td><td class="pre">{a.tiers.low}</td><td class="pre">{a.tiers.mod}</td><td class="pre">{a.tiers.high}</td></tr>{/each}</tbody>
      </table>
    </section>
  {/if}

  <div class="two">
    <section class="blk keep"><h4>6 · Assessment (PBD)</h4>
      <p><b>Evidence:</b> {lesson.assessment.evidence || '–'}</p>
      <p><b>Method:</b> {lesson.assessment.method || '–'}</p>
    </section>
    <section class="blk keep"><h4>7 · Plan B</h4>
      {#if planB.length}{#each planB as [k, v]}<p><b>{k}:</b> {v}</p>{/each}{:else}<p>–</p>{/if}
    </section>
  </div>

  <section class="blk keep"><h4>8 · Alignment map</h4>
    <table><thead><tr><th>LS</th><th>Objective</th><th>Activities in</th><th>Time</th><th>Status</th></tr></thead>
      <tbody>{#each rows as r}<tr><td>{r.ls} {r.role === 'main' ? 'M' : 'C'}</td><td>{r.objectives.join(', ') || '–'}</td><td>{r.stages.join(', ') || '–'}</td><td>{r.minutes} min</td><td class:okk={r.ok} class:no={!r.ok}>{r.ok ? '✔ Aligned' : '⚠ ' + r.problem}</td></tr>{/each}</tbody>
    </table>
  </section>

  <div class="two">
    <section class="blk keep"><h4>9 · Reflection</h4>
      {#if reflection && (reflection.worked || reflection.didnt || reflection.next)}
        <p><b>Worked:</b> {reflection.worked || '–'}</p><p><b>Did not go as planned:</b> {reflection.didnt || '–'}</p><p><b>Next time:</b> {reflection.next || '–'}</p>
      {:else}<div class="lines"></div>{/if}
    </section>
    <section class="blk keep"><h4>10 · Appendices and links</h4>
      <p class="pre">{lesson.appendices || '–'}</p>
      {#each lesson.links as l}<p class="qrrow"><Qr url={l.url} size={52} /><span>{l.label}<br /><small>{l.url}</small></span></p>{/each}
    </section>
  </div>
  <p class="foot">Prepared by {profile?.name || '________________'}{profile?.programme ? `, ${profile.programme}` : ''}{profile?.campus ? `, ${profile.campus}` : ''} · {profile?.school || ''} · Made with Consilia</p>
</article>

<style>
  .head { display: flex; justify-content: space-between; gap: 6mm; border-bottom: 2px solid var(--p-navy); padding-bottom: 3mm; margin-bottom: 3mm; }
  .kicker { font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; color: var(--p-gold); font-weight: 700; }
  h2 { font-size: 16pt; margin: 1mm 0; }
  .meta { font-size: 9pt; }
  .logo { height: 18mm; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .blk { border: 1px solid #c9ced8; border-radius: 2mm; overflow: hidden; margin-bottom: 3mm; }
  .blk > :not(h4):not(table):not(.ribbon) { padding: 0 3mm; }
  .blk > h4 { background: var(--p-navy); color: #fff; font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; padding: 1.2mm 3mm; margin-bottom: 1.5mm; }
  .blk > p:last-child, .blk > div:last-child { padding-bottom: 2mm; }
  .blk table { margin: 0; }
  .blk th, .blk td { border-left: 0; border-right: 0; font-size: 9pt; }
  .mcrow { display: grid; grid-template-columns: 9mm 1fr; gap: 2mm; margin: 1mm 3mm 1.5mm; }
  .mcrow > span { display: grid; place-items: center; border-radius: 1.5mm; font-weight: 800; font-size: 8.5pt; align-self: start; min-height: 7mm; }
  .mcrow .m { background: var(--p-m); } .mcrow .c { background: var(--p-c); }
  .ha { background: #e3e8f1; } .hb { background: #f1e3b5; font-weight: 700; } .hc { background: #d5efe9; } .hd { background: #e5ddf6; }
  .ha, .hb, .hc, .hd { border-radius: 1mm; padding: 0 1mm; }
  .ha:empty, .hb:empty, .hc:empty, .hd:empty { display: none; }
  .sm { font-size: 8.5pt; margin-top: 1mm; }
  .okk { color: #157347; font-weight: 700; } .no { color: #b02a37; font-weight: 700; }
  .pupil { font-family: Andika, Arial, sans-serif; }
  .ribbon { display: flex; height: 6mm; margin: 0 3mm 2mm; border-radius: 1.5mm; overflow: hidden; color: #fff; font-size: 7.5pt; font-weight: 700; }
  .ribbon div { display: grid; place-items: center; white-space: nowrap; overflow: hidden; }
  .lines { height: 28mm; margin: 0 3mm 2mm; background: repeating-linear-gradient(#fff 0 6.5mm, #c9ced8 6.5mm 6.8mm); }
  .qrrow { display: flex; gap: 2mm; align-items: center; margin: 1mm 0; overflow-wrap: anywhere; }
  .qrrow small { font-size: 7pt; color: #555; }
  .foot { font-size: 8pt; color: #555; text-align: right; margin-top: 2mm; }
</style>
