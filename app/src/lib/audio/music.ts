import { TRACKS, barEvents, barLength, freq, type NoteEvent, type Track } from './tracks';

/**
 * Small Web Audio synthesiser and look-ahead scheduler for the background music.
 * Electric piano: sine fundamental + soft overtone + a short FM "tine" at the attack, with tremolo.
 * Bass: triangle and sine sub through a low-pass. Drums: synthesised kick, finger-snap and hats.
 */
export class Music {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: GainNode;
  private verb!: ConvolverNode;
  private noise!: AudioBuffer;
  private timer: ReturnType<typeof setInterval> | null = null;
  private bar = 0; private barStart = 0; private track: Track = TRACKS[0];
  volume = 0.5;

  private init(given?: BaseAudioContext) {
    if (this.ctx) return;
    const ctx = (given ?? new AudioContext()) as AudioContext;
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    const warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 9000;
    this.bus = ctx.createGain(); this.bus.gain.value = 0.55;
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(2.4);
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    this.bus.connect(warm); this.bus.connect(this.verb); this.verb.connect(wet); wet.connect(warm);
    warm.connect(comp).connect(this.master).connect(ctx.destination);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  private impulse(sec: number) {
    const c = this.ctx!, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3; }
    return b;
  }
  /** Render a track into an OfflineAudioContext (used to make preview recordings). */
  renderInto(ctx: OfflineAudioContext, track: Track, seconds: number) {
    this.init(ctx); this.track = track; this.bar = 0; this.barStart = 0.05;
    this.master.gain.value = this.volume * 1.2;
    while (this.barStart < seconds) { for (const e of barEvents(track, this.bar)) this.voice(e, this.barStart + e.time); this.barStart += barLength(track); this.bar++; }
  }
  get playing() { return !!this.timer; }
  get current() { return this.track; }

  async play(track: Track = this.track) {
    this.init();
    const c = this.ctx!;
    if (c.state === 'suspended') await c.resume();
    this.stopScheduler();
    this.track = track; this.bar = 0; this.barStart = c.currentTime + 0.12;
    this.master.gain.cancelScheduledValues(c.currentTime);
    this.master.gain.setTargetAtTime(this.volume * 1.2, c.currentTime, 0.4); // gentle fade-in
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }
  stop() {
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    this.stopScheduler();
  }
  setVolume(v: number) { this.volume = v; if (this.ctx && this.timer) this.master.gain.setTargetAtTime(v * 1.2, this.ctx.currentTime, 0.1); }
  private stopScheduler() { if (this.timer) clearInterval(this.timer); this.timer = null; }

  private schedule() {
    const c = this.ctx!;
    while (this.barStart < c.currentTime + 0.25) {
      for (const e of barEvents(this.track, this.bar)) this.voice(e, this.barStart + e.time);
      this.barStart += barLength(this.track); this.bar++;
    }
  }
  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  private voice(e: NoteEvent, t: number) {
    const c = this.ctx!;
    if (e.voice === 'ep' || e.voice === 'lead') {
      const f = freq(e.midi!);
      const g = c.createGain(); g.connect(this.bus);
      const trem = c.createGain(); trem.gain.value = 1; trem.connect(g);
      const lfo = c.createOscillator(); lfo.frequency.value = 4.2; const ld = c.createGain(); ld.gain.value = 0.18; lfo.connect(ld).connect(trem.gain);
      const o1 = c.createOscillator(); o1.frequency.value = f;
      const o2 = c.createOscillator(); o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.12;
      const mod = c.createOscillator(); mod.frequency.value = f * 14; const mg = c.createGain();
      mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.08);
      mod.connect(mg).connect(o1.frequency);
      o1.connect(trem); o2.connect(g2).connect(trem);
      const len = e.voice === 'lead' ? Math.max(0.3, e.dur) : Math.min(2.2, e.dur + 1.2);
      this.env(g, t, (e.voice === 'lead' ? 0.16 : 0.07) * e.vel, 0.008, len);
      for (const o of [o1, o2, mod, lfo]) { o.start(t); o.stop(t + len + 0.1); }
    } else if (e.voice === 'bass') {
      const g = c.createGain(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = freq(e.midi!);
      const sub = c.createOscillator(); sub.frequency.value = freq(e.midi!);
      o.connect(lp); sub.connect(lp); lp.connect(g).connect(this.bus);
      this.env(g, t, 0.32 * e.vel, 0.01, Math.max(0.2, e.dur * 0.95));
      for (const x of [o, sub]) { x.start(t); x.stop(t + e.dur + 0.3); }
    } else if (e.voice === 'kick') {
      const o = c.createOscillator(); const g = c.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      o.connect(g).connect(this.bus); this.env(g, t, 0.55 * e.vel, 0.004, 0.32);
      o.start(t); o.stop(t + 0.45);
    } else {
      const s = c.createBufferSource(); s.buffer = this.noise;
      const f = c.createBiquadFilter(); const g = c.createGain();
      if (e.voice === 'snap') { f.type = 'bandpass'; f.frequency.value = 2100; f.Q.value = 1.4; this.env(g, t, 0.28 * e.vel, 0.002, 0.12); }
      else { f.type = 'highpass'; f.frequency.value = 7500; this.env(g, t, 0.12 * e.vel, 0.001, e.voice === 'hatOpen' ? 0.22 : 0.04); }
      s.connect(f).connect(g).connect(this.bus); s.start(t); s.stop(t + 0.3);
    }
  }
}
