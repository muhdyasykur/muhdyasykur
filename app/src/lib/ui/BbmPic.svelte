<script lang="ts">
  import { BBM_PICS } from '../recommend/bbm';
  /** Original picture of a teaching aid (static SVG from Consilia's own code). */
  let { id, label, size = 120 }: { id: string; label: string; size?: number } = $props();
</script>
<svg class="pic" viewBox="0 0 120 90" width={size} height={size * 0.75} role="img" aria-label={label}>
  <rect width="120" height="90" rx="10" fill="#F4F1EA" />
  {@html BBM_PICS[id] ?? ''}
</svg>
<style>.pic { display: block; flex: none; border-radius: 10px; }</style>
