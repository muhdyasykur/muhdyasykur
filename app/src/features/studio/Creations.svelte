<script lang="ts">
  import { tr, uiDate } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import { listCreations, deleteCreation } from '../../lib/db/repo';
  import type { Creation } from '../../lib/db/schema';
  import { toolMeta, TOOLS } from '../../lib/studio/catalogue';
  import { notify } from '../../lib/ui/toast.svelte';

  /** My creations: every Studio result, newest first, kept on this device and in backups. */
  let all = $state<Creation[] | null>(null);
  let q = $state('');
  let tool = $state('');
  let confirming = $state('');
  const load = () => listCreations().then((x) => (all = x));
  load();
  const tools = $derived([...new Set((all ?? []).map((c) => c.tool))].map((id) => toolMeta(id)).filter((t) => !!t));
  const shown = $derived((all ?? []).filter((c) => (!tool || c.tool === tool) && (!q.trim() || (c.title + ' ' + (c.versions[c.versions.length - 1]?.text ?? '')).toLowerCase().includes(q.trim().toLowerCase()))));
  async function remove(c: Creation) { await deleteCreation(c.id); confirming = ''; notify(tr('Deleted.'), { kind: 'ok' }); load(); }
  const preview = (c: Creation) => (c.versions[c.versions.length - 1]?.text ?? '').replace(/[#*_`>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('tools')}><Icon name="back" size={18} />{tr('Tools')}</a>
  <h1><Icon name="folder" size={28} /> {tr('My creations')}</h1>
  <p class="muted">{tr('Everything you made with the AI tools, newest first. It stays on this device and is included in your backups.')}</p>
  {#if all && all.length}
    <div class="row filters">
      <label class="search grow"><Icon name="search" size={18} /><span class="sr-only">{tr('Search my creations')}</span><input id="cr-q" class="input" type="search" bind:value={q} placeholder={tr('Search my creations')} /></label>
      <label class="sr-only" for="cr-tool">{tr('Tool')}</label>
      <select id="cr-tool" class="select auto" bind:value={tool}><option value="">{tr('All tools')}</option>{#each tools as t}<option value={t!.id}>{tr(t!.title)}</option>{/each}</select>
    </div>
  {/if}
  {#if all === null}
    <p class="muted" role="status">{tr('Loading…')}</p>
  {:else if !all.length}
    <EmptyState icon="folder" title={tr('Nothing here yet')}>
      {tr('Results from the AI tools are kept here automatically, with every version.')}
      {#snippet actions()}<a class="btn btn-gold" href={href('tools', TOOLS.find((t) => t.ai)!.id)}><Icon name="sparkle" size={18} />{tr('Try the Lesson plan writer')}</a>{/snippet}
    </EmptyState>
  {:else if !shown.length}
    <p class="muted">{tr('Nothing matches. Try another word or tool.')}</p>
  {:else}
    <ul class="list">
      {#each shown as c (c.id)}
        {@const m = toolMeta(c.tool)}
        <li class="card item cat-{m?.cat}" data-creation={c.id}>
          <span class="tile" aria-hidden="true"><Icon name={m?.icon ?? 'sparkle'} size={22} /></span>
          <div class="txt">
            <a href={href('tools', c.tool, 'c', c.id)}><b>{c.title}</b></a>
            <span class="muted small">{m ? tr(m.title) : c.tool} · {uiDate(new Date(c.updatedAt), { day: 'numeric', month: 'short', year: 'numeric' })} · {tr('{n} versions', { n: c.versions.length })}</span>
            <span class="small pv">{preview(c)}</span>
          </div>
          <div class="acts">
            {#if confirming === c.id}
              <button class="btn btn-text del" type="button" onclick={() => remove(c)}>{tr('Delete it')}</button>
              <button class="btn btn-text" type="button" onclick={() => (confirming = '')}>{tr('Cancel')}</button>
            {:else}
              <button class="btn btn-text" type="button" onclick={() => (confirming = c.id)} aria-label={tr('Delete {x}', { x: c.title })}><Icon name="close" size={18} /></button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  h1 { display: flex; align-items: center; gap: var(--s-2); margin: 0; }
  .filters { gap: var(--s-2); align-items: center; }
  .search { display: flex; align-items: center; gap: var(--s-2); }
  .search .input { flex: 1; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .item { display: grid; grid-template-columns: auto 1fr auto; gap: var(--s-3); align-items: start; }
  .txt { display: grid; gap: 2px; min-width: 0; }
  .txt a { color: var(--ink); text-decoration: none; }
  .txt a:hover b { text-decoration: underline; }
  .pv { color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
  .tile { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: var(--tile-bg, var(--sunken)); color: var(--tile-ink, var(--navy-2)); }
  .acts { display: flex; gap: 2px; }
  .cat-plan { --tile-bg: var(--gold-soft); --tile-ink: var(--gold); }
  .cat-create { --tile-bg: var(--main); --tile-ink: var(--main-ink); }
  .cat-assess { --tile-bg: var(--comp); --tile-ink: var(--comp-ink); }
  .cat-support { --tile-bg: var(--tint-green); --tile-ink: var(--tint-green-ink); }
  .cat-fun { --tile-bg: var(--tint-rose); --tile-ink: var(--tint-rose-ink); }
  .cat-write { --tile-bg: var(--tint-purple); --tile-ink: var(--tint-purple-ink); }
</style>
