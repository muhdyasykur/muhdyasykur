<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href, go } from '../../router.svelte';
  import { getClass, saveClass, deleteClass, listPupils, addPupils, parseNames, renamePupil, removePupil } from '../../lib/db/repo';
  import type { SchoolClass, Pupil } from '../../lib/db/schema';
  import Icon from '../../lib/ui/Icon.svelte';

  let { id }: { id: string } = $props();
  let cls = $state<SchoolClass | null>(null);
  let pupils = $state<Pupil[]>([]);
  let paste = $state('');
  let missing = $state(false);
  let confirmDelete = $state(false);
  let notice = $state('');

  async function load() {
    const c = await getClass(id);
    if (!c) { missing = true; return; }
    cls = c; pupils = await listPupils(id);
  }
  $effect(() => { load(); });

  const preview = $derived(parseNames(paste));
  async function addAll() {
    if (!preview.length) return;
    if (preview.length > 60 && !notice.startsWith('Add')) { notice = `Add ${preview.length} pupils? That is more than most classes. Tap "Add" again to confirm.`; return; }
    await addPupils(id, preview);
    notice = `${preview.length} pupils added.`; paste = '';
    pupils = await listPupils(id);
  }
  async function saveMeta() { if (cls) await saveClass($state.snapshot(cls)); }
  async function rename(p: Pupil, name: string) { if (name.trim() && name !== p.name) { await renamePupil(p.id, name.trim()); p.name = name.trim(); } }
  async function remove(p: Pupil) { await removePupil(p.id); pupils = pupils.filter((x) => x.id !== p.id); }
  async function del() { await deleteClass(id); go('classes'); }
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('classes')}><Icon name="back" size={18} />{tr('Classes')}</a>
  {#if missing}
    <p class="empty">{tr('This class no longer exists.')}</p>
  {:else if cls}
    <header>
      <p class="eyebrow">{tr('Year {year} · {schoolType}', { year: cls.year, schoolType: cls.schoolType })}</p>
      <h1>{cls.name}</h1>
    </header>
    <div class="row">
      <a id="cd-attendance" class="btn btn-gold" href={href('classes', id, 'attendance')}>{tr('✓ Take attendance')}</a>
      <a class="btn btn-primary" href={href('classes', id, 'pbd')}>{tr('PBD progress')}</a>
      <a class="btn btn-outline" href={href('classes', id, 'pbd', 'new')}>{tr('Record TP levels')}</a>
    </div>
    <section class="card grid">
      <label class="field"><span>{tr('Class name')}</span><input id="cd-name" class="input" bind:value={cls.name} onchange={saveMeta} /></label>
      <label class="field"><span>{tr('Level')}</span><input id="cd-level" class="input" bind:value={cls.levelLabel} onchange={saveMeta} placeholder={tr('e.g. Average')} /></label>
      <div class="field"><span id="cd-type">{tr('School type')}</span>
        <div class="seg" role="group" aria-labelledby="cd-type">
          {#each ['SK', 'SJK'] as s}<button type="button" aria-pressed={cls.schoolType === s} onclick={() => { cls!.schoolType = s as 'SK' | 'SJK'; saveMeta(); }}>{s}</button>{/each}
        </div>
      </div>
    </section>

    <section class="card stack">
      <h3>{tr('Pupils')} <span class="muted">({pupils.length})</span></h3>
      <label class="field">
        <span>{tr('Paste names, one per line')}</span>
        <textarea id="cd-paste" class="input ta" rows="5" bind:value={paste} placeholder={tr('Copy the name column from Excel, Google Sheets or WhatsApp.\nNumbers and bullets are removed automatically.')}></textarea>
      </label>
      <div class="row">
        <button class="btn btn-primary" type="button" disabled={!preview.length} onclick={addAll}>{tr('Add {x} {x2}', { x: preview.length || '', x2: preview.length === 1 ? 'pupil' : 'pupils' })}</button>
        {#if notice}<span class="muted small" role="status">{notice}</span>{/if}
      </div>
      {#if pupils.length}
        <ol class="pupils">
          {#each pupils as p (p.id)}
            <li><input class="input" aria-label={tr('Pupil name')} value={p.name} onchange={(e) => rename(p, e.currentTarget.value)} /><a class="btn btn-text" href={href('classes', id, 'pupil', p.id)}>{tr('Profile')}</a><button class="btn btn-text" type="button" onclick={() => remove(p)}>{tr('Remove')}</button></li>
          {/each}
        </ol>
      {/if}
    </section>

    <section class="danger row">
      {#if confirmDelete}
        <span>{tr('Delete {name} and its pupil list?', { name: cls.name })}</span>
        <button class="btn btn-outline del" type="button" onclick={del}>{tr('Delete class')}</button>
        <button class="btn btn-text" type="button" onclick={() => (confirmDelete = false)}>{tr('Keep it')}</button>
      {:else}
        <button class="btn btn-text del" type="button" onclick={() => (confirmDelete = true)}>{tr('Delete this class…')}</button>
      {/if}
    </section>
  {/if}
</div>

<style>
  .back { justify-self: start; }
  .grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: var(--s-3); }
  .ta { min-height: 120px; padding: var(--s-2) var(--s-3); resize: vertical; }
  .small { font-size: var(--t-sm); }
  .pupils { margin: 0; padding-left: 1.6em; display: grid; gap: var(--s-1); }
  .pupils li { padding-left: var(--s-1); }
  .pupils li > :global(*) { vertical-align: middle; }
  .pupils .input { width: min(100%, 360px); min-height: 38px; }
  .del { color: var(--bad); }
</style>
