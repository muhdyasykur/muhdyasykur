<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { route, href } from '../../router.svelte';
  import Icon, { type IconName } from '../../lib/ui/Icon.svelte';
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

  /** Tools: everything a trainee needs besides the RPH builder, in one place (blueprint F15, extended in M8). */
  interface Tool { id: string; icon: IconName; title: string; about: string; group: 'Plan' | 'Make' | 'Teach'; href?: string; keys?: string }
  const TOOLS: Tool[] = [
    { id: 'recommend', icon: 'sparkle', title: tr('Consilia recommends'), about: tr('Tell Consilia about your class; get a whole lesson with step-by-step activities, teaching aids and digital tools.'), group: 'Plan', href: href('plan', 'new', 'recommend'), keys: 'ai generate whole lesson rph auto rancang pelajaran cadangan agentic' },
    { id: 'ideas', icon: 'bulb', title: tr('Activity ideas'), about: tr('86 tried activities. Filter by skill, stage, year, time and what your class has.'), group: 'Plan', keys: 'activity aktiviti warm-up warmer set induction set induksi penutup closure game permainan practice production' },
    { id: 'objectives', icon: 'target', title: tr('Objective writer'), about: tr('ABCD objectives that pass SMART, with success criteria for pupils.'), group: 'Plan', keys: 'objective objektif abcd smart success criteria kriteria kejayaan' },
    { id: 'differentiate', icon: 'stairs', title: tr('Differentiation helper'), about: tr('Low, moderate and high versions of any activity.'), group: 'Plan', keys: 'differentiation pembezaan low moderate high tier weak pupils lemah murid cerdas' },
    { id: 'bbm', icon: 'scissors', title: tr('BBM guide'), about: tr('25 teaching aids with pictures, what you need and how to make them step by step.'), group: 'Make', keys: 'bbm bahan bantu mengajar teaching aids kad imbas flashcard puppet boneka dice dadu spinner make buat craft' },
    { id: 'worksheets', icon: 'sheet', title: tr('Worksheet maker'), about: tr('Flashcards, gap-fill, matching, strips, tiered worksheets, rubrics. Print offline.'), group: 'Make', keys: 'worksheet lembaran kerja printable cetak flashcard gap fill matching rubric exit ticket' },
    { id: 'chant', icon: 'music', title: tr('Chant maker'), about: tr('Turn your key words into a catchy chant with actions.'), group: 'Make', keys: 'chant song lagu nyanyian rhyme poem sajak music' },
    { id: 'slides', icon: 'slides', title: tr('Lesson slides'), about: tr('Turn a lesson plan into a full slide deck. Present it, or download PowerPoint for Canva and Google Slides.'), group: 'Make', keys: 'slides slaid powerpoint pptx canva google slides presentation pembentangan projector deck tayangan' },
    { id: 'ai', icon: 'prompt', title: tr('AI prompt builder'), about: tr('Ready prompts for Claude, ChatGPT, Gemini, Copilot or Canva AI: texts, questions, songs, pictures.'), group: 'Make', keys: 'ai claude chatgpt gemini copilot canva prompt text story questions soalan cerita' },
    { id: 'games', icon: 'game', title: tr('Classroom games'), about: tr('Spin wheel, Unjumble, Mystery word and Quiz show on the projector. Offline.'), group: 'Teach', keys: 'game permainan projector wheel spin roda quiz kuiz unjumble mystery word teka' },
    { id: 'digital', icon: 'globe', title: tr('Digital tools'), about: tr('Ready-made Wordwall, Liveworksheets, Quizizz, StoryWeaver and more for your topic.'), group: 'Teach', keys: 'digital online wordwall liveworksheets quizizz kahoot youtube video internet tmk ict' },
    { id: 'manage', icon: 'compass', title: tr('Classroom management'), about: tr('Routines, attention signals and rewards for your class.'), group: 'Teach', keys: 'classroom management pengurusan bilik darjah noisy bising discipline disiplin routine rutin attention reward' }
  ];
  let q = $state('');
  const shown = $derived(TOOLS.filter((t) => { const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean); const hay = (t.title + ' ' + t.about + ' ' + (t.keys ?? '')).toLowerCase(); return !words.length || words.some((w) => w.length > 2 && hay.includes(w)) || hay.includes(q.trim().toLowerCase()); }));
  const current = $derived(TOOLS.find((t) => t.id === route.parts[0] && !t.href));
</script>

