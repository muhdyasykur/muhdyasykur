<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { PROMPT_KINDS, buildPrompt, cefr, type PromptKind } from '../../lib/recommend/prompts';
  import AiButtons from './AiButtons.svelte';
  import { ctx, ctxWords } from '../../lib/tools/context.svelte';
  import { getLesson } from '../../lib/db/repo';
  import { compose } from '../../lib/lesson/objectives';
  /** Ready prompts for any AI chatbot, written for KSSR primary English. Consilia sends nothing itself. */
  let kind = $state<PromptKind>('text');
  let extra = $state('');
  // with an RPH in the lesson bar, "Improve my lesson plan" and the rubric are filled from it
  $effect(() => { const id = ctx.lessonId, k = kind; if (!id || (k !== 'improve' && k !== 'rubric')) return; getLesson(id).then((l) => { if (!l) return; extra = k === 'rubric' ? l.objectives.map(compose).filter(Boolean).join(' ') : [`Year ${l.curriculum.year}, ${l.header.durationMin} minutes, ${l.topic}.`, 'Objectives:', ...l.objectives.map((o) => '- ' + compose(o)), 'Stages:', ...l.stages.flatMap((s) => s.activities.filter((a) => a.teacher || a.pupils).map((a) => `- ${s.title} (${s.minutes} min): Teacher: ${a.teacher} Pupils: ${a.pupils}`))].join('\n'); }); });
  const prompt = $derived(buildPrompt(kind, { year: ctx.year, topic: ctx.topic, skill: ctx.skill, words: ctxWords(), sentence: ctx.sentence, extra }));
  const needsExtra = $derived(kind === 'improve' || kind === 'differentiate' || kind === 'rubric');
</script>
<div class="stack">
  <p class="muted">{tr('Choose what you need. Consilia writes a careful prompt for your pupils\' level (Year {year} ≈ CEFR {x}). You paste it into the AI you prefer.', { year: ctx.year, x: cefr(ctx.year) })}</p>
  <div class="kinds" role="radiogroup" aria-label={tr('What do you need?')}>
    {#each PROMPT_KINDS as k}<button type="button" role="radio" aria-checked={kind === k.id} class="card kind" data-kind={k.id} onclick={() => (kind = k.id)}><b>{tr(k.title)}</b><span class="muted small">{tr(k.about)}</span></button>{/each}
  </div>
  <section class="card stack">
    {#if needsExtra}<label class="field"><span>{kind === 'improve' ? tr('Paste your lesson plan') : kind === 'rubric' ? tr('Your objectives') : tr('The activity')}</span><textarea class="input ta" rows="4" bind:value={extra}></textarea></label>{/if}
    <AiButtons {prompt} label={tr('Get it from AI')} />
  </section>
</div>
<style>
  .kinds { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: var(--s-2); }
  .kind { text-align: left; display: grid; gap: 2px; cursor: pointer; font: inherit; color: inherit; }
  .kind[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); }

  .ta { min-height: 90px; padding: var(--s-2) var(--s-3); }
</style>
