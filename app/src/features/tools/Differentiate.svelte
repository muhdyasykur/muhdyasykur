<script lang="ts">
  import { differentiate } from '../../lib/recommend/differentiate';
  import AiButtons from './AiButtons.svelte';
  import { buildPrompt } from '../../lib/recommend/prompts';
  let activity = $state(''); let skill = $state('Speaking'); let year = $state(4);
  const t = $derived(differentiate(activity, skill));
</script>
<div class="stack">
  <section class="card stack">
    <label class="field"><span>Describe the activity</span><textarea id="df-act" class="input ta" rows="3" bind:value={activity} placeholder="e.g. Pupils interview a partner about their hobbies and report back"></textarea></label>
    <div class="grid">
      <label class="field"><span>Skill</span><select class="select" bind:value={skill}>{#each ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts'] as s}<option>{s}</option>{/each}</select></label>
      <label class="field"><span>Year</span><select class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
    </div>
  </section>
  <div class="tiers">
    <article class="card"><h3>🌱 Low</h3><ul>{#each t.low as x}<li>{x}</li>{/each}</ul></article>
    <article class="card"><h3>🌿 Moderate</h3><ul>{#each t.mod as x}<li>{x}</li>{/each}</ul></article>
    <article class="card"><h3>🌳 High</h3><ul>{#each t.high as x}<li>{x}</li>{/each}</ul></article>
  </div>
  <p class="muted small">Same learning goal for everyone; only the support and the challenge change. Use the PBD levels in Classes to decide who starts where.</p>
  <section class="card stack tight"><h3>Need fully written versions?</h3><AiButtons prompt={buildPrompt('differentiate', { year, topic: '', skill, words: [], sentence: '', extra: activity })} label="Differentiate with AI" /></section>
</div>
<style>
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: var(--s-3); }
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  h3 { margin: 0 0 var(--s-2); } ul { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
  .small { font-size: var(--t-sm); } .tight { gap: var(--s-2); }
</style>
