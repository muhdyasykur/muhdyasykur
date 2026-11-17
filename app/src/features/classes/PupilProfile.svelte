<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { db, type Pupil, type PbdRecord } from '../../lib/db/schema';
  import { listPupils, updatePupil, setPair, listLessons } from '../../lib/db/repo';
  import { autoTier } from '../../lib/pbd';
  import Icon from '../../lib/ui/Icon.svelte';

  let { classId, pupilId }: { classId: string; pupilId: string } = $props();
  let all = $state<Pupil[]>([]);
  let recs = $state<PbdRecord[]>([]);
  let topics = $state<Map<string, string>>(new Map());
  let note = $state(''); let saved = $state('');
  async function load() {
    all = await listPupils(classId);
    recs = (await db.pbd.where('pupilId').equals(pupilId).toArray()).sort((a, b) => b.date.localeCompare(a.date));
    topics = new Map((await listLessons()).map((l) => [l.id, l.topic]));
    note = all.find((p) => p.id === pupilId)?.note ?? '';
  }
  $effect(() => { load(); });
  const me = $derived(all.find((p) => p.id === pupilId));
  const others = $derived(all.filter((p) => p.id !== pupilId));
  const sug = $derived(autoTier(recs));
  async function pair(kind: 'keepApart' | 'keepTogether', other: string, on: boolean) { await setPair(kind, pupilId, other, on); await load(); }
  async function saveNote() { await updatePupil(pupilId, { note }); saved = tr('Saved.'); }
  async function setTier(v: string) { await updatePupil(pupilId, { tierOverride: (v || undefined) as Pupil['tierOverride'] }); await load(); }
  const names = { low: tr('Low'), mod: tr('Moderate'), high: tr('High') };
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('classes', classId, 'pbd')}><Icon name="back" size={18} />{tr('Class progress')}</a>
  {#if me}
    <h1>{me.name}</h1>
    <section class="card grid">
      <label class="field"><span>{tr('Level')}</span>
        <select id="pp-tier" class="select" value={me.tierOverride ?? ''} onchange={(e) => setTier(e.currentTarget.value)}>
          <option value="">{tr('Auto: {x}{x2}', { x: names[sug.tier], x2: sug.provisional ? tr(' (provisional)') : '' })}</option>
          <option value="low">{tr('Low (set by me)')}</option><option value="mod">{tr('Moderate (set by me)')}</option><option value="high">{tr('High (set by me)')}</option>
        </select>
      </label>
      <label class="field wide"><span>{tr('Note (private, protected by your PIN if set)')}</span><input id="pp-note" class="input" bind:value={note} onchange={saveNote} placeholder={tr('e.g. needs phonics support; sits at the front')} /></label>
      {#if saved}<span class="muted small">{saved}</span>{/if}
    </section>
    <section class="card stack">
      <h3>{tr('Grouping')}</h3>
      <p class="muted small">{tr('The group maker keeps these pupils apart, or together, whenever it can.')}</p>
      <div class="pairs">
        {#each others as o (o.id)}
          {@const apart = me.keepApart?.includes(o.id)}
          {@const together = me.keepTogether?.includes(o.id)}
          <div class="row pr"><span>{o.name}</span>
            <div class="seg" role="group" aria-label={tr('With {name}', { name: o.name })}>
              <button type="button" aria-pressed={!!apart} onclick={() => pair('keepApart', o.id, !apart)}>{tr('Keep apart')}</button>
              <button type="button" aria-pressed={!!together} onclick={() => pair('keepTogether', o.id, !together)}>{tr('Keep together')}</button>
            </div>
          </div>
        {/each}
      </div>
    </section>
    <section class="card stack">
      <h3>{tr('TP history')}</h3>
      {#if !recs.length}<p class="muted">{tr('No records yet.')}</p>{:else}
        <table class="hist"><thead><tr><th>{tr('Date')}</th><th>{tr('LS')}</th><th>{tr('TP')}</th><th>{tr('Lesson')}</th></tr></thead>
          <tbody>{#each recs as r}<tr><td>{r.date}</td><td class="code">{r.ls}</td><td><b>{tr('TP{tp}', { tp: r.tp })}</b></td><td>{r.lessonId ? topics.get(r.lessonId) ?? '' : '–'}</td></tr>{/each}</tbody></table>
      {/if}
    </section>
  {/if}
</div>

<style>
  .grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  .wide { grid-column: span 2; }
  @media (max-width: 600px) { .wide { grid-column: auto; } }
  .pairs { display: grid; gap: 4px; max-height: 360px; overflow-y: auto; }
  .pr { justify-content: space-between; border-bottom: 1px solid var(--line); padding: 2px 0; }
  .pr .seg button { min-height: 34px; font-size: var(--t-xs); }
  .hist { border-collapse: collapse; width: 100%; font-size: var(--t-sm); }
  .hist th, .hist td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
</style>
