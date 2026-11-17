<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import type { Lesson } from '../../../lib/lesson/model';
  import { profile } from '../../../lib/profile.svelte';
  import { href } from '../../../router.svelte';
  import { runChecks, GROUPS, type Result } from '../../../lib/lesson/checker';
  import { saveFile } from '../../../lib/export/download';
  import ScoreRing from '../../../lib/ui/ScoreRing.svelte';
  import RphSchool from '../print/RphSchool.svelte';
  import RphBlueprint from '../print/RphBlueprint.svelte';
  import PrintableView from '../print/PrintableView.svelte';
  import { db, type Reflection } from '../../../lib/db/schema';

  let { lesson = $bindable() }: { lesson: Lesson } = $props();
  const KEY = 'consilia.layout';
  let layout = $state<'school' | 'blueprint'>((() => { try { return localStorage.getItem(KEY) === 'blueprint' ? 'blueprint' : 'school'; } catch { return 'school'; } })());
  $effect(() => { try { localStorage.setItem(KEY, layout); } catch { /* ignore */ } });

  const report = $derived(runChecks(lesson));
  let reflection = $state<Reflection | null>(null);
  $effect(() => { db.reflections.get(lesson.id).then((r) => (reflection = r ?? null)); });
  const appendix = $derived((lesson.printables ?? []).filter((p) => p.inAppendix));
  let showPassed = $state(false);
  let noting = $state('');
  let reason = $state('');
  let wordState = $state('');

  function accept(r: Result) {
    if (!reason.trim()) return;
    lesson.checkNotes = { ...(lesson.checkNotes ?? {}), [r.rule.id]: reason.trim() };
    noting = ''; reason = '';
  }
  function unaccept(id: string) { const n = { ...(lesson.checkNotes ?? {}) }; delete n[id]; lesson.checkNotes = n; }
  async function word() {
    wordState = tr('Preparing the Word file…');
    try {
      const { toBlob, fileName } = await import('../../../lib/export/docx'); // loaded only when needed
      const how = await saveFile(await toBlob($state.snapshot(lesson) as Lesson, profile.value, layout), fileName(lesson, layout));
      wordState = how === 'shared' ? tr('Shared.') : tr('Saved to your downloads.');
    } catch (e) { wordState = tr('The Word file could not be made: ') + (e as Error).message; }
  }
  const icon = { pass: '✔', accepted: '✔', fail: '✘', skip: '–' } as const;
</script>

<div class="stack">
  <section class="no-print card stack check" id="check">
    <div class="row between">
      <div class="row"><ScoreRing score={report.score} size={72} /><div><h3>{tr('Alignment score')}</h3><p class="muted small">{report.failing.length ? tr('{length} of {length2} checks need attention. Warnings never stop you saving or printing.', { length: report.failing.length, length2: report.results.filter((r) => r.status !== 'skip').length }) : tr('Every check passes. This lesson is aligned.')}</p></div></div>
      <label class="row small"><input id="rv-passed" type="checkbox" bind:checked={showPassed} />{tr('Show passed checks')}</label>
    </div>
    {#each GROUPS as g}
      {@const rows = report.results.filter((r) => r.rule.group === g && (showPassed ? r.status !== 'skip' : r.status === 'fail' || r.status === 'accepted'))}
      {#if rows.length}
        <div class="grp">
          <h4>{tr(g)}</h4>
          <ul>
            {#each rows as r (r.rule.id)}
              <li class={r.status} data-rule={r.rule.id}>
                <span class="ic" aria-hidden="true">{icon[r.status]}</span>
                <div class="stack tight">
                  <b>{tr(r.rule.title)}</b>
                  <span class="muted small">{r.status === 'accepted' ? tr('Marked as fine: {note}', { note: r.note }) : r.message}</span>
                  {#if r.status === 'fail'}
                    <div class="row">
                      <a class="btn btn-text" href={href('plan', 'edit', lesson.id, r.rule.step)}>{tr('Fix it')}</a>
                      {#if noting === r.rule.id}
                        <input class="input reason" bind:value={reason} placeholder={tr('Why is this fine for this lesson?')} aria-label={tr('Reason')} />
                        <button class="btn btn-outline" type="button" disabled={!reason.trim()} onclick={() => accept(r)}>{tr('Save')}</button>
                        <button class="btn btn-text" type="button" onclick={() => (noting = '')}>{tr('Cancel')}</button>
                      {:else}
                        <button class="btn btn-text" type="button" onclick={() => { noting = r.rule.id; reason = ''; }}>{tr('Mark as fine')}</button>
                      {/if}
                    </div>
                  {:else if r.status === 'accepted'}
                    <button class="btn btn-text undo" type="button" onclick={() => unaccept(r.rule.id)}>{tr('Undo')}</button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/each}
  </section>

  <div class="no-print stack">
    <div class="row between">
      <div class="seg" role="group" aria-label={tr('Layout')}>
        <button type="button" aria-pressed={layout === 'school'} onclick={() => (layout = 'school')}>{tr('School template')}</button>
        <button type="button" aria-pressed={layout === 'blueprint'} onclick={() => (layout = 'blueprint')}>{tr('Consilia Lesson Blueprint')}</button>
      </div>
      <label class="row small"><input id="rv-ready" type="checkbox" checked={lesson.status !== 'draft'} onchange={(e) => (lesson.status = e.currentTarget.checked ? 'ready' : 'draft')} />{tr('Mark as ready')}</label>
    </div>
    <div class="row">
      <button id="rv-print" class="btn btn-gold" type="button" onclick={() => window.print()}>{tr('Print or save as PDF')}</button>
      <button id="rv-word" class="btn btn-primary" type="button" onclick={word}>{tr('Download Word (.docx)')}</button>
      <a id="rv-slides" class="btn btn-outline" href={href('plan', 'slides', lesson.id)}>{tr('🖼 Lesson slides')}</a>
      {#if wordState}<span class="muted small" role="status">{wordState}</span>{/if}
    </div>
    <p class="muted small">{tr('PDF: in the print dialog choose A4, "Save as PDF" and turn on "Background graphics". Word: the file opens in Microsoft Word, Google Docs and WPS for last edits.')}</p>
  </div>
  <div class="paper-wrap">
    {#if layout === 'school'}<RphSchool {lesson} profile={profile.value} />{:else}<RphBlueprint {lesson} profile={profile.value} {reflection} />{/if}
    {#each appendix as p (p.id)}<div class="apx"><PrintableView {p} {lesson} /></div>{/each}
  </div>
</div>

<style>

  .tight { gap: 2px; }
  .check h3 { margin-bottom: 2px; }
  .grp h4 { font-size: var(--t-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--gold); margin: var(--s-2) 0 var(--s-1); }
  .grp ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-1); }
  .grp li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: var(--s-2); padding: var(--s-2); border-radius: var(--r-ctl); background: var(--sunken); }
  .ic { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; font-size: 13px; font-weight: 800; color: #fff; }
  .fail .ic { background: var(--bad); } .pass .ic, .accepted .ic { background: var(--ok); }
  .reason { max-width: 340px; min-height: 38px; }
  .undo { justify-self: start; }
  .paper-wrap { overflow-x: auto; background: var(--sunken); border-radius: var(--r-card); padding: var(--s-4); }
  .apx { margin-top: var(--s-4); }
  @media print { .paper-wrap { overflow: visible; background: none; padding: 0; } .apx { break-before: page; margin: 0; } }
</style>
