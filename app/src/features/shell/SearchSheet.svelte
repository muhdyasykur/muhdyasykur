<script lang="ts">
  import { tick } from 'svelte';
  import { tr, i18n } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import Sheet from '../../lib/ui/Sheet.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import type { IconName } from '../../lib/ui/icons';
  import { closePanel } from '../../lib/ui/shell.svelte';
  import { TOOLS } from '../../lib/studio/catalogue';
  import { prefs } from '../../lib/studio/prefs.svelte';
  import { listLessons, listClasses } from '../../lib/db/repo';
  import { profile } from '../../lib/profile.svelte';
  import type { Lesson } from '../../lib/lesson/model';
  import type { SchoolClass } from '../../lib/db/schema';
  import type { SowLesson } from '../../lib/curriculum/types';

  /**
   * Search everything from anywhere (Ctrl+K or /): tools, your lesson plans and classes, the KSSR Scheme of Work for
   * Years 1 to 6, and the manual. All on the device; the curriculum is read only when you search it.
   */
  interface Hit { icon: IconName; title: string; sub: string; to: string }
  let q = $state('');
  let input = $state<HTMLInputElement>();
  let lessons = $state<Lesson[]>([]); let classes = $state<SchoolClass[]>([]);
  let sow = $state<{ year: number; l: SowLesson }[]>([]); let sowLoading = false; let sowLoaded = false;
  let manual = $state<{ id: string; title: string; chapter: string }[]>([]);
  let manualSearch: ((q: string) => { article: { id: string; title: string }; chapter: { title: string } }[]) | null = null;
  const school = $derived(profile.value?.schoolType === 'SJK' ? 'SJK' : 'SK');
  $effect(() => { listLessons().then((l) => (lessons = l)); listClasses().then((c) => (classes = c)); tick().then(() => input?.focus()); });
  async function ensureSow() {
    if (sowLoaded || sowLoading) return;
    sowLoading = true;
    const { loadSow } = await import('../../lib/curriculum/loader');
    const all: { year: number; l: SowLesson }[] = [];
    for (const year of [1, 2, 3, 4, 5, 6]) { try { const f = await loadSow(year, school); for (const l of f.lessons) all.push({ year, l }); } catch { /* not cached yet offline */ } }
    sow = all; sowLoaded = true; sowLoading = false;
  }
  async function ensureManual() {
    if (manualSearch) return;
    const m = await import('../../lib/content/manual');
    const chapters = i18n.locale === 'ms' ? m.localManual((await import('../../lib/content/manual.ms')).MANUAL_MS) : m.MANUAL;
    manualSearch = (s: string) => m.searchManual(s, chapters);
  }
  $effect(() => { const s = q.trim(); if (s.length >= 2) { ensureSow(); ensureManual().then(() => { manual = manualSearch ? manualSearch(s).slice(0, 5).map((h) => ({ id: h.article.id, title: h.article.title, chapter: h.chapter.title })) : []; }); } else manual = []; });
  const words = $derived(q.trim().toLowerCase().split(/\s+/).filter(Boolean));
  const has = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  const tools = $derived<Hit[]>(!words.length ? [] : TOOLS.filter((t) => has([t.title, t.about, tr(t.title), tr(t.about), t.keys].join(' '))).slice(0, 6)
    .map((t) => ({ icon: t.icon, title: tr(t.title), sub: tr(t.about), to: t.route === 'recommend' ? href('plan', 'new', 'recommend') : href('tools', t.id) })));
  const myLessons = $derived<Hit[]>(!words.length ? [] : lessons.filter((l) => has([l.topic, l.header.className, l.mainSkill, l.header.date, l.theme].join(' '))).slice(0, 6)
    .map((l) => ({ icon: 'plan', title: l.topic || tr('Untitled lesson'), sub: [l.header.className, l.header.date, l.mainSkill].filter(Boolean).join(' · '), to: href('plan', 'edit', l.id, 'review') })));
  const myClasses = $derived<Hit[]>(!words.length ? [] : classes.filter((c) => has(`${c.name} year ${c.year} tahun ${c.year}`)).slice(0, 4)
    .map((c) => ({ icon: 'classes', title: c.name, sub: tr('Year {year}', { year: c.year }), to: href('classes', c.id) })));
  const curriculum = $derived<Hit[]>(!words.length ? [] : sow.filter(({ year, l }) => has([l.topic, l.theme, l.unit ?? '', l.mainSkill ?? '', `year ${year}`, `tahun ${year}`].join(' '))).slice(0, 8)
    .map(({ year, l }) => ({ icon: 'library', title: l.topic, sub: tr('Year {year} · SoW lesson {no} · {x}', { year, no: l.no, x: l.mainSkill ?? '' }), to: href('library', year, school.toLowerCase(), 'sow', l.no) })));
  const help = $derived<Hit[]>(manual.map((m) => ({ icon: 'help', title: m.title, sub: m.chapter, to: href('me', 'help', m.id) })));
  const groups = $derived([[tr('Tools'), tools], [tr('My lesson plans'), myLessons], [tr('My classes'), myClasses], [tr('Scheme of Work'), curriculum], [tr('Help'), help]] as [string, Hit[]][]);
  const total = $derived(groups.reduce((n, [, g]) => n + g.length, 0));
  const first = $derived(groups.flatMap(([, g]) => g)[0]);
  const recent = $derived(prefs.recent.map((id) => TOOLS.find((t) => t.id === id)).filter((t) => !!t).slice(0, 4));
  function enter(e: KeyboardEvent) { if (e.key === 'Enter' && first) { location.hash = first.to; closePanel(); } }
