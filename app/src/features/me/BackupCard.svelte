<script lang="ts">
  import { makeBackup, readBackup, restore, backupName, lastBackup, type BackupFile } from '../../lib/backup';
  import { saveFile } from '../../lib/export/download';
  import { loadProfile } from '../../lib/profile.svelte';
  import { loadLock, lock } from '../../lib/lock.svelte';
  let last = $state<number | null>(null); let msg = $state(''); let pending = $state.raw<BackupFile | null>(null); /* raw: rows go straight into IndexedDB */ let err = $state("");
  $effect(() => { lastBackup().then((t) => (last = t)); });
  async function save() {
    msg = 'Preparing your backup…';
    const text = await makeBackup(__APP_VERSION__);
    const how = await saveFile(new Blob([text], { type: 'application/json' }), backupName());
    last = Date.now(); msg = how === 'shared' ? 'Backup shared.' : 'Backup saved to your downloads. Keep it somewhere safe, such as Google Drive.';
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
    catch (e) { err = `The backup could not be restored (${(e as Error).name}: ${(e as Error).message || 'no details'}). Nothing was changed.`; return; }
    pending = null;
    await loadProfile(); await loadLock();
    msg = `Restored ${n} records.${lock.configured ? ' Enter your PIN to see pupil names.' : ''}`;
  }
  const days = $derived(last ? Math.floor((Date.now() - last) / 86400000) : null);
</script>

<div class="stack">
  <p class="muted small">{last ? `Last backup: ${new Date(last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}${days && days > 7 ? ` (${days} days ago)` : ''}.` : 'No backup yet.'} Backups hold your lessons, classes, PBD, reflections and settings. Textbook PDFs are not included.</p>
  <div class="row">
    <button id="bk-save" class="btn btn-primary" type="button" onclick={save}>Back up now</button>
    <label class="btn btn-outline">Restore from a file<input id="bk-file" type="file" accept=".consilia-backup,application/json" class="sr-only" onchange={pick} /></label>
  </div>
  {#if pending}
    <div class="card warn stack">
      <b>Backup from {new Date(pending.createdAt).toLocaleString('en-GB')}</b>
      <p class="small">{pending.counts?.lessons ?? 0} lessons, {pending.counts?.classes ?? 0} classes, {pending.counts?.pupils ?? 0} pupils, {pending.counts?.pbd ?? 0} TP records.</p>
      <div class="row">
        <button id="bk-merge" class="btn btn-primary" type="button" onclick={() => apply('merge')}>Add to what is here</button>
        <button class="btn btn-outline del" type="button" onclick={() => apply('replace')}>Replace everything here</button>
        <button class="btn btn-text" type="button" onclick={() => (pending = null)}>Cancel</button>
      </div>
    </div>
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  {#if msg}<p id="bk-msg" class="ok small" role="status">{msg}</p>{/if}
</div>
<style>.small { font-size: var(--t-sm); } .err { color: var(--bad); } .ok { color: var(--ok); } .warn { border-color: var(--warn); } .del { color: var(--bad); }</style>