{#if current}
  <div class="stack">
    <a class="btn btn-text back" href={href('tools')}><Icon name="back" size={18} />{tr('Tools')}</a>
    <h1><Icon name={current.icon} size={28} /> {current.title}</h1>
    {#if !['bbm', 'manage', 'slides'].includes(current.id)}<ContextBar />{/if}
    {#if current.id === 'ideas'}<Ideas />{:else if current.id === 'bbm'}<BbmGuide />{:else if current.id === 'digital'}<DigitalTools />{:else if current.id === 'games'}<Games />{:else if current.id === 'ai'}<Prompts />{:else if current.id === 'objectives'}<ObjectiveWriter />{:else if current.id === 'chant'}<Chant />{:else if current.id === 'differentiate'}<Differentiate />{:else if current.id === 'worksheets'}<Worksheets />{:else if current.id === 'manage'}<Manage />{:else if current.id === 'slides'}<SlidesPick />{/if}
  </div>
{:else}
  <div class="stack">
    <h1>{tr('Tools')}</h1>
    <p class="muted">{tr('Everything works on this device and offline, except the outside sites you choose to open.')}</p>
    <ContextBar compact />
    {#if hasCtx()}
      <div class="quick" aria-label={tr('Quick actions for this lesson')}>
        {#if ctx.lessonId}<a class="btn btn-outline" href={href('plan', 'edit', ctx.lessonId, 'flow')}><Icon name="plan" size={18} />{tr('Open the lesson plan')}</a>{:else}<a class="btn btn-gold" href={href('plan', 'new', 'recommend')}><Icon name="sparkle" size={18} />{tr('Plan this lesson')}</a>{/if}
        {#if ctx.lessonId}<a class="btn btn-outline" href={href('plan', 'slides', ctx.lessonId)} data-quick="slides"><Icon name="slides" size={18} />{tr('Slides for this lesson')}</a>{/if}
        <a class="btn btn-outline" href={href('tools', 'games')} data-quick="games"><Icon name="game" size={18} />{tr('Games from my words')}</a>
        <a class="btn btn-outline" href={href('tools', 'ideas')}><Icon name="bulb" size={18} />{tr('Activity ideas')}</a>
        <a class="btn btn-outline" href={href('tools', 'objectives')}><Icon name="target" size={18} />{tr('An objective')}</a>
        <a class="btn btn-outline" href={href('tools', 'chant')}><Icon name="music" size={18} />{tr('A chant')}</a>
        <a class="btn btn-outline" href={href('tools', 'ai')}><Icon name="prompt" size={18} />{tr('A text with AI')}</a>
      </div>
    {/if}
    <label class="search"><Icon name="search" size={18} /><span class="sr-only">{tr('Search tools')}</span><input id="tools-q" class="input" type="search" bind:value={q} placeholder={tr('What do you need? e.g. warm-up, kad imbas, noisy class, song')} /></label>
    {#each ['Plan', 'Make', 'Teach'] as g}
      {@const list = shown.filter((t) => t.group === g)}
      {#if list.length}
        <section class="stack tight" aria-labelledby="tg-{g}">
          <h2 id="tg-{g}">{g === 'Plan' ? tr('Plan a lesson') : g === 'Make' ? tr('Make materials') : tr('In the classroom')}</h2>
          <div class="grid">
            {#each list as t}
              <a class="card raised tool" class:hero={t.id === 'recommend'} href={t.href ?? href('tools', t.id)} data-tool-card={t.id}>
                <span class="ic"><Icon name={t.icon} size={28} /></span><span class="txt"><b>{t.title}</b><span class="muted small">{t.about}</span></span>
              </a>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
    {#if !shown.length}<p class="muted">{tr('No tool matches "{q}". Try a simpler word, such as game, BBM or objective.', { q })}</p>{/if}
  </div>
{/if}

<style>
  h1 { margin: 0; }
  h2 { font-size: var(--t-lg); margin: var(--s-2) 0 0; }

  .quick { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .search { display: flex; align-items: center; gap: var(--s-2); }
  .search .input { flex: 1; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: var(--s-3); }
  .tool { display: grid; grid-template-columns: auto 1fr; gap: var(--s-3); align-items: start; text-decoration: none; color: var(--ink); }
  .tool:hover { border-color: var(--gold-strong); }
  .hero { background: linear-gradient(135deg, var(--gold-soft), var(--card)); border: 2px solid var(--gold-strong); }
  .ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: var(--r-ctl); background: var(--sunken); color: var(--navy-2); }
  .txt { display: grid; gap: 4px; }
</style>
