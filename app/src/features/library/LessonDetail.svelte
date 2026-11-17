<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { t } from '../../lib/i18n/index.svelte';
  import type { SowLesson, Standards, Role } from '../../lib/curriculum/types';
  import Icon from '../../lib/ui/Icon.svelte';

  let { lesson, standards, sourceLabel, backHref }: { lesson: SowLesson; standards: Standards; sourceLabel: string; backHref: string } = $props();
  const csText = (c: string) => standards.cs.find((x) => x.code === c)?.text ?? '';
  const lsText = (c: string) => standards.ls.find((x) => x.code === c)?.text ?? '';
  const roles: { role: Role; pill: string; label: 'library.mainSkill' | 'library.compSkill' }[] = [
    { role: 'main', pill: 'M', label: 'library.mainSkill' },
    { role: 'comp', pill: 'C', label: 'library.compSkill' }
  ];
  const sections = $derived([
    { key: 'Pre-lesson', steps: lesson.outline.pre },
    { key: 'Lesson delivery', steps: lesson.outline.delivery },
    { key: 'Post-lesson', steps: lesson.outline.post }
  ].filter((s) => s.steps.length));
  const startAt = $derived.by(() => { let c = 1; return sections.map((s) => { const v = c; c += s.steps.length; return v; }); });
</script>

<article class="stack">
  <a class="btn btn-text back" href={backHref}><Icon name="back" size={18} />{t('common.back')}</a>
  <header class="head">
    <p class="eyebrow">{t('library.lessonN', { n: lesson.no })} · {lesson.label}{lesson.unit ? ` · ${lesson.unit}` : ''}</p>
    <h1>{lesson.topic || lesson.label}</h1>
    <div class="row">
      <span class="chip">{lesson.mainSkill}</span>
      <span class="chip">{lesson.kind === 'textbook' ? t('library.textbook') : t('library.nonTextbook')}</span>
    </div>
  </header>

  <dl class="facts card">
    <div><dt>{t('library.theme')}</dt><dd>{lesson.theme || '–'}</dd></div>
    <div><dt>{t('library.cce')}</dt><dd>{lesson.cce || '–'}</dd></div>
    <div class="wide"><dt>{t('library.focus')}</dt><dd>{lesson.focus || '–'}</dd></div>
  </dl>

  <section class="card">
    <h3>{t('library.standards')}</h3>
    {#if lesson.std.note}<p class="muted">{lesson.std.note}</p>{/if}
    {#each roles as r}
      {#if lesson.std[r.role].ls.length}
        <div class="std">
          <span class={r.role === 'main' ? 'pill-m' : 'pill-c'} title={t(r.label)}>{r.pill}</span>
          <div class="stack tight">
            {#each lesson.std[r.role].cs as c}<p><span class="code">{tr('CS {c}', { c })}</span> {csText(c)}</p>{/each}
            {#each lesson.std[r.role].ls as c}
              <p class="ls"><span class="code">{tr('LS {c}', { c })}</span> {lsText(c)}</p>
              {#if lesson.std.sowWording?.[c]}<p class="muted small">{tr('SoW: {x}', { x: lesson.std.sowWording[c] })}</p>{/if}
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </section>

  <section class="card">
    <h3>{t('library.outline')}</h3>
    {#if lesson.outline.note}<p>{lesson.outline.note}</p>{/if}
    {#each sections as s, i}
      <h4>{s.key}</h4>
      <ol start={startAt[i]}>{#each s.steps as step}<li>{step}</li>{/each}</ol>
    {/each}
  </section>

  <div class="two">
    <section class="card"><h3>{t('library.materials')}</h3><p>{lesson.materials || '–'}</p></section>
    <section class="card"><h3>{t('library.diff')}</h3><p>{lesson.differentiation || '–'}</p></section>
  </div>
  <p class="muted small">{sourceLabel} · {t('library.source', { p: lesson.docPage })}</p>
</article>

<style>
  .head { display: grid; gap: var(--s-2); }
  .facts { grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--s-4); margin: 0; }
  .facts .wide { grid-column: 1 / -1; }
  dt { font-size: var(--t-xs); letter-spacing: .08em; text-transform: uppercase; font-weight: 700; color: var(--ink-3); }
  dd { margin: 2px 0 0; }
  .std { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--s-3); padding: var(--s-3) 0; border-top: 1px solid var(--line); }
  .tight { gap: var(--s-1); }
  .ls { white-space: pre-line; }

  h4 { font-size: var(--t-sm); letter-spacing: .06em; text-transform: uppercase; color: var(--gold); margin-top: var(--s-2); }
  ol { margin: 0; padding-left: 1.4em; display: grid; gap: var(--s-2); }
  li { white-space: pre-line; }
  .two { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: var(--s-4); }
</style>
