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
  import { saveCtx } from '../../lib/tools/context.svelte';
  import { go } from '../../router.svelte';
  import HeroScene from '../../lib/ui/art/HeroScene.svelte';
  import Scene from '../../lib/ui/art/Scene.svelte';
  import ClayIcon from '../../lib/ui/ClayIcon.svelte';
  import PlaneTrail from '../../lib/ui/PlaneTrail.svelte';
  import Carousel from '../../lib/ui/Carousel.svelte';
  import { loadIndex } from '../../lib/curriculum/loader';

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

  // ---- landing: quick start, popular tools, real numbers
  type Tab = 'plan' | 'create' | 'assess' | 'teach';
  let tab = $state<Tab>('plan');
  let qsYear = $state(String(ctx.year || 4)); let qsTopic = $state(ctx.topic); let qsSkill = $state(ctx.skill || 'Speaking'); let qsWords = $state(ctx.words);
  let qsCreate = $state('text'); let qsAssess = $state('quiz'); let qsGame = $state('wheel');
  const TABS: [Tab, string, 'plan' | 'scissors' | 'check' | 'game'][] = [['plan', 'Plan', 'plan'], ['create', 'Create', 'scissors'], ['assess', 'Assess', 'check'], ['teach', 'Teach', 'game']];
  const CREATE: [string, string][] = [['text', 'Reading and listening texts'], ['dialogue', 'Role-play and dialogue'], ['vocab', 'Vocabulary builder'], ['song', 'Song and rhyme writer'], ['story', 'Choose-your-path story'], ['worksheets', 'Worksheet maker']];
  const ASSESS: [string, string][] = [['quiz', 'Quiz maker'], ['questions', 'Questions at every level'], ['exit', 'Exit tickets'], ['rubric', 'PBD rubric']];
  const GAMES2: [string, string][] = [['wheel', 'Spin wheel'], ['unjumble', 'Unjumble'], ['mystery', 'Mystery word'], ['quiz', 'Quiz show']];
  function start() {
    Object.assign(ctx, { year: Number(qsYear) || 4, ...(qsTopic.trim() ? { topic: qsTopic.trim() } : {}), ...(tab === 'plan' ? { skill: qsSkill } : {}), ...(tab === 'teach' && qsWords.trim() ? { words: qsWords.trim() } : {}) });
    saveCtx();
    if (tab === 'plan') go('tools', 'lesson-plan');
    else if (tab === 'create') go('tools', qsCreate);
    else if (tab === 'assess') go('tools', qsAssess);
    else go('tools', 'games', qsGame);
  }
  const PICKS = ['lesson-plan', 'quiz', 'text', 'games', 'vocab', 'song', 'rubric', 'worksheets'].map((id) => toolMeta(id)!).filter(Boolean);
  let sowCount = $state(0);
  $effect(() => { loadIndex().then((ix) => { sowCount = Object.values(ix.years).reduce((n, y) => n + Object.values(y.schools).reduce((m, x) => m + x.lessons, 0), 0); }).catch(() => {}); });
  const aiCount = TOOLS.filter((t) => t.ai).length;
  const scrollToAll = () => document.getElementById('all-tools')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
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
  <div class="hub">
    <section class="lhero" aria-labelledby="tools-title">
      <div class="htxt">
        <p class="pill">{tr('Plan · Create · Teach')}</p>
        <h1 id="tools-title">{tr('Tools')}</h1>
        <p class="display">{tr('Teach smarter,')}<br /><span class="script">{tr('create magic')}</span></p>
        <p class="lead">{tr('{n} tools for planning, materials, assessment and your class. The AI tools write with Claude, Gemini or any AI chat; the others work offline.', { n: TOOLS.length })}</p>
        <div class="row">
          <button class="btn btn-primary big" type="button" onclick={scrollToAll}>{tr('Explore all tools')} <Icon name="chevron" size={18} /></button>
          <a class="btn btn-outline big" href={href('tools', 'creations')} id="tools-creations"><Icon name="folder" size={18} />{tr('My creations')}</a>
        </div>
        <p class="facts small"><span><Icon name="check" size={14} />{tr('{n} AI tools', { n: aiCount })}</span><span><Icon name="check" size={14} />{sowCount ? tr('{n} KSSR lessons inside', { n: sowCount.toLocaleString('en-GB') }) : tr('KSSR inside')}</span><span><Icon name="check" size={14} />{tr('Works offline')}</span>{#if !aiReady()}<a href={href('me', 'ai')}>{tr('Connect Claude')}</a>{/if}</p>
      </div>
      <div class="hart">
        <HeroScene />
        <div class="sticker" aria-hidden="true"><span class="script">{tr('New!')}</span><b>{tr('{n} AI tools', { n: aiCount })}</b><span>{tr('in your pocket')}</span></div>
      </div>
    </section>

    <section class="quick-start" aria-label={tr('Quick start')}>
      <div class="qtabs" role="tablist" aria-label={tr('What do you want to do?')}>
        {#each TABS as [id, label, icon]}<button type="button" role="tab" id="qs-tab-{id}" aria-selected={tab === id} aria-controls="qs-panel" tabindex={tab === id ? 0 : -1} onclick={() => (tab = id)} data-qs={id}><Icon name={icon} size={18} />{tr(label)}</button>{/each}
      </div>
      <div class="qform" role="tabpanel" id="qs-panel" aria-labelledby="qs-tab-{tab}">
        {#if tab !== 'teach'}
          <label class="qf"><span>{tr('Year')}</span><select class="select" bind:value={qsYear} id="qs-year">{#each ['1', '2', '3', '4', '5', '6'] as y}<option value={y}>{tr('Year {y}', { y })}</option>{/each}</select></label>
          <label class="qf grow"><span>{tr('Topic')}</span><input class="input" bind:value={qsTopic} id="qs-topic" placeholder={tr('e.g. Where are you from?')} /></label>
        {:else}
          <label class="qf grow"><span>{tr('Key words')}</span><input class="input" bind:value={qsWords} id="qs-words" placeholder={tr('e.g. Malaysia, Japan, China, India')} /></label>
        {/if}
        {#if tab === 'plan'}<label class="qf"><span>{tr('Main skill')}</span><select class="select" bind:value={qsSkill} id="qs-skill">{#each ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'] as k}<option value={k}>{tr(k)}</option>{/each}</select></label>
        {:else if tab === 'create'}<label class="qf"><span>{tr('What')}</span><select class="select" bind:value={qsCreate} id="qs-create">{#each CREATE as [id, label]}<option value={id}>{tr(label)}</option>{/each}</select></label>
        {:else if tab === 'assess'}<label class="qf"><span>{tr('What')}</span><select class="select" bind:value={qsAssess} id="qs-assess">{#each ASSESS as [id, label]}<option value={id}>{tr(label)}</option>{/each}</select></label>
        {:else}<label class="qf"><span>{tr('Game')}</span><select class="select" bind:value={qsGame} id="qs-game">{#each GAMES2 as [id, label]}<option value={id}>{tr(label)}</option>{/each}</select></label>{/if}
        <button class="btn btn-primary go" type="button" onclick={start} id="qs-go"><Icon name={tab === 'teach' ? 'play' : 'sparkle'} size={18} />{tab === 'plan' ? tr('Write the lesson plan') : tab === 'teach' ? tr('Play') : tr('Start')}</button>
      </div>
    </section>

    <ul class="features" aria-label={tr('Why teachers use Consilia')}>
      <li><ClayIcon name="library" tone="blue" size={52} /><span><b>{tr('KSSR and CEFR')}</b><span class="muted small">{tr('Every tool knows the Scheme of Work, the standards and your pupils\' level.')}</span></span></li>
      <li><ClayIcon name="offline" tone="teal" size={52} /><span><b>{tr('Works offline')}</b><span class="muted small">{tr('Planning, games, worksheets and slides need no internet.')}</span></span></li>
      <li><ClayIcon name="heart" tone="coral" size={52} /><span><b>{tr('Private by design')}</b><span class="muted small">{tr('Pupils\' names never leave your device.')}</span></span></li>
      <li><ClayIcon name="chat" tone="gold" size={52} /><span><b>{tr('Malay and English')}</b><span class="muted small">{tr('Every screen in both languages.')}</span></span></li>
    </ul>

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

    <section class="stack tight" aria-labelledby="popular-h">
      <div class="row between"><h2 id="popular-h" class="sec">{tr('Top picks')} <PlaneTrail /></h2><button class="btn btn-text" type="button" onclick={scrollToAll}>{tr('View all tools')} <Icon name="chevron" size={16} /></button></div>
      <Carousel label={tr('Top picks')}>
        {#each PICKS as t (t.id)}
          <li class="pcard cat-{t.cat}" data-pick-card={t.id}>
            <div class="part"><Scene name={t.cat} />
              <span class="pbadge">{t.ai ? tr('AI') : tr('Works offline')}</span>
              <button class="pfav" type="button" aria-pressed={prefs.fav.includes(t.id)} onclick={() => toggleFav(t.id)} aria-label={prefs.fav.includes(t.id) ? tr('Remove {x} from favourites', { x: tr(t.title) }) : tr('Add {x} to favourites', { x: tr(t.title) })}><Icon name="star" size={18} /></button>
            </div>
            <a class="pname" href={toolHref(t)}><b>{tr(t.title)}</b></a>
            <span class="muted small pabout">{tr(t.about)}</span>
            <span class="pgo" aria-hidden="true"><Icon name="chevron" size={18} /></span>
          </li>
        {/each}
      </Carousel>
    </section>

    <section class="stack all" id="all-tools" aria-labelledby="all-h">
      <h2 id="all-h" class="sec">{tr('All tools')} <PlaneTrail /></h2>
      <label class="search"><Icon name="search" size={18} /><span class="sr-only">{tr('Search tools')}</span><input id="tools-q" class="input" type="search" bind:value={q} placeholder={tr('What do you need? e.g. quiz, song, kad imbas, noisy class')} /></label>
      <div class="cats" role="group" aria-label={tr('Show tools for')}>
        <button type="button" aria-pressed={cat === 'all'} onclick={() => (cat = 'all')} data-cat="all">{tr('All')} <span class="n">{found.length}</span></button>
        <button type="button" aria-pressed={cat === 'fav'} onclick={() => (cat = 'fav')} data-cat="fav"><Icon name="star" size={16} />{tr('Favourites')} <span class="n">{found.filter((t) => prefs.fav.includes(t.id)).length}</span></button>
        {#each CATS as c}<button type="button" class="cat-{c.id}" aria-pressed={cat === c.id} onclick={() => (cat = c.id)} data-cat={c.id}><Icon name={c.icon} size={16} />{tr(c.name)} <span class="n">{countOf(c.id)}</span></button>{/each}
      </div>
      {#if recent.length && cat === 'all' && !q.trim()}
        <section class="stack tight" aria-labelledby="t-recent">
          <h3 id="t-recent">{tr('Recently used')}</h3>
          <div class="recent">{#each recent as t}<a class="rchip cat-{t.cat}" href={toolHref(t)} data-recent={t.id}><span class="tile sm" aria-hidden="true"><Icon name={t.icon} size={18} /></span>{tr(t.title)}</a>{/each}</div>
        </section>
      {/if}
      {#if cat === 'all'}
        {#each CATS as c}
          {@const list = shown.filter((t) => t.cat === c.id)}
          {#if list.length}
            <section class="stack tight" aria-labelledby="tg-{c.id}">
              <h3 id="tg-{c.id}" class="cat-{c.id} gh"><span class="tile sm" aria-hidden="true"><Icon name={c.icon} size={16} /></span>{tr(c.name)}</h3>
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
    </section>

    <section class="promo" aria-labelledby="promo-h">
      <div class="ptxt">
        <h2 id="promo-h">{tr('A whole lesson,')}<br /><span class="script">{tr('in one tap')}</span></h2>
        <p>{tr('Consilia recommends plans the lesson for your class offline; the Lesson plan writer writes one with AI; Lesson slides turns either into a deck.')}</p>
        <a class="btn btn-light" href={href('plan', 'new', 'recommend')}>{tr('Plan a lesson now')} <Icon name="chevron" size={18} /></a>
      </div>
      <ul class="deals">
        {#each ['recommend', 'lesson-plan', 'slides'].map((id) => toolMeta(id)!) as t}
          <li class="deal"><div class="dart cat-{t.cat}"><Scene name={t.id === 'slides' ? 'create' : 'plan'} /></div><b>{tr(t.title)}</b><span class="small muted">{t.ai ? tr('AI') : tr('Works offline')}</span><a class="dlink" href={toolHref(t)}>{tr('Open')} <Icon name="chevron" size={14} /></a></li>
        {/each}
      </ul>
    </section>

    <section class="how" aria-labelledby="how-h">
      <h2 id="how-h" class="sec center">{tr('How it works')}</h2>
      <ol class="steps">
        <li><ClayIcon name="search" tone="blue" size={56} /><b>{tr('1. Choose a tool')}</b><span class="muted small">{tr('Search, browse the groups or start from Quick start.')}</span></li>
        <li><ClayIcon name="edit" tone="purple" size={56} /><b>{tr('2. Fill in a little')}</b><span class="muted small">{tr('Year, topic and words come from your lesson bar.')}</span></li>
        <li><ClayIcon name="sparkle" tone="gold" size={56} /><b>{tr('3. Generate')}</b><span class="muted small">{tr('With Claude in one tap, or paste from any AI chat.')}</span></li>
        <li><ClayIcon name="send" tone="teal" size={56} /><b>{tr('4. Use it in class')}</b><span class="muted small">{tr('Print, project, play it as a game or add it to the lesson plan.')}</span></li>
      </ol>
    </section>

    <section class="stats" aria-label={tr('Consilia in numbers')}>
      <div><ClayIcon name="tools" tone="navy" size={44} /><b>{TOOLS.length}</b><span>{tr('tools')}</span></div>
      <div><ClayIcon name="library" tone="navy" size={44} /><b>{sowCount ? sowCount.toLocaleString('en-GB') : '…'}</b><span>{tr('KSSR lessons')}</span></div>
      <div><ClayIcon name="bulb" tone="navy" size={44} /><b>86</b><span>{tr('tried activities')}</span></div>
      <div><ClayIcon name="scissors" tone="navy" size={44} /><b>25</b><span>{tr('teaching aids to make')}</span></div>
    </section>
  </div>
{/if}

<style>
  h1 { margin: 0; }
  .th { display: flex; align-items: center; gap: var(--s-2); }
  h2 { font-size: var(--t-lg); margin: var(--s-2) 0 0; display: flex; align-items: center; gap: var(--s-2); }
  .hub { display: grid; gap: var(--s-8); }
  .sec { font-size: var(--t-2xl); margin: 0; }
  .sec.center { justify-content: center; text-align: center; }
  /* hero (the travel sites' big headline with one handwritten word) */
  .lhero { position: relative; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: var(--s-4); align-items: center; padding: var(--s-8) var(--s-8) var(--s-12); border-radius: var(--r-xl); background: linear-gradient(160deg, var(--sky-1), var(--sky-2) 55%, var(--paper)); overflow: hidden; --scene-blob: rgba(255, 255, 255, .5); }
  .htxt { display: grid; gap: var(--s-3); justify-items: start; min-width: 0; }
  .pill { font: 800 var(--t-xs) var(--f-body); letter-spacing: .16em; text-transform: uppercase; color: var(--ink); background: var(--card); padding: 5px 14px; border-radius: var(--r-pill); box-shadow: var(--shadow-raised); }
  .lhero h1 { font-size: var(--t-lg); color: var(--blue); letter-spacing: .02em; }
  .display { font: 800 clamp(2.3rem, 5vw, 3.6rem)/1.02 var(--f-display); letter-spacing: -.03em; color: var(--ink); }
  .display .script { font-size: 1.12em; line-height: .95; }
  .lead { color: var(--ink-2); font-size: var(--t-md); max-width: 46ch; }
  .big { min-height: 50px; padding: 0 var(--s-6); font-size: var(--t-md); }
  .facts { display: flex; flex-wrap: wrap; gap: var(--s-2) var(--s-4); color: var(--ink-2); }
  .facts span { display: inline-flex; align-items: center; gap: 4px; }
  .facts :global(svg) { color: var(--teal); }
  .hart { position: relative; }
  .sticker { position: absolute; right: 2%; bottom: 8%; display: grid; justify-items: center; padding: var(--s-2) var(--s-4); border-radius: 18px; background: var(--card); box-shadow: var(--shadow-float); transform: rotate(4deg); text-align: center; line-height: 1.1; }
  .sticker .script { font-size: 1.7rem; }
  .sticker b { font: 800 1.35rem var(--f-display); color: var(--blue); }
  .sticker span:last-child { font-size: var(--t-xs); color: var(--ink-2); }
  /* quick start (the floating search panel) */
  .quick-start { margin-top: calc(-1 * var(--s-16)); position: relative; z-index: 2; margin-inline: var(--s-6); padding: var(--s-2) var(--s-4) var(--s-4); border-radius: var(--r-xl); background: var(--card); box-shadow: var(--shadow-float); }
  .qtabs { display: flex; flex-wrap: wrap; gap: var(--s-1); padding: var(--s-2) 0 var(--s-3); border-bottom: 1px solid var(--line); }
  .qtabs button { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 var(--s-4); border: 0; border-radius: var(--r-pill); background: transparent; color: var(--ink-2); font: 700 var(--t-sm) var(--f-body); cursor: pointer; }
  .qtabs button[aria-selected='true'] { background: var(--blue-soft); color: var(--blue); }
  .qform { display: flex; flex-wrap: wrap; gap: var(--s-3); align-items: flex-end; padding-top: var(--s-3); }
  .qf { display: grid; gap: 4px; flex: 1 1 140px; min-width: 0; }
  .qf.grow { flex: 3 1 220px; }
  .qf span { font-size: var(--t-xs); font-weight: 700; color: var(--ink-2); }
  .go { min-height: 48px; padding: 0 var(--s-6); flex: 0 0 auto; }
  /* feature row */
  .features { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--s-3); }
  .features li { display: flex; gap: var(--s-3); align-items: center; padding: var(--s-3) var(--s-4); border-radius: var(--r-card); background: var(--card); box-shadow: var(--shadow-raised); }
  .features li > span { display: grid; gap: 2px; }
  .quick { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  /* popular (destination cards) */
  .pcard { position: relative; display: grid; gap: 4px; padding: var(--s-2) var(--s-2) var(--s-4); border-radius: var(--r-card); background: var(--card); box-shadow: var(--shadow-raised); transition: transform var(--dur-fast); }
  .pcard:hover { transform: translateY(-3px); }
  .part { position: relative; border-radius: 16px; background: var(--tile-bg); padding: 6px 22px 0; margin-bottom: var(--s-2); --scene-blob: rgba(255, 255, 255, .55); }
  .pbadge { position: absolute; left: 10px; top: 10px; font: 800 var(--t-xs) var(--f-body); padding: 3px 10px; border-radius: var(--r-pill); background: var(--card); color: var(--ink); }
  .pfav { position: absolute; right: 6px; top: 6px; z-index: 2; width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--card); color: var(--ink-3); display: grid; place-items: center; cursor: pointer; box-shadow: var(--shadow-raised); }
  .pfav[aria-pressed='true'] { color: var(--gold); }
  .pfav[aria-pressed='true'] :global(svg path) { fill: currentColor; }
  .pname { color: var(--ink); text-decoration: none; padding: 0 var(--s-2); font-size: var(--t-md); }
  .pname::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
  .pabout { padding: 0 44px 0 var(--s-2); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .pgo { position: absolute; right: 12px; bottom: 12px; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--blue-soft); color: var(--blue); }
  /* all tools */
  .all { scroll-margin-top: var(--s-6); }
  .gh { font-size: var(--t-lg); margin: var(--s-2) 0 0; display: flex; align-items: center; gap: var(--s-2); }
  .search { display: flex; align-items: center; gap: var(--s-2); }
  .search .input { flex: 1; min-height: 50px; border-radius: var(--r-pill); padding: 0 var(--s-4); }
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
  @media (prefers-reduced-motion: reduce) { .tcard:hover, .pcard:hover { transform: none; } }
  .hero { background: linear-gradient(135deg, var(--gold-soft), var(--card)); border: 2px solid var(--gold-strong); }
  .tile { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; background: var(--tile-bg); color: var(--tile-ink); }
  .tile.sm { width: 32px; height: 32px; border-radius: 10px; }
  .txt { display: grid; gap: 4px; min-width: 0; }
  .name { color: var(--ink); text-decoration: none; }
  .name::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
  .name:focus-visible { outline: none; }
  .name:focus-visible::after, .pname:focus-visible::after { outline: 3px solid var(--gold-strong); outline-offset: 2px; }
  .pname:focus-visible { outline: none; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; font: 700 var(--t-xs) var(--f-body); padding: 1px 8px; border-radius: var(--r-pill); border: 1px solid var(--line); color: var(--ink-2); }
  .badge.ai { background: var(--gold-soft); border-color: transparent; color: var(--ink); }
  .badge.new { background: var(--tint-rose); border-color: transparent; color: var(--tint-rose-ink); }
  .fav { position: relative; z-index: 1; display: grid; place-items: center; width: 44px; height: 44px; margin: -10px -10px 0 0; border: 0; border-radius: 50%; background: transparent; color: var(--ink-3); cursor: pointer; }
  .fav:hover { background: var(--sunken); }
  .fav[aria-pressed='true'] { color: var(--gold); }
  .fav[aria-pressed='true'] :global(svg path) { fill: currentColor; }
  /* promo banner ("Top deals this week") */
  .promo { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.4fr); gap: var(--s-6); align-items: center; padding: var(--s-6); border-radius: var(--r-xl); color: #fff; background: linear-gradient(135deg, #1D5BD8, #13294B); box-shadow: var(--shadow-float); }
  .promo h2 { margin: 0; font-size: clamp(1.9rem, 3.6vw, 2.6rem); line-height: 1.05; display: block; color: #fff; }
  .promo .script { color: #FFD36B; }
  .ptxt { display: grid; gap: var(--s-3); justify-items: start; }
  .ptxt p { opacity: .92; }
  .btn-light { background: #fff; color: #13294B; }
  .deals { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-3); }
  .deal { position: relative; display: grid; gap: 4px; padding: var(--s-2) var(--s-2) var(--s-3); border-radius: var(--r-card); background: var(--card); color: var(--ink); }
  .deal b { padding: 0 var(--s-2); }
  .deal .small { padding: 0 var(--s-2); }
  .dart { border-radius: 14px; background: var(--tile-bg); padding: 4px 14px 0; --scene-blob: rgba(255, 255, 255, .55); }
  .dlink { padding: 0 var(--s-2); font-weight: 700; font-size: var(--t-sm); color: var(--blue); text-decoration: none; display: inline-flex; align-items: center; gap: 2px; }
  .dlink::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
  @media (max-width: 899px) { .promo { grid-template-columns: 1fr; } }
  @media (max-width: 599px) { .deals { grid-template-columns: 1fr; } .dart { display: none; } }
  /* how it works */
  .how { display: grid; gap: var(--s-4); }
  .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s-4); }
  .steps li { position: relative; display: grid; justify-items: center; text-align: center; gap: var(--s-2); padding: var(--s-4) var(--s-2); }
  .steps li:not(:last-child)::after { content: ''; position: absolute; top: calc(var(--s-4) + 28px); left: calc(50% + 40px); width: calc(100% - 80px + var(--s-4)); border-top: 2px dashed color-mix(in srgb, var(--blue) 45%, transparent); }
  @media (max-width: 799px) { .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } .steps li::after { display: none; } }
  /* numbers band */
  .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s-3); padding: var(--s-6); border-radius: var(--r-xl); background: linear-gradient(135deg, var(--teal), var(--teal-2)); color: var(--on-teal); }
  .stats div { display: grid; justify-items: center; gap: 2px; text-align: center; }
  .stats b { font: 800 2rem var(--f-display); }
  @media (max-width: 599px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  /* categories */
  .cat-plan { --tile-bg: var(--gold-soft); --tile-ink: var(--gold); }
  .cat-create { --tile-bg: var(--main); --tile-ink: var(--main-ink); }
  .cat-assess { --tile-bg: var(--comp); --tile-ink: var(--comp-ink); }
  .cat-support { --tile-bg: var(--tint-green); --tile-ink: var(--tint-green-ink); }
  .cat-classroom { --tile-bg: var(--sky-1); --tile-ink: var(--navy-2); }
  .cat-fun { --tile-bg: var(--tint-rose); --tile-ink: var(--tint-rose-ink); }
  .cat-write { --tile-bg: var(--tint-purple); --tile-ink: var(--tint-purple-ink); }
  @media (max-width: 799px) {
    .lhero { grid-template-columns: 1fr; padding: var(--s-6) var(--s-4) var(--s-12); }
    .hart { order: -1; max-width: 420px; justify-self: center; }
    .quick-start { margin-inline: var(--s-2); }
  }
</style>
