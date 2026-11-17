<script lang="ts">
  import { tr, uiDate } from '../../lib/i18n/index.svelte';
  import { href } from '../../router.svelte';
  import { listLessons } from '../../lib/db/repo';
  import { longDate } from '../../lib/lesson/derive';
  import type { Lesson } from '../../lib/lesson/model';
  /** Tools → Lesson slides: choose the lesson plan to make slides from. */
  let lessons = $state<Lesson[] | null>(null);
  $effect(() => { listLessons().then((l) => (lessons = l)); });
</script>
<div class="stack">
  <p class="muted">{tr('Slides are made from a lesson plan, so the goals, words, activities and questions match what you will teach. Choose a lesson plan:')}</p>
  {#if lessons && !lessons.length}
    <section class="card stack"><p>{tr('You have no lesson plans yet.')}</p><div class="row"><a class="btn btn-gold" href={href('plan', 'new', 'recommend')}>{tr('✨ Let Consilia plan a lesson')}</a><a class="btn btn-outline" href={href('plan', 'new')}>{tr('New lesson plan')}</a></div></section>
  {:else if lessons}
    <ul class="list">
      {#each lessons as l (l.id)}
        <li><a class="card raised pick" href={href('plan', 'slides', l.id)} data-pick={l.id}>
          <span class="eyebrow">{uiDate(l.header.date)} · {l.header.className || tr('Year {year}', { year: l.curriculum.year })}</span>
          <b>{l.topic || tr('Untitled lesson')}</b>
          <span class="muted small">{l.slides ? tr('🖼 {length} slides', { length: l.slides.slides.length }) : tr('No slides yet: tap to make them')}</span>
        </a></li>
      {/each}
    </ul>
  {/if}
</div>
<style>
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .pick { display: grid; gap: 2px; text-decoration: none; color: var(--ink); }

</style>
