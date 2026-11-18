<script lang="ts">
  import { untrack } from 'svelte';
  import { tr } from '../../lib/i18n/index.svelte';
  import { route, href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import Ideas from './Ideas.svelte';
  import BbmGuide from './BbmGuide.svelte';
  import DigitalTools from './DigitalTools.svelte';
  import Games from './Games.svelte';
  import Prompts from './Prompts.svelte';
  import ObjectiveWriter from './ObjectiveWriter.svelte';
  import Chant from './Chant.svelte';
  import Differentiate from './Differentiate.svelte';
  import Worksheets from './Worksheets.svelte';
  import Manage from './Manage.svelte';
  import SlidesPick from '../slides/SlidesPick.svelte';
  import ContextBar from './ContextBar.svelte';
  import { ctx, hasCtx } from '../../lib/tools/context.svelte';
  import { TOOLS, CATS, toolMeta, type Cat, type ToolMeta } from '../../lib/studio/catalogue';
  import { prefs, toggleFav, used } from '../../lib/studio/prefs.svelte';
  import { aiReady } from '../../lib/ai/settings.svelte';

  /**
   * Tools: everything a trainee needs besides the lesson plan builder, in one gallery (blueprint F15, M8, M11).
   * Offline tools open here; the Studio's AI tools and My creations load only when opened.
   */
  let q = $state('');
  let cat = $state<Cat | 'all' | 'fav'>('all');
  const hay = (t: ToolMeta) => [t.title, t.about, tr(t.title), tr(t.about), t.keys].join(' ').toLowerCase();
  const matches = (list: ToolMeta[]) => {
    const query = q.trim().toLowerCase();
    if (!query) return list;
    const words = query.split(/\s+/).filter((w) => w.length > 2);
    const all = list.filter((t) => hay(t).includes(query) || (words.length > 0 && words.every((w) => hay(t).includes(w))));
    return all.length ? all : list.filter((t) => words.some((w) => hay(t).includes(w)));
  };
  const found = $derived(matches(TOOLS));
  const shown = $derived(found.filter((t) => cat === 'all' || (cat === 'fav' ? prefs.fav.includes(t.id) : t.cat === cat)));
  const part = $derived(route.parts[0] ?? '');
  const studio = $derived(toolMeta(part)?.ai ? part : '');
  const current = $derived(TOOLS.find((t) => t.id === part && !t.ai && !t.route));
  const recent = $derived(prefs.recent.map((id) => toolMeta(id)).filter((t): t is ToolMeta => !!t).slice(0, 4));
  const countOf = (c: Cat) => found.filter((t) => t.cat === c).length;
  $effect(() => { const c = current; if (c) untrack(() => used(c.id)); });
  const toolHref = (t: ToolMeta) => (t.route === 'recommend' ? href('plan', 'new', 'recommend') : href('tools', t.id));
</script>

{#snippet card(t: ToolMeta)}
  <article class="tcard cat-{t.cat}" class:hero={t.id === 'recommend'} data-tool-card={t.id}>
    <span class="tile" aria-hidden="true"><Icon name={t.icon} size={26} /></span>
    <div class="txt">
      <a class="name" href={toolHref(t)}><b>{tr(t.title)}</b></a>
      <span class="muted small">{tr(t.about)}</span>
      <span class="badges">
        {#if t.ai}<span class="badge ai"><Icon name="sparkle" size={12} />{tr('AI')}</span>{:else}<span class="badge off">{tr('Works offline')}</span>{/if}
        {#if t.isNew}<span class="badge new">{tr('New')}</span>{/if}
      </span>
    </div>
    <button class="fav" type="button" aria-pressed={prefs.fav.includes(t.id)} onclick={() => toggleFav(t.id)} aria-label={prefs.fav.includes(t.id) ? tr('Remove {x} from favourites', { x: tr(t.title) }) : tr('Add {x} to favourites', { x: tr(t.title) })}><Icon name="star" size={20} /></button>
  </article>
{/snippet}

{#if part === 'creations'}
  {#await import('../studio/Creations.svelte') then M}<M.default />{/await}
{:else if studio}
  {#key route.parts.join('/')}
    {#await import('../studio/StudioTool.svelte') then M}<M.default id={studio} cid={route.parts[1] === 'c' ? route.parts[2] ?? '' : ''} />{/await}
  {/key}
{:else if current}
  <div class="stack">
    <a class="btn btn-text back" href={href('tools')}><Icon name="back" size={18} />{tr('Tools')}</a>
    <h1 class="th"><Icon name={current.icon} size={28} /> {tr(current.title)}</h1>
    {#if !['bbm', 'manage', 'slides'].includes(current.id)}<ContextBar />{/if}
    {#if current.id === 'ideas'}<Ideas />{:else if current.id === 'bbm'}<BbmGuide />{:else if current.id === 'digital'}<DigitalTools />{:else if current.id === 'games'}<Games />{:else if current.id === 'ai'}<Prompts />{:else if current.id === 'objectives'}<ObjectiveWriter />{:else if current.id === 'chant'}<Chant />{:else if current.id === 'differentiate'}<Differentiate />{:else if current.id === 'worksheets'}<Worksheets />{:else if current.id === 'manage'}<Manage />{:else if current.id === 'slides'}<SlidesPick />{/if}
  </div>
{:else}
  <div class="stack hub">
    <header class="top">
      <div>
        <h1>{tr('Tools')}</h1>
        <p class="muted">{tr('{n} tools for planning, materials, assessment and your class. The AI tools write with Claude, Gemini or any AI chat; the others work offline.', { n: TOOLS.length })}</p>
      </div>
      <div class="row">
        <a class="btn btn-outline" href={href('tools', 'creations')} id="tools-creations"><Icon name="folder" size={18} />{tr('My creations')}</a>
        {#if !aiReady()}<a class="btn btn-text" href={href('me', 'ai')}>{tr('Connect Claude')}</a>{/if}
      </div>
    </header>
    <ContextBar compact />
    {#if hasCtx()}
      <div class="quick" aria-label={tr('Quick actions for this lesson')}>
        {#if ctx.lessonId}<a class="btn btn-outline" href={href('plan', 'edit', ctx.lessonId, 'flow')}><Icon name="plan" size={18} />{tr('Open the lesson plan')}</a>{:else}<a class="btn btn-gold" href={href('plan', 'new', 'recommend')}><Icon name="sparkle" size={18} />{tr('Plan this lesson')}</a>{/if}
        {#if ctx.lessonId}<a class="btn btn-outline" href={href('plan', 'slides', ctx.lessonId)} data-quick="slides"><Icon name="slides" size={18} />{tr('Slides for this lesson')}</a>{/if}
        <a class="btn btn-outline" href={href('tools', 'games')} data-quick="games"><Icon name="game" size={18} />{tr('Games from my words')}</a>
        <a class="btn btn-outline" href={href('tools', 'quiz')} data-quick="quiz"><Icon name="help" size={18} />{tr('A quiz')}</a>
        <a class="btn btn-outline" href={href('tools', 'text')} data-quick="text"><Icon name="book" size={18} />{tr('A reading text')}</a>
        <a class="btn btn-outline" href={href('tools', 'ideas')}><Icon name="bulb" size={18} />{tr('Activity ideas')}</a>
        <a class="btn btn-outline" href={href('tools', 'objectives')}><Icon name="target" size={18} />{tr('An objective')}</a>
      </div>
    {/if}
    <label class="search"><Icon name="search" size={18} /><span class="sr-only">{tr('Search tools')}</span><input id="tools-q" class="input" type="search" bind:value={q} placeholder={tr('What do you need? e.g. quiz, song, kad imbas, noisy class')} /></label>
    <div class="cats" role="group" aria-label={tr('Show tools for')}>
      <button type="button" aria-pressed={cat === 'all'} onclick={() => (cat = 'all')} data-cat="all">{tr('All')} <span class="n">{found.length}</span></button>
      <button type="button" aria-pressed={cat === 'fav'} onclick={() => (cat = 'fav')} data-cat="fav"><Icon name="star" size={16} />{tr('Favourites')} <span class="n">{found.filter((t) => prefs.fav.includes(t.id)).length}</span></button>
      {#each CATS as c}<button type="button" class="cat-{c.id}" aria-pressed={cat === c.id} onclick={() => (cat = c.id)} data-cat={c.id}><Icon name={c.icon} size={16} />{tr(c.name)} <span class="n">{countOf(c.id)}</span></button>{/each}
    </div>
    {#if recent.length && cat === 'all' && !q.trim()}
      <section class="stack tight" aria-labelledby="t-recent">
        <h2 id="t-recent">{tr('Recently used')}</h2>
        <div class="recent">{#each recent as t}<a class="rchip cat-{t.cat}" href={toolHref(t)} data-recent={t.id}><span class="tile sm" aria-hidden="true"><Icon name={t.icon} size={18} /></span>{tr(t.title)}</a>{/each}</div>
      </section>
    {/if}
    {#if cat === 'all'}
      {#each CATS as c}
        {@const list = shown.filter((t) => t.cat === c.id)}
        {#if list.length}
          <section class="stack tight" aria-labelledby="tg-{c.id}">
            <h2 id="tg-{c.id}" class="cat-{c.id}"><span class="tile sm" aria-hidden="true"><Icon name={c.icon} size={16} /></span>{tr(c.name)}</h2>
            <div class="grid">{#each list as t (t.id)}{@render card(t)}{/each}</div>
          </section>
        {/if}
      {/each}
    {:else if cat === 'fav' && !shown.length}
      <EmptyState icon="star" title={tr('No favourites yet')} compact>{tr('Tap the star on any tool to keep it here.')}</EmptyState>
    {:else}
      <div class="grid">{#each shown as t (t.id)}{@render card(t)}{/each}</div>
    {/if}
    {#if !found.length}<p class="muted">{tr('No tool matches "{q}". Try a simpler word, such as game, teaching aid or objective.', { q })}</p>{/if}
  </div>
{/if}

<style>
  h1 { margin: 0; }
  .th { display: flex; align-items: center; gap: var(--s-2); }
  h2 { font-size: var(--t-lg); margin: var(--s-2) 0 0; display: flex; align-items: center; gap: var(--s-2); }
  .top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: var(--s-3); }
  .top p { margin: 4px 0 0; max-width: 60ch; }
  .quick { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .search { display: flex; align-items: center; gap: var(--s-2); }
  .search .input { flex: 1; }
  .cats { display: flex; gap: var(--s-2); overflow-x: auto; padding: 2px 2px var(--s-2); scrollbar-width: thin; }
  .cats button { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; min-height: 40px; padding: 0 var(--s-3); border-radius: var(--r-pill); border: 1px solid var(--line); background: var(--card); color: var(--ink); font: 600 var(--t-sm) var(--f-body); cursor: pointer; }
  .cats button[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); border-color: var(--navy); }
  .cats .n { font-weight: 700; font-size: var(--t-xs); opacity: .75; }
  .recent { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .rchip { display: inline-flex; align-items: center; gap: var(--s-2); min-height: 44px; padding: 4px var(--s-3) 4px 4px; border-radius: var(--r-pill); border: 1px solid var(--line); background: var(--card); color: var(--ink); text-decoration: none; font-weight: 600; font-size: var(--t-sm); }
  .rchip:hover { border-color: var(--tile-ink); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: var(--s-3); }
  .tcard { position: relative; display: grid; grid-template-columns: auto 1fr auto; gap: var(--s-3); align-items: start; padding: var(--s-4); border: 1px solid var(--line); border-radius: var(--r-card); background: var(--card); box-shadow: var(--shadow-raised); transition: transform var(--dur-fast), border-color var(--dur-fast); }
  .tcard:hover { border-color: var(--tile-ink); transform: translateY(-2px); }
  .tcard:focus-within { border-color: var(--tile-ink); }
  @media (prefers-reduced-motion: reduce) { .tcard:hover { transform: none; } }
  .hero { background: linear-gradient(135deg, var(--gold-soft), var(--card)); border: 2px solid var(--gold-strong); }
  .tile { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; background: var(--tile-bg); color: var(--tile-ink); }
  .tile.sm { width: 32px; height: 32px; border-radius: 10px; }
  .txt { display: grid; gap: 4px; min-width: 0; }
  .name { color: var(--ink); text-decoration: none; }
  .name::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
  .name:focus-visible { outline: none; }
  .name:focus-visible::after { outline: 3px solid var(--gold-strong); outline-offset: 2px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; font: 700 var(--t-xs) var(--f-body); padding: 1px 8px; border-radius: var(--r-pill); border: 1px solid var(--line); color: var(--ink-2); }
  .badge.ai { background: var(--gold-soft); border-color: transparent; color: var(--ink); }
  .badge.new { background: var(--tint-rose); border-color: transparent; color: var(--tint-rose-ink); }
  .fav { position: relative; z-index: 1; display: grid; place-items: center; width: 44px; height: 44px; margin: -10px -10px 0 0; border: 0; border-radius: 50%; background: transparent; color: var(--ink-3); cursor: pointer; }
  .fav:hover { background: var(--sunken); }
  .fav[aria-pressed='true'] { color: var(--gold); }
  .fav[aria-pressed='true'] :global(svg path) { fill: currentColor; }
  .cat-plan { --tile-bg: var(--gold-soft); --tile-ink: var(--gold); }
  .cat-create { --tile-bg: var(--main); --tile-ink: var(--main-ink); }
  .cat-assess { --tile-bg: var(--comp); --tile-ink: var(--comp-ink); }
  .cat-support { --tile-bg: var(--tint-green); --tile-ink: var(--tint-green-ink); }
  .cat-classroom { --tile-bg: var(--sunken); --tile-ink: var(--navy-2); }
  .cat-fun { --tile-bg: var(--tint-rose); --tile-ink: var(--tint-rose-ink); }
  .cat-write { --tile-bg: var(--tint-purple); --tile-ink: var(--tint-purple-ink); }
</style>
