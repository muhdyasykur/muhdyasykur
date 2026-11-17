<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon, { type IconName } from './Icon.svelte';
  /**
   * What a screen or a list shows when there is nothing yet: an optional icon, a title, a short explanation and the
   * action that fixes it. `compact` is the one-line version inside a card.
   */
  let { icon, title, children, actions, compact = false, alert = false }: { icon?: IconName; title?: string; children?: Snippet; actions?: Snippet; compact?: boolean; alert?: boolean } = $props();
</script>

<section class="empty" class:compact role={alert ? 'alert' : undefined}>
  {#if icon}<span class="ic" aria-hidden="true"><Icon name={icon} size={compact ? 22 : 30} /></span>{/if}
  {#if title}<h3>{title}</h3>{/if}
  {#if children}<p>{@render children()}</p>{/if}
  {#if actions}<div class="row act">{@render actions()}</div>{/if}
</section>

<style>
  .ic { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--sunken); color: var(--navy-2); }
  .empty h3 { color: var(--ink); }
  .empty p { max-width: 46ch; }
  .act { justify-content: center; }
  .compact { padding: var(--s-4); }
  .compact .ic { width: 40px; height: 40px; }
</style>
