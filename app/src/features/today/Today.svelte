<script lang="ts">
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import { tr, dateLocale } from '../../lib/i18n/index.svelte';
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
  import { db } from '../../lib/db/schema';
  import { lastBackup } from '../../lib/backup';

  let loaded = $state(false);
  let lessons = $state<Lesson[]>([]);
  let classes = $state<SchoolClass[]>([]);
  let slots = $state<Slot[]>([]);
  let cancelled = $state<Cancelled>({});
  let reflected = $state<Set<string>>(new Set());
  let backupAge = $state<number | null>(null);
  $effect(() => {
    Promise.all([listLessons(), listClasses(), getSetting<Slot[]>('timetable', []), getSetting<Cancelled>('cancelled', {})])
      .then(async ([l, c, s, x]) => { lessons = l; classes = c; slots = s; cancelled = x; reflected = new Set((await db.reflections.toArray()).map((r) => r.lessonId)); const lb = await lastBackup(); backupAge = lb ? Math.floor((Date.now() - lb) / 86400000) : -1; loaded = true; });
  });

  const now = new Date();
  const today = iso(now);
  const next = $derived<WeekItem | null>(nextItem(now, slots, lessons, cancelled));
  const week = $derived(weekItems(mondayOf(today), slots, lessons, cancelled).filter((i) => !i.cancelled));
  const unplanned = $derived(week.filter((i) => !i.lesson && i.date >= today));
  const weak = $derived(lessons.filter((l) => l.status !== 'taught' && l.header.date >= today).map((l) => ({ l, score: runChecks(l).score })).filter((x) => x.score < 80));
  const needBackup = $derived(lessons.length > 0 && (backupAge === -1 || (backupAge ?? 0) > 7));
  const toReflect = $derived(lessons.filter((l) => l.status === 'taught' && !reflected.has(l.id)).slice(0, 3));
  const cname = (id: string) => classes.find((c) => c.id === id)?.name ?? '';
  const when = (d: string) => (d === today ? tr('Today') : parseDate(d).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'short' }));
  const first = $derived((profile.value?.name ?? '').split(/\s+/)[0]);
</script>

