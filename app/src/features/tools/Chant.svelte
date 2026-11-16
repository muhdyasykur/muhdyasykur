<script lang="ts">
  import { makeChants } from '../../lib/recommend/chant';
  import AiButtons from './AiButtons.svelte';
  import { buildPrompt } from '../../lib/recommend/prompts';
  import { ctx, ctxWords } from '../../lib/tools/context.svelte';
  import { appendAppendix } from '../../lib/tools/actions';
  const W = $derived(ctxWords());
  const chants = $derived(makeChants(W, ctx.sentence));
  async function add(title: string, lines: string[]) { const l = await appendAppendix(ctx.lessonId, `Chant: ${title}`, lines); copied = l ? `Added to the appendices of ${l.topic || 'your lesson'}.` : 'That lesson could not be found.'; }
  let copied = $state('');
  async function copy(lines: string[]) { try { await navigator.clipboard.writeText(lines.join('\n')); copied = 'Copied.'; } catch { copied = 'Select the lines to copy them.'; } }
</script>
<div class="stack">
  <p class="muted small">Chants help pupils remember words and sentence patterns, and get shy pupils speaking together. They use the key words and sentence in the bar above.{#if !W.length} Add some key words there to make them yours.{/if}</p>
  {#each chants as c (c.id)}
    <article class="card stack tight chant" data-chant={c.id}>
      <h3>{c.title}</h3><p class="muted small">{c.how}</p>
      <pre class="lines">{c.lines.join('\n')}</pre>
      <div class="row"><button class="btn btn-outline" type="button" onclick={() => copy(c.lines)}>Copy</button>{#if ctx.lessonId}<button class="btn btn-gold add-chant" type="button" onclick={() => add(c.title, c.lines)}>＋ Add to my lesson</button>{/if}{#if copied}<span class="muted small">{copied}</span>{/if}</div>
    </article>
  {/each}
  <section class="card stack tight"><h3>Want a full song?</h3>
    <AiButtons prompt={buildPrompt('song', { year: ctx.year, topic: ctx.topic || W.join(', '), skill: 'Language Arts', words: W, sentence: ctx.sentence })} label="Write a song with AI" />
  </section>
</div>
<style>
  .tight { gap: var(--s-2); } h3 { margin: 0; } .small { font-size: var(--t-sm); } p { margin: 0; }
  .lines { font: 600 var(--t-lg) var(--f-pupil); white-space: pre-wrap; margin: 0; background: var(--sunken); border-radius: var(--r-ctl); padding: var(--s-3); }
</style>
