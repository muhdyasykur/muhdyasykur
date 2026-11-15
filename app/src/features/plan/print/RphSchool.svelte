<script lang="ts">
  import './paper.css';
  import type { Lesson, Activity } from '../../../lib/lesson/model';
  import type { Profile } from '../../../lib/db/schema';
  import { endTime } from '../../../lib/lesson/model';
  import { objectiveText, weekday, longDate } from '../../../lib/lesson/derive';

  /** Mirrors the SK(C) Anglo Chinese Kota Kinabalu daily lesson plan template supplied by the developer. */
  let { lesson, profile }: { lesson: Lesson; profile: Profile | null } = $props();
  const roman = ['I', 'II', 'III'];
  const mid = $derived(lesson.stages.slice(1, -1));
  const first = $derived(lesson.stages[0]);
  const last = $derived(lesson.stages[lesson.stages.length - 1]);
  const cls = $derived.by(() => {
    const extra = [lesson.header.levelLabel && `${lesson.header.levelLabel} Level`, lesson.header.pupils && `${lesson.header.pupils} Students`].filter(Boolean).join(', ');
    return [lesson.header.className, extra && `(${extra})`].filter(Boolean).join(' ');
  });
  const steps = (a: Activity) => [a.teacher, a.pupils].map((x) => x.trim()).filter(Boolean);
  const tiers = (a: Activity) => [['Low', a.tiers.low], ['Moderate', a.tiers.mod], ['High', a.tiers.high]].filter(([, t]) => t.trim());
  const aidsOf = (s: Lesson['stages'][number]) => [...new Set(s.activities.map((a) => a.aids.trim()).filter(Boolean))];
  const valuesOf = (s: Lesson['stages'][number]) => [...new Set(s.activities.map((a) => a.values.trim()).filter(Boolean))];
</script>