<div class="stack">
  <header class="hello">
    <Logo size={56} animate />
    <div>
      <p class="eyebrow">{now.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1>{first ? tr('Hello, {first}', { first }) : t('today.greeting')}</h1>
      <p class="muted"><i>{t('app.tagline')}</i></p>
    </div>
  </header>
  <nav class="quicklinks" aria-label={tr('Shortcuts')}>
    <a class="btn btn-outline" href={href('plan', 'day')} data-quick="day">{tr('📅 My day')}</a>
    <a class="btn btn-outline" href={href('plan', 'year')}>{tr('🗓 Yearly plan')}</a>
    <a class="btn btn-outline" href={href('classes')}>{tr('✓ Attendance')}</a>
    <a class="btn btn-outline" href={href('tools')}>{tr('🧰 Tools')}</a>
  </nav>

  {#if loaded}
    {#if next}
      <section class="card raised next" aria-label={tr('Next lesson')}>
        <p class="eyebrow">{tr('Next lesson · {x} {start}', { x: when(next.date), start: next.slot.start })}</p>
        {#if next.lesson}
          {@const s = runChecks(next.lesson).score}
          <div class="row nl"><ScoreRing score={s} size={64} /><div><h2>{next.lesson.topic || tr('Untitled lesson')}</h2><p class="muted">{cname(next.slot.classId)} · {next.lesson.mainSkill} · {next.lesson.status === 'ready' ? tr('Ready') : tr('Draft')}</p></div></div>
          <div class="row">
            <a class="btn btn-gold" href={href('teach', next.lesson.id)}>{tr('▶ Teach')}</a>
            <a class="btn btn-outline" href={href('plan', 'edit', next.lesson.id, s < 100 ? 'review' : 'setup')}>{s < 100 ? tr('See what to fix') : tr('Open lesson plan')}</a>
          </div>
        {:else}
          <h2>{tr('{x} has no lesson plan yet', { x: cname(next.slot.classId) })}</h2>
          <a class="btn btn-gold" href={href('plan', 'new', next.slot.classId, next.date, next.slot.start, next.slot.durationMin)}><Icon name="plus" size={18} />{tr('Plan this lesson')}</a>
          <a class="btn btn-outline" href={href('plan', 'new', 'recommend', next.slot.classId, next.date, next.slot.start, next.slot.durationMin)}>{tr('✨ Let Consilia plan it')}</a>
        {/if}
      </section>
    {:else if !slots.length}
      <EmptyState icon="today" title={lessons.length ? tr('Add your timetable') : t('today.empty.title')}>
        {lessons.length ? tr('With your English periods set once, Today shows your next lesson and what still needs planning.') : t('today.empty.body')}
        {#snippet actions()}
          <a class="btn btn-gold" href={href('plan', 'new')}><Icon name="plus" size={18} />{t('today.newRph')}</a>
          <a class="btn btn-outline" href={href('plan', 'new', 'recommend')}>{tr('✨ Let Consilia plan it')}</a>
          <a class="btn btn-outline" href={href('plan', 'week')}>{tr('Set up timetable')}</a>
        {/snippet}
      </EmptyState>
    {/if}

    {#if unplanned.length || weak.length || toReflect.length || needBackup}
      <section class="stack tight" aria-label={tr('To do')}>
        <h3>{tr('To do')}</h3>
        <ul class="nudges">
          {#each unplanned as u}<li><span class="dot warn"></span><span>{tr('{x}, {x2} {start}: no lesson plan yet.', { x: cname(u.slot.classId), x2: when(u.date), start: u.slot.start })}</span><a class="btn btn-text" href={href('plan', 'new', u.slot.classId, u.date, u.slot.start, u.slot.durationMin)}>{tr('Plan')}</a></li>{/each}
          {#if needBackup}<li><span class="dot warn"></span><span>{tr('{x} One file keeps your lessons safe if this device is lost.', { x: backupAge === -1 ? tr('You have not backed up yet.') : tr('Your last backup was {backupAge} days ago.', { backupAge }) })}</span><a class="btn btn-text" href={href('me')}>{tr('Back up')}</a></li>{/if}
          {#each toReflect as r}<li><span class="dot ok"></span><span>{tr('You taught "{x}". Write your reflection while it is fresh.', { x: r.topic || tr('a lesson') })}</span><a class="btn btn-text" href={href('plan', 'reflect', r.id)}>{tr('Reflect')}</a></li>{/each}
          {#each weak as w}<li><span class="dot bad"></span><span>{tr('"{x}" ({x2}) scores {score}. Aim for 80 or more.', { x: w.l.topic || tr('Untitled'), x2: when(w.l.header.date), score: w.score })}</span><a class="btn btn-text" href={href('plan', 'edit', w.l.id, 'review')}>{tr('Fix')}</a></li>{/each}
        </ul>
      </section>
    {/if}

    {#if week.length}
      <section class="stack tight" aria-label={tr('This week')}>
        <div class="row between"><h3>{tr('This week')}</h3><a class="btn btn-text" href={href('plan', 'week')}>{tr('Open planner')}</a></div>
        <ul class="week">
          {#each week as w (w.slot.id + w.date)}
            <li class:past={w.date < today}>
              <span class="when">{when(w.date)}<br /><span class="muted">{w.slot.start}</span></span>
              <span class="what"><b>{w.lesson?.topic || tr('Not planned')}</b><span class="muted small">{cname(w.slot.classId)}</span></span>
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

  .next { gap: var(--s-3); border-left: 4px solid var(--gold-strong); }
  .nl { flex-wrap: nowrap; gap: var(--s-3); }
  .nudges, .week { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .nudges li { display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; gap: var(--s-2); align-items: center; padding: var(--s-1) var(--s-3); background: var(--card); border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.warn { background: var(--warn); } .dot.ok { background: var(--ok); } .dot.bad { background: var(--bad); }
  .week li { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: var(--s-3); align-items: center; padding: var(--s-2) var(--s-3); background: var(--card); border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .week li.past { opacity: .6; }
  .when { font-size: var(--t-sm); font-weight: 600; }
  .what { display: grid; min-width: 0; }
  .quicklinks { display: flex; flex-wrap: wrap; gap: var(--s-2); }
</style>
