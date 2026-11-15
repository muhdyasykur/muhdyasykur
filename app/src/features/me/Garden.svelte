<script lang="ts">
  import { db, type FeedbackItem } from '../../lib/db/schema';
  import { MOODS, KINDS, IDEAS, DAILY_LIMIT, plant, flush, sentToday } from '../../lib/feedback';
  import { pwa } from '../../lib/pwa.svelte';

  /** Feedback Garden: every piece of feedback plants a flower; the flower depends on the mood. */
  let items = $state<FeedbackItem[]>([]);
  let mood = $state(''); let kind = $state<string>('Idea'); let text = $state(''); let votes = $state<string[]>([]); let name = $state('');
  let fresh = $state(''); let msg = $state('');
  async function load() { items = (await db.feedbackQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt); }
  $effect(() => { load(); });
  function vote(v: string) { votes = votes.includes(v) ? votes.filter((x) => x !== v) : votes.length < 3 ? [...votes, v] : votes; }
  async function send() {
    if (!mood || !text.trim()) return;
    if (sentToday(items) >= DAILY_LIMIT) { msg = `You have planted ${DAILY_LIMIT} flowers today. Come back tomorrow!`; return; }
    const it = await plant({ mood, kind, text, votes: [...votes], name });
    fresh = it.id; text = ''; votes = []; mood = '';
    const n = await flush(__APP_VERSION__);
    msg = n ? 'Planted and sent. Thank you!' : pwa.online ? 'Planted. It will be sent shortly.' : 'Planted. You are offline, so it will be sent when you are back online.';
    await load();
  }
  const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const flowerOf = (m: string) => MOODS.find((x) => x.id === m)?.flower ?? 'sprout';
  const spots = $derived(items.map((it, i) => { const h = hash(it.id); return { it, x: 6 + ((h % 880) / 10) % 88, h: 34 + (h % 22), d: i * 0.04 }; }));
</script>

