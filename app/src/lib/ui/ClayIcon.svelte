<script lang="ts">
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';
  /** A round "clay" tile: a soft gradient, a highlight and a shadow behind a line icon (feature rows, stats). Decorative. */
  let { name, tone = 'blue', size = 56 }: { name: IconName; tone?: 'blue' | 'teal' | 'gold' | 'coral' | 'green' | 'purple' | 'navy'; size?: number } = $props();
</script>
<span class="clay {tone}" style="width:{size}px;height:{size}px" aria-hidden="true"><Icon {name} size={Math.round(size * 0.46)} /></span>
<style>
  .clay { position: relative; display: inline-grid; place-items: center; flex: 0 0 auto; border-radius: 50%; color: #fff; background: var(--c2);
    background: radial-gradient(circle at 32% 26%, var(--c1) 0%, var(--c2) 58%, var(--c3) 100%);
    box-shadow: 0 10px 22px -10px var(--c3), inset 0 -4px 8px rgba(0, 0, 0, .12), inset 0 3px 6px rgba(255, 255, 255, .35); }
  .clay::after { content: ''; position: absolute; top: 12%; left: 20%; width: 34%; height: 22%; border-radius: 50%; background: rgba(255, 255, 255, .38); filter: blur(1px); }
  .clay :global(svg) { position: relative; z-index: 1; stroke-width: 2.1; }
  .blue { --c1: #8FB7FF; --c2: #2F6FEB; --c3: #1A47A8; }
  .teal { --c1: #7FE0D5; --c2: #14857C; --c3: #0B5F58; }
  .gold { --c1: #FFE08A; --c2: #E9A92B; --c3: #B07A12; }
  .coral { --c1: #FFB49C; --c2: #E2643F; --c3: #A9381B; }
  .green { --c1: #A6E38C; --c2: #3E9B53; --c3: #276B37; }
  .purple { --c1: #C9B6FF; --c2: #6B4FD8; --c3: #44309A; }
  .navy { --c1: #6F8CC4; --c2: #1E3A66; --c3: #0D1D38; }
</style>
