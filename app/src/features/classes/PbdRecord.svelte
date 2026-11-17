<script lang="ts">
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import { tr } from '../../lib/i18n/index.svelte';
  import { today as localToday } from '../../lib/dates';
  import { href } from '../../router.svelte';
  import { db, type Pupil, type PbdRecord, type SchoolClass } from '../../lib/db/schema';
  import { getClass, listPupils, getLesson } from '../../lib/db/repo';
  import { loadStandards } from '../../lib/curriculum/loader';
  import type { Standards } from '../../lib/curriculum/types';
  import type { Lesson } from '../../lib/lesson/model';
  import Icon from '../../lib/ui/Icon.svelte';

  /** Record TP1–TP6 for each pupil and Learning Standard, after a lesson or on its own (blueprint F20). */
  let { classId, lessonId }: { classId: string; lessonId: string } = $props();
  let cls = $state<SchoolClass | null>(null);
  let pupils = $state<Pupil[]>([]);
  let lesson = $state<Lesson | null>(null);
  let std = $state<Standards | null>(null);
  let codes = $state<string[]>([]);
  let date = $state(localToday());
  let absent = $state<string[]>([]);
  let tp = $state<Record<string, number>>({}); // `${pupilId}|${ls}` → TP
  let notes = $state<Record<string, string>>({});
  let saved = $state('');
  let help = $state('');

  async function load() {
    cls = (await getClass(classId)) ?? null;
    if (!cls) return;
    pupils = await listPupils(classId);
    std = await loadStandards(cls.year, cls.schoolType);
    if (lessonId !== 'new') {
      lesson = (await getLesson(lessonId)) ?? null;
      if (lesson) {
        codes = [...lesson.standards.main.ls, ...lesson.standards.comp.ls].map((x) => x.code);
        date = lesson.header.date;
        const sess = (await db.sessions.where('lessonId').equals(lessonId).toArray()).filter((s) => s.endedAt).sort((a, b) => b.startedAt - a.startedAt)[0];
        absent = sess?.absent ?? [];
      }
    }
    const recs = await db.pbd.where('classId').equals(classId).toArray();
    for (const r of recs.filter((r) => (lessonId !== 'new' ? r.lessonId === lessonId : false))) { tp[`${r.pupilId}|${r.ls}`] = r.tp; if (r.note) notes[r.pupilId] = r.note; }
  }
  $effect(() => { load(); });

  function addCode(c: string) { if (c && !codes.includes(c)) codes = [...codes, c]; }
  function set(pid: string, ls: string, v: number) { const k = `${pid}|${ls}`; tp[k] = tp[k] === v ? 0 : v; saved = ''; }
  function fillAll(ls: string, v: number) { for (const p of pupils) if (!absent.includes(p.id)) tp[`${p.id}|${ls}`] = v; saved = ''; }
  async function save() {
    const rows: PbdRecord[] = [];
    const del: string[] = [];
    const key = lessonId === 'new' ? `manual-${date}` : lessonId;
    for (const p of pupils) for (const ls of codes) {
      const id = `${key}:${p.id}:${ls}`;
      const v = tp[`${p.id}|${ls}`];
      if (v) rows.push({ id, pupilId: p.id, classId, lessonId: lessonId === 'new' ? null : lessonId, ls, tp: v as PbdRecord['tp'], date, note: notes[p.id]?.trim() || undefined });
      else del.push(id);
    }
    await db.transaction('rw', db.pbd, async () => { await db.pbd.bulkDelete(del); await db.pbd.bulkPut(rows); });
    saved = tr('{length} record{x} saved.', { length: rows.length, x: rows.length === 1 ? '' : 's' });
  }
  const skillOf = (ls: string) => ({ '1': 'Listening', '2': 'Speaking', '3': 'Reading', '4': 'Writing', '5': 'Language Arts' } as Record<string, string>)[ls[0]];
  const desc = (ls: string, level: number) => std?.performance[skillOf(ls)]?.find((p) => p.level === level)?.descriptors ?? [];
  const lsText = (c: string) => std?.ls.find((l) => l.code === c)?.text ?? '';
  let pickLs = $state('');
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('classes', classId)}><Icon name="back" size={18} />{cls?.name ?? tr('Class')}</a>
  <header><p class="eyebrow">{tr('PBD · {x}', { x: cls?.name })}</p><h1>{lesson ? lesson.topic || tr('Lesson') : tr('Record TP levels')}</h1></header>

  <section class="card grid">
    <label class="field"><span>{tr('Date')}</span><input id="pbd-date" class="input" type="date" bind:value={date} /></label>
    <label class="field"><span>{tr('Add a Learning Standard')}</span>
      <select id="pbd-ls" class="select" bind:value={pickLs} onchange={() => { addCode(pickLs); pickLs = ''; }}>
        <option value="">{tr('Choose…')}</option>
        {#each std?.ls ?? [] as l}<option value={l.code}>{l.code} {l.text.slice(0, 60)}</option>{/each}
      </select>
    </label>
  </section>

  {#if !pupils.length}
    <EmptyState icon="classes" compact>{tr('This class has no pupils yet.')} <a href={href('classes', classId)}>{tr('Add the pupil list')}</a> {tr('first.')}</EmptyState>
  {:else if !codes.length}
    <EmptyState compact>{tr('Choose the Learning Standard you assessed.')}</EmptyState>
  {:else}
    {#each codes as ls (ls)}
      <section class="card stack ls">
        <div class="row between"><h3><span class="code">{tr('LS {ls}', { ls })}</span> {skillOf(ls)}</h3>
          <div class="row"><span class="muted small">{tr('Set everyone to')}</span>{#each [1, 2, 3, 4, 5, 6] as v}<button class="btn btn-text mini" type="button" onclick={() => fillAll(ls, v)}>{v}</button>{/each}</div>
        </div>
        <p class="muted small pre">{lsText(ls)}</p>
        <details><summary class="small">{tr('What each TP means for {x}', { x: skillOf(ls) })}</summary>
          <ol class="tpd">{#each [1, 2, 3, 4, 5, 6] as v}<li><b>{tr('TP{v}', { v })}</b> {desc(ls, v).join(' ')}</li>{/each}</ol>
        </details>
        <ul class="grid-tp">
          {#each pupils as p (p.id)}
            {@const off = absent.includes(p.id)}
            <li class:off>
              <span class="nm">{p.name}{#if off} <span class="muted small">{tr('(absent)')}</span>{/if}</span>
              <div class="tps" role="group" aria-label={tr('TP for {name}', { name: p.name })}>
                {#each [1, 2, 3, 4, 5, 6] as v}<button type="button" class="tp t{v}" aria-pressed={tp[`${p.id}|${ls}`] === v} disabled={off} onclick={() => set(p.id, ls, v)} onfocus={() => (help = `TP${v}: ${desc(ls, v)[0] ?? ''}`)}>{v}</button>{/each}
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
    {#if help}<p class="muted small">{help}</p>{/if}
    <details class="card"><summary>{tr('Notes about pupils (optional)')}</summary>
      <div class="notes">{#each pupils as p}<label class="field"><span>{p.name}</span><input class="input" bind:value={notes[p.id]} placeholder={tr('e.g. needs phonics support')} /></label>{/each}</div>
    </details>
    <div class="row"><button id="pbd-save" class="btn btn-gold" type="button" onclick={save}>{tr('Save TP levels')}</button>{#if saved}<span class="ok" role="status">{saved}</span><a class="btn btn-text" href={href('classes', classId, 'pbd')}>{tr('See class progress')}</a>{/if}</div>
  {/if}
</div>

<style>
  .grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }

  .mini { min-height: 32px; padding: 0 8px; }
  .tpd { margin: var(--s-2) 0 0; padding-left: 0; list-style: none; display: grid; gap: 4px; font-size: var(--t-sm); }
  .grid-tp { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .grid-tp li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--s-2); align-items: center; padding: 4px 0; border-bottom: 1px solid var(--line); }
  .grid-tp li.off { opacity: .55; }
  .nm { overflow: hidden; text-overflow: ellipsis; }
  .tps { display: flex; gap: 4px; }
  .tp { width: 38px; height: 38px; border-radius: 8px; border: 1px solid var(--line); background: var(--card); font: 700 var(--t-sm) var(--f-mono); color: var(--ink); cursor: pointer; }
  .tp[aria-pressed='true'] { color: #111; border-color: transparent; }
  .tp.t1[aria-pressed='true'] { background: #F2A39B; } .tp.t2[aria-pressed='true'] { background: #F7C08A; } .tp.t3[aria-pressed='true'] { background: #F6DC7E; }
  .tp.t4[aria-pressed='true'] { background: #CFE59A; } .tp.t5[aria-pressed='true'] { background: #9FD9AE; } .tp.t6[aria-pressed='true'] { background: #6CC59B; }
  @media (max-width: 420px) { .tp { width: 32px; height: 36px; } }
  .notes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-2); margin-top: var(--s-2); }
  .ok { color: var(--ok); font-weight: 600; }
</style>
