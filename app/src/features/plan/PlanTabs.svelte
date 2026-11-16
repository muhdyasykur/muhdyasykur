<script lang="ts">
  import { href } from '../../router.svelte';
  let { current }: { current: 'lessons' | 'day' | 'week' | 'year' } = $props();
  const TABS: [typeof current, string, string][] = [['lessons', 'Lessons', href('plan')], ['day', 'My day', href('plan', 'day')], ['week', 'This week', href('plan', 'week')], ['year', 'Yearly plan', href('plan', 'year')]];
</script>
<nav class="tabs" aria-label="Plan views">{#each TABS as [id, label, url]}<a href={url} aria-current={current === id ? 'page' : undefined} data-plantab={id}>{label}</a>{/each}</nav>
<style>
  /* also styles the Yearly / Monthly / Weekly switch inside the yearly plan */
  :global(nav.tabs) { display: flex; gap: var(--s-1); border-bottom: 1px solid var(--line); overflow-x: auto; scrollbar-width: none; }
  :global(nav.tabs a) { padding: var(--s-3); min-height: var(--tap); text-decoration: none; color: var(--ink-2); font-weight: 600; font-size: var(--t-sm); border-bottom: 3px solid transparent; white-space: nowrap; flex: none; }
  :global(nav.tabs a[aria-current="page"]) { color: var(--navy); border-color: var(--gold-strong); }
</style>
