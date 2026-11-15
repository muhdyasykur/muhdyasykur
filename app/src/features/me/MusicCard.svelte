<script lang="ts">
  import { music, toggle, next, setVolume, play, TRACKS } from '../../lib/audio/player.svelte';
</script>
<div class="stack">
  <p class="muted small">Three original R&B instrumentals composed for Consilia and played live on this device. Off until you press play; pauses by itself in Teach mode.</p>
  <div class="row">
    <button id="music-toggle" class="btn btn-primary" type="button" onclick={toggle} aria-pressed={music.playing}>{music.playing ? '❚❚ Pause' : '▶ Play'}</button>
    <button class="btn btn-outline" type="button" onclick={next}>Next track</button>
    <label class="row vol"><span class="small">Volume</span><input id="music-vol" type="range" min="0" max="1" step="0.05" value={music.volume} oninput={(e) => setVolume(Number(e.currentTarget.value))} /></label>
  </div>
  <ul class="tracks">{#each TRACKS as t, i}<li><button type="button" class:on={music.track === i} onclick={() => play(i)}><b>{t.title}</b><span class="muted small">{t.mood} · {t.bpm} BPM</span></button></li>{/each}</ul>
</div>
<style>
  .small { font-size: var(--t-sm); }
  .vol input { width: 140px; }
  .tracks { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .tracks button { width: 100%; text-align: left; display: grid; gap: 2px; padding: var(--s-2) var(--s-3); border-radius: var(--r-ctl); border: 1px solid var(--line); background: var(--card); color: var(--ink); cursor: pointer; }
  .tracks button.on { border-color: var(--gold-strong); background: var(--gold-soft); }
</style>
