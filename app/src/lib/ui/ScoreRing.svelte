<script lang="ts">
  /** Alignment score ring: amber below 80, green from 80. */
  let { score, size = 56, label = 'Alignment score' }: { score: number; size?: number; label?: string } = $props();
  const r = 15.9155; // circumference 100
  const tone = $derived(score >= 80 ? 'ok' : score >= 50 ? 'warn' : 'bad');
</script>
<svg class="ring {tone}" viewBox="0 0 36 36" width={size} height={size} role="img" aria-label="{label}: {score} out of 100">
  <circle cx="18" cy="18" r={r} class="track" />
  <circle cx="18" cy="18" r={r} class="val" stroke-dasharray="{score} 100" />
  <text x="18" y="18" dy="0.35em" text-anchor="middle">{score}</text>
</svg>
<style>
  .ring { flex: none; }
  circle { fill: none; stroke-width: 3.2; }
  .track { stroke: var(--line); }
  .val { stroke-linecap: round; transform: rotate(-90deg); transform-origin: 18px 18px; transition: stroke-dasharray var(--dur-slow) ease-out, stroke var(--dur-slow); }
  .ok .val { stroke: var(--ok); } .warn .val { stroke: var(--warn); } .bad .val { stroke: var(--bad); }
  text { font: 800 10px var(--f-display); fill: var(--ink); }
</style>
