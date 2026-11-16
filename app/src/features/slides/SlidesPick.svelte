<script lang="ts">
  import { href } from '../../router.svelte';
  import { listLessons } from '../../lib/db/repo';
  import { longDate } from '../../lib/lesson/derive';
  import type { Lesson } from '../../lib/lesson/model';
  /** Tools → Lesson slides: choose the lesson plan to make slides from. */
  let lessons = $state<Lesson[] | null>(null);
  $effect(() => { listLessons().then((l) => (lessons = l)); });
</script>
<div class="stack">
  <p class="muted">Slides are made from a lesson plan, so the goals, words, activities and questions match what you will teach. Choose a lesson plan:</p>
  {#if lessons && !lessons.length}
    <section class="card stack"><p>You have no lesson plans yet.</p><div class="row"><a class="btn btn-gold" href={href('plan', 'new', 'recommend')}>✨ Let Consilia plan a lesson</a><a class="btn btn-outline" href={href('plan', 'new')}>New lesson plan</a></div></section>
  {:else if lessons}
    <ul class="list">
      {#each lessons as l (l.id)}
        <li><a class="card raised pick" href={href('plan', 'slides', l.id)} data-pick={l.id}>
          <span class="eyebrow">{longDate(l.header.date)} · {l.header.className || `Year ${l.curriculum.year}`}</span>
          <b>{l.topic || 'Untitled lesson'}</b>
          <span class="muted small">{l.slides ? `🖼 ${l.slides.slides.length} slides` : 'No slides yet: tap to make them'}</span>
        </a></li>
      {/each}
    </ul>
  {/if}
</div>
<style>
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .pick { display: grid; gap: 2px; text-decoration: none; color: var(--ink); }
  .small { font-size: var(--t-sm); }
</style>
