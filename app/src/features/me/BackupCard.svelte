<script lang="ts">
  import { tr, dateLocale } from '../../lib/i18n/index.svelte';
  import { makeBackup, readBackup, restore, backupName, lastBackup, type BackupFile } from '../../lib/backup';
  import { saveFile } from '../../lib/export/download';
  import { loadProfile } from '../../lib/profile.svelte';
  import { loadLock, lock } from '../../lib/lock.svelte';
  let last = $state<number | null>(null); let msg = $state(''); let pending = $state.raw<BackupFile | null>(null); /* raw: rows go straight into IndexedDB */ let err = $state("");
  $effect(() => { lastBackup().then((t) => (last = t)); });
  async function save() {
    msg = tr('Preparing your backup…');
    const text = await makeBackup(__APP_VERSION__);
    const how = await saveFile(new Blob([text], { type: 'application/json' }), backupName());
    last = Date.now(); msg = how === 'shared' ? tr('Backup shared.') : tr('Backup saved to your downloads. Keep it somewhere safe, such as Google Drive.');
  }
  async function pick(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = '';
    if (!f) return; err = ''; msg = '';
    const r = readBackup(await f.text());
    if (!r.ok) { err = r.error; return; }
    pending = r.file;
  }
  async function apply(mode: 'merge' | 'replace') {
    if (!pending) return;
    let n = 0;
    try { n = await restore(pending, mode); }
    catch (e) { err = tr('The backup could not be restored ({name}: {x}). Nothing was changed.', { name: (e as Error).name, x: (e as Error).message || tr('no details') }); return; }
    pending = null;
    await loadProfile(); await loadLock();
    msg = tr('Restored {n} records.{x}', { n, x: lock.configured ? tr(' Enter your PIN to see pupil names.') : '' });
  }
  const days = $derived(last ? Math.floor((Date.now() - last) / 86400000) : null);
</script>

<div class="stack">
  <p class="muted small">{tr('{x} Backups hold your lessons, classes, PBD, reflections and settings. Textbook PDFs are not included.', { x: last ? tr('Last backup: {x}{x2}.', { x: new Date(last).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' }), x2: days && days > 7 ? tr(' ({days} days ago)', { days }) : '' }) : tr('No backup yet.') })}</p>
  <div class="row">
    <button id="bk-save" class="btn btn-primary" type="button" onclick={save}>{tr('Back up now')}</button>
    <label class="btn btn-outline">{tr('Restore from a file')}<input id="bk-file" type="file" accept=".consilia-backup,application/json" class="sr-only" onchange={pick} /></label>
  </div>
  {#if pending}
    <div class="card warn stack">
      <b>{tr('Backup from {x}', { x: new Date(pending.createdAt).toLocaleString(dateLocale()) })}</b>
      <p class="small">{tr('{x} lessons, {x2} classes, {x3} pupils, {x4} TP records.', { x: pending.counts?.lessons ?? 0, x2: pending.counts?.classes ?? 0, x3: pending.counts?.pupils ?? 0, x4: pending.counts?.pbd ?? 0 })}</p>
      <div class="row">
        <button id="bk-merge" class="btn btn-primary" type="button" onclick={() => apply('merge')}>{tr('Add to what is here')}</button>
        <button class="btn btn-outline del" type="button" onclick={() => apply('replace')}>{tr('Replace everything here')}</button>
        <button class="btn btn-text" type="button" onclick={() => (pending = null)}>{tr('Cancel')}</button>
      </div>
    </div>
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  {#if msg}<p id="bk-msg" class="ok small" role="status">{msg}</p>{/if}
</div>
<style> .err { color: var(--bad); } .warn { border-color: var(--warn); }</style>
