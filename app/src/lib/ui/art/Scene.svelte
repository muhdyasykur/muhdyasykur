<script lang="ts" module>
  export type SceneName = 'plan' | 'create' | 'assess' | 'support' | 'classroom' | 'fun' | 'write';
</script>
<script lang="ts">
  /**
   * Small illustrations for each kind of tool, drawn for Consilia in a soft "clay" style (gradients, a highlight and a
   * ground shadow). Decorative. The round backdrop follows the theme through --scene-blob.
   */
  let { name }: { name: SceneName } = $props();
  const uid = Math.random().toString(36).slice(2, 7);
</script>

<svg viewBox="0 0 240 160" class="scene" aria-hidden="true" focusable="false">
  <defs>
    <filter id="sc-sh-{uid}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#13294B" flood-opacity=".2" /></filter>
    <linearGradient id="sc-gold-{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE08A" /><stop offset="1" stop-color="#E9A92B" /></linearGradient>
    <linearGradient id="sc-coral-{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F59A7C" /><stop offset="1" stop-color="#D9512E" /></linearGradient>
    <linearGradient id="sc-blue-{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9CC2FF" /><stop offset="1" stop-color="#1D5BD8" /></linearGradient>
    <linearGradient id="sc-teal-{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FE0D5" /><stop offset="1" stop-color="#0F766E" /></linearGradient>
    <linearGradient id="sc-green-{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BDB7E" /><stop offset="1" stop-color="#3E9B53" /></linearGradient>
  </defs>
  <circle cx="120" cy="78" r="64" fill="var(--scene-blob, #EEF4FF)" />
  <ellipse cx="120" cy="142" rx="74" ry="7" fill="#13294B" opacity=".12" />

  {#if name === 'plan'}
    <g filter="url(#sc-sh-{uid})">
      <rect x="80" y="30" width="86" height="104" rx="10" fill="#FFFFFF" />
      <rect x="80" y="30" width="86" height="16" rx="8" fill="#1D5BD8" />
      {#each [52, 72, 92, 112] as y, i}
        <rect x="94" y={y} width="12" height="12" rx="3" fill={i < 3 ? '#3E9B53' : '#FFFFFF'} stroke={i < 3 ? 'none' : '#B9C2D3'} stroke-width="2" />
        {#if i < 3}<path d="M97 {y + 6.5}l2.5 2.5 4.5-5" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />{/if}
        <path d="M114 {y + 6}h{i === 3 ? 28 : 38}" stroke="#C9D3E6" stroke-width="4" stroke-linecap="round" />
      {/each}
    </g>
    <g filter="url(#sc-sh-{uid})"><circle cx="64" cy="50" r="20" fill="url(#sc-gold-{uid})" /><circle cx="64" cy="50" r="14" fill="#FFFFFF" /><path d="M64 42v8l6 4" stroke="#13294B" stroke-width="2.4" fill="none" stroke-linecap="round" /></g>
    <g transform="rotate(38 172 98)"><rect x="150" y="92" width="64" height="12" rx="3" fill="url(#sc-coral-{uid})" /><rect x="206" y="92" width="10" height="12" rx="2" fill="#B9C2D3" /><path d="M150 92l-12 6 12 6z" fill="#F2D3A2" /></g>
  {:else if name === 'create'}
    <g filter="url(#sc-sh-{uid})">
      <rect x="72" y="40" width="70" height="86" rx="8" fill="url(#sc-blue-{uid})" transform="rotate(-14 107 83)" />
      <rect x="92" y="34" width="70" height="86" rx="8" fill="url(#sc-gold-{uid})" transform="rotate(4 127 77)" />
      <rect x="108" y="40" width="70" height="86" rx="8" fill="#FFFFFF" transform="rotate(14 143 83)" />
    </g>
    <g transform="rotate(14 143 83)"><path d="M122 62h40M122 76h30M122 90h36" stroke="#C9D3E6" stroke-width="4" stroke-linecap="round" /></g>
    <g fill="none" stroke="#13294B" stroke-width="3.5" stroke-linecap="round"><circle cx="70" cy="122" r="9" /><circle cx="92" cy="128" r="9" /><path d="M76 115l40-34M99 121l12-36" stroke="#8B95A8" /></g>
    <g fill="url(#sc-gold-{uid})"><path d="M186 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" /><path d="M58 48l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" /></g>
  {:else if name === 'assess'}
    <g filter="url(#sc-sh-{uid})">
      <rect x="76" y="30" width="84" height="106" rx="10" fill="#B07A4C" />
      <rect x="84" y="40" width="68" height="88" rx="6" fill="#FFFFFF" />
      <rect x="100" y="24" width="36" height="14" rx="5" fill="#13294B" />
      {#each [54, 76, 98] as y}
        <circle cx="98" cy={y} r="7" fill="#3E9B53" /><path d="M95 {y}l2.4 2.4 4-4.4" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M110 {y}h32" stroke="#C9D3E6" stroke-width="4" stroke-linecap="round" />
      {/each}
    </g>
    <g filter="url(#sc-sh-{uid})">
      <path d="M160 78l-8 26h12l6-14z" fill="#1D5BD8" /><path d="M184 78l8 26h-12l-6-14z" fill="#D9512E" />
      <circle cx="172" cy="108" r="20" fill="url(#sc-gold-{uid})" /><path d="M172 97l3.4 7 7.6 1-5.5 5.2 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.2 7.6-1z" fill="#FFFFFF" opacity=".9" />
    </g>
  {:else if name === 'support'}
    <g filter="url(#sc-sh-{uid})">
      <rect x="62" y="104" width="40" height="32" rx="6" fill="url(#sc-teal-{uid})" />
      <rect x="100" y="80" width="40" height="56" rx="6" fill="url(#sc-teal-{uid})" opacity=".85" />
      <rect x="138" y="56" width="40" height="80" rx="6" fill="url(#sc-teal-{uid})" opacity=".7" />
    </g>
    <g filter="url(#sc-sh-{uid})"><path d="M158 52c-4-10-20-10-20 2 0 10 20 20 20 20s20-10 20-20c0-12-16-12-20-2z" fill="url(#sc-coral-{uid})" /></g>
    <circle cx="82" cy="92" r="9" fill="#F5C9A0" /><path d="M72 104c2-6 6-8 10-8s8 2 10 8" fill="#1D5BD8" />
    <circle cx="120" cy="68" r="9" fill="#C98E62" /><path d="M110 80c2-6 6-8 10-8s8 2 10 8" fill="#E9A92B" />
  {:else if name === 'classroom'}
    <g filter="url(#sc-sh-{uid})">
      <path d="M84 112l-12 30M156 112l12 30" stroke="#8A5A33" stroke-width="5" stroke-linecap="round" />
      <rect x="58" y="28" width="124" height="86" rx="8" fill="#B07A4C" />
      <rect x="66" y="36" width="108" height="70" rx="4" fill="#2F6B4F" />
    </g>
    <text x="80" y="80" fill="#FFFFFF" font-family="Andika, sans-serif" font-size="26" font-weight="700" opacity=".92">ABC</text>
    <path d="M140 70c4 6 12 6 16 0M142 60h.01M154 60h.01" stroke="#F5C9A0" stroke-width="3" fill="none" stroke-linecap="round" />
    <path d="M80 92h70" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="5 5" opacity=".55" />
    <rect x="98" y="106" width="22" height="5" rx="2" fill="#FFFFFF" />
  {:else if name === 'fun'}
    {#each [[84, 58, 'coral'], [120, 44, 'gold'], [156, 60, 'blue']] as [x, y, c]}
      <path d="M{x} {Number(y) + 34}q-6 20 4 40" stroke="#8B95A8" stroke-width="1.8" fill="none" />
      <g filter="url(#sc-sh-{uid})"><ellipse cx={x} cy={y} rx="18" ry="22" fill="url(#sc-{c}-{uid})" /><path d="M{Number(x) - 4} {Number(y) + 22}h8l-4 6z" fill="#8B95A8" /></g>
      <ellipse cx={Number(x) - 6} cy={Number(y) - 8} rx="5" ry="7" fill="#FFFFFF" opacity=".45" />
    {/each}
    <g fill="#13294B"><circle cx="58" cy="118" r="6" /><path d="M63 118V92l12 4v8l-10-3" stroke="#13294B" stroke-width="3" fill="none" stroke-linejoin="round" /><circle cx="186" cy="112" r="5" /><path d="M190 112V92" stroke="#13294B" stroke-width="3" /></g>
    {#each [[70, 30, 20, '#E9A92B'], [176, 34, -20, '#3E9B53'], [196, 82, 40, '#D9512E'], [44, 84, -30, '#1D5BD8']] as [x, y, r, c]}<rect x={x} y={y} width="10" height="5" rx="1.5" fill={String(c)} transform="rotate({r} {x} {y})" />{/each}
  {:else}
    <path d="M44 98c22-26 48-36 66-24 16 10 4 28-10 20-14-8-2-30 26-40" stroke="#13294B" stroke-width="2" stroke-dasharray="6 6" fill="none" opacity=".45" stroke-linecap="round" />
    <g filter="url(#sc-sh-{uid})">
      <rect x="64" y="70" width="112" height="66" rx="8" fill="#FFFFFF" />
      <path d="M64 78l56 34 56-34" stroke="#C9D3E6" stroke-width="3" fill="none" stroke-linejoin="round" />
      <rect x="80" y="52" width="80" height="44" rx="4" fill="#FFF8EC" />
      <path d="M90 64h56M90 76h40" stroke="#C9D3E6" stroke-width="3.5" stroke-linecap="round" />
    </g>
    <g transform="translate(150 22) rotate(-12)" filter="url(#sc-sh-{uid})">
      <path d="M0 14 44 0 21 31 17 20z" fill="#FFFFFF" stroke="#1D5BD8" stroke-width="1.6" stroke-linejoin="round" />
      <path d="M17 20 44 0 12 17z" fill="#BFD2F6" stroke="#1D5BD8" stroke-width="1.6" stroke-linejoin="round" />
    </g>
  {/if}
</svg>

<style>
  .scene { width: 100%; height: auto; }
</style>
