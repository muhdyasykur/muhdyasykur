<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { differentiate } from '../../lib/recommend/differentiate';
  import AiButtons from './AiButtons.svelte';
  import { buildPrompt } from '../../lib/recommend/prompts';
  import { ctx } from '../../lib/tools/context.svelte';
  let activity = $state('');
  const t = $derived(differentiate(activity, ctx.skill));
</script>
<div class="stack">
  <section class="card stack">
    <label class="field"><span>{tr('Describe the activity')}</span><textarea id="df-act" class="input ta" rows="3" bind:value={activity} placeholder="e.g. Pupils interview a partner about their hobbies and report back"></textarea></label>
  </section>
  <div class="tiers">
    <article class="card"><h3>{tr('🌱 Low')}</h3><ul>{#each t.low as x}<li>{x}</li>{/each}</ul></article>
    <article class="card"><h3>{tr('🌿 Moderate')}</h3><ul>{#each t.mod as x}<li>{x}</li>{/each}</ul></article>
    <article class="card"><h3>{tr('🌳 High')}</h3><ul>{#each t.high as x}<li>{x}</li>{/each}</ul></article>
  </div>
  <p class="muted small">{tr('Same learning goal for everyone; only the support and the challenge change. Use the PBD levels in Classes to decide who starts where.')}</p>
  <section class="card stack tight"><h3>{tr('Need fully written versions?')}</h3><AiButtons prompt={buildPrompt('differentiate', { year: ctx.year, topic: ctx.topic, skill: ctx.skill, words: [], sentence: ctx.sentence, extra: activity })} label={tr('Differentiate with AI')} /></section>
</div>
<style>
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); }
  .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: var(--s-3); }
  h3 { margin: 0 0 var(--s-2); } ul { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
  .small { font-size: var(--t-sm); } .tight { gap: var(--s-2); }
</style>
