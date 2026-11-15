<script lang="ts">
  let { size = 40, animate = false }: { size?: number; animate?: boolean } = $props();
</script>
<svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label="Consilia" class:animate>
  <rect width="160" height="160" rx="36" class="bg" />
  <path d="M112 52 A44 44 0 1 0 112 108" fill="none" class="c" stroke-width="11" stroke-linecap="round" />
  <path d="M58 70 Q70 63 80 70 Q90 63 102 70 L102 100 Q90 93 80 100 Q70 93 58 100 Z" class="book" />
  <path d="M80 70 L80 100" class="spine" stroke-width="2" />
  <path class="star" d="M112 20 l4.5 10 10 4.5 -10 4.5 -4.5 10 -4.5 -10 -10 -4.5 10 -4.5z" />
</svg>
<style>
  .bg { fill: var(--brand-bg); }
  .c { stroke: var(--gold-strong); }
  .book { fill: #fff; }
  .spine { stroke: var(--brand-bg); }
  .star { fill: var(--gold-strong); transform-origin: 112px 34.5px; }
  @media (prefers-reduced-motion: no-preference) {
    .animate .star { animation: twinkle 3.2s ease-in-out infinite; }
    @keyframes twinkle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2) rotate(12deg); } }
  }
</style>
