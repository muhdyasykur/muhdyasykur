<script lang="ts">
  /** The dashed flight path with a paper plane, beside section titles. Decorative. */
  let { width = 64 }: { width?: number } = $props();
</script>
<svg class="trail" viewBox="0 0 64 22" width={width} height={width * 22 / 64} aria-hidden="true" focusable="false">
  <path d="M2 18c10-1 18-4 26-9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round" opacity=".55" />
  <path d="M32 8 58 2 44 18 41 12z" fill="var(--card)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
  <path d="M41 12 58 2 37 10z" fill="var(--blue-soft)" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
</svg>
<style>.trail { color: var(--blue); flex: 0 0 auto; }</style>
