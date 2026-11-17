<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { t, type Key } from '../../lib/i18n/index.svelte';
  import { route, href } from '../../router.svelte';
  import { loadIndex, loadSow, loadStandards, loadPhonics, searchLessons } from '../../lib/curriculum/loader';
  import type { PackIndex, School, SowFile, Standards, PhonicsFile, SowLesson } from '../../lib/curriculum/types';
  import Icon from '../../lib/ui/Icon.svelte';
  import LessonDetail from './LessonDetail.svelte';
  import Shelf from '../books/Shelf.svelte';
  import Reader from '../books/Reader.svelte';
  import { BANK } from '../../lib/content/bank';
  import { GUIDE, SOURCES } from '../../lib/content/guide';

  type Tab = 'sow' | 'phonics' | 'standards' | 'levels' | 'tasks' | 'books' | 'bank' | 'guide';
  // The whole view is addressed by the hash, so a refresh or a shared link reopens the same place:
  // #/library/<year>/<school>/<tab>/<lesson>
  const year = $derived(Math.min(6, Math.max(1, Number(route.parts[0]) || 4)));
  const school = $derived<School>(route.parts[1] === 'sjk' ? 'SJK' : 'SK');
  const tab = $derived<Tab>((['sow', 'phonics', 'standards', 'levels', 'tasks', 'books', 'bank', 'guide'] as Tab[]).includes(route.parts[2] as Tab) ? (route.parts[2] as Tab) : 'sow');
  const reading = $derived(route.parts[0] === 'read' && route.parts[1] ? { slot: route.parts[1], page: Number(route.parts[2]) || 1, slot2: route.parts[3], page2: Number(route.parts[4]) || 1 } : null);
  let everything = $state('');
  let bankSkill = $state('All');
  const lessonNo = $derived(Number(route.parts[3]) || 0);
  const link = (y = year, s: School = school, tb: Tab = tab, n?: number) => href('library', y, s.toLowerCase(), tb, ...(n ? [n] : []));

  let index = $state<PackIndex | null>(null);
  let sow = $state<SowFile | null>(null);
  let standards = $state<Standards | null>(null);
  let phonics = $state<PhonicsFile | null>(null);
  let error = $state('');
  let query = $state('');
  let skill = $state('Listening');

  $effect(() => {
    const y = year, s = school;
    error = '';
    Promise.all([loadIndex(), loadSow(y, s), loadStandards(y, s), loadPhonics(y)])
      .then(([i, w, st, ph]) => { if (y === year && s === school) { index = i; sow = w; standards = st; phonics = ph; } })
      .catch((e) => (error = String(e.message ?? e)));
  });

  const hasPhonics = $derived(!!index?.years[String(year)]?.phonics);
  const activeTab = $derived<Tab>(tab === 'phonics' && !hasPhonics ? 'sow' : tab);
  const lessons = $derived<SowLesson[]>(activeTab === 'phonics' ? phonics?.lessons ?? [] : sow?.lessons ?? []);
  const shown = $derived(searchLessons(lessons, query));
  const current = $derived(lessonNo ? lessons.find((l) => l.no === lessonNo) : undefined);
  const tabs = $derived<{ id: Tab; label: string }[]>([
    { id: 'sow', label: t('library.sow') },
    ...(hasPhonics ? [{ id: 'phonics' as Tab, label: tr('Phonics') }] : []),
    { id: 'standards', label: t('library.standards') },
    { id: 'levels', label: t('library.levels') },
    { id: 'tasks', label: t('library.tasks') },
    { id: 'books', label: tr('Textbooks') },
    { id: 'bank', label: tr('Activity bank') },
    { id: 'guide', label: tr('Method Guide') }
  ]);
  // search everything in this year: lessons, standards, task bank, strategies, activity bank, Method Guide
  const found = $derived.by(() => {
    const q = everything.trim().toLowerCase();
    if (q.length < 2 || !sow || !standards) return null;
    const has = (...xs: string[]) => xs.join(' ').toLowerCase().includes(q);
    return {
      lessons: sow.lessons.filter((l) => has(String(l.no), l.label, l.topic, l.mainSkill, l.focus, l.unit, l.materials, ...l.outline.pre, ...l.outline.delivery, ...l.outline.post, ...l.std.main.ls, ...l.std.comp.ls)).slice(0, 15),
      standards: standards.ls.filter((l) => has(l.code, l.text, l.focus)).slice(0, 10),
      tasks: [...sow.support.pre.map((x) => ({ ...x, kind: 'Pre-lesson' })), ...sow.support.post.map((x) => ({ ...x, kind: 'Post-lesson' }))].filter((x) => has(x.title, x.aim, ...x.steps)).slice(0, 8),
      strategies: sow.support.strategies.filter((x) => has(x.title, x.body, ...x.points)),
      bank: BANK.filter((b) => has(b.title, b.skill, b.teacher, b.pupils)).slice(0, 10),
      guide: GUIDE.filter((g) => has(g.title, ...g.body, ...(g.pitfalls ?? [])))
    };
  });
  const bankSkills = ['All', 'Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts', 'Pre-lesson', 'Post-lesson'];
  const bankShown = $derived(BANK.filter((b) => (bankSkill === 'All' || b.skill === bankSkill) && year >= b.years[0] && year <= b.years[1]));
  const skills = $derived(standards ? Object.keys(standards.performance) : []);
  const bySkill = $derived.by(() => {
    if (!standards) return [];
    const order = ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'];
    return order.map((s) => ({ skill: s, cs: standards!.cs.filter((c) => c.skill === s).map((c) => ({ ...c, ls: standards!.ls.filter((l) => l.cs === c.code) })) })).filter((g) => g.cs.length);
  });
  const taskGroups = $derived<{ key: Key; items: SowFile['support']['pre'] }[]>(sow ? [
    { key: 'library.prePost.pre', items: sow.support.pre }, { key: 'library.prePost.post', items: sow.support.post }
  ] : []);
