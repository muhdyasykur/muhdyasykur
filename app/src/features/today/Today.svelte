<script lang="ts">
  import { t } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { profile } from '../../lib/profile.svelte';
  import { listClasses, listLessons, getSetting } from '../../lib/db/repo';
  import { DAYS, iso, mondayOf, nextItem, weekItems, parseDate, type Slot, type Cancelled, type WeekItem } from '../../lib/timetable';
  import { runChecks } from '../../lib/lesson/checker';
  import type { Lesson } from '../../lib/lesson/model';
  import type { SchoolClass } from '../../lib/db/schema';
  import Icon from '../../lib/ui/Icon.svelte';
  import Logo from '../../lib/ui/Logo.svelte';
  import ScoreRing from '../../lib/ui/ScoreRing.svelte';

  let loaded = $state(false);
  let lessons = $state<Lesson[]>([]);
  let classes = $state<SchoolClass[]>([]);
  let slots = $state<Slot[]>([]);
  let cancelled = $state<Cancelled>({});
  $effect(() => {
    Promise.all([listLessons(), listClasses(), getSetting<Slot[]>('timetable', []), getSetting<Cancelled>('cancelled', {})])
      .then(([l, c, s, x]) => { lessons = l; classes = c; slots = s; cancelled = x; loaded = true; });
  });

  const now = new Date();
  const today = iso(now);
  const next = $derived<WeekItem | null>(nextItem(now, slots, lessons, cancelled));
  const week = $derived(weekItems(mondayOf(today), slots, lessons, cancelled).filter((i) => !i.cancelled));
  const unplanned = $derived(week.filter((i) => !i.lesson && i.date >= today));
  const weak = $derived(lessons.filter((l) => l.status !== 'taught' && l.header.date >= today).map((l) => ({ l, score: runChecks(l).score })).filter((x) => x.score < 80));
  const cname = (id: string) => classes.find((c) => c.id === id)?.name ?? '';
  const when = (d: string) => (d === today ? 'Today' : parseDate(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }));
  const first = $derived((profile.value?.name ?? '').split(/\s+/)[0]);
</script>

<div class="stack">
  <header class="hello">
    <Logo size={56} animate />
    <div>
      <p class="eyebrow">{DAYS[((now.getDay() + 6) % 7) + 1]} · {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
      <h1>{first ? `Hello, ${first}` : t('today.greeting')}</h1>
      <p class="muted"><i>{t('app.tagline')}</i></p>
    </div>
  </header>

  {#if loaded}
    {#if next}
      <section class="card raised next" aria-label="Next lesson">
        <p class="eyebrow">Next lesson · {when(next.date)} {next.slot.start}</p>
        {#if next.lesson}
          {@const s = runChecks(next.lesson).score}
          <div class="row nl"><ScoreRing score={s} size={64} /><div><h2>{next.lesson.topic || 'Untitled lesson'}</h2><p class="muted">{cname(next.slot.classId)} · {next.lesson.mainSkill} · {next.lesson.status === 'ready' ? 'Ready' : 'Draft'}</p></div></div>
          <div class="row">
            <a class="btn btn-primary" href={href('plan', 'edit', next.lesson.id, s < 100 ? 'review' : 'setup')}>{s < 100 ? 'See what to fix' : 'Open RPH'}</a>
            <a class="btn btn-outline" href={href('plan', 'edit', next.lesson.id, 'review')}>Print</a>
          </div>
          <p class="muted small">Teach mode, with the stage timer and classroom tools, arrives in milestone 4.</p>
        {:else}
          <h2>{cname(next.slot.classId)} has no RPH yet</h2>
          <a class="btn btn-gold" href={href('plan', 'new', next.slot.classId, next.date, next.slot.start, next.slot.durationMin)}><Icon name="plus" size={18} />Plan this lesson</a>
        {/if}
      </section>
    {:else if !slots.length}
      <section class="empty">
        <h3>{lessons.length ? 'Add your timetable' : t('today.empty.title')}</h3>
        <p>{lessons.length ? 'With your English periods set once, Today shows your next lesson and what still needs planning.' : t('today.empty.body')}</p>
        <div class="row">
          <a class="btn btn-gold" href={href('plan', 'new')}><Icon name="plus" size={18} />{t('today.newRph')}</a>
          <a class="btn btn-outline" href={href('plan', 'week')}>Set up timetable</a>
        </div>
      </section>
    {/if}

    {#if unplanned.length || weak.length}
      <section class="stack tight" aria-label="To do">
        <h3>To do</h3>
        <ul class="nudges">
          {#each unplanned as u}<li><span class="dot warn"></span><span>{cname(u.slot.classId)}, {when(u.date)} {u.slot.start}: no RPH yet.</span><a class="btn btn-text" href={href('plan', 'new', u.slot.classId, u.date, u.slot.start, u.slot.durationMin)}>Plan</a></li>{/each}
          {#each weak as w}<li><span class="dot bad"></span><span>"{w.l.topic || 'Untitled'}" ({when(w.l.header.date)}) scores {w.score}. Aim for 80 or more.</span><a class="btn btn-text" href={href('plan', 'edit', w.l.id, 'review')}>Fix</a></li>{/each}
        </ul>
      </section>
    {/if}

    {#if week.length}
      <section class="stack tight" aria-label="This week">
        <div class="row between"><h3>This week</h3><a class="btn btn-text" href={href('plan', 'week')}>Open planner</a></div>
        <ul class="week">
          {#each week as w (w.slot.id + w.date)}
            <li class:past={w.date < today}>
              <span class="when">{when(w.date)}<br /><span class="muted">{w.slot.start}</span></span>
              <span class="what"><b>{w.lesson?.topic || 'Not planned'}</b><span class="muted small">{cname(w.slot.classId)}</span></span>
              {#if w.lesson}<ScoreRing score={runChecks(w.lesson).score} size={36} />{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .hello { display: flex; gap: var(--s-4); align-items: center; flex-wrap: wrap; }
  .small { font-size: var(--t-sm); }
  .tight { gap: var(--s-2); }
  .between { justify-content: space-between; }
  .next { gap: var(--s-3); border-left: 4px solid var(--gold-strong); }
  .nl { flex-wrap: nowrap; gap: var(--s-3); }
  .nudges, .week { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .nudges li { display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; gap: var(--s-2); align-items: center; padding: var(--s-1) var(--s-3); background: var(--card); border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.warn { background: var(--warn); } .dot.bad { background: var(--bad); }
  .week li { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: var(--s-3); align-items: center; padding: var(--s-2) var(--s-3); background: var(--card); border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .week li.past { opacity: .6; }
  .when { font-size: var(--t-sm); font-weight: 600; }
  .what { display: grid; min-width: 0; }
</style>
