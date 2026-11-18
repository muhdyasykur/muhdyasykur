<script lang="ts">
  import { tr, dateLocale, t } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { profile } from '../../lib/profile.svelte';
  import { listClasses, listLessons, getSetting } from '../../lib/db/repo';
  import { iso, mondayOf, nextItem, weekItems, parseDate, type Slot, type Cancelled, type WeekItem } from '../../lib/timetable';
  import { addDays } from '../../lib/dates';
  import { runChecks } from '../../lib/lesson/checker';
  import type { Lesson } from '../../lib/lesson/model';
  import type { SchoolClass } from '../../lib/db/schema';
  import Icon from '../../lib/ui/Icon.svelte';
  import ClayIcon from '../../lib/ui/ClayIcon.svelte';
  import ScoreRing from '../../lib/ui/ScoreRing.svelte';
  import HeroScene from '../../lib/ui/art/HeroScene.svelte';
  import Scene from '../../lib/ui/art/Scene.svelte';
  import PlaneTrail from '../../lib/ui/PlaneTrail.svelte';
  import Carousel from '../../lib/ui/Carousel.svelte';
  import { db } from '../../lib/db/schema';
  import { lastBackup } from '../../lib/backup';
  import { TOOLS, type ToolMeta } from '../../lib/studio/catalogue';
  import { prefs, toggleFav } from '../../lib/studio/prefs.svelte';
  import { openPanel } from '../../lib/ui/shell.svelte';

  /**
   * Today, as a dashboard (the island-app look): a greeting, the next lesson as the featured card, today's periods in a
   * teal card like a weather forecast, the week as a route with five stops, what is coming up, what still needs doing,
   * and the tools you use most.
   */
  let loaded = $state(false);
  let lessons = $state<Lesson[]>([]);
  let classes = $state<SchoolClass[]>([]);
  let slots = $state<Slot[]>([]);
  let cancelled = $state<Cancelled>({});
  let reflected = $state<Set<string>>(new Set());
  let backupAge = $state<number | null>(null);
  $effect(() => {
    Promise.all([listLessons(), listClasses(), getSetting<Slot[]>('timetable', []), getSetting<Cancelled>('cancelled', {})])
      .then(async ([l, c, s, x]) => { lessons = l; classes = c; slots = s; cancelled = x; reflected = new Set((await db.reflections.toArray()).map((r) => r.lessonId)); const lb = await lastBackup(); backupAge = lb ? Math.floor((Date.now() - lb) / 864e5) : -1; loaded = true; });
  });

  const now = new Date();
  const today = iso(now);
  const monday = mondayOf(today);
  const next = $derived<WeekItem | null>(nextItem(now, slots, lessons, cancelled));
  const week = $derived(weekItems(monday, slots, lessons, cancelled).filter((i) => !i.cancelled));
  const todays = $derived(week.filter((i) => i.date === today));
  const upcoming = $derived(week.filter((i) => i.date > today || (i.date === today && i !== next)).filter((i) => i.date >= today).slice(0, 3));
  const unplanned = $derived(week.filter((i) => !i.lesson && i.date >= today));
  const weak = $derived(lessons.filter((l) => l.status !== 'taught' && l.header.date >= today).map((l) => ({ l, score: runChecks(l).score })).filter((x) => x.score < 80));
  const needBackup = $derived(lessons.length > 0 && (backupAge === -1 || (backupAge ?? 0) > 7));
  const toReflect = $derived(lessons.filter((l) => l.status === 'taught' && !reflected.has(l.id)).slice(0, 3));
  const cname = (id: string) => classes.find((c) => c.id === id)?.name ?? '';
  const when = (d: string) => (d === today ? tr('Today') : parseDate(d).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'short' }));
  const first = $derived((profile.value?.name ?? '').split(/\s+/)[0]);
  // the week as five stops
  const stops = $derived([0, 1, 2, 3, 4].map((i) => {
    const date = addDays(monday, i);
    const items = week.filter((w) => w.date === date);
    const planned = items.filter((w) => w.lesson).length;
    return { date, items: items.length, planned, day: parseDate(date).toLocaleDateString(dateLocale(), { weekday: 'short' }), full: parseDate(date).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }) };
  }));
  const POS = [[8, 74], [29, 30], [50, 66], [71, 24], [92, 58]];
  // tools: favourites, then recent, then the most useful
  const myTools = $derived(([...prefs.fav, ...prefs.recent, 'lesson-plan', 'quiz', 'text', 'games', 'worksheets', 'song'].map((id) => TOOLS.find((x) => x.id === id)).filter((x, i, a): x is ToolMeta => !!x && a.indexOf(x) === i)).slice(0, 6));
  const toolHref = (x: ToolMeta) => (x.route === 'recommend' ? href('plan', 'new', 'recommend') : href('tools', x.id));
