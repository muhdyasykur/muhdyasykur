<script lang="ts">
  import PageHero from '../../lib/ui/PageHero.svelte';
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import { tr } from '../../lib/i18n/index.svelte';
  import { route, href, go } from '../../router.svelte';
  import { listClasses, saveClass, countPupils } from '../../lib/db/repo';
  import { profile } from '../../lib/profile.svelte';
  import type { SchoolClass } from '../../lib/db/schema';
  import Icon from '../../lib/ui/Icon.svelte';
  import ClassDetail from './ClassDetail.svelte';
  import PbdRecord from './PbdRecord.svelte';
  import PbdProgress from './PbdProgress.svelte';
  import PupilProfile from './PupilProfile.svelte';
  import Attendance from './Attendance.svelte';
  import Unlock from '../../lib/ui/Unlock.svelte';
  import { lock } from '../../lib/lock.svelte';

  const years = [1, 2, 3, 4, 5, 6] as const;
  let classes = $state<SchoolClass[]>([]);
  let counts = $state<Record<string, number>>({});
  let year = $state<number>(4);
  let adding = $state(false);
  let name = $state('');
  let level = $state('');
  let schoolType = $state<'SK' | 'SJK'>(profile.value?.schoolType ?? 'SK');
  let error = $state('');

  async function refresh() {
    classes = await listClasses();
    counts = Object.fromEntries(await Promise.all(classes.map(async (c) => [c.id, await countPupils(c.id)] as const)));
    if (classes.length && !classes.some((c) => c.year === year)) year = classes[0].year;
  }
  $effect(() => { void lock.unlocked; if (!route.parts[0]) refresh(); });

  async function add(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) { error = tr('Give the class a name, for example "4 Zhong".'); return; }
    const id = await saveClass({ year: year as SchoolClass['year'], name: name.trim(), schoolType, levelLabel: level.trim() || undefined });
    name = ''; level = ''; adding = false; error = '';
    go('classes', id);
  }
  const inYear = $derived(classes.filter((c) => c.year === year));
</script>

{#if lock.configured && !lock.unlocked}
  <Unlock />
{:else if route.parts[0] && route.parts[1] === 'pbd' && route.parts[2]}
  {#key route.parts[2]}<PbdRecord classId={route.parts[0]} lessonId={route.parts[2]} />{/key}
{:else if route.parts[0] && route.parts[1] === 'attendance'}
  {#key route.parts[0]}<Attendance classId={route.parts[0]} initialDate={route.parts[2] ?? ''} />{/key}
{:else if route.parts[0] && route.parts[1] === 'pbd'}
  <PbdProgress classId={route.parts[0]} />
{:else if route.parts[0] && route.parts[1] === 'pupil' && route.parts[2]}
  {#key route.parts[2]}<PupilProfile classId={route.parts[0]} pupilId={route.parts[2]} />{/key}
{:else if route.parts[0]}
  <ClassDetail id={route.parts[0]} />
{:else}
<div class="stack">
  <PageHero title={tr('Classes')} eyebrow={tr('Attendance · PBD · Profiles')} script={tr('Know every pupil')} sub={tr('Your classes and pupils, attendance and PBD progress, kept on this device.')} scene="support" tone="mint" />
  <div class="seg years" role="group" aria-label={tr('Year')}>
    {#each years as y}
      {@const n = classes.filter((c) => c.year === y).length}
      <button type="button" aria-pressed={year === y} onclick={() => (year = y)}>{tr('Year {y}', { y })}{#if n}<span class="count">{n}</span>{/if}</button>
    {/each}
  </div>

  {#if inYear.length}
    <ul class="cards">
      {#each inYear as c (c.id)}
        <li><a class="card raised" href={href('classes', c.id)}>
          <span class="nm">{c.name}</span>
          <span class="muted small">{tr('{schoolType}{x} · {x2} pupils', { schoolType: c.schoolType, x: c.levelLabel ? ` · ${c.levelLabel}` : '', x2: counts[c.id] ?? 0 })}</span>
        </a></li>
      {/each}
    </ul>
  {:else if !adding}
    <EmptyState icon="classes" title={tr('No Year {year} classes yet', { year })}>
      {tr('Add a class to put its name and pupil count on your lesson plan. Pupil lists also power attendance and PBD later.')}
    </EmptyState>
  {/if}

  {#if adding}
    <form class="card stack" onsubmit={add}>
      <h3>{tr('New Year {year} class', { year })}</h3>
      <div class="grid">
        <label class="field"><span>{tr('Class name')}</span><input id="cl-name" class="input" bind:value={name} placeholder={tr('e.g. 4 Zhong')} /></label>
        <label class="field"><span>{tr('Level (optional)')}</span><input id="cl-level" class="input" bind:value={level} placeholder={tr('e.g. Average')} list="levels" /></label>
        <div class="field"><span id="cl-type">{tr('School type')}</span>
          <div class="seg" role="group" aria-labelledby="cl-type">
            <button type="button" aria-pressed={schoolType === 'SK'} onclick={() => (schoolType = 'SK')}>{tr('SK')}</button>
            <button type="button" aria-pressed={schoolType === 'SJK'} onclick={() => (schoolType = 'SJK')}>{tr('SJK')}</button>
          </div>
        </div>
      </div>
      <datalist id="levels"><option value="Low"></option><option value="Average"></option><option value="High"></option><option value="Mixed ability"></option></datalist>
      {#if error}<p class="err">{error}</p>{/if}
      <div class="row"><button class="btn btn-gold" type="submit">{tr('Add class')}</button><button class="btn btn-text" type="button" onclick={() => (adding = false)}>{tr('Cancel')}</button></div>
    </form>
  {:else}
    <button class="btn btn-primary add" type="button" onclick={() => (adding = true)}><Icon name="plus" size={18} />{tr('Add a Year {year} class', { year })}</button>
  {/if}
</div>
{/if}

<style>
  .years { max-width: 100%; overflow-x: auto; }
  .years button { white-space: nowrap; display: inline-flex; gap: 6px; align-items: center; }
  .count { font-size: var(--t-xs); background: var(--gold-soft); color: var(--ink); border-radius: 99px; padding: 0 6px; }
  .cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: var(--s-3); }
  .cards a { text-decoration: none; color: var(--ink); }
  .nm { font: 700 var(--t-lg) var(--f-display); }

  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }

  .err { color: var(--bad); font-size: var(--t-sm); }
</style>
