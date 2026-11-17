<script lang="ts">
  import { tr } from '../../lib/i18n/index.svelte';
  import { href, route } from '../../router.svelte';
  import { startTour } from '../../lib/tour.svelte';
  import { i18n } from '../../lib/i18n/index.svelte';
  import { searchManual, localManual } from '../../lib/content/manual';
  import { VIDEOS, videoUrl, captionUrl, keepForOffline, isKept } from '../../lib/content/videos';
  import { pwa } from '../../lib/pwa.svelte';
  import { music, pause } from '../../lib/audio/player.svelte';
  import Icon from '../../lib/ui/Icon.svelte';

  /** Help: guided tour, ten captioned videos and the searchable manual. #/me/help/<article id> opens one article. */
  let q = $state('');
  // the Malay manual loads only when needed
  let manualMs = $state<import('../../lib/content/manual').ManualTranslation | null>(null);
  $effect(() => { if (i18n.locale === 'ms' && !manualMs) import('../../lib/content/manual.ms').then((m) => (manualMs = m.MANUAL_MS)); });
  const MANUAL = $derived(localManual(i18n.locale === 'ms' ? manualMs : null));
  const hits = $derived(searchManual(q, MANUAL));
  const openId = $derived(route.parts[1] ?? '');
  let playing = $state('');
  let kept = $state<Record<string, boolean>>({});
  let videoErr = $state('');
  $effect(() => { for (const v of VIDEOS) isKept(v.id).then((k) => (kept[v.id] = k)); });
  $effect(() => {
    if (!openId) return;
    queueMicrotask(() => document.getElementById(`a-${openId}`)?.scrollIntoView({ block: 'start' }));
  });
  function play(id: string) {
    videoErr = '';
    if (!kept[id] && !pwa.online) { videoErr = tr('This video has not been saved yet. Connect to the internet once to watch it; after that it works offline.'); return; }
    playing = id;
    if (music.playing) pause();
  }
  async function started(id: string) { if (!kept[id]) kept[id] = await keepForOffline(id); }
  const titleOf = (id: string) => { const v = VIDEOS.find((x) => x.id === id); return v ? (i18n.locale === 'ms' ? v.ms : v.title) : ''; };
  const hl = (text: string) => {
    const ws = q.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!ws.length) return [{ t: text, m: false }];
    return text.split(new RegExp(`(${ws.join('|')})`, 'gi')).map((t, i) => ({ t, m: i % 2 === 1 }));
  };
</script>

