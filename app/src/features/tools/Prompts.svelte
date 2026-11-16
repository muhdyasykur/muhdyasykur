<script lang="ts">
  import { PROMPT_KINDS, buildPrompt, cefr, type PromptKind } from '../../lib/recommend/prompts';
  import AiButtons from './AiButtons.svelte';
  /** Ready prompts for any AI chatbot, written for KSSR primary English. Consilia sends nothing itself. */
  let kind = $state<PromptKind>('text');
  let year = $state(4); let topic = $state(''); let skill = $state('Reading'); let words = $state(''); let sentence = $state(''); let extra = $state('');
  const prompt = $derived(buildPrompt(kind, { year, topic, skill, words: words.split(',').map((w) => w.trim()).filter(Boolean), sentence, extra }));
  const needsExtra = $derived(kind === 'improve' || kind === 'differentiate' || kind === 'rubric');
</script>
<div class="stack">
  <p class="muted">Choose what you need. Consilia writes a careful prompt for your pupils' level (Year {year} ≈ CEFR {cefr(year)}). You paste it into the AI you prefer.</p>
  <div class="kinds" role="radiogroup" aria-label="What do you need?">
    {#each PROMPT_KINDS as k}<button type="button" role="radio" aria-checked={kind === k.id} class="card kind" data-kind={k.id} onclick={() => (kind = k.id)}><b>{k.title}</b><span class="muted small">{k.about}</span></button>{/each}
  </div>
  <section class="card stack">
    <div class="grid">
      <label class="field"><span>Year</span><select class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
      <label class="field"><span>Skill</span><select class="select" bind:value={skill}>{#each ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'] as s}<option>{s}</option>{/each}</select></label>
      <label class="field"><span>Topic</span><input id="ai-topic" class="input" bind:value={topic} placeholder="e.g. Healthy habits" /></label>
      <label class="field"><span>Key words</span><input class="input" bind:value={words} placeholder="e.g. vegetables, water, sleep" /></label>
      <label class="field"><span>Target sentence</span><input class="input" bind:value={sentence} placeholder="e.g. I should … because …" /></label>
    </div>
    {#if needsExtra}<label class="field"><span>{kind === 'improve' ? 'Paste your lesson plan' : kind === 'rubric' ? 'Your objectives' : 'The activity'}</span><textarea class="input ta" rows="4" bind:value={extra}></textarea></label>{/if}
    <AiButtons {prompt} label="Get it from AI" />
  </section>
</div>
<style>
  .kinds { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: var(--s-2); }
  .kind { text-align: left; display: grid; gap: 2px; cursor: pointer; font: inherit; color: inherit; }
  .kind[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .small { font-size: var(--t-sm); }
  .ta { min-height: 90px; padding: var(--s-2) var(--s-3); }
</style>
