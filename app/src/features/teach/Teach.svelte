<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { iso } from '../../lib/dates';
  import { href, go as navigate } from '../../router.svelte';
  import { db, type TeachSession, type PbdRecord } from '../../lib/db/schema';
  import { getLesson, saveLesson, listPupils, getSetting, setSetting } from '../../lib/db/repo';
  import { lock } from '../../lib/lock.svelte';
  import { isEncrypted } from '../../lib/crypto/pin';
  import { autoTier } from '../../lib/pbd';
  import { startClock, go, pause, resume, remainingSec, advice, fmt, type ClockState, type StagePlan } from '../../lib/teach/session';
  import { criteria } from '../../lib/lesson/derive';
  import { suggestPlanB } from '../../lib/lesson/planb';
  import { chime, soundOn, setSound } from '../../lib/audio/sfx';
  import { uid, type Lesson } from '../../lib/lesson/model';
  import Unlock from '../../lib/ui/Unlock.svelte';
  import Picker from './tools/Picker.svelte';
  import Groups from './tools/Groups.svelte';
  import Noise from './tools/Noise.svelte';
  import Points from './tools/Points.svelte';
  import Signal from './tools/Signal.svelte';
  import Timer from './tools/Timer.svelte';
  import Games from '../tools/Games.svelte';
  import SlideShow from '../slides/SlideShow.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';
  import { buildDeck } from '../../lib/slides/deck';
  import { fromTeach } from '../../lib/attendance';
  import type { TeachPupil } from './types';
  import Viewer from '../books/Viewer.svelte';
  import { findRefs, type PageRef } from '../../lib/textbook/refs';
  import { slotFor } from '../../lib/textbook/books';
  import { listBooks } from '../../lib/textbook/store';

  let { id }: { id: string } = $props();
  let lesson = $state<Lesson | null>(null);
  let pupils = $state<TeachPupil[]>([]);
  let session = $state<TeachSession | null>(null);
  let missing = $state(false);
  let needsUnlock = $state(false);
  let now = $state(Date.now());
  let tool = $state<'' | 'picker' | 'groups' | 'noise' | 'points' | 'signal' | 'timer' | 'book' | 'games' | 'slides'>('');
  let shelf = $state<string[]>([]);
  let bookRef = $state<{ slot: string; page: number } | null>(null);
  $effect(() => { listBooks().then((b) => (shelf = b.map((x) => x.slot))); });
  let notes = $state(false);
  let sound = $state(soundOn());
  let chimedFor = '';

  async function load() {
    const l = await getLesson(id);
    if (!l) { missing = true; return; }
    lesson = l;
    if (l.classId) {
      const raw = await db.pupils.where('classId').equals(l.classId).first();
      if (raw && (isEncrypted(raw.name)) && !lock.unlocked) { needsUnlock = true; return; }
      needsUnlock = false;
      const ps = await listPupils(l.classId);
      const recs = await db.pbd.where('classId').equals(l.classId).toArray();
      pupils = ps.map((p) => ({ id: p.id, name: p.name, tier: p.tierOverride ?? autoTier(recs.filter((r) => r.pupilId === p.id)).tier, keepApart: p.keepApart ?? [], keepTogether: p.keepTogether ?? [] }));
    }
    const open = (await db.sessions.where('lessonId').equals(id).toArray()).filter((s) => !s.endedAt).sort((a, b) => b.startedAt - a.startedAt)[0];
    const saved = l.classId ? await getSetting<string[][]>(`groups:${l.classId}`, []) : [];
    session = open ?? { id: uid(), lessonId: id, classId: l.classId, startedAt: 0, clock: null, absent: [], picker: { picked: [] }, points: [], groups: saved };
  }
  $effect(() => { void lock.unlocked; load(); });

  // Live clock; time always comes from timestamps, the tick only redraws.
  $effect(() => { const t = setInterval(() => (now = Date.now()), 500); return () => clearInterval(t); });
  // Keep the screen awake while teaching.
  $effect(() => {
    let wl: { release(): Promise<void> } | null = null;
    const get = async () => { try { wl = await (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed */ } };
    const vis = () => { if (document.visibilityState === 'visible') get(); };
    get(); document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); wl?.release().catch(() => {}); };
  });
  // Save the session on every change so a reload or power cut resumes the lesson.
  $effect(() => { if (session && session.startedAt) { const s = $state.snapshot(session) as TeachSession; db.sessions.put(s); } });
  // Esc leaves Teach mode (teacher's keyboard); pupils at the board cannot do this by accident.
  $effect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (tool) tool = ''; else exit(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const plan = $derived<StagePlan[]>(lesson ? lesson.stages.map((s) => ({ key: s.key, title: s.title, minutes: s.minutes })) : []);
  const clock = $derived(session?.clock as ClockState | null);
  const phase = $derived(!clock ? 'start' : clock.finishedAt ? 'end' : 'live');
  const present = $derived(pupils.filter((p) => !session?.absent.includes(p.id)));
  const stage = $derived(lesson && clock ? lesson.stages[clock.stageIndex] : null);
  const left = $derived(clock ? remainingSec(clock, plan, now) : 0);
  const coach = $derived(clock ? advice(clock, plan, now) : null);
  const sc = $derived(lesson ? criteria(lesson) : []);
  const backup = $derived(lesson ? { ...suggestPlanB(lesson), ...Object.fromEntries(Object.entries(lesson.planB).filter(([, v]) => v.trim())) } : null);
  const teams = $derived(session?.groups?.length ? session.groups.map((_, i) => `Group ${i + 1}`) : ['Team 1', 'Team 2', 'Team 3', 'Team 4']);
  const smallClass = $derived((lesson?.curriculum.year ?? 4) <= 3);

  $effect(() => { if (clock && !clock.finishedAt && left <= 0 && chimedFor !== stage?.key) { chimedFor = stage?.key ?? ''; chime(); } });

  function toggleAbsent(pid: string) { if (!session) return; session.absent = session.absent.includes(pid) ? session.absent.filter((x) => x !== pid) : [...session.absent, pid]; }
  function start() { if (!session) return; const t = Date.now(); session.startedAt = t; session.clock = startClock(t); }
  function step(dir: 1 | -1) { if (session && clock) session.clock = go(clock, plan, Date.now(), dir); }
  function togglePause() { if (session && clock) session.clock = clock.pausedAt ? resume(clock, Date.now()) : pause(clock, Date.now()); }
  async function finish() {
    if (!session || !lesson) return;
    session.endedAt = Date.now();
    const s = $state.snapshot(session) as TeachSession;
    await db.sessions.put(s);
    await db.attendance.bulkPut(pupils.map((p) => ({ id: `${s.id}:${p.id}`, sessionId: s.id, pupilId: p.id, present: !s.absent.includes(p.id) })));
    if (lesson.classId && pupils.length) await fromTeach(lesson.classId, iso(new Date(s.startedAt)), pupils.map((p) => p.id), [...s.absent]);
    lesson.status = 'taught';
    await saveLesson($state.snapshot(lesson) as Lesson);
  }
  $effect(() => { if (phase === 'end' && session && !session.endedAt) finish(); });
  function exit() { navigate('plan', 'edit', id, 'review'); }
  function saveGroups(g: string[][]) { if (lesson?.classId) setSetting(`groups:${lesson.classId}`, g); }

  // Hold-to-exit button: 900 ms press
  let holdTimer: ReturnType<typeof setTimeout> | undefined; let holding = $state(false);
  const holdStart = () => { holding = true; holdTimer = setTimeout(exit, 900); };
  const holdEnd = () => { holding = false; clearTimeout(holdTimer); };
  const pageRefs = $derived<PageRef[]>(lesson ? findRefs([lesson.sowNotes.materials, lesson.aids, ...lesson.stages.flatMap((s) => s.activities.map((a) => a.teacher))].join('\n')) : []);
  const openable = $derived(pageRefs.map((r) => ({ r, slot: lesson ? slotFor(lesson.curriculum.year, r.kind)?.id : undefined })).filter((x) => x.slot && shelf.includes(x.slot)));
  const sbSlot = $derived(lesson ? slotFor(lesson.curriculum.year, 'SB')?.id : undefined);
  const tools = [
    { id: 'book', label: tr('Textbook'), icon: '📖' },
    { id: 'picker', label: tr('Name picker'), icon: '🎯' }, { id: 'groups', label: tr('Groups'), icon: '👥' }, { id: 'noise', label: tr('Noise'), icon: '🔊' },
    { id: 'points', label: tr('Points'), icon: '⭐' }, { id: 'signal', label: tr('Attention'), icon: '👀' }, { id: 'timer', label: tr('Timer'), icon: '⏱' }, { id: 'games', label: tr('Games'), icon: '🎮' }, { id: 'slides', label: tr('Slides'), icon: '🖼' }
  ] as const;
</script>

<div class="teach" class:small-years={smallClass}>
  {#if missing}
    <div class="center"><p>{tr('This lesson plan no longer exists.')}</p><a class="btn btn-primary" href={href('plan')}>{tr('Back to Plan')}</a></div>
  {:else if needsUnlock}
    <Unlock why={tr('This class list is protected. Enter your PIN to teach with pupil names.')} />
    <div class="center"><a class="btn btn-text" href={href('plan', 'edit', id, 'review')}>{tr('Back')}</a></div>
  {:else if lesson && session}
    <header class="top">
      <div class="title"><p class="eyebrow">{lesson.header.className || tr('Year {year}', { year: lesson.curriculum.year })} · {lesson.mainSkill}</p><h1>{lesson.topic || tr('Lesson')}</h1></div>
      <div class="row">
        <button class="btn btn-text" type="button" aria-pressed={sound} onclick={() => { sound = !sound; setSound(sound); }}>{sound ? tr('🔔 Sound on') : tr('🔕 Sound off')}</button>
        <button class="btn btn-outline exit" class:holding type="button" onpointerdown={holdStart} onpointerup={holdEnd} onpointerleave={holdEnd} onkeydown={(e) => { if (e.key === 'Enter') exit(); }} aria-label={tr('Exit Teach mode (press and hold)')}>{tr('Hold to exit')}</button>
      </div>
    </header>

    {#if phase === 'start'}
      <main class="startscreen">
        <section class="card stack" lang="en">
          <h2>Today we will…</h2>
          <ul class="sc pupil-font">{#each sc as c}<li>{c.text || '…'}</li>{/each}</ul>
        </section>
        {#if pupils.length}
          <section class="card stack" aria-label={tr('Attendance')}>
            <div class="row between"><h2>{tr('Attendance')}</h2><span class="muted">{tr('{length} of {length2} present · tap a name to mark absent', { length: present.length, length2: pupils.length })}</span></div>
            <div class="att">
              {#each pupils as p (p.id)}<button type="button" class="pp" class:absent={session.absent.includes(p.id)} aria-pressed={!session.absent.includes(p.id)} onclick={() => toggleAbsent(p.id)} data-pupil={p.name}>{p.name}</button>{/each}
            </div>
          </section>
        {:else}
          <p class="muted">{tr('No pupil list for this lesson. Link the lesson to a class with pupils to use attendance, the name picker and groups.')}</p>
        {/if}
        <button id="teach-start" class="btn btn-gold huge" type="button" onclick={start}>{tr('Start the lesson')}</button>
      </main>
    {:else if phase === 'live' && clock && stage}
      <main class="live">
        <section class="stagebox">
          <p class="eyebrow">{tr('Stage {x} of {length} · {minutes} min planned', { x: clock.stageIndex + 1, length: plan.length, minutes: stage.minutes })}</p>
          <h2 class="stagename">{stage.title}</h2>
          <p class="clock" class:warn={left <= 120 && left > 0} class:over={left <= 0} aria-live="off" data-left={left}>{clock.pausedAt ? tr('Paused') : fmt(left)}</p>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={stage.minutes * 60} aria-valuenow={Math.max(0, stage.minutes * 60 - left)} aria-label={tr('Time used in this stage')}>
            <div style="width:{Math.min(100, (1 - left / (stage.minutes * 60)) * 100)}%"></div>
          </div>
          <div class="ribbon">{#each plan as p, i}<span class:done={i < clock.stageIndex} class:now={i === clock.stageIndex} style="flex:{p.minutes}" title={p.title}></span>{/each}</div>
        </section>

        {#if coach && backup}
          <aside class="coach {coach.kind}" role="status">
            <b>{coach.kind === 'behind' ? tr('You are {minutes} min behind.', { minutes: coach.minutes }) : tr('You are {minutes} min ahead.', { minutes: coach.minutes })}</b>
            <span>{coach.kind === 'behind' ? backup.late : backup.early}</span>
          </aside>
        {/if}

        <section class="acts">
          {#each stage.activities.filter((a) => a.pupils.trim() || a.teacher.trim()) as a, i}
            <div class="act">
              {#if a.pupils.trim()}<p class="pupils pupil-font">{a.pupils}</p>{/if}
              {#if notes || !a.pupils.trim()}<p class="mine">{a.teacher}</p>{/if}
            </div>
          {/each}
          <button class="btn btn-text" type="button" onclick={() => (notes = !notes)}>{notes ? tr('Hide my notes') : tr('Show my notes')}</button>
          {#if lesson.links.length}<div class="row">{#each lesson.links as l}<a class="btn btn-outline" href={l.url} target="_blank" rel="noopener">{l.label}</a>{/each}</div>{/if}
        </section>

        <nav class="controls" aria-label={tr('Stage controls')}>
          <button class="btn btn-outline" type="button" onclick={() => step(-1)} disabled={clock.stageIndex === 0}>{tr('‹ Back')}</button>
          <button class="btn btn-outline" type="button" onclick={togglePause}>{clock.pausedAt ? tr('Resume') : tr('Pause')}</button>
          <button id="teach-next" class="btn btn-gold" type="button" onclick={() => step(1)}>{clock.stageIndex === plan.length - 1 ? tr('Finish lesson') : `Next: ${plan[clock.stageIndex + 1].title} ›`}</button>
        </nav>
      </main>
    {:else if phase === 'end' && clock}
      <main class="endscreen stack">
        <h2>{tr('Lesson finished')}</h2>
        <table class="sum">
          <thead><tr><th>{tr('Stage')}</th><th>{tr('Planned')}</th><th>{tr('Actual')}</th></tr></thead>
          <tbody>{#each plan as p}{@const a = clock.log.find((x) => x.key === p.key)}<tr><td>{p.title}</td><td>{tr('{minutes} min', { minutes: p.minutes })}</td><td class:over={a && a.actualSec > p.minutes * 60 + 60}>{tr('{x} min', { x: a ? Math.round(a.actualSec / 60) : 0 })}</td></tr>{/each}</tbody>
        </table>
        <p class="muted">{tr('These times will appear in your reflection. Attendance has been saved.')}</p>
        <div class="row">
          {#if lesson.classId}<a id="teach-pbd" class="btn btn-gold" href={href('classes', lesson.classId, 'pbd', lesson.id)}>{tr('Record PBD for this lesson')}</a>{/if}
          <a class="btn btn-outline" href={href('plan', 'reflect', lesson.id)}>{tr('Write my reflection')}</a>
          <a class="btn btn-text" href={href('plan', 'edit', lesson.id, 'review')}>{tr('Back to the lesson plan')}</a>
        </div>
      </main>
    {/if}

    {#if phase !== 'end'}
      <nav class="dock" aria-label={tr('Classroom tools')}>
        {#each tools as t}<button type="button" class:on={tool === t.id} onclick={() => (tool = tool === t.id ? '' : t.id)} data-tool={t.id}><span aria-hidden="true">{t.icon}</span>{t.label}</button>{/each}
      </nav>
    {/if}

    {#if tool}
      <Sheet title={tools.find((t) => t.id === tool)?.label ?? ''} onclose={() => (tool = '')} wide>
          {#if tool === 'picker'}<Picker pupils={present} bind:picker={session.picker} />
          {:else if tool === 'groups'}<Groups pupils={present} bind:groups={session.groups} onsave={saveGroups} />
          {:else if tool === 'noise'}<Noise />
          {:else if tool === 'points'}<Points {teams} bind:points={session.points} />
          {:else if tool === 'signal'}<Signal />
          {:else if tool === 'book'}
            {#if !shelf.length || !sbSlot || !shelf.includes(sbSlot)}
              <p class="muted">{tr('Add the Year {year} Student\'s Book on the', { year: lesson.curriculum.year })} <a href={href('library', lesson.curriculum.year, lesson.curriculum.school.toLowerCase(), 'books')}>{tr('Textbook Shelf')}</a> {tr('to show its pages here.')}</p>
            {/if}
            {#if openable.length}<div class="row">{#each openable as o}<button class="btn btn-outline" type="button" onclick={() => (bookRef = { slot: o.slot!, page: o.r.page })}>{o.r.label}</button>{/each}</div>{/if}
            {#if bookRef || (sbSlot && shelf.includes(sbSlot))}
              {#key bookRef?.slot ?? sbSlot}<Viewer slot={bookRef?.slot ?? sbSlot!} page={bookRef?.page ?? openable[0]?.r.page ?? 1} />{/key}
            {/if}
          {:else if tool === 'games'}<Games embedded initialWords={lesson.vocabulary} />
          {:else if tool === 'slides'}
            {@const deck = lesson.slides ?? buildDeck($state.snapshot(lesson) as Lesson)}
            {@const at = stage ? deck.slides.findIndex((x) => x.stage === stage.title) : -1}
            {#if !lesson.slides}<p class="muted small">{tr('These slides are made from your plan now.')} <a href={href('plan', 'slides', lesson.id)}>{tr('Edit them or download PowerPoint')}</a> {tr('after the lesson.')}</p>{/if}
            <SlideShow {deck} start={at < 0 ? 0 : at} embedded />
          {:else}<Timer />{/if}
      </Sheet>
    {/if}
  {:else}
    <p class="center muted">{tr('Loading…')}</p>
  {/if}
</div>

<style>
  .teach { min-height: 100dvh; background: var(--paper); display: grid; grid-template-rows: auto 1fr auto; padding: max(var(--s-3), env(safe-area-inset-top, 0px)) max(var(--s-4), env(safe-area-inset-right, 0px)) 0 max(var(--s-4), env(safe-area-inset-left, 0px)); }
  .center { display: grid; justify-items: center; gap: var(--s-3); padding: var(--s-8); }
  .top { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); flex-wrap: wrap; padding-bottom: var(--s-2); border-bottom: 1px solid var(--line); }
  .title h1 { font-size: var(--t-xl); }
  .exit { position: relative; overflow: hidden; }
  .exit.holding::after { content: ''; position: absolute; inset: auto 0 0 0; height: 3px; background: var(--bad); animation: hold 0.9s linear forwards; }
  @keyframes hold { from { width: 0; } to { width: 100%; } }
  main { padding: var(--s-4) 0 var(--s-8); max-width: 1100px; width: 100%; margin: 0 auto; }
  .startscreen { display: grid; gap: var(--s-4); align-content: start; }
  .sc { margin: 0; padding-left: 1.2em; font-size: clamp(1.2rem, 2.6vw, 1.7rem); display: grid; gap: var(--s-2); }
  .att { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: var(--s-2); }
  .pp { min-height: var(--tap); border-radius: var(--r-ctl); border: 1px solid var(--line); background: var(--card); font: 600 1rem var(--f-pupil); cursor: pointer; color: var(--ink); }
  .pp.absent { background: var(--sunken); color: var(--ink-3); text-decoration: line-through; border-style: dashed; }
  .huge { min-height: 64px; font-size: var(--t-xl); justify-self: start; padding: 0 var(--s-8); }
  .live { display: grid; gap: var(--s-4); align-content: start; }
  .stagebox { display: grid; gap: var(--s-2); justify-items: center; text-align: center; }
  .stagename { font-size: clamp(2rem, 6vw, 3.6rem); }
  .clock { font: 800 clamp(3.5rem, 14vw, 8rem)/1 var(--f-mono); color: var(--ink); }
  .clock.warn { color: var(--warn); } .clock.over { color: var(--bad); }
  .bar { width: min(100%, 720px); height: 14px; border-radius: 7px; background: var(--sunken); overflow: hidden; }
  .bar div { height: 100%; background: var(--gold-strong); transition: width .5s linear; }
  .small-years .bar { height: 28px; border-radius: 14px; }
  .ribbon { display: flex; gap: 3px; width: min(100%, 720px); }
  .ribbon span { height: 8px; border-radius: 4px; background: var(--line); }
  .ribbon span.done { background: var(--ok); } .ribbon span.now { background: var(--gold-strong); }
  .coach { display: grid; gap: 4px; padding: var(--s-3) var(--s-4); border-radius: var(--r-card); border-left: 5px solid var(--warn); background: var(--gold-soft); }
  .coach.ahead { border-color: var(--ok); }
  .acts { display: grid; gap: var(--s-3); }
  .act { padding: var(--s-3) var(--s-4); border-radius: var(--r-card); background: var(--card); border: 1px solid var(--line); }
  .pupils { font-size: clamp(1.5rem, 3.4vw, 2.3rem); line-height: 1.3; }
  .mine { color: var(--ink-2); margin-top: var(--s-2); white-space: pre-line; }
  .controls { display: flex; gap: var(--s-3); justify-content: center; flex-wrap: wrap; }
  .controls .btn { min-height: 56px; font-size: var(--t-md); }
  .sum { border-collapse: collapse; width: min(100%, 520px); }
  .sum th, .sum td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); }
  .sum td.over { color: var(--bad); font-weight: 700; }
  .dock { position: sticky; bottom: 0; display: flex; gap: var(--s-1); justify-content: center; flex-wrap: wrap; background: var(--card); border-top: 1px solid var(--line); padding: var(--s-2) 0 max(var(--s-2), env(safe-area-inset-bottom, 0px)); margin: 0 calc(-1 * max(var(--s-4), env(safe-area-inset-left, 0px))); }
  .dock button { display: grid; justify-items: center; gap: 2px; min-width: 72px; min-height: 56px; border: 0; border-radius: var(--r-ctl); background: transparent; font: 600 var(--t-xs) var(--f-body); color: var(--ink-2); cursor: pointer; }
  .dock button span { font-size: 1.4rem; }
  .dock button.on { background: var(--gold-soft); color: var(--ink); }
</style>
