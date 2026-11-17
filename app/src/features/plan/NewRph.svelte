<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { today as localToday } from '../../lib/dates';
  import { href, go, route } from '../../router.svelte';
  import { listClasses, countPupils, saveLesson } from '../../lib/db/repo';
  import { loadSow, loadStandards, loadPhonics, searchLessons, loadIndex } from '../../lib/curriculum/loader';
  import { buildLesson } from '../../lib/lesson/create';
  import type { Mode } from '../../lib/lesson/model';
  import type { School, SowLesson, PackIndex } from '../../lib/curriculum/types';
  import type { SchoolClass } from '../../lib/db/schema';
  import { profile } from '../../lib/profile.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import Proposal from './Proposal.svelte';
  import { briefFrom, type Brief, type ClassProfile, type Goal, type Trait, type Devices } from '../../lib/recommend/engine';
  import { getSetting, setSetting } from '../../lib/db/repo';
  import type { Lesson } from '../../lib/lesson/model';

  const today = localToday();
  let classes = $state<SchoolClass[]>([]);
  let classId = $state('');
  let year = $state(4);
  let school = $state<School>(profile.value?.schoolType ?? 'SK');
  let date = $state(today);
  let start = $state('08:00');
  let duration = $state(60);
  let mode = $state<Mode>('follow-sow');
  let usePhonics = $state(false);
  let index = $state<PackIndex | null>(null);
  let lessons = $state<SowLesson[]>([]);
  let query = $state('');
  let picked = $state<number | null>(null);
  let busy = $state(false);
  let error = $state('');

  // Prefill from links: #/plan/new[/recommend][/sow/<lesson>/<year>/<SK|SJK>][/<classId>/<date>/<start>/<minutes>]
  const tokens = route.parts.slice(1);
  if (tokens[0] === 'recommend') { mode = 'recommend'; tokens.shift(); }
  let wantSow = 0;
  if (tokens[0] === 'sow') { wantSow = Number(tokens[1]) || 0; if (Number(tokens[2]) >= 1) year = Number(tokens[2]); if (tokens[3] === 'SK' || tokens[3] === 'SJK') school = tokens[3]; tokens.splice(0, 4); }
  const [pClass, pDate, pStart, pDur] = tokens;
  if (pDate && /^\d{4}-\d{2}-\d{2}$/.test(pDate)) date = pDate;
  if (pStart && /^\d{2}:\d{2}$/.test(pStart)) start = pStart;
  if (pDur && Number(pDur) >= 15) duration = Number(pDur);
  $effect(() => { listClasses().then((c) => { classes = c; if (pClass && c.some((x) => x.id === pClass)) classId = pClass; }); loadIndex().then((i) => (index = i)); });
  const cls = $derived(classes.find((c) => c.id === classId));
  $effect(() => { if (cls) { year = cls.year; school = cls.schoolType; } });
  const hasPhonics = $derived(!!index?.years[String(year)]?.phonics);
  $effect(() => {
    const y = year, s = school, ph = usePhonics && hasPhonics;
    picked = null;
    (ph ? loadPhonics(y).then((p) => p?.lessons ?? []) : loadSow(y, s).then((f) => f.lessons)).then((l) => { if (y === year) { lessons = l; if (wantSow && l.some((x) => x.no === wantSow)) { picked = wantSow; wantSow = 0; queueMicrotask(() => document.querySelector(`[data-sow="${picked}"]`)?.scrollIntoView({ block: 'center' })); } } });
  });
  const shown = $derived(searchLessons(lessons, query));
  const modes: { id: Mode; title: string; body: string }[] = [
    { id: 'recommend', title: tr('✨ Consilia recommends'), body: tr('Tell Consilia about your class. It plans the whole lesson: creative step-by-step activities, teaching aids with pictures and how to make them, and ready digital tools.') },
    { id: 'follow-sow', title: tr('Follow the SoW'), body: tr('Everything from the SoW lesson is filled in: standards, outline steps and materials. Improve and expand it.') },
    { id: 'sow-standards', title: tr('SoW standards, my activities'), body: tr('The CS, LS, skills and theme come from the SoW. You design the activities.') },
    { id: 'scratch', title: tr('From scratch'), body: tr('Choose your own standards from the DSKP and plan everything yourself.') }
  ];

  // ---- Consilia Recommends: what the teacher tells us about the class and the lesson
  let prof = $state<ClassProfile>({ level: 'mixed', traits: [], projector: true, speakers: true, internet: false, devices: 'teacher' });
  let goals = $state<Goal[]>([]);
  let words = $state(''); let sentence = $state(''); let prep = $state(30);
  let proposal = $state.raw<{ base: Lesson; brief: Brief; profile: ClassProfile } | null>(null);
  $effect(() => { const id = classId; if (id) getSetting<(ClassProfile & { prep?: number }) | null>(`recommend:${id}`, null).then((p) => { if (p && id === classId) { prof = { level: p.level, traits: [...p.traits], projector: p.projector, speakers: p.speakers, internet: p.internet, devices: p.devices }; if (p.prep) prep = p.prep; } }); });
  const TRAITS: [Trait, string][] = [['shy', tr('Shy speakers')], ['energetic', tr('Very energetic')], ['weak-readers', tr('Many weak readers')], ['large-class', tr('Large class (30+)')], ['sen', tr('Pupils with special needs')], ['mixed-languages', tr('Many home languages')]];
  const GOALS: [Goal, string][] = [['speaking', tr('More speaking time')], ['fun', tr('Fun and lively')], ['calm', tr('Calm and focused')], ['creative', tr('Creativity')], ['assessment', tr('Clear assessment')], ['observation', tr('Observation lesson')], ['tech', tr('Use technology')]];
  const DEVICES: [Devices, string][] = [['none', tr('None')], ['teacher', tr('My phone only')], ['shared', tr('A few to share')], ['one-each', tr('One each')]];
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

  async function create() {
    error = '';
    if (mode !== 'scratch' && picked == null) { error = tr('Choose the SoW lesson you are planning.'); return; }
    if (!(duration >= 15 && duration <= 120)) { error = tr('Lesson length must be between 15 and 120 minutes.'); return; }
    busy = true;
    try {
      const std = await loadStandards(year, school);
      const sow = picked != null ? lessons.find((l) => l.no === picked) ?? null : null;
      const l = buildLesson({ mode, year, school, sow, phonics: usePhonics && hasPhonics, date, start, durationMin: duration,
        classId: cls?.id ?? null, className: cls?.name ?? '', levelLabel: cls?.levelLabel ?? '', pupils: cls ? await countPupils(cls.id) || null : null }, std);
      if (mode === 'recommend') {
        const profile = $state.snapshot(prof) as ClassProfile;
        if (cls) await setSetting(`recommend:${cls.id}`, { ...profile, prep });
        const brief = briefFrom(l, { words: words.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean).slice(0, 12), sentence: sentence.trim(), goals: [...goals], prepMinutes: prep });
        proposal = { base: l, brief, profile };
        busy = false;
        scrollTo({ top: 0 });
        return;
      }
      await saveLesson(l);
      go('plan', 'edit', l.id, mode === 'scratch' ? 'standards' : 'setup');
    } catch (e) { error = (e as Error).message; busy = false; }
  }