<div class="stack">
  <a class="btn btn-text back" href={href('me')}><Icon name="back" size={18} />{tr('Me')}</a>
  <h1>{tr('Help')}</h1>
  <div class="row"><button id="help-tour" class="btn btn-gold" type="button" onclick={startTour}>{tr('Replay the guided tour')}</button></div>

  <section class="stack" aria-labelledby="vid-h">
    <h2 id="vid-h">{tr('Video tutorials')}</h2>
    <p class="muted small">{tr('Each video is 1 to 2 minutes with English and Bahasa Melayu captions. They are not part of the install, so they download when you first play them and then work offline.')}</p>
    {#if playing}
      <div class="card player">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video id="help-video" controls autoplay playsinline preload="metadata" src={videoUrl(playing)} onplay={() => started(playing)} onerror={() => (videoErr = tr('The video could not load. Check your connection and try again.'))}>
          <track kind="captions" srclang="en" label={tr('English')} src={captionUrl(playing, 'en')} default={i18n.locale !== 'ms'} />
          <track kind="captions" srclang="ms" label={tr('Bahasa Melayu')} src={captionUrl(playing, 'ms')} default={i18n.locale === 'ms'} />
        </video>
        <div class="row between"><b>{titleOf(playing)}</b><button class="btn btn-text" type="button" onclick={() => (playing = '')}>{tr('Close video')}</button></div>
      </div>
    {/if}
    {#if videoErr}<p class="warn" role="alert">{videoErr}</p>{/if}
    <div class="vids">
      {#each VIDEOS as v, i}
        <button type="button" class="card raised vid" data-video={v.id} aria-pressed={playing === v.id} onclick={() => play(v.id)}>
          <span class="num" aria-hidden="true">{i + 1}</span>
          <span class="txt"><b>{i18n.locale === 'ms' ? v.ms : v.title}</b><span class="muted small">{tr(v.about)}</span>
            <span class="small {kept[v.id] ? 'ok' : 'muted'}">{kept[v.id] ? tr('✓ Saved for offline') : tr('Downloads when played')}</span></span>
          <span class="playic" aria-hidden="true">▶</span>
        </button>
      {/each}
    </div>
  </section>

  <section class="stack" aria-labelledby="man-h">
    <h2 id="man-h">{tr('Manual')}</h2>
    <label class="search"><Icon name="search" size={18} /><span class="sr-only">{tr('Search the manual')}</span>
      <input id="manual-q" class="input" type="search" bind:value={q} placeholder={tr('Search the manual: PBD, Canva, backup, objectives…')} /></label>

    {#if q.trim()}
      <div class="stack" aria-live="polite">
        <p class="muted small">{hits.length ? tr('{length} result{x}', { length: hits.length, x: hits.length === 1 ? '' : 's' }) : tr('Nothing matches "{q}". Try one word, such as "PIN" or "print".', { q })}</p>
        {#each hits as h (h.article.id)}
          <article class="card stack tight hit">
            <span class="muted small">{h.chapter.title}</span>
            <h3>{#each hl(h.article.title) as part}{#if part.m}<mark>{part.t}</mark>{:else}{part.t}{/if}{/each}</h3>
            {#each h.article.body as p}<p>{#each hl(p) as part}{#if part.m}<mark>{part.t}</mark>{:else}{part.t}{/if}{/each}</p>{/each}
            {#if h.article.steps}<ol>{#each h.article.steps as s}<li>{s}</li>{/each}</ol>{/if}
            {#if h.article.tips}<ul class="tips">{#each h.article.tips as s}<li>{s}</li>{/each}</ul>{/if}
            {#if h.article.video}<button class="btn btn-outline vbtn" type="button" onclick={() => play(h.article.video!)}>{tr('▶ Watch: {x}', { x: titleOf(h.article.video) })}</button>{/if}
          </article>
        {/each}
      </div>
    {:else}
      {#each MANUAL as ch}
        <section class="stack tight">
          <h3 class="ch">{ch.title}</h3>
          {#each ch.articles as a}
            <details class="card" id="a-{a.id}" open={openId === a.id}>
              <summary><b>{a.title}</b></summary>
              <div class="stack tight body">
                {#each a.body as p}<p>{p}</p>{/each}
                {#if a.steps}<ol>{#each a.steps as s}<li>{s}</li>{/each}</ol>{/if}
                {#if a.tips}<ul class="tips">{#each a.tips as s}<li>{s}</li>{/each}</ul>{/if}
                {#if a.video}<button class="btn btn-outline vbtn" type="button" onclick={() => play(a.video!)}>{tr('▶ Watch: {x}', { x: titleOf(a.video) })}</button>{/if}
              </div>
            </details>
          {/each}
        </section>
      {/each}
    {/if}
  </section>
  <p class="muted small">{tr('Still stuck? Tell the developer in the')} <a href={href('me', 'about')}>{tr('Feedback Garden')}</a>{tr('. Read how your data is handled in')} <a href={href('me', 'privacy')}>{tr('Privacy')}</a>.</p>
</div>

<style>
  .back { justify-self: start; }
  h2 { font-size: var(--t-xl); margin: 0; }
  .ch { margin-top: var(--s-2); }
  summary { cursor: pointer; min-height: var(--tap); display: flex; align-items: center; }
  .body { padding-top: var(--s-2); }
  p, li { max-width: 70ch; }
  p { margin: 0; }
  ol, ul { margin: 0; padding-left: 1.4em; display: grid; gap: 4px; }
  .tips li::marker { content: '💡 '; }
  .tight { gap: var(--s-2); }
  .small { font-size: var(--t-sm); }
  .vids { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: var(--s-3); }
  .vid { display: grid; grid-template-columns: auto 1fr auto; gap: var(--s-3); align-items: center; text-align: left; cursor: pointer; font: inherit; color: var(--ink); border: 1px solid var(--line); }
  .vid[aria-pressed='true'] { box-shadow: 0 0 0 2px var(--gold-strong); }
  .num { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--navy); color: var(--on-navy); font-weight: 700; }
  .txt { display: grid; gap: 2px; }
  .playic { color: var(--gold-strong); font-size: 1.2rem; }
  .ok { color: var(--ok); }
  .player { display: grid; gap: var(--s-2); }
  video { width: 100%; max-height: 70vh; border-radius: var(--r-card); background: #000; }
  .between { justify-content: space-between; }
  .search { display: flex; align-items: center; gap: var(--s-2); }
  .search .input { flex: 1; }
  mark { background: color-mix(in srgb, var(--gold) 45%, transparent); color: inherit; border-radius: 3px; padding: 0 2px; }
  .vbtn { justify-self: start; }
  .warn { color: var(--warn, #9a5b00); }
</style>
