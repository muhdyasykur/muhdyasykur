<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import type { Block, Inline, List } from '../../lib/studio/markdown';
  /** Draws a Studio result. Everything is a text node: an AI answer is never inserted as HTML. */
  let { blocks }: { blocks: Block[] } = $props();
</script>

{#snippet runs(xs: Inline[])}{#each xs as x}{#if x.t === 'text'}{x.v}{:else if x.t === 'code'}<code>{x.v}</code>{:else if x.t === 'b'}<strong>{@render runs(x.c)}</strong>{:else}<em>{@render runs(x.c)}</em>{/if}{/each}{/snippet}

{#snippet list(l: List)}
  {#if l.t === 'ol'}
    <ol start={l.start}>{#each l.items as it}<li>{@render runs(it.c)}{#if it.sub}{@render list(it.sub)}{/if}</li>{/each}</ol>
  {:else}
    <ul>{#each l.items as it}<li>{@render runs(it.c)}{#if it.sub}{@render list(it.sub)}{/if}</li>{/each}</ul>
  {/if}
{/snippet}

<div class="md">
  {#each blocks as b}
    {#if b.t === 'h'}
      {#if b.level === 1}<h2>{@render runs(b.c)}</h2>{:else if b.level === 2}<h3>{@render runs(b.c)}</h3>{:else}<h4>{@render runs(b.c)}</h4>{/if}
    {:else if b.t === 'p'}<p>{@render runs(b.c)}</p>
    {:else if b.t === 'quote'}<blockquote>{@render runs(b.c)}</blockquote>
    {:else if b.t === 'hr'}<hr />
    {:else if b.t === 'table'}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (a scrollable table must be reachable by keyboard) -->
      <div class="tw" role="region" aria-label={tr('Table')} tabindex="0">
        <table>
          <thead><tr>{#each b.head as c}<th scope="col">{@render runs(c)}</th>{/each}</tr></thead>
          <tbody>{#each b.rows as r}<tr>{#each r as c}<td>{@render runs(c)}</td>{/each}</tr>{/each}</tbody>
        </table>
      </div>
    {:else}{@render list(b)}{/if}
  {/each}
</div>

<style>
  .md { display: grid; gap: var(--s-3); line-height: 1.6; overflow-wrap: anywhere; }
  .md :global(h2), .md :global(h3), .md :global(h4) { margin: var(--s-2) 0 0; line-height: 1.3; }
  .md :global(h2) { font-size: var(--t-xl); }
  .md :global(h3) { font-size: var(--t-lg); }
  .md :global(h4) { font-size: var(--t-md); }
  .md :global(p) { margin: 0; white-space: pre-line; }
  .md :global(ul), .md :global(ol) { margin: 0; padding-left: 1.4em; display: grid; gap: 4px; }
  .md :global(li) { white-space: pre-line; }
  .md :global(li > ul), .md :global(li > ol) { margin-top: 4px; }
  .md :global(blockquote) { margin: 0; padding: var(--s-2) var(--s-3); border-left: 4px solid var(--gold-strong); background: var(--sunken); border-radius: 0 var(--r-ctl) var(--r-ctl) 0; white-space: pre-line; }
  .md :global(hr) { border: 0; border-top: 1px solid var(--line); margin: var(--s-2) 0; }
  .md :global(code) { font-family: var(--f-mono); font-size: .9em; background: var(--sunken); padding: 0 4px; border-radius: 4px; }
  .tw { overflow-x: auto; max-width: 100%; }
  table { border-collapse: collapse; width: 100%; font-size: var(--t-sm); }
  th, td { border: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: var(--sunken); }
  @media print { .md { color: #000; } th { background: #eee; } }
</style>
