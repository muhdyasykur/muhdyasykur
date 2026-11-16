<script lang="ts">
  import { makeChants } from '../../lib/recommend/chant';
  import AiButtons from './AiButtons.svelte';
  import { buildPrompt } from '../../lib/recommend/prompts';
  let words = $state(''); let frame = $state(''); let year = $state(3);
  const W = $derived(words.split(',').map((w) => w.trim()).filter(Boolean));
  const chants = $derived(makeChants(W, frame));
  let copied = $state('');
  async function copy(lines: string[]) { try { await navigator.clipboard.writeText(lines.join('\n')); copied = 'Copied.'; } catch { copied = 'Select the lines to copy them.'; } }
</script>
<div class="stack">
  <section class="card stack">
    <div class="grid">
      <label class="field"><span>Key words (comma separated)</span><input id="ch-words" class="input" bind:value={words} placeholder="e.g. Japan, China, India, Thailand" /></label>
      <label class="field"><span>Sentence frame (use … for the word)</span><input id="ch-frame" class="input" bind:value={frame} placeholder="e.g. He is from …" /></label>
    </div>
    <p class="muted small">Chants help pupils remember words and sentence patterns, and get shy pupils speaking together.</p>
  </section>
  {#each chants as c (c.id)}
    <article class="card stack tight chant" data-chant={c.id}>
      <h3>{c.title}</h3><p class="muted small">{c.how}</p>
      <pre class="lines">{c.lines.join('\n')}</pre>
      <div class="row"><button class="btn btn-outline" type="button" onclick={() => copy(c.lines)}>Copy</button>{#if copied}<span class="muted small">{copied}</span>{/if}</div>
    </article>
  {/each}
  <section class="card stack tight"><h3>Want a full song?</h3>
    <label class="field"><span>Year</span><select class="select" bind:value={year}>{#each [1, 2, 3, 4, 5, 6] as y}<option value={y}>Year {y}</option>{/each}</select></label>
    <AiButtons prompt={buildPrompt('song', { year, topic: W.join(', '), skill: 'Language Arts', words: W, sentence: frame })} label="Write a song with AI" />
  </section>
</div>
<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--s-3); }
  .tight { gap: var(--s-2); } h3 { margin: 0; } .small { font-size: var(--t-sm); } p { margin: 0; }
  .lines { font: 600 var(--t-lg) var(--f-pupil); white-space: pre-wrap; margin: 0; background: var(--sunken); border-radius: var(--r-ctl); padding: var(--s-3); }
</style>
