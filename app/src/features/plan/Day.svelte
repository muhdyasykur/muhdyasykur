<script lang="ts">
  import { tr, dateLocale } from '../../lib/i18n/index.svelte';
  import { route, href } from '../../router.svelte';
  import { listClasses, listLessons, getSetting } from '../../lib/db/repo';
  import { db, type DayPlan, type SchoolClass } from '../../lib/db/schema';
  import { addDays, iso, parseDate, type Slot, type Cancelled } from '../../lib/timetable';
  import { buildDay, sortByTime, toPlan, type DayRow } from '../../lib/day';
  import { runChecks } from '../../lib/lesson/checker';
  import { uid, type Lesson } from '../../lib/lesson/model';
  import { weekOf, type PlanWeek } from '../../lib/yearplan';
  import Icon from '../../lib/ui/Icon.svelte';

  /** My day: everything on one day, in the order the teacher wants, with what to do next for each item. */
  const today = iso(new Date());
  const date = $derived(/^\d{4}-\d{2}-\d{2}$/.test(route.parts[1] ?? '') ? route.parts[1] : today);
  let classes = $state<SchoolClass[]>([]); let lessons = $state<Lesson[]>([]); let slots = $state<Slot[]>([]); let cancelled = $state<Cancelled>({});
  let rows = $state<DayRow[]>([]); let note = $state(''); let ready = $state(false);
  let plans = $state<{ name: string; week: PlanWeek }[]>([]);
  const cname = (id: string) => classes.find((c) => c.id === id)?.name ?? tr('Class');
  async function load(d: string) {
    ready = false;
    [classes, lessons, slots, cancelled] = await Promise.all([listClasses(), listLessons(), getSetting<Slot[]>('timetable', []), getSetting<Cancelled>('cancelled', {})]);
    const saved = await db.days.get(d);
    if (d !== date) return;
    rows = buildDay(d, slots, lessons, cancelled, saved, cname); note = saved?.note ?? '';
    plans = (await db.plans.toArray()).map((p) => ({ name: p.name, week: weekOf(p, d) })).filter((x): x is { name: string; week: PlanWeek } => !!x.week);
    ready = true;
  }
  $effect(() => { load(date); });
  async function save() { await db.days.put(JSON.parse(JSON.stringify(toPlan(date, rows, note))) as DayPlan); }
  function move(i: number, d: number) { const j = i + d; if (j < 0 || j >= rows.length) return; const r = [...rows]; [r[i], r[j]] = [r[j], r[i]]; rows = r; save(); }
  function toggle(i: number) { rows[i].item.done = !rows[i].item.done; save(); }
  function sortTime() { rows = sortByTime(rows); save(); }
  let time = $state('10:00'); let title = $state('');
  function addExtra() { if (!title.trim()) return; rows = [...rows, { item: { id: uid(), kind: 'extra', ref: '', time, title: title.trim(), done: false }, lesson: null, slot: null, cancelled: null }]; title = ''; save(); }
  function removeExtra(i: number) { rows = rows.filter((_, k) => k !== i); save(); }
  const nice = (d: string) => parseDate(d).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
  const doneCount = $derived(rows.filter((r) => r.item.done).length);
  // drag to reorder (mouse and touch), as well as the ↑ ↓ buttons
  let dragFrom = $state(-1);
  function drop(i: number) { if (dragFrom < 0 || dragFrom === i) return; const r = [...rows]; const [x] = r.splice(dragFrom, 1); r.splice(i, 0, x); rows = r; dragFrom = -1; save(); }
</script>

