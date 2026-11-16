<script lang="ts">
  import { route, href } from '../../router.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
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

  /** Tools: everything a trainee needs besides the RPH builder, in one place (blueprint F15, extended in M8). */
  interface Tool { id: string; icon: string; title: string; about: string; group: 'Plan' | 'Make' | 'Teach'; href?: string }
  const TOOLS: Tool[] = [
    { id: 'recommend', icon: '✨', title: 'Consilia recommends', about: 'Tell Consilia about your class; get a whole lesson with step-by-step activities, teaching aids and digital tools.', group: 'Plan', href: href('plan', 'new', 'recommend') },
    { id: 'ideas', icon: '💡', title: 'Activity ideas', about: '86 tried activities. Filter by skill, stage, year, time and what your class has.', group: 'Plan' },
    { id: 'objectives', icon: '🎯', title: 'Objective writer', about: 'ABCD objectives that pass SMART, with success criteria for pupils.', group: 'Plan' },
    { id: 'differentiate', icon: '🪜', title: 'Differentiation helper', about: 'Low, moderate and high versions of any activity.', group: 'Plan' },
    { id: 'bbm', icon: '✂️', title: 'BBM guide', about: '24 teaching aids with pictures, what you need and how to make them step by step.', group: 'Make' },
    { id: 'worksheets', icon: '📝', title: 'Worksheet maker', about: 'Flashcards, gap-fill, matching, strips, tiered worksheets, rubrics. Print offline.', group: 'Make' },
    { id: 'chant', icon: '🎵', title: 'Chant maker', about: 'Turn your key words into a catchy chant with actions.', group: 'Make' },
    { id: 'ai', icon: '🤖', title: 'AI prompt builder', about: 'Ready prompts for ChatGPT, Gemini, Copilot or Canva AI: texts, questions, songs, pictures.', group: 'Make' },
    { id: 'games', icon: '🎮', title: 'Classroom games', about: 'Spin wheel, Unjumble, Mystery word and Quiz show on the projector. Offline.', group: 'Teach' },
    { id: 'digital', icon: '🌐', title: 'Digital tools', about: 'Ready-made Wordwall, Liveworksheets, Quizizz, StoryWeaver and more for your topic.', group: 'Teach' },
    { id: 'manage', icon: '🧭', title: 'Classroom management', about: 'Routines, attention signals and rewards for your class.', group: 'Teach' }
  ];
  let q = $state('');
  const shown = $derived(TOOLS.filter((t) => !q.trim() || (t.title + ' ' + t.about).toLowerCase().includes(q.trim().toLowerCase())));
  const current = $derived(TOOLS.find((t) => t.id === route.parts[0] && !t.href));
</script>

{#if current}
  <div class="stack">
    <a class="btn btn-text back" href={href('tools')}><Icon name="back" size={18} />Tools</a>
    <h1><span aria-hidden="true">{current.icon}</span> {current.title}</h1>
    {#if current.id === 'ideas'}<Ideas />{:else if current.id === 'bbm'}<BbmGuide />{:else if current.id === 'digital'}<DigitalTools />{:else if current.id === 'games'}<Games />{:else if current.id === 'ai'}<Prompts />{:else if current.id === 'objectives'}<ObjectiveWriter />{:else if current.id === 'chant'}<Chant />{:else if current.id === 'differentiate'}<Differentiate />{:else if current.id === 'worksheets'}<Worksheets />{:else if current.id === 'manage'}<Manage />{/if}
  </div>
{:else}
  <div class="stack">
    <h1>Tools</h1>
    <p class="muted">Everything works on this device and offline, except the outside sites you choose to open.</p>
    <label class="search"><Icon name="search" size={18} /><span class="sr-only">Search tools</span><input id="tools-q" class="input" type="search" bind:value={q} placeholder="Search tools: games, BBM, objectives…" /></label>
    {#each ['Plan', 'Make', 'Teach'] as g}
      {@const list = shown.filter((t) => t.group === g)}
      {#if list.length}
        <section class="stack tight" aria-labelledby="tg-{g}">
          <h2 id="tg-{g}">{g === 'Plan' ? 'Plan a lesson' : g === 'Make' ? 'Make materials' : 'In the classroom'}</h2>
          <div class="grid">
            {#each list as t}
              <a class="card raised tool" class:hero={t.id === 'recommend'} href={t.href ?? href('tools', t.id)} data-tool-card={t.id}>
                <span class="ic" aria-hidden="true">{t.icon}</span><span class="txt"><b>{t.title}</b><span class="muted small">{t.about}</span></span>
              </a>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
    {#if !shown.length}<p class="muted">No tool matches "{q}".</p>{/if}
  </div>
{/if}

<style>
  .back { justify-self: start; }
  h1 { margin: 0; }
  h2 { font-size: var(--t-lg); margin: var(--s-2) 0 0; }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .search { display: flex; align-items: center; gap: var(--s-2); }
  .search .input { flex: 1; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: var(--s-3); }
  .tool { display: grid; grid-template-columns: auto 1fr; gap: var(--s-3); align-items: start; text-decoration: none; color: var(--ink); }
  .tool:hover { border-color: var(--gold-strong); }
  .hero { background: linear-gradient(135deg, var(--gold-soft), var(--card)); border: 2px solid var(--gold-strong); }
  .ic { font-size: 1.8rem; line-height: 1; }
  .txt { display: grid; gap: 4px; }
</style>
