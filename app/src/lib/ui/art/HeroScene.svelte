<script lang="ts">
  /**
   * Consilia's signature illustration, drawn for Consilia: a learning journey rising out of an open book (a school on an
   * island, sea, mountains, a paper plane on a dashed loop, a balloon and a pencil). Decorative; sky colours follow the
   * theme. Original artwork in the spirit of the travel designs the teacher chose.
   */
  let { label = '' }: { label?: string } = $props();
</script>

<svg viewBox="0 0 600 440" class="hero-scene" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'} focusable="false">
  <defs>
    <linearGradient id="hs-sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE08A" /><stop offset="1" stop-color="#F5B83D" /></linearGradient>
    <radialGradient id="hs-glow"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9" /><stop offset="1" stop-color="#FFE9A8" stop-opacity="0" /></radialGradient>
    <linearGradient id="hs-mtn1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FA7D9" /><stop offset="1" stop-color="#C9D6F2" /></linearGradient>
    <linearGradient id="hs-mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E7FC4" /><stop offset="1" stop-color="#A9BEE9" /></linearGradient>
    <linearGradient id="hs-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FC1C9" /><stop offset="1" stop-color="#1B8FA6" /></linearGradient>
    <linearGradient id="hs-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CCB6A" /><stop offset="1" stop-color="#3E9B53" /></linearGradient>
    <linearGradient id="hs-page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#EDE7DA" /></linearGradient>
    <linearGradient id="hs-cover" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#13294B" /><stop offset="1" stop-color="#1E3A66" /></linearGradient>
    <linearGradient id="hs-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E86A4A" /><stop offset="1" stop-color="#C24A2C" /></linearGradient>
    <linearGradient id="hs-plane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#D5E2FA" /></linearGradient>
    <linearGradient id="hs-balloon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F5B83D" /><stop offset=".5" stop-color="#E86A4A" /><stop offset="1" stop-color="#F5B83D" /></linearGradient>
    <filter id="hs-soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#13294B" flood-opacity=".18" /></filter>
  </defs>

  <!-- sun and glow -->
  <circle cx="470" cy="92" r="78" fill="url(#hs-glow)" />
  <circle cx="470" cy="92" r="36" fill="url(#hs-sun)" />
  <!-- clouds -->
  <g fill="#FFFFFF" class="cloud">
    <path d="M70 120c0-14 12-25 27-25 4-15 19-26 36-26 20 0 36 14 38 32 13 1 23 10 23 22 0 12-10 21-23 21H96c-14 0-26-10-26-24z" opacity=".92" />
    <path d="M380 150c0-10 9-18 20-18 3-11 14-19 26-19 15 0 27 10 28 23 9 1 17 8 17 17s-8 16-17 16h-56c-10 0-18-8-18-19z" opacity=".85" />
  </g>
  <!-- birds -->
  <g fill="none" stroke="#13294B" stroke-width="2.2" stroke-linecap="round" opacity=".55">
    <path d="M196 70q6-6 12 0q6-6 12 0" /><path d="M226 92q4-4 8 0q4-4 8 0" />
  </g>
  <!-- mountains -->
  <path d="M110 300 210 168l52 58 46-66 120 140z" fill="url(#hs-mtn1)" />
  <path d="M190 300 300 150l130 150z" fill="url(#hs-mtn2)" />
  <path d="M300 150 278 180l14-4 10 12 12-14 14 4z" fill="#FFFFFF" opacity=".9" />
  <!-- sea -->
  <path d="M70 300c60-14 140-20 230-20s180 6 240 20v40H70z" fill="url(#hs-sea)" />
  <path d="M120 314c20-4 40-4 60 0M260 322c24-5 48-5 72 0M400 312c18-4 36-4 54 0" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6" />
  <!-- island with school and palms -->
  <path d="M206 304c18-34 70-52 120-50 48 2 86 22 98 50z" fill="url(#hs-hill)" />
  <g filter="url(#hs-soft)">
    <rect x="276" y="240" width="74" height="44" rx="4" fill="#FFF8EC" />
    <path d="M268 244 313 216l45 28z" fill="url(#hs-roof)" />
    <rect x="306" y="258" width="14" height="26" rx="2" fill="#13294B" />
    <rect x="284" y="252" width="14" height="12" rx="2" fill="#7FB2F0" /><rect x="328" y="252" width="14" height="12" rx="2" fill="#7FB2F0" />
    <path d="M313 216v-24" stroke="#13294B" stroke-width="2.4" stroke-linecap="round" />
    <path d="M313 192h20l-6 6 6 6h-20z" fill="#E2BC4F" />
  </g>
  <g>
    <path d="M238 296c2-20 6-38 14-54" stroke="#8A5A33" stroke-width="5" stroke-linecap="round" fill="none" />
    <path d="M252 242c-12-8-26-8-34 0 10-2 20 0 30 6M252 242c2-14 12-22 24-22-8 6-14 14-16 24M252 242c14-6 28-2 34 8-10-6-22-6-32-2M252 242c-10 4-16 14-16 26 4-10 10-18 18-22" fill="#3E9B53" stroke="#2F7D40" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M384 296c-2-16-6-30-12-42" stroke="#8A5A33" stroke-width="4.5" stroke-linecap="round" fill="none" />
    <path d="M372 254c10-8 24-8 30 2-8-4-18-4-28 2M372 254c-4-12-14-18-24-16 8 4 14 10 16 18M372 254c-12-2-22 4-24 14 6-8 14-12 22-12" fill="#4FB062" stroke="#2F7D40" stroke-width="1.5" stroke-linejoin="round" />
  </g>
  <!-- open book -->
  <g filter="url(#hs-soft)">
    <path d="M60 330c80-22 160-22 240 6 80-28 160-28 240-6v62c-80-22-160-22-240 6-80-28-160-28-240-6z" fill="url(#hs-cover)" />
    <path d="M72 326c76-20 152-18 228 8v58c-76-26-152-28-228-8z" fill="url(#hs-page)" />
    <path d="M528 326c-76-20-152-18-228 8v58c76-26 152-28 228-8z" fill="url(#hs-page)" />
    <path d="M300 334v58" stroke="#C9BFA9" stroke-width="2" />
    <g stroke="#C9D3E6" stroke-width="3" stroke-linecap="round" fill="none"><path d="M100 344c50-12 100-10 170 6M100 360c50-12 100-10 170 6M330 350c60-14 120-14 170-4M330 366c60-14 120-14 170-4" /></g>
  </g>
  <!-- pencil -->
  <g transform="rotate(-28 520 300)">
    <rect x="470" y="292" width="110" height="18" rx="3" fill="#F5B83D" />
    <rect x="470" y="292" width="110" height="6" rx="3" fill="#FFD36B" />
    <rect x="566" y="292" width="20" height="18" rx="3" fill="#E98AA0" />
    <rect x="560" y="292" width="8" height="18" fill="#B9C2D3" />
    <path d="M470 292l-22 9 22 9z" fill="#F2D3A2" /><path d="M454 299.5l-6 1.5 6 1.5z" fill="#13294B" />
  </g>
  <!-- paper plane and its dashed loop -->
  <path d="M40 210c40-40 90-60 120-40 24 16 6 44-16 34-22-10-8-48 34-66 34-14 74-12 108-2" fill="none" stroke="#13294B" stroke-width="2.4" stroke-dasharray="7 8" stroke-linecap="round" opacity=".45" />
  <g transform="translate(286 108) rotate(-14)" filter="url(#hs-soft)">
    <path d="M0 20 62 0 30 44 24 28z" fill="url(#hs-plane)" stroke="#1E3A66" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M24 28 62 0 18 24z" fill="#BFD2F6" stroke="#1E3A66" stroke-width="1.6" stroke-linejoin="round" />
  </g>
  <!-- hot-air balloon -->
  <g transform="translate(520 150)">
    <path d="M0 0c-22 0-36 16-36 34 0 20 22 36 30 46h12c8-10 30-26 30-46C36 16 22 0 0 0z" fill="url(#hs-balloon)" />
    <path d="M0 0c-8 10-10 50-6 80M0 0c8 10 10 50 6 80" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".7" />
    <path d="M-6 80l2 10M6 80l-2 10" stroke="#8A5A33" stroke-width="1.6" />
    <rect x="-7" y="90" width="14" height="10" rx="2" fill="#8A5A33" />
  </g>
</svg>

<style>
  .hero-scene { width: 100%; height: auto; overflow: visible; }
  @media (prefers-reduced-motion: no-preference) {
    .hero-scene .cloud { animation: drift 14s ease-in-out infinite alternate; }
    @keyframes drift { from { transform: translateX(-6px); } to { transform: translateX(10px); } }
  }
</style>