</script>

<div class="today">
  <header class="greet">
    <div class="gtxt">
      <p class="eyebrow">{now.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <div class="hrow"><h1>{first ? tr('Hello, {first}', { first }) : t('today.greeting')}</h1><span class="wave" aria-hidden="true">👋</span></div>
      <p class="lead">{tr('Ready for today\'s lessons?')} <span class="script">{tr('Teach with joy')}</span></p>
    </div>
    <button class="searchpill" type="button" onclick={() => openPanel('search')} data-open="search-today"><Icon name="search" size={20} /><span>{tr('Search lessons, tools, topics…')}</span><kbd aria-hidden="true">Ctrl K</kbd></button>
  </header>

  <nav class="quicklinks" aria-label={tr('Shortcuts')}>
    <a href={href('plan', 'day')} data-quick="day"><ClayIcon name="day" tone="blue" size={34} />{tr('My day')}</a>
    <a href={href('plan', 'year')}><ClayIcon name="year" tone="purple" size={34} />{tr('Yearly plan')}</a>
    <a href={href('classes')}><ClayIcon name="check" tone="teal" size={34} />{tr('Attendance')}</a>
    <a href={href('tools')}><ClayIcon name="tools" tone="gold" size={34} />{tr('Tools')}</a>
  </nav>

  {#if loaded}
    <div class="dash">
      <div class="col">
        {#if next}
          {@const s = next.lesson ? runChecks(next.lesson).score : 0}
          <section class="feature next" aria-labelledby="next-h">
            <div class="ftxt">
              <p class="kicker">{tr('Next lesson · {x} {start}', { x: when(next.date), start: next.slot.start })}</p>
              <h2 id="next-h">{next.lesson ? next.lesson.topic || tr('Untitled lesson') : tr('{x} has no lesson plan yet', { x: cname(next.slot.classId) })}</h2>
              <ul class="facts">
                <li><Icon name="classes" size={20} /><span><b>{cname(next.slot.classId) || '–'}</b><small>{tr('Class')}</small></span></li>
                <li><Icon name="timer" size={20} /><span><b>{tr('{d} min', { d: next.slot.durationMin })}</b><small>{tr('Length')}</small></span></li>
                {#if next.lesson}<li><Icon name="check" size={20} /><span><b>{next.lesson.status === 'ready' ? tr('Ready') : tr('Draft')}</b><small>{next.lesson.mainSkill || tr('Lesson')}</small></span></li>{/if}
              </ul>
              <div class="row">
                {#if next.lesson}
                  <a class="btn btn-gold" href={href('teach', next.lesson.id)}><Icon name="play" size={18} />{tr('Teach')}</a>
                  <a class="btn btn-outline" href={href('plan', 'edit', next.lesson.id, s < 100 ? 'review' : 'setup')}>{s < 100 ? tr('See what to fix') : tr('Open lesson plan')}</a>
                {:else}
                  <a class="btn btn-gold" href={href('plan', 'new', next.slot.classId, next.date, next.slot.start, next.slot.durationMin)}><Icon name="plus" size={18} />{tr('Plan this lesson')}</a>
                  <a class="btn btn-outline" href={href('plan', 'new', 'recommend', next.slot.classId, next.date, next.slot.start, next.slot.durationMin)}><Icon name="sparkle" size={18} />{tr('Let Consilia plan it')}</a>
                {/if}
              </div>
            </div>
            <div class="fart">
              <HeroScene />
              {#if next.lesson}<span class="score"><ScoreRing score={s} size={58} /></span>{/if}
              <span class="where"><Icon name="classes" size={14} />{cname(next.slot.classId)}</span>
            </div>
          </section>
        {:else if !slots.length}
          <section class="feature welcome empty" aria-labelledby="welcome-h">
            <div class="ftxt">
              <p class="kicker">{tr('Start here')}</p>
              <h2 id="welcome-h">{lessons.length ? tr('Add your timetable') : t('today.empty.title')}</h2>
              <p class="muted">{lessons.length ? tr('With your English periods set once, Today shows your next lesson and what still needs planning.') : t('today.empty.body')}</p>
              <div class="row">
                <a class="btn btn-gold" href={href('plan', 'new')}><Icon name="plus" size={18} />{t('today.newRph')}</a>
                <a class="btn btn-outline" href={href('plan', 'new', 'recommend')}><Icon name="sparkle" size={18} />{tr('Let Consilia plan it')}</a>
                <a class="btn btn-text" href={href('plan', 'week')}>{tr('Set up timetable')}</a>
              </div>
            </div>
            <div class="fart"><HeroScene /></div>
          </section>
        {/if}

        {#if unplanned.length || weak.length || toReflect.length || needBackup}
          <section class="card raised todo" aria-labelledby="todo-h">
            <div class="row between"><h3 id="todo-h">{tr('To do')}</h3><span class="count">{unplanned.length + weak.length + toReflect.length + (needBackup ? 1 : 0)}</span></div>
            <ul class="nudges">
              {#each unplanned as u}<li><span class="dot warn"></span><span>{tr('{x}, {x2} {start}: no lesson plan yet.', { x: cname(u.slot.classId), x2: when(u.date), start: u.slot.start })}</span><a class="btn btn-text" href={href('plan', 'new', u.slot.classId, u.date, u.slot.start, u.slot.durationMin)}>{tr('Plan')}</a></li>{/each}
              {#if needBackup}<li><span class="dot warn"></span><span>{tr('{x} One file keeps your lessons safe if this device is lost.', { x: backupAge === -1 ? tr('You have not backed up yet.') : tr('Your last backup was {backupAge} days ago.', { backupAge: backupAge ?? 0 }) })}</span><a class="btn btn-text" href={href('me')}>{tr('Back up')}</a></li>{/if}
              {#each toReflect as r}<li><span class="dot ok"></span><span>{tr('You taught "{x}". Write your reflection while it is fresh.', { x: r.topic || tr('a lesson') })}</span><a class="btn btn-text" href={href('plan', 'reflect', r.id)}>{tr('Reflect')}</a></li>{/each}
              {#each weak as w}<li><span class="dot bad"></span><span>{tr('"{x}" ({x2}) scores {score}. Aim for 80 or more.', { x: w.l.topic || tr('Untitled'), x2: when(w.l.header.date), score: w.score })}</span><a class="btn btn-text" href={href('plan', 'edit', w.l.id, 'review')}>{tr('Fix')}</a></li>{/each}
            </ul>
          </section>
        {/if}

        <section class="stack tight toolsrow" aria-labelledby="tools-h">
          <div class="row between"><h3 id="tools-h" class="sec">{tr('Your tools')} <PlaneTrail width={54} /></h3><a class="btn btn-text" href={href('tools')}>{tr('View all')} <Icon name="chevron" size={16} /></a></div>
          <Carousel label={tr('Your tools')}>
            {#each myTools as x (x.id)}
              <li class="tcard cat-{x.cat}">
                <div class="tart"><Scene name={x.cat === 'classroom' ? 'classroom' : x.cat === 'write' ? 'write' : x.cat} />
                  <button class="heart" type="button" aria-pressed={prefs.fav.includes(x.id)} onclick={() => toggleFav(x.id)} aria-label={prefs.fav.includes(x.id) ? tr('Remove {x} from favourites', { x: tr(x.title) }) : tr('Add {x} to favourites', { x: tr(x.title) })}><Icon name="star" size={18} /></button>
                  {#if x.ai}<span class="badge">{tr('AI')}</span>{/if}
                </div>
                <a class="tname" href={toolHref(x)}><b>{tr(x.title)}</b></a>
                <span class="muted small">{tr(x.about)}</span>
              </li>
            {/each}
          </Carousel>
        </section>
      </div>

      <aside class="col side">
        <section class="tcardx" aria-labelledby="day-h">
          <div class="row between"><div><p class="tk">{tr('Today')}</p><h3 id="day-h" class="big">{todays.length ? tr('{n} lessons', { n: todays.length }) : tr('No lessons')}</h3></div><ClayIcon name="sun" tone="gold" size={54} /></div>
          {#if todays.length}
            <ol class="hours">
              {#each todays as w (w.slot.id)}
                <li class:done={!!w.lesson}><span class="tm">{w.slot.start}</span><Icon name={w.lesson ? 'check' : 'plan'} size={20} /><span class="cl">{cname(w.slot.classId)}</span></li>
              {/each}
            </ol>
          {:else}
            <p class="soft">{slots.length ? tr('No English periods today. Use the time to plan ahead.') : tr('Add your English periods once, and each day shows here.')}</p>
            {#if !slots.length}<a class="btn btn-light" href={href('plan', 'week')}>{tr('Set up timetable')}</a>{/if}
          {/if}
        </section>

        <section class="card raised weekmap" aria-labelledby="week-h">
          <div class="row between"><h3 id="week-h">{tr('This week')}</h3><a class="btn btn-text" href={href('plan', 'week')}>{tr('Open planner')}</a></div>
          <div class="map">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M8 74C16 50 22 30 29 30S42 66 50 66 63 24 71 24 84 58 92 58" fill="none" stroke="var(--blue)" stroke-width="1.4" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" /></svg>
            {#each stops as st, i}
              <a class="stop" class:today={st.date === today} class:allset={st.items > 0 && st.planned === st.items} class:todo={st.planned < st.items} style="left:{POS[i][0]}%;top:{POS[i][1]}%" href={href('plan', 'day', st.date)}
                aria-label={st.items ? tr('{x}: {n} lessons, {m} planned', { x: st.full, n: st.items, m: st.planned }) : tr('{x}: no lessons', { x: st.full })}>
                <span class="pin">{st.items || '·'}</span><span class="dn">{st.day}</span>
              </a>
            {/each}
          </div>
          <p class="muted small legend"><span class="lg allset"></span>{tr('All planned')} <span class="lg todo"></span>{tr('Needs planning')}</p>
        </section>

        {#if upcoming.length}
          <section class="card raised up" aria-labelledby="up-h">
            <div class="row between"><h3 id="up-h">{tr('Coming up')}</h3><a class="btn btn-text" href={href('plan', 'week')}>{tr('See all')}</a></div>
            <ul>
              {#each upcoming as u (u.slot.id + u.date)}
                <li>
                  <span class="ut"><Scene name={u.lesson ? 'plan' : 'create'} /></span>
                  <span class="ux"><b>{u.lesson?.topic || tr('Not planned')}</b>
                    <span class="muted small"><Icon name="day" size={14} /> {when(u.date)} · {u.slot.start}</span>
                    <span class="muted small"><Icon name="classes" size={14} /> {cname(u.slot.classId)}</span></span>
                  <a class="go" href={u.lesson ? href('plan', 'edit', u.lesson.id, 'review') : href('plan', 'new', u.slot.classId, u.date, u.slot.start, u.slot.durationMin)} aria-label={u.lesson ? tr('Open {x}', { x: u.lesson.topic || tr('lesson plan') }) : tr('Plan {x}', { x: cname(u.slot.classId) })}><Icon name="chevron" size={20} /></a>
                </li>
              {/each}
            </ul>
          </section>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<style>
  .today { display: grid; gap: var(--s-6); }
  .greet { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: var(--s-4); }
  .gtxt { display: grid; gap: 4px; }
  .hrow { display: flex; align-items: center; gap: var(--s-2); }
  .hrow h1 { font-size: clamp(2.1rem, 4.5vw, 3rem); }
  .wave { font-size: 2.2rem; line-height: 1; }
  @media (prefers-reduced-motion: no-preference) { .wave { animation: wave 2.4s ease-in-out 1; transform-origin: 70% 70%; } @keyframes wave { 10%, 30% { transform: rotate(14deg); } 20%, 40% { transform: rotate(-8deg); } 50% { transform: none; } } }
  .lead { color: var(--ink-2); font-size: var(--t-lg); }
  .lead .script { font-size: 1.7rem; margin-left: 4px; }
  .searchpill { display: flex; align-items: center; gap: var(--s-2); min-height: 52px; min-width: min(100%, 360px); padding: 0 var(--s-3) 0 var(--s-4); border-radius: var(--r-pill); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); box-shadow: var(--shadow-raised); cursor: pointer; font: inherit; }
  .searchpill span { flex: 1; text-align: left; }
  kbd { font: 700 var(--t-xs) var(--f-mono); padding: 2px 6px; border-radius: 6px; background: var(--sunken); color: var(--ink-2); }
  .quicklinks { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .quicklinks a { display: inline-flex; align-items: center; gap: var(--s-2); min-height: 48px; padding: 4px var(--s-4) 4px 6px; border-radius: var(--r-pill); background: var(--card); border: 1px solid var(--line); color: var(--ink); font-weight: 700; font-size: var(--t-sm); text-decoration: none; box-shadow: var(--shadow-raised); transition: transform var(--dur-fast); }
  .quicklinks a:hover { transform: translateY(-2px); }
  .dash { display: grid; gap: var(--s-6); align-items: start; }
  @media (min-width: 1000px) { .dash { grid-template-columns: minmax(0, 1.65fr) minmax(300px, 1fr); } }
  .col { display: grid; gap: var(--s-6); min-width: 0; align-content: start; }
  /* phone and tablet: one column in the order a teacher needs it */
  @media (max-width: 999px) {
    .dash { display: flex; flex-direction: column; }
    .col { display: contents; }
    .feature { order: 1; } .tcardx { order: 2; } .todo { order: 3; } .weekmap { order: 4; } .up { order: 5; } .toolsrow { order: 6; }
  }
  /* featured card */
  .feature { position: relative; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: var(--s-4); align-items: center; padding: var(--s-6); border-radius: var(--r-xl); background: var(--card); box-shadow: var(--shadow-float); overflow: hidden; }
  .feature.welcome { border: 0; text-align: left; justify-items: stretch; color: var(--ink); background: linear-gradient(135deg, var(--sky-1), var(--card) 80%); }
  .ftxt { display: grid; gap: var(--s-3); min-width: 0; }
  .kicker { font-size: var(--t-xs); font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--teal); }
  .feature h2 { font-size: clamp(1.6rem, 3.2vw, 2.3rem); line-height: 1.1; }
  .facts { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--s-4); }
  .facts li { display: flex; align-items: center; gap: var(--s-2); color: var(--teal); }
  .facts span { display: grid; line-height: 1.2; color: var(--ink); }
  .facts small { color: var(--ink-2); font-size: var(--t-xs); }
  .fart { position: relative; border-radius: var(--r-card); background: linear-gradient(180deg, var(--sky-1), var(--sky-2)); padding: var(--s-2); align-self: stretch; display: grid; align-items: end; }
  .score { position: absolute; top: 10px; right: 10px; background: var(--card); border-radius: 50%; box-shadow: var(--shadow-raised); }
  .where { position: absolute; left: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: var(--r-pill); background: var(--card); color: var(--ink); font: 700 var(--t-xs) var(--f-body); box-shadow: var(--shadow-raised); }
  @media (max-width: 699px) { .feature { grid-template-columns: 1fr; padding: var(--s-4); } .fart { order: -1; max-height: 210px; overflow: hidden; } }
  /* to do */
  .todo h3 { font-size: var(--t-lg); }
  .count { min-width: 28px; height: 28px; border-radius: 14px; display: grid; place-items: center; background: var(--coral-soft); color: var(--ink); font: 800 var(--t-sm) var(--f-display); }
  .nudges { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-1); }
  .nudges li { display: grid; grid-template-columns: 12px minmax(0, 1fr) auto; gap: var(--s-2); align-items: center; padding: var(--s-2) var(--s-3); background: var(--paper); border-radius: var(--r-ctl); }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.warn { background: var(--warn); } .dot.ok { background: var(--ok); } .dot.bad { background: var(--bad); }
  /* tools row */
  .sec { display: flex; align-items: center; gap: var(--s-2); font-size: var(--t-xl); }
  .tcard { position: relative; display: grid; gap: 4px; padding: var(--s-2) var(--s-2) var(--s-3); border-radius: var(--r-card); background: var(--card); box-shadow: var(--shadow-raised); }
  .tart { position: relative; border-radius: 14px; background: var(--tile-bg, var(--sky-2)); --scene-blob: rgba(255, 255, 255, .55); padding: 4px 18px 0; margin-bottom: var(--s-2); }
  .heart { position: absolute; top: 6px; right: 6px; z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: 0; background: var(--card); color: var(--ink-3); display: grid; place-items: center; cursor: pointer; box-shadow: var(--shadow-raised); }
  .heart[aria-pressed='true'] { color: var(--gold); }
  .heart[aria-pressed='true'] :global(svg path) { fill: currentColor; }
  .badge { position: absolute; left: 8px; top: 8px; font: 800 var(--t-xs) var(--f-body); padding: 2px 8px; border-radius: var(--r-pill); background: var(--card); color: var(--ink); }
  .tname { color: var(--ink); text-decoration: none; padding: 0 var(--s-2); }
  .tname::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
  .tcard .small { padding: 0 var(--s-2); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cat-plan { --tile-bg: var(--gold-soft); } .cat-create { --tile-bg: var(--main); } .cat-assess { --tile-bg: var(--comp); } .cat-support { --tile-bg: var(--tint-green); }
  .cat-classroom { --tile-bg: var(--sky-1); } .cat-fun { --tile-bg: var(--tint-rose); } .cat-write { --tile-bg: var(--tint-purple); }
  /* teal "forecast" card */
  .tcardx { display: grid; gap: var(--s-3); padding: var(--s-4) var(--s-4) var(--s-4); border-radius: var(--r-xl); color: var(--on-teal); background: linear-gradient(150deg, var(--teal), var(--teal-2)); box-shadow: 0 22px 44px -24px var(--teal-2); }
  .tk { font-weight: 700; opacity: .9; }
  .big { font-size: 2rem; }
  .hours { list-style: none; margin: 0; padding: 0; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(64px, 1fr); gap: var(--s-2); overflow-x: auto; }
  .hours li { display: grid; justify-items: center; gap: 6px; padding: var(--s-2) 4px; border-radius: 16px; background: rgba(255, 255, 255, .14); text-align: center; }
  .hours li.done { background: rgba(255, 255, 255, .26); }
  .tm { font-weight: 800; }
  .cl { font-size: var(--t-xs); font-weight: 700; overflow-wrap: anywhere; }
  .soft { opacity: .95; }
  .btn-light { background: var(--card); color: var(--ink); justify-self: start; }
  /* week as a route */
  .map { position: relative; height: 170px; margin: var(--s-2) 0; border-radius: var(--r-card); background: radial-gradient(circle at 20% 30%, var(--teal-soft), transparent 55%), radial-gradient(circle at 80% 70%, var(--blue-soft), transparent 55%), var(--paper); }
  .map svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .stop { position: absolute; transform: translate(-50%, -50%); display: grid; justify-items: center; gap: 2px; text-decoration: none; color: var(--ink); min-width: 44px; min-height: 44px; }
  .pin { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font: 800 var(--t-sm) var(--f-display); background: var(--card); border: 2px solid var(--line); box-shadow: var(--shadow-raised); }
  .stop.allset .pin { background: var(--teal); color: var(--on-teal); border-color: var(--teal); }
  .stop.todo .pin { background: var(--gold-strong); color: var(--on-gold); border-color: var(--gold-strong); }
  .stop.today .pin { outline: 3px solid var(--blue); outline-offset: 2px; }
  .dn { font: 800 var(--t-xs) var(--f-body); background: var(--card); padding: 0 6px; border-radius: var(--r-pill); }
  .legend { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .lg { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .lg.allset { background: var(--teal); } .lg.todo { background: var(--gold-strong); margin-left: var(--s-2); }
  /* coming up */
  .up ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .up li { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: var(--s-3); align-items: center; }
  .ut { width: 64px; height: 56px; border-radius: 14px; overflow: hidden; background: var(--sky-2); --scene-blob: transparent; display: grid; place-items: center; }
  .ux { display: grid; gap: 2px; min-width: 0; }
  .ux .small { display: inline-flex; align-items: center; gap: 4px; }
  .go { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--paper); color: var(--ink); }
</style>