<div class="stack day">
  <div class="row between">
    <div class="row">
      <a class="btn btn-outline" href={href('plan', 'day', addDays(date, -1))} aria-label={tr('Previous day')}><Icon name="back" size={18} /></a>
      <b class="dt" id="day-title">{nice(date)}</b>
      <a class="btn btn-outline" href={href('plan', 'day', addDays(date, 1))} aria-label={tr('Next day')}><Icon name="chevron" size={18} /></a>
      {#if date !== today}<a class="btn btn-text" href={href('plan', 'day')}>{tr('Today')}</a>{/if}
    </div>
    {#if rows.length > 1}<button class="btn btn-text" type="button" onclick={sortTime}>{tr('Sort by time')}</button>{/if}
  </div>

  {#each plans as p}<p class="yp card" data-yearplan><b>{tr('{name}, week {week}:', { name: p.name, week: p.week.week })}</b> {#if p.week.holiday}<Icon name="sun" size={16} /> {p.week.holiday}{:else}{[p.week.topic || p.week.theme, p.week.lessons.length ? `SoW lessons ${p.week.lessons.join(', ')}` : ''].filter(Boolean).join(' · ')}{/if} <a href={href('plan', 'year')}>{tr('Yearly plan')}</a></p>{/each}

  {#if ready && !rows.length}
    <section class="empty card"><h3>{tr('Nothing on this day yet')}</h3><p class="muted">{tr('Your English periods appear here from your timetable, together with lesson plans dated this day. Add your own items below.')}</p>
      <a class="btn btn-outline" href={href('plan', 'week')}>{tr('Set up timetable')}</a></section>
  {/if}
  {#if rows.length}<p class="muted small" aria-live="polite">{tr('{doneCount} of {length} done. Drag or use ↑ ↓ to arrange your day.', { doneCount, length: rows.length })}</p>{/if}

  <ol class="items">
    {#each rows as r, i (r.item.id)}
      {@const score = r.lesson ? runChecks(r.lesson).score : null}
      <li class="card it" class:done={r.item.done} class:off={!!r.cancelled} draggable="true" ondragstart={() => (dragFrom = i)} ondragover={(e) => e.preventDefault()} ondrop={() => drop(i)} data-day-item={r.item.kind}>
        <div class="handle" aria-hidden="true">⋮⋮</div>
        <label class="tick"><input type="checkbox" checked={r.item.done} onchange={() => toggle(i)} aria-label={tr('Done: {title}', { title: r.item.title })} /></label>
        <div class="body">
          <div class="row t"><span class="time">{r.item.time}</span><b>{r.item.title}</b>
            {#if r.cancelled}<span class="chip">{tr('No class: {cancelled}', { cancelled: r.cancelled })}</span>{:else if r.item.kind !== 'extra'}<span class="chip {r.lesson ? 'ok' : 'warn'}">{r.lesson ? tr('Planned · {score}', { score }) : tr('No lesson plan yet')}</span>{/if}</div>
          <div class="row acts">
            {#if r.item.kind !== 'extra' && !r.cancelled}
              {#if r.lesson}
                <a class="btn btn-outline" href={href('plan', 'edit', r.lesson.id, (score ?? 100) < 100 ? 'review' : 'setup')}>{tr('Open')}</a>
                <a class="btn btn-gold" href={href('teach', r.lesson.id)}><Icon name="play" size={18} />{tr('Teach')}</a>
              {:else if r.slot}
                <a class="btn btn-gold" href={href('plan', 'new', r.slot.classId, date, r.slot.start, r.slot.durationMin)}>{tr('Plan this lesson')}</a>
                <a class="btn btn-outline" href={href('plan', 'new', 'recommend', r.slot.classId, date, r.slot.start, r.slot.durationMin)}><Icon name="sparkle" size={18} />{tr('Let Consilia plan it')}</a>
              {/if}
              {#if r.slot || r.lesson?.classId}<a class="btn btn-outline" href={href('classes', (r.slot?.classId ?? r.lesson?.classId)!, 'attendance', date)}><Icon name="check" size={18} />{tr('Attendance')}</a>{/if}
            {/if}
            {#if r.item.kind === 'extra'}<button class="btn btn-text del" type="button" onclick={() => removeExtra(i)}>{tr('Remove')}</button>{/if}
          </div>
        </div>
        <div class="mv"><button class="btn btn-text" type="button" aria-label={tr('Move up')} disabled={i === 0} onclick={() => move(i, -1)}>↑</button><button class="btn btn-text" type="button" aria-label={tr('Move down')} disabled={i === rows.length - 1} onclick={() => move(i, 1)}>↓</button></div>
      </li>
    {/each}
  </ol>

  <section class="card stack tight">
    <h3>{tr('Add to my day')}</h3>
    <div class="row addrow">
      <input class="input t" type="time" bind:value={time} aria-label={tr('Time')} />
      <input id="day-add" class="input grow" bind:value={title} placeholder={tr('e.g. Relief class 4 Cemerlang, meeting, marking')} onkeydown={(e) => { if (e.key === 'Enter') addExtra(); }} aria-label={tr('What')} />
      <button id="day-add-btn" class="btn btn-primary" type="button" onclick={addExtra} disabled={!title.trim()}>{tr('Add')}</button>
    </div>
    <label class="field"><span>{tr('Notes for the day')}</span><textarea class="input ta" rows="2" bind:value={note} onchange={save} placeholder="Reminders: bring the speaker, collect workbooks…"></textarea></label>
  </section>
</div>

<style>
  .between { justify-content: space-between; align-items: center; }
  .dt { font-size: var(--t-lg); }

  .yp { margin: 0; padding: var(--s-2) var(--s-3); border-left: 4px solid var(--navy-2); }
  .items { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--s-2); }
  .it { display: grid; grid-template-columns: auto auto 1fr auto; gap: var(--s-2); align-items: start; padding: var(--s-3); }
  .it.done { opacity: .65; } .it.done b { text-decoration: line-through; }
  .it.off { opacity: .6; }
  .handle { cursor: grab; color: var(--ink-3); padding-top: 10px; user-select: none; }
  .tick { min-height: var(--tap); display: flex; align-items: center; }
  .body { display: grid; gap: var(--s-2); min-width: 0; }
  .t { align-items: center; gap: var(--s-2); }
  .time { font: 600 var(--t-sm) var(--f-mono); color: var(--gold); }
  .chip.ok { color: var(--ok); } .chip.warn { color: var(--warn); }
  .acts { gap: var(--s-2); }
  .mv { display: grid; }
  .mv .btn { min-height: 36px; padding: 0 10px; }
  .addrow { align-items: center; }
  .grow { flex: 1; min-width: 180px; }
  .input.t { width: auto; }
  .ta { min-height: 60px; padding: var(--s-2) var(--s-3); }

  .empty h3 { margin: 0; }
</style>
