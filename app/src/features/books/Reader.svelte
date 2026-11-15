<script lang="ts">
  import { href } from '../../router.svelte';
  import { slotById } from '../../lib/textbook/books';
  import Viewer from './Viewer.svelte';
  import Icon from '../../lib/ui/Icon.svelte';
  import { untrack } from 'svelte';
  /** One book, or two side by side on a wide screen (e.g. Student's Book with the Teacher's Book). */
  let { slot, page, slot2, page2 }: { slot: string; page: number; slot2?: string; page2?: number } = $props();
  let p1 = $state(untrack(() => page)); let p2 = $state(untrack(() => page2 ?? 1)); // keyed by the address in Library
  const s = $derived(slotById(slot));
  const year = $derived(s?.years[0] ?? 4);
</script>
<div class="stack">
  <a class="btn btn-text back" href={href('library', year, 'sk', 'books')}><Icon name="back" size={18} />Textbook Shelf</a>
  <div class="pair" class:two={!!slot2}>
    <Viewer {slot} bind:page={p1} />
    {#if slot2}<Viewer slot={slot2} bind:page={p2} tools={false} />{/if}
  </div>
</div>
<style>
  .back { justify-self: start; }
  .pair { display: grid; gap: var(--s-4); }
  @media (min-width: 1100px) { .pair.two { grid-template-columns: 1fr 1fr; } }
</style>
