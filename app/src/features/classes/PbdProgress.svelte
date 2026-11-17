<script lang="ts">
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import { tr } from '../../lib/i18n/index.svelte';
  import { today as localToday } from '../../lib/dates';
  import { href } from '../../router.svelte';
  import { db, type Pupil, type PbdRecord, type SchoolClass } from '../../lib/db/schema';
  import { getClass, listPupils, listLessons, updatePupil } from '../../lib/db/repo';
  import { autoTier, latestGrid, type Tier } from '../../lib/pbd';
  import { pbdSheets, sheetsToBlob } from '../../lib/export/xlsx';
  import { saveFile } from '../../lib/export/download';
  import Icon from '../../lib/ui/Icon.svelte';

  /** Class heatmap of pupils × Learning Standards and suggested Low / Moderate / High groups (blueprint F20). */
  let { classId }: { classId: string } = $props();
  let cls = $state<SchoolClass | null>(null);
  let pupils = $state<Pupil[]>([]);
  let recs = $state<PbdRecord[]>([]);
  let topics = $state<Map<string, string>>(new Map());
  let msg = $state('');
  async function load() {
    cls = (await getClass(classId)) ?? null;
    pupils = await listPupils(classId);
    recs = await db.pbd.where('classId').equals(classId).toArray();
    topics = new Map((await listLessons()).map((l) => [l.id, l.topic]));
  }
  $effect(() => { load(); });
  const codes = $derived([...new Set(recs.map((r) => r.ls))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  const grid = $derived(latestGrid(recs));
  const suggested = $derived(new Map(pupils.map((p) => [p.id, autoTier(recs.filter((r) => r.pupilId === p.id))])));
  const level = (p: Pupil): Tier => p.tierOverride ?? suggested.get(p.id)!.tier;
  const names = { low: tr('🌱 Low'), mod: tr('🌿 Moderate'), high: tr('🌳 High') } as const;
  async function override(p: Pupil, v: string) { const t = (v || undefined) as Tier | undefined; await updatePupil(p.id, { tierOverride: t }); p.tierOverride = t; }
  async function excel() {
    if (!cls) return;
    msg = tr('Preparing the Excel file…');
    const blob = await sheetsToBlob(pbdSheets([{ cls, pupils, records: recs }], (id) => (id ? topics.get(id) ?? '' : tr('Recorded separately'))));
    await saveFile(blob, `PBD-${cls.name.replace(/[^\w-]+/g, '-')}-${localToday()}.xlsx`);
    msg = tr('Excel file ready.');
  }
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('classes', classId)}><Icon name="back" size={18} />{cls?.name ?? tr('Class')}</a>
  <header class="row between"><div><p class="eyebrow">{tr('PBD progress')}</p><h1>{cls?.name}</h1></div>
    <div class="row"><a class="btn btn-gold" href={href('classes', classId, 'pbd', 'new')}>{tr('Record TP levels')}</a><button id="pbd-excel" class="btn btn-outline" type="button" onclick={excel} disabled={!recs.length}>{tr('Export to Excel')}</button></div>
  </header>
  {#if msg}<p class="muted small" role="status">{msg}</p>{/if}

  {#if !recs.length}
    <EmptyState icon="classes" title={tr('No TP records yet')}>{tr('After teaching, tap "Record PBD" at the end of Teach mode, or record TP levels here.')}</EmptyState>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="scroll" role="region" aria-label={tr('Heatmap')} tabindex="0">
      <table class="heat">
        <thead><tr><th class="sticky">{tr('Pupil')}</th><th>{tr('Level')}</th>{#each codes as c}<th class="code-h">{c}</th>{/each}</tr></thead>
        <tbody>
          {#each pupils as p (p.id)}
            {@const s = suggested.get(p.id)!}
            <tr>
              <th class="sticky"><a href={href('classes', classId, 'pupil', p.id)}>{p.name}</a></th>
              <td class="lvl {level(p)}">{names[level(p)]}{#if !p.tierOverride && s.provisional}<span class="muted" title={tr('Fewer than three records')}> *</span>{/if}</td>
              {#each codes as c}{@const r = grid.get(p.id)?.get(c)}<td class="tp t{r?.tp ?? 0}" title={r ? tr('TP{tp} on {date}', { tp: r.tp, date: r.date }) : tr('Not assessed')}>{r?.tp ?? ''}</td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="muted small">{tr('Colours show the latest TP for each standard. * Suggested level from fewer than three records. Levels feed the group maker and differentiated worksheets.')}</p>

    <section class="stack">
      <h2>{tr('Suggested groups')}</h2>
      <div class="lv3">
        {#each ['low', 'mod', 'high'] as t}
          <section class="card">
            <h3>{names[t as Tier]} <span class="muted">({pupils.filter((p) => level(p) === t).length})</span></h3>
            <ul>{#each pupils.filter((p) => level(p) === t) as p}<li class="row between"><span>{p.name}</span>
              <select class="select tiny" aria-label={tr('Level for {name}', { name: p.name })} value={p.tierOverride ?? ''} onchange={(e) => override(p, e.currentTarget.value)}>
                <option value="">{tr('Auto')}</option><option value="low">{tr('Low')}</option><option value="mod">{tr('Moderate')}</option><option value="high">{tr('High')}</option>
              </select></li>{/each}</ul>
          </section>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>

  .scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--card); }
  .heat { border-collapse: collapse; font-size: var(--t-sm); }
  .heat th, .heat td { padding: 6px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; text-align: left; }
  .sticky { position: sticky; left: 0; background: var(--card); z-index: 1; }
  .code-h { font-family: var(--f-mono); font-size: var(--t-xs); }
  td.tp { text-align: center; font: 700 var(--t-sm) var(--f-mono); color: #111; min-width: 44px; }
  .t0 { background: transparent; } .t1 { background: #F2A39B; } .t2 { background: #F7C08A; } .t3 { background: #F6DC7E; } .t4 { background: #CFE59A; } .t5 { background: #9FD9AE; } .t6 { background: #6CC59B; }
  .lv3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .lv3 ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .tiny { min-height: 34px; width: auto; font-size: var(--t-sm); }
</style>
