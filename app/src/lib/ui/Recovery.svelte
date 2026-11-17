<script lang="ts">
  import { tr } from '../i18n/index.svelte';
  import { makeBackup, backupName } from '../backup';
  import { saveFile } from '../export/download';
  import { href, route } from '../../router.svelte';
  import { untrack } from 'svelte';
  /**
   * Shown in place of a screen that failed to draw, instead of a blank page. The rest of the app keeps working:
   * the teacher can try again, go elsewhere, or save a backup first.
   */
  let { error, reset }: { error: unknown; reset: () => void } = $props();
  let msg = $state('');
  // moving to another screen (even within the same tab) tries again
  const at = untrack(() => `${route.name}/${route.parts.join('/')}`);
  $effect(() => { if (`${route.name}/${route.parts.join('/')}` !== at) reset(); });
  const detail = $derived(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  async function backup() {
    msg = tr('Making the backup…');
    try {
      await saveFile(new Blob([await makeBackup(__APP_VERSION__)], { type: 'application/json' }), backupName());
      msg = tr('Backup saved. Keep the file somewhere safe.');
    } catch { msg = tr('The backup could not be made. Try Me → Backup after reloading.'); }
  }
</script>

<section class="card stack recovery" role="alert" data-recovery>
  <h1>{tr('This screen stopped working')}</h1>
  <p>{tr('Something went wrong while showing this screen. Your lessons and classes are saved on this device up to your last change.')}</p>
  <div class="row">
    <button class="btn btn-gold" type="button" onclick={reset}>{tr('Try again')}</button>
    <button class="btn btn-outline" type="button" onclick={() => location.reload()}>{tr('Reload Consilia')}</button>
    <a class="btn btn-text" href={href('today')} onclick={reset}>{tr('Go to Today')}</a>
    <button class="btn btn-text" type="button" onclick={backup}>{tr('Back up my data')}</button>
  </div>
  {#if msg}<p class="muted small" role="status">{msg}</p>{/if}
  <details><summary class="small">{tr('Details for the developer')}</summary><p class="small mono">{tr('{detail} · version {__APP_VERSION__}', { detail, __APP_VERSION__ })}</p><p class="small">{tr('If it keeps happening, tell the developer in Me → About and Feedback Garden (choose Bug) and include these details.')}</p></details>
</section>

<style>
  .recovery { max-width: 640px; margin: var(--s-8) auto; border-left: 4px solid var(--bad); }
  .recovery h1 { font-size: var(--t-xl); }

  .mono { font-family: var(--f-mono); word-break: break-word; }
  summary { cursor: pointer; min-height: 32px; display: flex; align-items: center; }
</style>