</script>

{#if reading}
  {#key route.parts.join('/')}<Reader slot={reading.slot} page={reading.page} slot2={reading.slot2} page2={reading.page2} />{/key}
{:else if current && standards && (activeTab === 'sow' || activeTab === 'phonics')}
  <LessonDetail lesson={current} {standards} backHref={link()}
    sourceLabel={`${activeTab === 'phonics' ? 'Phonics SoW' : 'SoW'} · ${t('library.year', { n: year })}${activeTab === 'phonics' ? '' : ' ' + school}`} />
{:else}
<div class="stack">
  <header class="stack tight">
    <h1>{t('library.title')}</h1>
    <p class="muted">{t('library.sub', { v: index?.version ?? '…' })}{#if index} · {index.years[String(year)].textbook}{/if}</p>
  </header>

  <div class="controls">
    <div class="seg" role="group" aria-label={tr('Year')}>
      {#each [1, 2, 3, 4, 5, 6] as y}<button type="button" aria-pressed={year === y} onclick={() => { query = ''; location.hash = link(y, school, tab); }}>{t('library.year', { n: y })}</button>{/each}
    </div>
    <div class="seg" role="group" aria-label={t('library.school')}>
      {#each ['SK', 'SJK'] as s}<button type="button" aria-pressed={school === s} onclick={() => (location.hash = link(year, s as School, tab))}>{s}</button>{/each}
    </div>
  </div>

  <label class="search everything"><Icon name="search" size={18} /><span class="sr-only">{tr('Search everything')}</span>
    <input id="lib-everything" class="input" type="search" bind:value={everything} placeholder={tr('Search everything in Year {year}: lessons, standards, tasks, activities, Method Guide', { year })} /></label>

  {#if found}
    <section class="stack found" aria-label={tr('Search results')}>
      {#if found.lessons.length}<h3>{tr('SoW lessons')}</h3><ul class="flat">{#each found.lessons as l}<li><a href={link(year, school, 'sow', l.no)}>{tr('Lesson {no}: {x}', { no: l.no, x: l.topic || l.label })}</a> <span class="muted small">{l.label}</span></li>{/each}</ul>{/if}
      {#if found.standards.length}<h3>{tr('Learning Standards')}</h3><ul class="flat">{#each found.standards as l}<li><a href={link(year, school, 'standards')}><span class="code">{l.code}</span></a> <span class="pre">{l.text}</span></li>{/each}</ul>{/if}
      {#if found.tasks.length}<h3>{tr('SoW task bank')}</h3><ul class="flat">{#each found.tasks as x}<li><a href={link(year, school, 'tasks')}>{tr('{kind} task {no}: {title}', { kind: x.kind, no: x.no, title: x.title })}</a> <span class="muted small">{x.aim}</span></li>{/each}</ul>{/if}
      {#if found.strategies.length}<h3>{tr('Differentiation strategies')}</h3><ul class="flat">{#each found.strategies as x}<li><a href={link(year, school, 'tasks')}>{tr('Strategy {no}: {title}', { no: x.no, title: x.title })}</a></li>{/each}</ul>{/if}
      {#if found.bank.length}<h3>{tr('Activity bank')}</h3><ul class="flat">{#each found.bank as b}<li><a href={link(year, school, 'bank')}>{b.title}</a> <span class="muted small">{tr('{skill} · Years {x}–{x2}', { skill: b.skill, x: b.years[0], x2: b.years[1] })}</span></li>{/each}</ul>{/if}
      {#if found.guide.length}<h3>{tr('Method Guide')}</h3><ul class="flat">{#each found.guide as g}<li><a href={link(year, school, 'guide')}>{g.title}</a></li>{/each}</ul>{/if}
      {#if !Object.values(found).some((v) => v.length)}<p class="muted">{tr('Nothing in Year {year} matches "{everything}".', { year, everything })}</p>{/if}
    </section>
  {/if}

  <div class="tabs" role="tablist">
    {#each tabs as tb}<a role="tab" aria-selected={activeTab === tb.id} href={link(year, school, tb.id)}>{tb.label}</a>{/each}
  </div>

  {#if activeTab === 'books'}
    <Shelf {year} {school} />
  {:else if activeTab === 'bank'}
    <div class="seg skills" role="group" aria-label={tr('Skill')}>{#each bankSkills as k}<button type="button" aria-pressed={bankSkill === k} onclick={() => (bankSkill = k)}>{k}</button>{/each}</div>
    <p class="muted small">{tr('{length} activities for Year {year}. Insert them into a lesson from the Lesson flow step of the lesson plan builder.', { length: bankShown.length, year })}</p>
    <div class="bank">
      {#each bankShown as b (b.id)}
        <details class="card" data-bank={b.id}>
          <summary><b>{b.title}</b><span class="muted small">{tr('{skill} · {minutes} min · {pattern} · Years {x}–{x2}', { skill: b.skill, minutes: b.minutes, pattern: b.pattern, x: b.years[0], x2: b.years[1] })}</span></summary>
          <p><b>{tr('Teacher:')}</b> {b.teacher}</p><p><b>{tr('Pupils:')}</b> {b.pupils}</p>
          <ul class="tiers"><li><b>{tr('🌱 Low')}</b> {b.tiers.low}</li><li><b>{tr('🌿 Moderate')}</b> {b.tiers.mod}</li><li><b>{tr('🌳 High')}</b> {b.tiers.high}</li></ul>
          <p class="muted small">{tr('Materials: {materials} · Offline: {offline}', { materials: b.materials, offline: b.offline })}</p>
        </details>
      {/each}
    </div>
  {:else if activeTab === 'guide'}
    <div class="stack guide">
      {#each GUIDE as g (g.id)}
        <section class="card" id={'guide-' + g.id}><h3>{g.title}</h3>{#each g.body as para}<p>{para}</p>{/each}
          {#if g.pitfalls}<p class="muted small"><b>{tr('Watch out for:')}</b></p><ul class="small">{#each g.pitfalls as p}<li>{p}</li>{/each}</ul>{/if}
        </section>
      {/each}
      <section class="card"><h3>{tr('Sources')}</h3><p class="muted small">{tr('The skill-to-framework advice is mainstream TESL methodology from these sources, not an official KPM rule.')}</p><ol class="small">{#each SOURCES as src}<li>{src}</li>{/each}</ol></section>
    </div>
  {:else if error}
    <p class="empty" role="alert">{error}</p>
  {:else if !sow || !standards}
    <p class="muted">{t('common.loading')}</p>
  {:else if activeTab === 'sow' || activeTab === 'phonics'}
    <label class="search">
      <Icon name="search" size={18} />
      <span class="sr-only">{t('common.search')}</span>
      <input id="lesson-search" class="input" type="search" placeholder={t('library.searchLessons')} bind:value={query} />
    </label>
    <p class="muted small">{t('library.lessons', { n: shown.length })}</p>
    {#if !shown.length}<p class="empty">{t('library.noResults')}</p>{/if}
    <ul class="lessons">
      {#each shown as l (l.no)}
        <li>
          <a data-lesson={l.no} href={link(year, school, activeTab, l.no)}>
            <span class="no">{l.no}</span>
            <span class="what"><b>{l.topic || l.label}</b><span class="muted">{l.label}{l.unit ? ` · ${l.unit}` : ''}</span></span>
            <span class="codes">{#each l.std.main.ls as c}<span class="code">{c}</span>{/each}</span>
            <Icon name="chevron" size={18} />
          </a>
        </li>
      {/each}
    </ul>
  {:else if activeTab === 'standards'}
    {#each bySkill as g}
      <section class="stack tight">
        <h2>{g.skill}</h2>
        {#each g.cs as c}
          <div class="card">
            <p><span class="code">{tr('CS {code}', { code: c.code })}</span> <b>{c.text}</b></p>
            <ul class="lslist">
              {#each c.ls as l}<li><span class="code">{l.code}</span><span><span class="pre">{l.text}</span>{#if l.focus && !l.text.startsWith(l.focus.replace(/[: ]+$/, ''))}<br /><span class="muted small">{tr('Focus: {focus}', { focus: l.focus })}</span>{/if}</span></li>{/each}
            </ul>
          </div>
        {/each}
      </section>
    {/each}
  {:else if activeTab === 'levels'}
    <div class="seg" role="group" aria-label={tr('Skill')}>
      {#each skills as s}<button type="button" aria-pressed={skill === s} onclick={() => (skill = s)}>{s}</button>{/each}
    </div>
    <div class="stack tight">
      {#each standards.performance[skills.includes(skill) ? skill : skills[0]] ?? [] as p}
        <div class="card tp">
          <span class="tpn">{t('library.tp', { n: p.level })}</span>
          <div class="stack tight"><ul>{#each p.descriptors as d}<li>{d}</li>{/each}</ul>{#if p.note}<p class="muted small">{p.note}</p>{/if}</div>
        </div>
      {/each}
    </div>
  {:else}
    {#each taskGroups as g}
      <section class="stack tight">
        <h2>{t(g.key)}</h2>
        {#each g.items as task}
          <details class="card">
            <summary><span class="no">{task.no}</span><span class="what"><b>{task.title}</b><span class="muted">{task.aim}</span></span></summary>
            {#if task.materials}<p class="muted small">{t('library.materials')}: {task.materials}</p>{/if}
            <ol>{#each task.steps as s}<li>{s}</li>{/each}</ol>
            {#each task.notes ?? [] as nline}<p class="muted small">{nline}</p>{/each}
          </details>
        {/each}
      </section>
    {/each}
    <section class="stack tight">
      <h2>{t('library.diffStrategies')}</h2>
      {#each sow.support.strategies as s}
        <details class="card">
          <summary><span class="no">{s.no}</span><span class="what"><b>{s.title}</b></span></summary>
          <p>{s.body}</p>
          {#if s.points.length}<ul>{#each s.points as p}<li>{p}</li>{/each}</ul>{/if}
        </details>
      {/each}
    </section>
  {/if}

  <aside class="card soon">
    <span class="chip">2027</span>
    <div><b>{t('library.kp2027.title')}</b><p class="muted small">{t('library.kp2027.body')}</p></div>
  </aside>
</div>
{/if}

<style>
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .pre { white-space: pre-line; }
  .controls { display: flex; flex-wrap: wrap; gap: var(--s-3); }
  .controls .seg { max-width: 100%; overflow-x: auto; }
  .seg button { white-space: nowrap; }
  .tabs { display: flex; gap: var(--s-1); border-bottom: 1px solid var(--line); overflow-x: auto; }
  .tabs a { padding: var(--s-3) var(--s-3); min-height: var(--tap); text-decoration: none; color: var(--ink-2); font-weight: 600; font-size: var(--t-sm); white-space: nowrap; border-bottom: 3px solid transparent; }
  .tabs a[aria-selected='true'] { color: var(--navy); border-color: var(--gold-strong); }
  .search { position: relative; display: block; color: var(--ink-3); }
  .search :global(svg) { position: absolute; left: 12px; top: 13px; }
  .search .input { padding-left: 38px; }
  .lessons { list-style: none; margin: 0; padding: 0; display: grid; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--card); overflow: hidden; }
  .lessons li + li { border-top: 1px solid var(--line); }
  .lessons a { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto 18px; gap: var(--s-3); align-items: center; padding: var(--s-3) var(--s-4); min-height: 56px; text-decoration: none; color: var(--ink); }
  .lessons a:hover { background: var(--sunken); }
  .no { font: 500 var(--t-sm) var(--f-mono); color: var(--gold); }
  .what { display: grid; min-width: 0; }
  .what b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .what .muted { font-size: var(--t-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .codes { display: flex; gap: 4px; }
  @media (max-width: 480px) { .codes { display: none; } .lessons a { grid-template-columns: 32px minmax(0, 1fr) 18px; } }
  .lslist { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .lslist li { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: var(--s-3); align-items: start; }
  .tp { grid-template-columns: 56px minmax(0, 1fr); align-items: start; }
  .tpn { font: 800 var(--t-lg) var(--f-display); color: var(--navy); }
  .tp ul, details ul, details ol { margin: 0; padding-left: 1.2em; display: grid; gap: var(--s-1); }
  summary { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: var(--s-3); cursor: pointer; list-style: none; min-height: var(--tap); align-items: center; }
  summary::-webkit-details-marker { display: none; }
  summary .what b, summary .what .muted { white-space: normal; }
  .everything .input { padding-left: 38px; }
  .found h3 { font-size: var(--t-sm); letter-spacing: .1em; text-transform: uppercase; color: var(--gold); }
  .flat { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .bank { display: grid; gap: var(--s-2); }
  .bank summary { display: grid; gap: 2px; grid-template-columns: 1fr; }
  .tiers { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
  .guide p + p { margin-top: var(--s-2); }
  .soon { grid-template-columns: auto minmax(0, 1fr); align-items: start; border-style: dashed; }
</style>