{#snippet notes(s: Lesson['stages'][number])}
  <p><b>Teaching Aids:</b></p>
  {#if aidsOf(s).length}<ul>{#each aidsOf(s) as x}<li>{x}</li>{/each}</ul>{:else}<p>None Applied (N/A)</p>{/if}
  <p><b>Moral Values:</b></p>
  {#if valuesOf(s).length}<ul>{#each valuesOf(s) as x}<li>{x}</li>{/each}</ul>{:else}<p>None Applied (N/A)</p>{/if}
{/snippet}
{#snippet acts(s: Lesson['stages'][number])}
  {#each s.activities as a}
    {#if steps(a).length}<ol>{#each steps(a) as t}<li class="pre">{t}</li>{/each}</ol>{/if}
    {#if tiers(a).length}<p class="diff"><b>Differentiation:</b> {#each tiers(a) as [n, t], i}{i ? '; ' : ''}<i>{n}</i>: {t.trim().replace(/[.;]+$/, '')}{/each}.</p>{/if}
  {/each}
{/snippet}

<article class="paper school" aria-label="RPH, school template">
  <header class="top">
    {#if profile?.logo}<img src={profile.logo} alt="" class="logo" />{/if}
    <p class="sch">{(profile?.school || 'School name').toUpperCase()}</p>
    <p class="ttl">DAILY LESSON PLAN</p>
  </header>
  <table>
    <colgroup><col style="width:24%" /><col style="width:28%" /><col style="width:24%" /><col style="width:24%" /></colgroup>
    <tbody>
      <tr><td><b>Subject:</b> {lesson.header.subject}</td><td><b>Class:</b> {cls || '–'}</td><td><b>Time:</b> {lesson.header.start} – {endTime(lesson.header.start, lesson.header.durationMin)}</td><td><b>Duration:</b> {lesson.header.durationMin >= 60 && lesson.header.durationMin % 60 === 0 ? `${lesson.header.durationMin / 60} hour${lesson.header.durationMin > 60 ? 's' : ''}` : `${lesson.header.durationMin} minutes`}</td></tr>
      <tr><td><b>Theme:</b> {lesson.theme || '–'}</td><td><b>Focus skill:</b> {lesson.mainSkill || '–'}</td><td><b>CCE:</b> {lesson.cce || '–'}</td><td><b>Date:</b> {longDate(lesson.header.date)} ({weekday(lesson.header.date)})</td></tr>
      <tr><td colspan="2" class="pre"><b>Teaching Aids and Materials:</b> {lesson.aids || '–'}</td><td colspan="2"><b>21st Century Skills/Strategy/Activity:</b> {lesson.skills21 || '–'}</td></tr>
      <tr><td colspan="4" class="band">Topic</td></tr>
      <tr><td colspan="4" class="center strong">{(lesson.topic || '–').toUpperCase()}</td></tr>
      <tr><td colspan="4" class="band">Current Pedagogical Practice</td></tr>
      <tr><td colspan="4" class="center">{(lesson.pedagogy || '–').toUpperCase()}</td></tr>
      <tr><td colspan="4" class="band">Content Standard</td></tr>
    </tbody>
  </table>
  <table class="mc">
    <colgroup><col style="width:9mm" /><col /><col style="width:9mm" /><col /></colgroup>
    <tbody>
      <tr><td class="m">M</td><td>{#each lesson.standards.main.cs as c}<p>{c.code} {c.text}</p>{/each}</td><td class="c">C</td><td>{#each lesson.standards.comp.cs as c}<p>{c.code} {c.text}</p>{/each}</td></tr>
      <tr><td colspan="4" class="band">Learning Standards</td></tr>
      <tr><td class="m">M</td><td>{#each lesson.standards.main.ls as c}<p class="pre">{c.code} {c.text}</p>{/each}</td><td class="c">C</td><td>{#each lesson.standards.comp.ls as c}<p class="pre">{c.code} {c.text}</p>{/each}</td></tr>
      <tr><td colspan="4" class="band">Learning Objectives</td></tr>
      {#each lesson.objectives as o}
        <tr><td class={o.role === 'main' ? 'm' : 'c'}>{o.role === 'main' ? 'M' : 'C'}</td><td colspan="3">{objectiveText(o) || '–'}</td></tr>
      {/each}
    </tbody>
  </table>
  <table class="flow">
    <colgroup><col style="width:21%" /><col style="width:53%" /><col style="width:26%" /></colgroup>
    <thead><tr><th>Lesson Stage</th><th>Teaching and Learning Activities</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><b>{roman[0]}. PRE-LESSON</b><br />(Induction)<br />{first.minutes} mins</td><td>{@render acts(first)}</td><td>{@render notes(first)}</td></tr>
      {#each mid as s, i}
        <tr>
          {#if i === 0}<td rowspan={mid.length}><b>{roman[1]}. LESSON DEVELOPMENT</b><br />{mid.reduce((a, x) => a + x.minutes, 0)} mins</td>{/if}
          <td><p><b>Activity {i + 1} ({s.title}) ({s.minutes} minutes):</b></p>{@render acts(s)}</td>
          <td>{@render notes(s)}</td>
        </tr>
      {/each}
      <tr><td><b>{roman[2]}. CLOSURE</b><br />{last.minutes} mins</td><td>{@render acts(last)}</td><td>{@render notes(last)}</td></tr>
    </tbody>
  </table>
  {#if lesson.frameworkReason}<p class="small"><b>Framework note:</b> {lesson.frameworkReason}</p>{/if}
  <table class="app"><tbody>
    <tr><td class="band">Appendices</td></tr>
    <tr><td class="pre">{lesson.appendices || ' '}{#if lesson.links.length}<br /><br /><b>Links:</b>{#each lesson.links as l}<br />{l.label}: {l.url}{/each}{/if}</td></tr>
  </tbody></table>
</article>

<style>
  .top { text-align: center; margin-bottom: 3mm; }
  .logo { height: 20mm; margin: 0 auto 2mm; }
  .sch { font-weight: 800; font-size: 11.5pt; }
  .ttl { font-weight: 800; font-size: 11pt; }
  .mc { margin-top: -1px; }
  .flow { margin-top: 3mm; }
  .flow p + ol, .flow ol + ol { margin-top: 3px; }
  .center { text-align: center; }
  .strong { font-weight: 700; }
  .diff { font-size: 9pt; margin-top: 2px; }
  .small { font-size: 9pt; margin-top: 2mm; }
  .app { margin-top: 3mm; }
  .app td { min-height: 30mm; }
</style>
