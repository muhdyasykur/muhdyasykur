<script lang="ts">
  import { tr } from '../../../lib/i18n/index.svelte';
  /** Noise meter (blueprint F18): reads the microphone level only. Nothing is recorded or stored. */
  let level = $state(0); // 0–100
  let limit = $state(60);
  let mic = $state<'idle' | 'on' | 'denied'>('idle');
  let manual = $state<'green' | 'amber' | 'red'>('green');
  let stream: MediaStream | null = null; let raf = 0; let ctx: AudioContext | null = null;

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      ctx = new AudioContext();
      const an = ctx.createAnalyser(); an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      mic = 'on';
      const loop = () => {
        an.getFloatTimeDomainData(buf);
        const rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length);
        const v = Math.min(100, Math.max(0, (20 * Math.log10(rms + 1e-6) + 60) * 1.8)); // about -60 dB → 0
        level = level * 0.85 + v * 0.15;
        raf = requestAnimationFrame(loop);
      };
      loop();
    } catch { mic = 'denied'; }
  }
  $effect(() => () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); ctx?.close(); });
  const light = $derived(mic === 'on' ? (level >= limit ? 'red' : level >= limit * 0.75 ? 'amber' : 'green') : manual);
  const words = { green: 'Good working voices', amber: 'Getting loud', red: 'Too loud: stop and listen' };
</script>

<div class="tool">
  <div class="lamp {light}" role="img" aria-label={words[light]}></div>
  <p class="msg pupil-font" aria-live="polite">{words[light]}</p>
  {#if mic === 'idle'}
    <button id="noise-start" class="btn btn-gold" type="button" onclick={start}>{tr('Use the microphone')}</button>
    <p class="muted small">{tr('Only the loudness is measured. Nothing is recorded or saved.')}</p>
  {:else if mic === 'on'}
    <div class="meter" aria-hidden="true"><div style="width:{level}%"></div><span style="left:{limit}%"></span></div>
    <label class="field lim"><span>{tr('Too-loud level: {limit}', { limit })}</span><input type="range" min="20" max="95" bind:value={limit} /></label>
  {:else}
    <p class="muted small">{tr('The microphone is not available, so use the lights by hand.')}</p>
  {/if}
  {#if mic !== 'on'}
    <div class="seg" role="group" aria-label={tr('Traffic light')}>
      <button type="button" aria-pressed={manual === 'green'} onclick={() => (manual = 'green')}>{tr('Green')}</button>
      <button type="button" aria-pressed={manual === 'amber'} onclick={() => (manual = 'amber')}>{tr('Amber')}</button>
      <button type="button" aria-pressed={manual === 'red'} onclick={() => (manual = 'red')}>{tr('Red')}</button>
    </div>
  {/if}
</div>

<style>
  .tool { display: grid; gap: var(--s-4); justify-items: center; text-align: center; padding: var(--s-4) 0; }
  .lamp { width: min(40vw, 180px); aspect-ratio: 1; border-radius: 50%; transition: background var(--dur-slow); box-shadow: inset 0 -10px 30px rgba(0,0,0,.2); }
  .lamp.green { background: #2E9E5B; } .lamp.amber { background: #E5A83A; } .lamp.red { background: #D2453D; }
  .msg { font: 700 clamp(1.4rem, 4vw, 2.2rem) var(--f-pupil); }
  .meter { position: relative; width: min(100%, 420px); height: 18px; background: var(--sunken); border-radius: 9px; overflow: hidden; }
  .meter div { height: 100%; background: linear-gradient(90deg, #2E9E5B, #E5A83A 70%, #D2453D); }
  .meter span { position: absolute; top: 0; bottom: 0; width: 3px; background: var(--ink); }
  .lim { width: min(100%, 420px); }

</style>