</script>

{#if proposal}
<div class="stack">
  <button class="btn btn-text back" type="button" onclick={() => (proposal = null)}><Icon name="back" size={18} />{tr('Change my answers')}</button>
  <Proposal base={proposal.base} brief={proposal.brief} profile={proposal.profile} onback={() => (proposal = null)} onuse={async (l) => { await saveLesson(l); go('plan', 'edit', l.id, 'review'); }} />
</div>
{:else}
<div class="stack">
  <a class="btn btn-text back" href={href('plan')}><Icon name="back" size={18} />{tr('Plan')}</a>
  <h1>{tr('New lesson plan')}</h1>

  <section class="card stack">
    <h3>{tr('1 · Class and time')}</h3>
    <div class="grid">
      <label class="field"><span>{tr('Class')}</span>
        <select id="nr-class" class="select" bind:value={classId}>
          <option value="">{tr('No class (choose year below)')}</option>
          {#each classes as c}<option value={c.id}>{tr('{name} · Year {year} {schoolType}', { name: c.name, year: c.year, schoolType: c.schoolType })}</option>{/each}
        </select>
        {#if !classes.length}<small class="muted">{tr('Tip:')} <a href={href('classes')}>{tr('add your classes')}</a> {tr('to fill the class name and pupil count.')}</small>{/if}
      </label>
      {#if !cls}
        <label class="field"><span>{tr('Year')}</span>
          <select id="nr-year" class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>{tr('Year {y}', { y })}</option>{/each}</select>
        </label>
        <div class="field"><span id="nr-school">{tr('School type')}</span>
          <div class="seg" role="group" aria-labelledby="nr-school">{#each ['SK', 'SJK'] as s}<button type="button" aria-pressed={school === s} onclick={() => (school = s as School)}>{s}</button>{/each}</div>
        </div>
      {/if}
      <label class="field"><span>{tr('Date')}</span><input id="nr-date" class="input" type="date" bind:value={date} /></label>
      <label class="field"><span>{tr('Start time')}</span><input id="nr-start" class="input" type="time" bind:value={start} /></label>
      <div class="field"><span id="nr-dur">{tr('Length')}</span>
        <div class="row">
          <div class="seg" role="group" aria-labelledby="nr-dur">{#each [30, 60] as d}<button type="button" aria-pressed={duration === d} onclick={() => (duration = d)}>{tr('{d} min', { d })}</button>{/each}</div>
          <input id="nr-duration" class="input mins" type="number" min="15" max="120" step="5" bind:value={duration} aria-label={tr('Custom length in minutes')} />
        </div>
      </div>
    </div>
  </section>

  <section class="stack">
    <h3>{tr('2 · How do you want to start?')}</h3>
    <div class="modes" role="radiogroup" aria-label={tr('Planning mode')}>
      {#each modes as m}
        <button type="button" role="radio" aria-checked={mode === m.id} class="mode card" onclick={() => (mode = m.id)}>
          <b>{m.title}</b><span class="muted">{m.body}</span>
        </button>
      {/each}
    </div>
  </section>

  {#if mode !== 'scratch'}
    <section class="card stack">
      <div class="row between">
        <h3>{tr('3 · Choose the SoW lesson')}</h3>
        {#if hasPhonics}<label class="row small"><input id="nr-phonics" type="checkbox" bind:checked={usePhonics} />{tr('Phonics SoW')}</label>{/if}
      </div>
      <p class="muted small">{tr('Year {year} {x} · {x2}', { year, x: usePhonics && hasPhonics ? tr('Phonics') : school, x2: index?.years[String(year)]?.textbook })}</p>
      <input id="nr-search" class="input" type="search" placeholder={tr('Search by lesson number, topic, skill or LS code')} bind:value={query} />
      <ul class="pick" role="listbox" aria-label={tr('SoW lessons')}>
        {#each shown.slice(0, 200) as l (l.no)}
          <li role="none"><button type="button" role="option" aria-selected={picked === l.no} data-sow={l.no} onclick={() => (picked = l.no)}>
            <span class="no">{l.no}</span><span class="what"><b>{l.topic || l.label}</b><span class="muted">{tr('{label}{x} · LS {x2}', { label: l.label, x: l.unit ? ` · ${l.unit}` : '', x2: l.std.main.ls.join(', ') || tr('teacher choice') })}</span></span>
          </button></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if mode === 'recommend'}
    <section class="card stack rec" aria-labelledby="rc-h">
      <h3 id="rc-h">{tr('4 · Tell Consilia about your class')}</h3>
      <p class="muted small">{tr('Every question is optional: skip straight to the button and Consilia uses sensible defaults. {x}', { x: cls ? tr('Your answers are remembered for {name}.', { name: cls.name }) : tr('Choose a class above and Consilia remembers your answers for it.') })}</p>
      <div class="field"><span id="rc-level">{tr('Ability of the class')}</span>
        <div class="seg" role="group" aria-labelledby="rc-level">{#each [['low', tr('Mostly lower')], ['mixed', tr('Mixed')], ['high', tr('Mostly higher')]] as [v, t]}<button type="button" aria-pressed={prof.level === v} onclick={() => (prof.level = v as ClassProfile['level'])}>{t}</button>{/each}</div>
      </div>
      <div class="field"><span id="rc-traits">{tr('About the pupils (choose any)')}</span>
        <div class="chips" role="group" aria-labelledby="rc-traits">{#each TRAITS as [v, t]}<button type="button" class="chip pickable" aria-pressed={prof.traits.includes(v)} data-trait={v} onclick={() => (prof.traits = toggle(prof.traits, v))}>{t}</button>{/each}</div>
      </div>
      <div class="field"><span id="rc-res">{tr('In your classroom')}</span>
        <div class="chips" role="group" aria-labelledby="rc-res">
          <button type="button" class="chip pickable" aria-pressed={prof.projector} data-res="projector" onclick={() => (prof.projector = !prof.projector)}>{tr('📽 Projector or TV')}</button>
          <button type="button" class="chip pickable" aria-pressed={prof.speakers} onclick={() => (prof.speakers = !prof.speakers)}>{tr('🔈 Speakers')}</button>
          <button type="button" class="chip pickable" aria-pressed={prof.internet} data-res="internet" onclick={() => (prof.internet = !prof.internet)}>{tr('📶 Internet')}</button>
        </div>
      </div>
      <div class="field"><span id="rc-dev">{tr('Devices for pupils')}</span>
        <div class="seg" role="group" aria-labelledby="rc-dev">{#each DEVICES as [v, t]}<button type="button" aria-pressed={prof.devices === v} onclick={() => (prof.devices = v)}>{t}</button>{/each}</div>
      </div>
      <h3>{tr('5 · About this lesson')}</h3>
      <div class="grid">
        <label class="field"><span>{tr('Key words (optional, comma separated)')}</span><input id="rc-words" class="input" bind:value={words} placeholder={tr('e.g. Malaysia, Japan, China, India')} /></label>
        <label class="field"><span>{tr('Target sentence (optional)')}</span><input id="rc-sentence" class="input" bind:value={sentence} placeholder={tr('e.g. He is from …')} /></label>
      </div>
      <div class="field"><span id="rc-goals">{tr('What matters most today? (choose up to 3)')}</span>
        <div class="chips" role="group" aria-labelledby="rc-goals">{#each GOALS as [v, t]}<button type="button" class="chip pickable" aria-pressed={goals.includes(v)} data-goal={v} disabled={!goals.includes(v) && goals.length >= 3} onclick={() => (goals = toggle(goals, v))}>{t}</button>{/each}</div>
      </div>
      <div class="field"><span id="rc-prep">{tr('Time you have to prepare')}</span>
        <div class="seg" role="group" aria-labelledby="rc-prep">{#each [10, 30, 60] as m}<button type="button" aria-pressed={prep === m} onclick={() => (prep = m)}>{m === 60 ? tr('1 hour+') : tr('{m} min', { m })}</button>{/each}</div>
      </div>
    </section>
  {/if}

  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <div class="row"><button id="nr-create" class="btn btn-gold" type="button" disabled={busy} onclick={create}>{mode === 'recommend' ? tr('✨ Plan it with Consilia') : tr('Create lesson plan')}</button></div>
</div>
{/if}

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }
  small, .small { font-size: var(--t-sm); }
  .mins { width: 90px; }
  .modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .mode { text-align: left; cursor: pointer; font: inherit; color: inherit; }
  .mode[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); }

  .pick { list-style: none; margin: 0; padding: 0; max-height: 360px; overflow-y: auto; border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .pick li + li { border-top: 1px solid var(--line); }
  .pick button { width: 100%; display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: var(--s-3); text-align: left; padding: var(--s-2) var(--s-3); border: 0; background: transparent; cursor: pointer; min-height: var(--tap); }
  .pick button[aria-selected='true'] { background: var(--gold-soft); }
  .no { font: 500 var(--t-sm) var(--f-mono); color: var(--gold); padding-top: 2px; }
  .what { display: grid; min-width: 0; }
  .what .muted { font-size: var(--t-sm); }

  .rec { border: 2px solid var(--gold-strong); }

  .pickable { cursor: pointer; min-height: var(--tap); padding: 0 var(--s-3); font: 600 var(--t-sm) var(--f-body); border: 1px solid var(--line); background: var(--card); color: var(--ink-2); }
  .pickable[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); border-color: var(--navy); }
  .pickable:disabled { opacity: .45; cursor: not-allowed; }
  .mode:first-child { background: linear-gradient(135deg, var(--gold-soft), var(--card)); }
</style>