</script>

<Sheet title={tr('Search')} onclose={closePanel} wide>
  <label class="box"><Icon name="search" size={20} /><span class="sr-only">{tr('Search lesson plans, tools, topics and help')}</span>
    <input bind:this={input} id="g-search" class="input" type="search" bind:value={q} onkeydown={enter} placeholder={tr('Search lesson plans, tools, topics and help')} autocomplete="off" /></label>
  {#if !words.length}
    <div class="stack tight">
      <p class="muted small">{tr('Try "quiz", "Where are you from", "Year 4", "attendance" or a pupil-free topic. Press Ctrl+K or / to search from anywhere.')}</p>
      {#if recent.length}<h3>{tr('Recently used')}</h3><div class="row">{#each recent as t}<a class="btn btn-outline" href={href('tools', t!.id)} onclick={closePanel}><Icon name={t!.icon} size={18} />{tr(t!.title)}</a>{/each}</div>{/if}
    </div>
  {:else}
    <p class="muted small" role="status" aria-live="polite">{total ? tr('{n} results. Press Enter to open the first.', { n: total }) : tr('Nothing found for "{q}".', { q: q.trim() })}</p>
    {#each groups as [name, hits]}
      {#if hits.length}
        <section class="grp" aria-label={name}>
          <h3>{name}</h3>
          <ul>{#each hits as h}<li><a href={h.to} onclick={closePanel} data-hit={name}><span class="ic"><Icon name={h.icon} size={18} /></span><span class="t"><b>{h.title}</b><span class="muted small">{h.sub}</span></span></a></li>{/each}</ul>
        </section>
      {/if}
    {/each}
  {/if}
</Sheet>

<style>
  .box { display: flex; align-items: center; gap: var(--s-2); margin: var(--s-3) 0; padding: 0 var(--s-3); border: 2px solid var(--blue); border-radius: var(--r-pill); background: var(--card); }
  .box .input { border: 0; background: transparent; min-height: 52px; font-size: var(--t-lg); }
  .box .input:focus-visible { outline: none; }
  .box:focus-within { box-shadow: 0 0 0 4px var(--blue-soft); }
  h3 { font-size: var(--t-sm); text-transform: uppercase; letter-spacing: .1em; color: var(--ink-2); margin: var(--s-3) 0 var(--s-1); }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  a:not(.btn) { display: flex; gap: var(--s-3); align-items: center; min-height: 52px; padding: var(--s-1) var(--s-2); border-radius: var(--r-ctl); color: var(--ink); text-decoration: none; }
  a:not(.btn):hover, a:not(.btn):focus-visible { background: var(--blue-soft); }
  .ic { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--sunken); color: var(--blue); flex: 0 0 auto; }
  .t { display: grid; min-width: 0; }
  .t b, .t span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
