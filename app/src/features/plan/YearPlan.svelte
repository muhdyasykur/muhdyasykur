<script lang="ts">
  import { route, href, go } from '../../router.svelte';
  import { db, type SchoolClass, type YearPlan as Plan, type PlanWeek } from '../../lib/db/schema';
  import { listClasses, listLessons, getSetting } from '../../lib/db/repo';
  import { rowsToWeeks, fillDates, buildFromSow, weekOf, weeksInMonth, addDaysIso, type Extracted } from '../../lib/yearplan';
  import { readPlanFile } from '../../lib/yearplan-file';
  import { loadSow } from '../../lib/curriculum/loader';
  import type { SowLesson } from '../../lib/curriculum/types';
  import { uid, type Lesson } from '../../lib/lesson/model';
  import { weekItems, mondayOf, parseDate, iso, type Slot, type Cancelled } from '../../lib/timetable';
  import Icon from '../../lib/ui/Icon.svelte';

  /** Yearly plan (RPT): upload the school's file or build it from the SoW, then see it by year, month and week. */
  const today = iso(new Date());
  let plans = $state<Plan[]>([]); let classes = $state<SchoolClass[]>([]);
  async function refresh() { plans = (await db.plans.toArray()).sort((a, b) => b.updatedAt - a.updatedAt); classes = await listClasses(); }
  $effect(() => { refresh(); });
  const planId = $derived(route.parts[1] && route.parts[1] !== 'new' ? route.parts[1] : '');
  const plan = $derived(plans.find((p) => p.id === planId));
  const view = $derived((['year', 'month', 'week'].includes(route.parts[2] ?? '') ? route.parts[2] : 'year') as 'year' | 'month' | 'week');

  // ---------------------------------------------------------------- making a plan
  let draft = $state<Plan | null>(null);
  let report = $state<Extracted['found'] | null>(null);
  let err = $state(''); let busy = $state('');
  let week1 = $state(''); // Monday of week 1, for plans without dates
  const newPlan = (over: Partial<Plan> = {}): Plan => ({ id: uid(), name: '', calendarYear: new Date().getFullYear(), year: classes[0]?.year ?? 4, school: classes[0]?.schoolType ?? 'SK', classIds: [], source: '', weeks: [], createdAt: Date.now(), updatedAt: Date.now(), ...over });
  async function upload(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ''; if (!f) return;
    err = ''; busy = `Reading ${f.name} on this device…`;
    try {
      const { rows, kind } = await readPlanFile(f);
      const calendarYear = Number(/20\d{2}/.exec(rows.slice(0, 5).flat().join(' ') + ' ' + f.name)?.[0]) || new Date().getFullYear();
      const x = rowsToWeeks(rows, calendarYear);
      if (x.problem) { err = x.problem; busy = ''; return; }
      const yr = Number(/(?:tahun|year)\s*([1-6])/i.exec(rows.slice(0, 5).flat().join(' ') + ' ' + f.name)?.[1]) || classes[0]?.year || 4;
      draft = newPlan({ name: f.name.replace(/\.[^.]+$/, ''), calendarYear, year: yr, source: `${kind} file: ${f.name}`, weeks: x.weeks, classIds: classes.filter((c) => c.year === yr).map((c) => c.id) });
      report = x.found;
      week1 = x.weeks.find((w) => w.week === 1 && w.start)?.start ?? '';
    } catch (x) { err = (x as Error).message; }
    busy = '';
  }
  // build from the SoW
  let bYear = $state(4); let bSchool = $state<'SK' | 'SJK'>('SK'); let bStart = $state(mondayOf(today)); let bWeeks = $state(42); let bPer = $state(3); let bHol = $state('');
  let building = $state(false);
  function holidayWeeks(t: string) { return t.split(/[,\s]+/).flatMap((p) => { const m = /^(\d+)(?:-(\d+))?$/.exec(p.trim()); if (!m) return []; const a = Number(m[1]), b = Number(m[2] ?? m[1]); return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i); }); }
  async function build() {
    const sow = await loadSow(bYear, bSchool);
    const ls = sow.lessons.filter((l) => l.std.main.ls.length);
    draft = newPlan({ name: `English Year ${bYear} ${bSchool} ${bStart.slice(0, 4)}`, calendarYear: Number(bStart.slice(0, 4)), year: bYear, school: bSchool, source: 'Built from the Scheme of Work',
      classIds: classes.filter((c) => c.year === bYear && c.schoolType === bSchool).map((c) => c.id),
      weeks: buildFromSow({ week1Monday: mondayOf(bStart), weeks: bWeeks, perWeek: bPer, holidays: holidayWeeks(bHol), lessonNos: ls.map((l) => l.no), topics: new Map(ls.map((l) => [l.no, l.topic || l.label])), ls: new Map(ls.map((l) => [l.no, l.std.main.ls])) }) });
    report = null; week1 = mondayOf(bStart); building = false;
  }
  // perWeek from the timetable, if the teacher has one
  $effect(() => { getSetting<Slot[]>('timetable', []).then((s) => { const c = classes.find((x) => x.year === bYear); if (c) { const n = s.filter((x) => x.classId === c.id).length; if (n) bPer = n; } }); });
  async function saveDraft() {
    if (!draft) return;
    const d = $state.snapshot(draft) as Plan;
    if (week1) d.weeks = fillDates(d.weeks, mondayOf(week1));
    d.updatedAt = Date.now(); d.name = d.name.trim() || `Yearly plan Year ${d.year}`;
    await db.plans.put(JSON.parse(JSON.stringify(d)));
    draft = null; await refresh(); go('plan', 'year', d.id);
  }
  const missingDates = $derived(draft ? draft.weeks.filter((w) => !w.start).length : 0);

  // ---------------------------------------------------------------- viewing a plan
  let sow = $state<SowLesson[]>([]);
  $effect(() => { const p = plan; if (p) loadSow(p.year, p.school).then((f) => { if (p === plan) sow = f.lessons; }); });
  const sowOf = (n: number) => sow.find((l) => l.no === n);
  const current = $derived(plan ? weekOf(plan, today) : undefined);
  const weekNo = $derived(Number(route.parts[3]) || current?.week || plan?.weeks[0]?.week || 1);
  const wk = $derived(plan?.weeks.find((w) => w.week === weekNo));
  let month = $state(today.slice(0, 7));
  $effect(() => { if (view === 'month' && /^\d{4}-\d{2}$/.test(route.parts[3] ?? '')) month = route.parts[3]; });
  const fmt = (d: string) => (d ? parseDate(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
  // this week's periods for the linked classes, matched to the week's SoW lessons
  let lessons = $state<Lesson[]>([]); let slots = $state<Slot[]>([]); let cancelled = $state<Cancelled>({});
  $effect(() => { Promise.all([listLessons(), getSetting<Slot[]>('timetable', []), getSetting<Cancelled>('cancelled', {})]).then(([l, s, c]) => { lessons = l; slots = s; cancelled = c; }); });
  const periods = $derived(plan && wk?.start ? weekItems(mondayOf(wk.start), slots.filter((s) => plan.classIds.includes(s.classId)), lessons, cancelled) : []);
  function suggestion(i: number) { const byClass = periods.slice(0, i + 1).filter((p) => p.slot.classId === periods[i].slot.classId).length - 1; return wk?.lessons[byClass]; }
  const cname = (id: string) => classes.find((c) => c.id === id)?.name ?? 'Class';
  async function remove() { if (!plan || !confirm(`Delete "${plan.name}"? Your lesson plans are not affected.`)) return; await db.plans.delete(plan.id); await refresh(); go('plan', 'year'); }
  async function exportPlan() {
    if (!plan) return;
    const { sheetsToBlob } = await import('../../lib/export/xlsx'); const { saveFile } = await import('../../lib/export/download');
    const head = ['Week', 'Start', 'End', 'Theme', 'Topic', 'Learning Standards', 'SoW lessons', 'Holiday', 'Notes'].map((v) => ({ value: v, bold: true, fill: '#E3E8F1' }));
    const rows = plan.weeks.map((w) => [w.week, w.start, w.end, w.theme, w.topic, w.ls.join(', '), w.lessons.join(', '), w.holiday, w.notes].map((v) => ({ value: v as string | number })));
    await saveFile(await sheetsToBlob([{ name: 'Yearly plan', rows: [[{ value: plan.name, bold: true }], head, ...rows] }]), `${plan.name.replace(/[^\w-]+/g, '-')}.xlsx`);
  }
  function edit() { if (plan) { draft = structuredClone($state.snapshot(plan)) as Plan; report = null; week1 = plan.weeks.find((w) => w.week === 1)?.start ?? ''; } }
  // month grid: Mon–Fri rows for every week touching the month
  const grid = $derived(plan ? weeksInMonth(plan, month) : []);
</script>

{#if draft}
  <section class="stack" aria-labelledby="yp-check">
    <h2 id="yp-check">Check your yearly plan</h2>
    {#if report}<p class="ok-box card" role="status">Found <b>{draft.weeks.length} weeks</b>: {report.dates} with dates, {report.holidays} holiday or exam weeks, {report.ls} Learning Standards and {report.lessons} SoW lesson numbers. Correct anything below, then save.</p>{/if}
    <div class="card grid">
      <label class="field"><span>Name</span><input id="yp-name" class="input" bind:value={draft.name} /></label>
      <label class="field"><span>Year</span><select class="select" bind:value={draft.year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
      <label class="field"><span>School type</span><select class="select" bind:value={draft.school}><option>SK</option><option>SJK</option></select></label>
      <label class="field"><span>Monday of week 1{missingDates ? ` (${missingDates} weeks have no dates)` : ''}</span><input id="yp-week1" class="input" type="date" bind:value={week1} /></label>
    </div>
    {#if classes.length}<fieldset class="card"><legend>Classes that follow this plan</legend><div class="row">{#each classes as c}<label class="row small"><input type="checkbox" checked={draft.classIds.includes(c.id)} onchange={(e) => { if (!draft) return; draft.classIds = (e.currentTarget as HTMLInputElement).checked ? [...draft.classIds, c.id] : draft.classIds.filter((x) => x !== c.id); }} />{c.name}</label>{/each}</div></fieldset>{/if}
    <div class="tablewrap card"><table class="weeks edit">
      <thead><tr><th>Week</th><th>Starts</th><th>Topic or theme</th><th>SoW lessons</th><th>Holiday / exam</th></tr></thead>
      <tbody>{#each draft.weeks as w, i (i)}<tr class:hol={!!w.holiday}>
        <td><input class="input n" type="number" min="1" max="53" bind:value={w.week} aria-label="Week number" /></td>
        <td><input class="input" type="date" bind:value={w.start} onchange={() => { if (w.start) w.end = addDaysIso(w.start, 4); }} aria-label="Week {w.week} start" /></td>
        <td><input class="input" bind:value={w.topic} placeholder={w.theme} aria-label="Week {w.week} topic" /></td>
        <td><input class="input" value={w.lessons.join(', ')} onchange={(e) => (w.lessons = (e.currentTarget as HTMLInputElement).value.split(/[,\s]+/).map(Number).filter((n) => n > 0))} aria-label="Week {w.week} SoW lessons" /></td>
        <td><input class="input" bind:value={w.holiday} aria-label="Week {w.week} holiday" /></td>
      </tr>{/each}</tbody>
    </table></div>
    <div class="row"><button class="btn btn-outline" type="button" onclick={() => { if (draft) draft.weeks = [...draft.weeks, { week: (draft.weeks.at(-1)?.week ?? 0) + 1, start: '', end: '', holiday: '', theme: '', topic: '', ls: [], lessons: [], notes: '' }]; }}>＋ Add a week</button></div>
    <div class="row sticky"><button id="yp-save" class="btn btn-gold" type="button" onclick={saveDraft}>Save yearly plan</button><button class="btn btn-text" type="button" onclick={() => (draft = null)}>Cancel</button></div>
  </section>

{:else if !plan}
  <div class="stack">
    <p class="muted">Your school's yearly plan (Rancangan Pengajaran Tahunan) shows what to teach each week. Consilia turns it into a monthly and weekly view, and links each week's lessons to your timetable.</p>
    {#if err}<p class="err" role="alert">{err}</p>{/if}
    {#if busy}<p class="busy" role="status">{busy}</p>{/if}
    <div class="choices">
      <section class="card stack tight">
        <h3>📤 Upload my yearly plan</h3>
        <p class="muted small">Word (.docx), Excel (.xlsx), CSV or a PDF made from Word. Consilia reads the table on this device: weeks, dates, topics, Learning Standards, SoW lessons and holidays. Nothing is uploaded anywhere.</p>
        <label class="btn btn-gold up">Choose file<input id="yp-file" type="file" accept=".docx,.xlsx,.csv,.pdf,.txt,.doc,.xls" class="sr-only" onchange={upload} /></label>
      </section>
      <section class="card stack tight">
        <h3>🧩 Build it from the Scheme of Work</h3>
        <p class="muted small">No file? Consilia lays out the SoW lessons week by week, skipping holiday and exam weeks.</p>
        {#if !building}<button id="yp-build-open" class="btn btn-outline" type="button" onclick={() => (building = true)}>Build a plan</button>{:else}
          <div class="grid">
            <label class="field"><span>Year</span><select class="select" bind:value={bYear}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
            <label class="field"><span>School type</span><select class="select" bind:value={bSchool}><option>SK</option><option>SJK</option></select></label>
            <label class="field"><span>Week 1 starts</span><input id="yp-start" class="input" type="date" bind:value={bStart} /></label>
            <label class="field"><span>Teaching weeks</span><input class="input" type="number" min="4" max="52" bind:value={bWeeks} /></label>
            <label class="field"><span>English lessons a week</span><input id="yp-per" class="input" type="number" min="1" max="8" bind:value={bPer} /></label>
            <label class="field"><span>Holiday / exam weeks</span><input id="yp-hol" class="input" bind:value={bHol} placeholder="e.g. 10, 20-21, 30" /></label>
          </div>
          <button id="yp-build" class="btn btn-gold" type="button" onclick={build}>Build</button>
        {/if}
      </section>
    </div>
    {#if plans.length}
      <h3>My yearly plans</h3>
      <div class="choices">{#each plans as p}{@const cw = weekOf(p, today)}<a class="card raised planc" href={href('plan', 'year', p.id)} data-plan={p.name}><b>{p.name}</b><span class="muted small">Year {p.year} {p.school} · {p.weeks.length} weeks{cw ? ` · now week ${cw.week}` : ''}</span></a>{/each}</div>
    {/if}
  </div>

{:else}
  <div class="stack">
    <div class="row between">
      <div><a class="btn btn-text back" href={href('plan', 'year')}><Icon name="back" size={18} />All yearly plans</a><h2 class="pn">{plan.name}</h2>
        <p class="muted small">Year {plan.year} {plan.school} · {plan.weeks.length} weeks{current ? ` · this is week ${current.week}` : ''}{plan.classIds.length ? ` · ${plan.classIds.map(cname).join(', ')}` : ''}</p></div>
      <div class="row"><button class="btn btn-outline" type="button" onclick={exportPlan}>Excel</button><button class="btn btn-outline" type="button" onclick={edit}>Edit</button><button class="btn btn-text del" type="button" onclick={remove}>Delete</button></div>
    </div>
    <nav class="tabs" aria-label="Plan view">
      <a href={href('plan', 'year', plan.id, 'year')} aria-current={view === 'year' ? 'page' : undefined} data-ypview="year">Yearly</a>
      <a href={href('plan', 'year', plan.id, 'month', month)} aria-current={view === 'month' ? 'page' : undefined} data-ypview="month">Monthly</a>
      <a href={href('plan', 'year', plan.id, 'week', weekNo)} aria-current={view === 'week' ? 'page' : undefined} data-ypview="week">Weekly</a>
    </nav>

    {#if view === 'year'}
      <div class="tablewrap card"><table class="weeks">
        <thead><tr><th>Week</th><th>Dates</th><th>Topic</th><th>SoW lessons</th></tr></thead>
        <tbody>{#each plan.weeks as w (w.week)}<tr class:now={current?.week === w.week} class:hol={!!w.holiday}>
          <td><a href={href('plan', 'year', plan.id, 'week', w.week)}>{w.week}</a></td><td class="nowrap">{fmt(w.start)}{w.end ? ` – ${fmt(w.end)}` : ''}</td>
          <td>{w.holiday ? `🏖 ${w.holiday}` : w.topic || w.theme}{w.ls.length ? ` · LS ${w.ls.slice(0, 4).join(', ')}${w.ls.length > 4 ? '…' : ''}` : ''}</td><td>{w.lessons.join(', ')}</td></tr>{/each}</tbody>
      </table></div>
    {:else if view === 'month'}
      <div class="row"><label class="field"><span>Month</span><input id="yp-month" class="input" type="month" bind:value={month} /></label></div>
      {#if !grid.length}<p class="muted">No weeks of this plan fall in this month.</p>{/if}
      <div class="cal">
        <div class="calh">Week</div>{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as d}<div class="calh">{d}</div>{/each}
        {#each grid as w (w.week)}
          <a class="calw" href={href('plan', 'year', plan.id, 'week', w.week)} class:now={current?.week === w.week}><b>{w.week}</b></a>
          {#each [0, 1, 2, 3, 4] as d}{@const day = addDaysIso(w.start, d)}<div class="cald" class:out={day.slice(0, 7) !== month} class:today={day === today}><span class="dn">{Number(day.slice(8))}</span></div>{/each}
          <div class="calt">{w.holiday ? `🏖 ${w.holiday}` : w.topic || w.theme || '—'}{w.lessons.length ? ` · SoW ${w.lessons.join(', ')}` : ''}</div>
        {/each}
      </div>
    {:else if wk}
      <div class="row between">
        <a class="btn btn-outline" href={href('plan', 'year', plan.id, 'week', Math.max(1, weekNo - 1))} aria-label="Previous week"><Icon name="back" size={18} /></a>
        <b class="wkh" id="yp-week-title">Week {wk.week}{wk.start ? ` · ${fmt(wk.start)} – ${fmt(wk.end)}` : ''}</b>
        <a class="btn btn-outline" href={href('plan', 'year', plan.id, 'week', weekNo + 1)} aria-label="Next week"><Icon name="chevron" size={18} /></a>
      </div>
      {#if wk.holiday}<p class="card hol-box">🏖 {wk.holiday}</p>{/if}
      <section class="card stack tight">
        <h3>{wk.topic || wk.theme || 'This week'}</h3>
        {#if wk.ls.length}<p class="small"><b>Learning Standards:</b> {wk.ls.join(', ')}</p>{/if}
        {#if wk.notes}<p class="small muted">{wk.notes}</p>{/if}
        {#if wk.lessons.length}
          <ul class="les">{#each wk.lessons as n}{@const l = sowOf(n)}<li><span><b>SoW lesson {n}</b>{l ? ` · ${l.topic || l.label} · ${l.label}` : ''}</span>
            <a class="btn btn-outline" href={href('plan', 'new', 'sow', n, plan.year, plan.school)} data-plan-sow={n}>Plan it</a></li>{/each}</ul>
        {:else if !wk.holiday}<p class="muted">No SoW lessons listed for this week. Edit the plan to add them.</p>{/if}
      </section>
      {#if plan.classIds.length}
        <section class="card stack tight">
          <h3>Your periods this week</h3>
          {#if !periods.length}<p class="muted small">No timetable periods for these classes. <a href={href('plan', 'week')}>Set up your timetable</a> to match each period with a lesson.</p>{/if}
          <ul class="les">{#each periods as p, i}{@const n = suggestion(i)}<li class:off={!!p.cancelled}>
            <span>{parseDate(p.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })} {p.slot.start} · <b>{cname(p.slot.classId)}</b>{p.lesson ? ` · ${p.lesson.topic}` : n ? ` · suggested SoW lesson ${n}` : ''}</span>
            {#if p.cancelled}<span class="chip">No class</span>{:else if p.lesson}<a class="btn btn-outline" href={href('plan', 'edit', p.lesson.id, 'review')}>Open</a>
            {:else}<a class="btn btn-gold" data-period-plan href={n ? href('plan', 'new', 'sow', n, plan.year, plan.school, p.slot.classId, p.date, p.slot.start, p.slot.durationMin) : href('plan', 'new', p.slot.classId, p.date, p.slot.start, p.slot.durationMin)}>Plan {n ? `lesson ${n}` : 'this lesson'}</a>{/if}
          </li>{/each}</ul>
        </section>
      {/if}
    {:else}<p class="muted">This plan has no week {weekNo}.</p>{/if}
  </div>
{/if}

<style>
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: var(--s-3); }
  h3 { margin: 0; } .up { justify-self: start; }
  .err { color: var(--bad); } .busy { font-weight: 600; }
  .ok-box { margin: 0; border-left: 4px solid var(--ok); }
  .tablewrap { overflow-x: auto; padding: 0; }
  .weeks { width: 100%; border-collapse: collapse; font-size: var(--t-sm); }
  .weeks th, .weeks td { border-bottom: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
  .weeks tr.now { background: var(--gold-soft); } .weeks tr.hol td { color: var(--ink-3); }
  .weeks.edit .input { min-height: 36px; padding: 4px 8px; font-size: var(--t-sm); min-width: 90px; } .weeks.edit .n { width: 64px; min-width: 64px; }
  .nowrap { white-space: nowrap; }
  .sticky { position: sticky; bottom: var(--s-3); background: var(--card); border: 1px solid var(--line); border-radius: var(--r-card); padding: var(--s-3); box-shadow: var(--shadow-raised); }
  @media (max-width: 767px) { .sticky { bottom: calc(var(--tabbar-h) + var(--s-2)); } }
  .between { justify-content: space-between; align-items: center; }
  .back { justify-self: start; padding-left: 0; } .pn { margin: 0; }
  .planc { display: grid; gap: 4px; text-decoration: none; color: var(--ink); }
  .del { color: var(--bad); }
  .cal { display: grid; grid-template-columns: 56px repeat(5, minmax(0, 1fr)); gap: 4px; }
  .calh { font-size: var(--t-xs); font-weight: 700; color: var(--ink-2); text-transform: uppercase; padding: 4px; }
  .calw { display: grid; place-items: center; background: var(--sunken); border-radius: 8px; text-decoration: none; color: var(--ink); min-height: 44px; }
  .calw.now { background: var(--gold-soft); border: 2px solid var(--gold-strong); }
  .cald { background: var(--card); border: 1px solid var(--line); border-radius: 8px; min-height: 44px; padding: 4px 6px; display: grid; align-content: start; gap: 2px; overflow: hidden; }
  .cald.out { opacity: .45; } .cald.today { border: 2px solid var(--navy); }
  .dn { font: 600 var(--t-xs) var(--f-mono); color: var(--ink-3); }
  .calt { grid-column: 1 / -1; font-size: var(--t-sm); font-weight: 600; padding: 2px 6px var(--s-2); border-bottom: 1px solid var(--line); }
  .wkh { font-size: var(--t-lg); text-align: center; }
  .hol-box { margin: 0; border-left: 4px solid var(--warn); }
  .les { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-2); }
  .les li { display: flex; justify-content: space-between; align-items: center; gap: var(--s-2); flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: var(--s-2); }
  .les li.off { opacity: .6; }
</style>
