<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  import { href } from '../../../router.svelte';
  import type { Lesson } from '../../../lib/lesson/model';
  import { KIND_NAME, type BookKind } from '../../../lib/textbook/books';
  import { lessonTextbook } from '../../../lib/textbook/lesson';
  import type { PagePicture } from '../../../lib/textbook/pictures';

  /**
   * Pictures of the lesson's textbook pages after the printed plan, drawn from the teacher's own PDFs on the
   * Textbook Shelf. Shown only when the teacher ticks "Print pictures of these pages" in Materials.
   */
  let { lesson }: { lesson: Lesson } = $props();
  let pictures = $state<PagePicture[]>([]);
  let missing = $state<BookKind[]>([]);
  let busy = $state(false);
  const tb = $derived(lessonTextbook(lesson));
  const key = $derived(tb.pictures ? JSON.stringify(tb.pages) : '');
  $effect(() => {
    const k = key; pictures = []; missing = [];
    if (!k) return;
    busy = true;
    let stale = false;
    import('../../../lib/textbook/pictures').then(({ lessonPictures }) => lessonPictures($state.snapshot(lesson) as Lesson))
      .then((r) => { if (!stale) { pictures = r.pictures; missing = r.missing; } })
      .catch(() => { if (!stale) missing = [...new Set(tb.pages.map((p) => p.kind))]; })
      .finally(() => { if (!stale) busy = false; });
    return () => { stale = true; };
  });
</script>

{#if tb.pictures}
  {#if busy}<p class="muted small no-print" role="status">{tr('Drawing the textbook pages…')}</p>{/if}
  {#if missing.length}<p class="muted small no-print" data-tb-missing>{tr('Not printed: {x}. Add the book on the', { x: missing.map((k) => KIND_NAME[k]).join(', ') })} <a href={href('library', lesson.curriculum.year, lesson.curriculum.school.toLowerCase(), 'books')}>{tr('Textbook Shelf')}</a>.</p>{/if}
  {#each pictures as p, i (p.kind + p.page)}
    <figure class="apx tbpic" lang="en" data-tb-picture={`${p.kind}-${p.page}`}>
      <figcaption>{i === 0 ? 'Textbook pages · ' : ''}{p.title} p. {p.page}</figcaption>
      <img src={p.dataUrl} alt={`${p.title}, page ${p.page}`} />
    </figure>
  {/each}
{/if}

<style>
  .tbpic { background: #fff; color: #111; margin: var(--s-4) auto 0; padding: 10mm; max-width: 210mm; box-sizing: border-box; box-shadow: 0 1px 4px rgb(0 0 0 / .15); }
  .tbpic figcaption { font: 700 11pt Arial, sans-serif; margin-bottom: 4mm; }
  .tbpic img { display: block; width: 100%; max-height: 260mm; object-fit: contain; }
  @media print { .tbpic { box-shadow: none; padding: 0; margin: 0; break-before: page; } }
</style>