<section class="stack">
  <div class="bed" aria-label="{items.length} flowers in your garden">
    <svg viewBox="0 0 100 60" preserveAspectRatio="none" class="sky" aria-hidden="true"><rect width="100" height="60" fill="var(--sky)" /><path d="M0 52 Q25 46 50 50 T100 48 V60 H0Z" fill="var(--soil)" /></svg>
    <span class="sun" aria-hidden="true"></span>
    {#each spots as s (s.it.id)}
      <svg class="flower {flowerOf(s.it.mood)}" class:grow={s.it.id === fresh} style="left:{s.x}%;height:{s.h}%;animation-delay:{s.d}s" viewBox="0 0 40 80" aria-hidden="true">
        <path class="stem" d="M20 80 Q18 60 20 34" />
        <path class="leaf" d="M20 62 Q8 56 6 48 Q16 50 20 58Z" />
        <g class="head">
          {#if flowerOf(s.it.mood) === 'sunflower'}{#each Array(10) as _, i}<ellipse cx="20" cy="18" rx="3.4" ry="9" fill="#F2C230" transform="rotate({i * 36} 20 26) translate(0 -4)" />{/each}<circle cx="20" cy="26" r="6" fill="#7A4B1C" />
          {:else if flowerOf(s.it.mood) === 'bungaraya'}{#each Array(5) as _, i}<path d="M20 26 C12 16 14 8 20 6 C26 8 28 16 20 26Z" fill="#D7263D" transform="rotate({i * 72} 20 26)" />{/each}<path d="M20 26 L28 12" stroke="#F4D35E" stroke-width="1.6" /><circle cx="28" cy="12" r="1.8" fill="#F4D35E" />
          {:else if flowerOf(s.it.mood) === 'orchid'}{#each Array(5) as _, i}<ellipse cx="20" cy="18" rx="4.5" ry="8" fill="#B07CD8" transform="rotate({i * 72} 20 26)" />{/each}<circle cx="20" cy="26" r="3.5" fill="#F7E1FF" />
          {:else}<path d="M20 34 Q10 24 8 16 Q18 18 20 30Z M20 34 Q30 24 32 16 Q22 18 20 30Z" fill="#5BAA5F" />{/if}
        </g>
      </svg>
    {/each}
    {#if !items.length}<p class="first">Your garden is waiting for its first flower.</p>{/if}
  </div>

  <div class="card stack">
    <h3>Plant your feedback</h3>
    <div class="moods" role="radiogroup" aria-label="How do you feel about Consilia?">
      {#each MOODS as m}<button type="button" role="radio" aria-checked={mood === m.id} onclick={() => (mood = m.id)} data-mood={m.id}><span>{m.icon}</span>{m.label}</button>{/each}
    </div>
    <div class="seg" role="group" aria-label="Type">{#each KINDS as k}<button type="button" aria-pressed={kind === k} onclick={() => (kind = k)}>{k}</button>{/each}</div>
    <label class="field"><span>Your message</span><textarea id="fg-text" class="input ta" rows="3" bind:value={text} placeholder="What helped, what was hard, what should come next?"></textarea></label>
    <div class="stack tight"><span class="lbl">Vote for up to 3 ideas</span>
      <div class="row">{#each IDEAS as v}<button type="button" class="chip vote" aria-pressed={votes.includes(v)} onclick={() => vote(v)}>{v}</button>{/each}</div>
    </div>
    <label class="field"><span>Your name (optional)</span><input id="fg-name" class="input" bind:value={name} /></label>
    <div class="row"><button id="fg-send" class="btn btn-gold" type="button" disabled={!mood || !text.trim()} onclick={send}>Plant it</button>{#if msg}<span class="muted small" role="status">{msg}</span>{/if}</div>
    <p class="muted small">Sent to the developer's feedback form on Jotform with your mood, message, votes, the app version and your name if you give it. Nothing about your pupils or lessons is sent.</p>
  </div>
</section>

<style>
  .bed { --sky: #DCEBFA; --soil: #6B4F2A; position: relative; height: 220px; border-radius: var(--r-card); overflow: hidden; }
  :global([data-theme='dark']) .bed { --sky: #1A2D4F; --soil: #3E2E1A; }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .bed { --sky: #1A2D4F; --soil: #3E2E1A; } }
  .sky { position: absolute; inset: 0; width: 100%; height: 100%; }
  .sun { position: absolute; top: 14px; right: 9%; width: 44px; aspect-ratio: 1; border-radius: 50%; background: #F6D776; opacity: .85; box-shadow: 0 0 24px 6px rgb(246 215 118 / .45); }
  .flower { position: absolute; bottom: 9%; width: auto; transform: translateX(-50%); overflow: visible; }
  .stem { fill: none; stroke: #3F8A43; stroke-width: 2.4; }
  .leaf { fill: #4E9B52; }
  .grow .stem, .grow .leaf { transform-origin: 20px 80px; animation: up .9s ease-out both; }
  .grow .head { transform-origin: 20px 26px; animation: bloom .6s .8s cubic-bezier(.3,1.6,.5,1) both; }
  @keyframes up { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes bloom { from { transform: scale(0); } to { transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .grow .stem, .grow .leaf, .grow .head { animation: none; } }
  .first { position: absolute; inset: 0; display: grid; place-items: center; color: var(--ink-2); font-weight: 600; }
  .moods { display: flex; gap: var(--s-2); flex-wrap: wrap; }
  .moods button { display: grid; justify-items: center; gap: 2px; min-width: 76px; padding: var(--s-2); border-radius: var(--r-card); border: 1px solid var(--line); background: var(--card); cursor: pointer; font: 600 var(--t-xs) var(--f-body); color: var(--ink-2); }
  .moods button span { font-size: 1.8rem; }
  .moods button[aria-checked='true'] { border-color: var(--gold-strong); box-shadow: 0 0 0 2px var(--gold-strong); color: var(--ink); }
  .ta { min-height: 80px; padding: var(--s-2) var(--s-3); }
  .tight { gap: 6px; }
  .lbl { font-weight: 600; font-size: var(--t-sm); }
  .vote { cursor: pointer; }
  .vote[aria-pressed='true'] { background: var(--navy); color: var(--on-navy); border-color: var(--navy); }
  .small { font-size: var(--t-sm); }
</style>
