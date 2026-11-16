<script lang="ts">
  import { href, go, route } from '../../router.svelte';
  import { listClasses, countPupils, saveLesson } from '../../lib/db/repo';
  import { loadSow, loadStandards, loadPhonics, searchLessons, loadIndex } from '../../lib/curriculum/loader';
  import { buildLesson } from '../../lib/lesson/create';
  import type { Mode } from '../../lib/lesson/model';
  import type { School, SowLesson, PackIndex } from '../../lib/curriculum/types';
  import type { SchoolClass } from '../../lib/db/schema';
  import { profile } from '../../lib/profile.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  const today = new Date().toISOString().slice(0, 10);
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

  // Prefill from the weekly planner: #/plan/new/<classId>/<date>/<start>/<minutes>
  const [pClass, pDate, pStart, pDur] = route.parts.slice(1);
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
    (ph ? loadPhonics(y).then((p) => p?.lessons ?? []) : loadSow(y, s).then((f) => f.lessons)).then((l) => { if (y === year) lessons = l; });
  });
  const shown = $derived(searchLessons(lessons, query));
  const modes: { id: Mode; title: string; body: string }[] = [
    { id: 'follow-sow', title: 'Follow the SoW', body: 'Everything from the SoW lesson is filled in: standards, outline steps and materials. Improve and expand it.' },
    { id: 'sow-standards', title: 'SoW standards, my activities', body: 'The CS, LS, skills and theme come from the SoW. You design the activities.' },
    { id: 'scratch', title: 'From scratch', body: 'Choose your own standards from the DSKP and plan everything yourself.' }
  ];

  async function create() {
    error = '';
    if (mode !== 'scratch' && picked == null) { error = 'Choose the SoW lesson you are planning.'; return; }
    if (!(duration >= 15 && duration <= 120)) { error = 'Lesson length must be between 15 and 120 minutes.'; return; }
    busy = true;
    try {
      const std = await loadStandards(year, school);
      const sow = picked != null ? lessons.find((l) => l.no === picked) ?? null : null;
      const l = buildLesson({ mode, year, school, sow, phonics: usePhonics && hasPhonics, date, start, durationMin: duration,
        classId: cls?.id ?? null, className: cls?.name ?? '', levelLabel: cls?.levelLabel ?? '', pupils: cls ? await countPupils(cls.id) || null : null }, std);
      await saveLesson(l);
      go('plan', 'edit', l.id, mode === 'scratch' ? 'standards' : 'setup');
    } catch (e) { error = (e as Error).message; busy = false; }
  }
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('plan')}><Icon name="back" size={18} />Plan</a>
  <h1>New RPH</h1>

  <section class="card stack">
    <h3>1 · Class and time</h3>
    <div class="grid">
      <label class="field"><span>Class</span>
        <select id="nr-class" class="select" bind:value={classId}>
          <option value="">No class (choose year below)</option>
          {#each classes as c}<option value={c.id}>{c.name} · Year {c.year} {c.schoolType}</option>{/each}
        </select>
        {#if !classes.length}<small class="muted">Tip: <a href={href('classes')}>add your classes</a> to fill the class name and pupil count.</small>{/if}
      </label>
      {#if !cls}
        <label class="field"><span>Year</span>
          <select id="nr-year" class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select>
        </label>
        <div class="field"><span id="nr-school">School type</span>
          <div class="seg" role="group" aria-labelledby="nr-school">{#each ['SK', 'SJK'] as s}<button type="button" aria-pressed={school === s} onclick={() => (school = s as School)}>{s}</button>{/each}</div>
        </div>
      {/if}
      <label class="field"><span>Date</span><input id="nr-date" class="input" type="date" bind:value={date} /></label>
      <label class="field"><span>Start time</span><input id="nr-start" class="input" type="time" bind:value={start} /></label>
      <div class="field"><span id="nr-dur">Length</span>
        <div class="row">
          <div class="seg" role="group" aria-labelledby="nr-dur">{#each [30, 60] as d}<button type="button" aria-pressed={duration === d} onclick={() => (duration = d)}>{d} min</button>{/each}</div>
          <input id="nr-duration" class="input mins" type="number" min="15" max="120" step="5" bind:value={duration} aria-label="Custom length in minutes" />
        </div>
      </div>
    </div>
  </section>

  <section class="stack">
    <h3>2 · How do you want to start?</h3>
    <div class="modes" role="radiogroup" aria-label="Planning mode">
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
        <h3>3 · Choose the SoW lesson</h3>
        {#if hasPhonics}<label class="row small"><input id="nr-phonics" type="checkbox" bind:checked={usePhonics} />Phonics SoW</label>{/if}
      </div>
      <p class="muted small">Year {year} {usePhonics && hasPhonics ? 'Phonics' : school} · {index?.years[String(year)]?.textbook}</p>
      <input id="nr-search" class="input" type="search" placeholder="Search by lesson number, topic, skill or LS code" bind:value={query} />
      <ul class="pick" role="listbox" aria-label="SoW lessons">
        {#each shown.slice(0, 200) as l (l.no)}
          <li role="none"><button type="button" role="option" aria-selected={picked === l.no} data-sow={l.no} onclick={() => (picked = l.no)}>
            <span class="no">{l.no}</span><span class="what"><b>{l.topic || l.label}</b><span class="muted">{l.label}{l.unit ? ` · ${l.unit}` : ''} · LS {l.std.main.ls.join(', ') || 'teacher choice'}</span></span>
          </button></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <div class="row"><button id="nr-create" class="btn btn-gold" type="button" disabled={busy} onclick={create}>Create RPH</button></div>
</div>

<style>
  .back { justify-self: start; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }
  small, .small { font-size: var(--t-sm); }
  .mins { width: 90px; }
  .modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .mode { text-align: left; cursor: pointer; font: inherit; color: inherit; }
  .mode[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); }
  .between { justify-content: space-between; }
  .pick { list-style: none; margin: 0; padding: 0; max-height: 360px; overflow-y: auto; border: 1px solid var(--line); border-radius: var(--r-ctl); }
  .pick li + li { border-top: 1px solid var(--line); }
  .pick button { width: 100%; display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: var(--s-3); text-align: left; padding: var(--s-2) var(--s-3); border: 0; background: transparent; cursor: pointer; min-height: var(--tap); }
  .pick button[aria-selected='true'] { background: var(--gold-soft); }
  .no { font: 500 var(--t-sm) var(--f-mono); color: var(--gold); padding-top: 2px; }
  .what { display: grid; min-width: 0; }
  .what .muted { font-size: var(--t-sm); }
  .err { color: var(--bad); }
</style>
