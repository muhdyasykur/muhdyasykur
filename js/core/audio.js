/* PunctuAction — audio: Recorder (mic -> 16 kHz WAV), Analyse (pauses, pitch contour, intonation, expression),
   Disguise (privacy voice changer that keeps timing & intonation shape). All processing happens on the device. */
(function () {
  const PA = (window.PA = window.PA || {});
  const SR = 16000;

  /* ===================== WAV helpers ===================== */
  function encodeWav(samples, sr = SR) {
    const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    return new Blob([buf], { type: "audio/wav" });
  }
  function downsample(chunks, inRate) {
    let len = 0; chunks.forEach((c) => (len += c.length));
    const all = new Float32Array(len); let o = 0; chunks.forEach((c) => { all.set(c, o); o += c.length; });
    if (inRate === SR) return all;
    const ratio = inRate / SR, outLen = Math.floor(len / ratio), out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const a = Math.floor(i * ratio), b = Math.min(len, Math.floor((i + 1) * ratio)); let s = 0;
      for (let j = a; j < b; j++) s += all[j];
      out[i] = s / Math.max(1, b - a);
    }
    return out;
  }

  /* ===================== Recorder ===================== */
  const Recorder = {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)),
    active: false,
    async start({ onLevel, maxSec = 30, onAutoStop } = {}) {
      if (this.active) await this.cancel();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      const C = window.AudioContext || window.webkitAudioContext;
      const ctx = new C();
      if (ctx.state === "suspended") await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const chunks = [];
      proc.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      src.connect(proc); proc.connect(ctx.destination);
      const td = new Float32Array(analyser.fftSize);
      let raf = 0;
      const t0 = performance.now();
      const loop = () => {
        analyser.getFloatTimeDomainData(td);
        let s = 0; for (let i = 0; i < td.length; i++) s += td[i] * td[i];
        const rms = Math.sqrt(s / td.length);
        let f0 = 0;
        if (rms > 0.01) f0 = yin(td.subarray(0, 1600), ctx.sampleRate, 75, 600, 0.2, 4);
        onLevel && onLevel({ rms, f0, t: (performance.now() - t0) / 1000 });
        raf = requestAnimationFrame(loop);
      };
      loop();
      this._s = { stream, ctx, src, proc, analyser, chunks, raf: () => cancelAnimationFrame(raf), timer: setTimeout(async () => { if (this.active) { const r = await this.stop(); onAutoStop && onAutoStop(r); } }, maxSec * 1000) };
      this.active = true;
      return analyser;
    },
    async stop() {
      const s = this._s; if (!s) return null;
      this.active = false; clearTimeout(s.timer); s.raf();
      await PA.sleep(120);
      try { s.proc.disconnect(); s.src.disconnect(); } catch (e) {}
      s.stream.getTracks().forEach((t) => t.stop());
      const samples = downsample(s.chunks, s.ctx.sampleRate);
      try { s.ctx.close(); } catch (e) {}
      this._s = null;
      // trim leading 80 ms (click) and normalise gently
      const trimmed = samples.subarray(Math.min(samples.length, Math.floor(SR * 0.08)));
      let peak = 0; for (let i = 0; i < trimmed.length; i++) peak = Math.max(peak, Math.abs(trimmed[i]));
      const g = peak > 0.02 ? Math.min(4, 0.9 / peak) : 1;
      const out = new Float32Array(trimmed.length); for (let i = 0; i < out.length; i++) out[i] = trimmed[i] * g;
      return { samples: out, sr: SR, duration: out.length / SR, wav: encodeWav(out) };
    },
    async cancel() { const s = this._s; if (!s) return; this.active = false; clearTimeout(s.timer); s.raf(); s.stream.getTracks().forEach((t) => t.stop()); try { s.ctx.close(); } catch (e) {} this._s = null; }
  };

  /* ===================== Pitch (YIN) ===================== */
  function yin(buf, sr, fmin = 70, fmax = 500, thresh = 0.15, step = 1) {
    const maxLag = Math.floor(sr / fmin), minLag = Math.floor(sr / fmax);
    const W = buf.length - maxLag; if (W < 64) return 0;
    const d = new Float32Array(maxLag + 2);
    for (let tau = 1; tau <= maxLag; tau++) { let s = 0; for (let i = 0; i < W; i += step) { const x = buf[i] - buf[i + tau]; s += x * x; } d[tau] = s; }
    let run = 0; d[0] = 1;
    for (let tau = 1; tau <= maxLag; tau++) { run += d[tau]; d[tau] = run ? (d[tau] * tau) / run : 1; }
    for (let tau = minLag; tau < maxLag; tau++) {
      if (d[tau] < thresh) {
        while (tau + 1 < maxLag && d[tau + 1] < d[tau]) tau++;
        const a = d[tau - 1], b = d[tau], c = d[tau + 1]; const den = a + c - 2 * b;
        const better = den ? tau + (a - c) / (2 * den) : tau;
        return sr / better;
      }
    }
    return 0;
  }
  const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

  /* ===================== Analyse ===================== */
  const Analyse = {
    async decode(blob) {
      const ab = await blob.arrayBuffer();
      const O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const oac = new O(1, SR, SR);
      const buf = await oac.decodeAudioData(ab);
      if (buf.numberOfChannels === 1) return { samples: buf.getChannelData(0), sr: buf.sampleRate };
      const a = buf.getChannelData(0), b = buf.getChannelData(1), m = new Float32Array(a.length);
      for (let i = 0; i < a.length; i++) m[i] = (a[i] + b[i]) / 2;
      return { samples: m, sr: buf.sampleRate };
    },
    run(samples, sr = SR) {
      const hop = Math.round(sr * 0.01), win = Math.round(sr * 0.025) + Math.floor(sr / 70);
      const frames = [];
      for (let i = 0; i + win < samples.length; i += hop) {
        let s = 0; const fr = samples.subarray(i, i + win);
        for (let j = 0; j < fr.length; j += 2) s += fr[j] * fr[j];
        frames.push({ t: i / sr, rms: Math.sqrt(s / (fr.length / 2)), f0: 0, i });
      }
      if (!frames.length) return { empty: true, duration: samples.length / sr };
      const rmsList = frames.map((f) => f.rms);
      const peak = Math.max(...rmsList), noise = pct(rmsList, 0.1);
      const thr = Math.max(noise * 3, peak * 0.09, 0.006);
      frames.forEach((f) => { f.voiced = f.rms > thr; if (f.voiced) f.f0 = yin(samples.subarray(f.i, f.i + win), sr, 70, 520, 0.18); });
      const vf = frames.filter((f) => f.voiced);
      if (vf.length < 15) return { empty: true, duration: samples.length / sr, peak };
      const start = vf[0].t, end = vf[vf.length - 1].t;
      // pauses inside speech
      const pauses = []; let gapStart = null;
      for (const f of frames) {
        if (f.t < start || f.t > end) continue;
        if (!f.voiced) { if (gapStart == null) gapStart = f.t; }
        else if (gapStart != null) { const dur = f.t - gapStart; if (dur >= 0.18) pauses.push({ start: gapStart, end: f.t, dur }); gapStart = null; }
      }
      // pitch in semitones relative to speaker median
      const f0s = frames.filter((f) => f.f0 > 0).map((f) => f.f0);
      const med = median(f0s) || 200;
      frames.forEach((f) => { f.st = f.f0 > 0 ? 12 * Math.log2(f.f0 / med) : null; if (f.st != null && Math.abs(f.st) > 11) f.st = null; });
      // median smoothing
      const st = frames.map((f) => f.st);
      frames.forEach((f, i) => { const w = st.slice(Math.max(0, i - 2), i + 3).filter((x) => x != null); f.sts = f.st == null ? null : median(w); });
      const stv = frames.filter((f) => f.sts != null).map((f) => f.sts);
      const mean = stv.reduce((a, b) => a + b, 0) / (stv.length || 1);
      const std = Math.sqrt(stv.reduce((a, b) => a + (b - mean) ** 2, 0) / (stv.length || 1));
      const range = pct(stv, 0.92) - pct(stv, 0.08);
      // ending tone: last voiced stretch (after last pause), final ~45% / max 0.6 s
      const lastPauseEnd = pauses.length ? pauses[pauses.length - 1].end : start;
      const tail = frames.filter((f) => f.t >= lastPauseEnd && f.t <= end && f.sts != null);
      let endTone = "level", endDelta = 0;
      if (tail.length >= 8) {
        const n = tail.length, seg = Math.max(4, Math.min(Math.round(n * 0.45), 60));
        const last = tail.slice(n - seg);
        const k = Math.max(2, Math.floor(last.length / 3));
        const a = median(last.slice(0, k).map((f) => f.sts)), b = median(last.slice(-k).map((f) => f.sts));
        endDelta = b - a;
        endTone = endDelta > 1.4 ? "rise" : endDelta < -1.4 ? "fall" : "level";
      }
      const db = (x) => 20 * Math.log10(Math.max(1e-5, x));
      const loud = db(pct(vf.map((f) => f.rms), 0.9)) - db(median(vf.map((f) => f.rms)));
      return {
        duration: samples.length / sr, start, end, speechTime: end - start, pauses, pitchMedian: med, pitchStd: std, pitchRange: range,
        endTone, endDelta, loudVar: loud, peak,
        contour: frames.map((f) => ({ t: f.t, st: f.sts, v: f.voiced ? 1 : 0, r: f.rms / peak }))
      };
    },

    /** Voice-coach report for a line of text */
    report(an, text, { emotion } = {}) {
      const tips = [], stars = {};
      if (!an || an.empty) return { empty: true, tips: ["I couldn't hear you clearly. Move closer to the microphone and try again. 🎤"], stars: {}, robot: 0 };
      const sents = PA.Lang.sentences(text);
      const toks = PA.Lang.tokenize(text);
      const marks = toks.filter((t) => t.type === "mark").map((t) => PA.Lang.normMark(t.mark));
      const words = toks.filter((t) => t.type === "word").length;
      const finalMark = sents.length ? sents[sents.length - 1].mark : ".";
      const internalStops = Math.max(0, sents.length - 1);
      const commas = marks.filter((m) => m === ",").length;
      const expected = internalStops + commas;
      const longP = an.pauses.filter((p) => p.dur >= 0.42).length;
      const nP = an.pauses.length;
      // Robot-o-meter (expression): pitch movement in semitones
      const robot = Math.round(PA.clamp(((an.pitchStd - 1.0) / 2.8) * 100, 0, 100));
      // choppy word-by-word reading (a "robot reading" habit)
      const choppy = words >= 5 && nP >= Math.max(expected + 3, words * 0.6);
      if (choppy) tips.push("You stopped after almost every word. Read the words between the marks smoothly, like a wave 🌊, and only stop at the marks.");
      if (expected > 0) {
        const got = Math.min(nP, expected);
        const sc = got >= expected ? 3 : got >= expected / 2 ? 2 : 1;
        stars.pause = choppy ? Math.min(sc, 2) : sc;
        if (got < expected) tips.push(commas ? `Koma 💨 says: I counted ${expected} place${expected > 1 ? "s" : ""} to pause, but I heard ${got}. Take a little breath at each comma.` : `Dotty 🛑 says: stop properly at each full stop before the next sentence.`);
        if (internalStops > 0) { stars.stop = longP >= internalStops ? 3 : longP > 0 ? 2 : 1; if (longP < internalStops) tips.push("Dotty 🛑 says: make your STOP at a full stop a little longer than a comma pause."); }
      } else if (words <= 12 && nP === 0) stars.pause = 3;
      const last = sents[sents.length - 1];
      if (finalMark === "?") {
        const cls = PA.Lang.classify(last.text);
        if (cls.type === "wh") {
          stars.ask = an.endTone === "fall" ? 3 : 2;
          tips.push(an.endTone === "fall" ? "Quizzy ↘: great WH-question voice — strong start, falling end!" : `Quizzy says: “${cls.cueWord}” is a WH word. Make it strong, then let your voice go down at the end ↘.`);
        } else {
          stars.ask = an.endTone === "rise" ? 3 : an.endTone === "level" ? 2 : 1;
          tips.push(an.endTone === "rise" ? "Quizzy ↗: yes! Your voice went UP at the end like a real question." : "Quizzy says: this is a Yes/No question. Lift your voice UP at the last word ↗.");
        }
      }
      if (finalMark === "!" || marks.includes("!")) {
        const feel = an.pitchRange >= 6 || an.loudVar >= 7 ? 3 : an.pitchRange >= 3.8 ? 2 : 1;
        stars.feel = feel;
        const emo = emotion && PA.EMOTIONS[emotion] ? PA.EMOTIONS[emotion] : null;
        tips.push(feel === 3 ? `Zing 💥: I can FEEL it${emo ? ` — that sounds ${emo.label.toLowerCase()} ${emo.emoji}` : ""}!` : `Zing says: show more feeling${emo ? ` — make it sound ${emo.label.toLowerCase()} ${emo.emoji}` : ""}! Change how high, loud or fast your voice is.`);
      }
      if (finalMark === "." && sents.length === 1 && an.endTone === "rise") tips.push("Dotty says: this sentence is not a question, so let your voice go down at the full stop.");
      if (robot < 30) tips.push("Bip 🤖 says: your voice sounded a bit flat, like me! Let it go up and down to show the meaning.");
      else if (robot > 70) tips.push("Bip 🤖 says: wow, your voice moved beautifully. Not a robot at all!");
      return { stars, tips, robot, choppy, expectedPauses: expected, heardPauses: nP };
    },

    /** Draw the "voice melody line" on a canvas. opts.model = other analysis to overlay (dashed). */
    draw(canvas, an, { color = "#4C7DFF", model = null, text = "" } = {}) {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth || 600, H = canvas.clientHeight || 160;
      canvas.width = W * dpr; canvas.height = H * dpr;
      const g = canvas.getContext("2d"); g.scale(dpr, dpr); g.clearRect(0, 0, W, H);
      g.fillStyle = "#F7F8FF"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "#E3E6F2"; g.lineWidth = 1;
      for (let y = 1; y < 4; y++) { g.beginPath(); g.moveTo(0, (H * y) / 4); g.lineTo(W, (H * y) / 4); g.stroke(); }
      const plot = (a, col, dashed, width) => {
        if (!a || a.empty) return;
        const t0 = a.start - 0.1, t1 = a.end + 0.1, span = Math.max(0.3, t1 - t0);
        const X = (t) => ((t - t0) / span) * (W - 20) + 10, Y = (st) => H / 2 - (st / 9) * (H / 2 - 12);
        if (!dashed) {
          g.fillStyle = "rgba(20,188,156,.16)";
          a.pauses.forEach((p) => { g.fillRect(X(p.start), 0, X(p.end) - X(p.start), H); });
          g.fillStyle = "#0B8F77"; g.font = "600 11px Fredoka, sans-serif";
          a.pauses.forEach((p) => { if (X(p.end) - X(p.start) > 16) g.fillText(p.dur >= 0.42 ? "stop" : "pause", X(p.start) + 2, 12); });
          g.fillStyle = "rgba(76,125,255,.10)";
          a.contour.forEach((f) => { if (f.t >= t0 && f.t <= t1 && f.v) { const h = Math.min(H, f.r * H * 0.45); g.fillRect(X(f.t), H - h, 2, h); } });
        }
        g.strokeStyle = col; g.lineWidth = width; g.lineJoin = "round"; g.lineCap = "round"; g.setLineDash(dashed ? [6, 6] : []);
        g.beginPath(); let pen = false;
        a.contour.forEach((f) => { if (f.t < t0 || f.t > t1) return; if (f.st == null) { pen = false; return; } const x = X(f.t), y = Y(f.st); pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; });
        g.stroke(); g.setLineDash([]);
        if (!dashed && a.endTone) {
          const lastV = [...a.contour].reverse().find((f) => f.st != null);
          if (lastV) { g.font = "700 22px Fredoka, sans-serif"; g.fillStyle = col; g.fillText(a.endTone === "rise" ? "↗" : a.endTone === "fall" ? "↘" : "→", Math.min(W - 24, X(lastV.t) + 4), Math.max(22, Y(lastV.st))); }
        }
      };
      if (model) plot(model, "#B2B7D3", true, 3);
      plot(an, color, false, 4);
      if (!an || an.empty) { g.fillStyle = "#8389A8"; g.font = "600 15px Fredoka, sans-serif"; g.fillText("No voice heard yet", 14, H / 2); }
    },
    yin
  };

  /* ===================== Disguise ===================== */
  function hann(N) { const w = new Float32Array(N); for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)); return w; }
  function timeStretch(x, factor) {
    const N = 512, Hs = 256, Ha = Hs / factor, tol = 128;
    const outLen = Math.ceil(x.length * factor) + N;
    const out = new Float32Array(outLen), norm = new Float32Array(outLen), w = hann(N);
    let prev = 0, outPos = 0;
    for (let k = 0; ; k++) {
      const target = Math.round(k * Ha);
      if (target + N + tol >= x.length || outPos + N >= outLen) break;
      let best = target;
      if (k > 0) {
        const ref = prev + Hs; let bestC = -Infinity;
        if (ref + N < x.length) {
          for (let d = -tol; d <= tol; d += 2) {
            const p = target + d; if (p < 0 || p + N >= x.length) continue;
            let c = 0; for (let i = 0; i < N; i += 4) c += x[p + i] * x[ref + i];
            if (c > bestC) { bestC = c; best = p; }
          }
        }
      }
      for (let i = 0; i < N; i++) { out[outPos + i] += x[best + i] * w[i]; norm[outPos + i] += w[i]; }
      prev = best; outPos += Hs;
    }
    for (let i = 0; i < outLen; i++) if (norm[i] > 1e-3) out[i] /= norm[i];
    return out.subarray(0, Math.min(outLen, Math.round(x.length * factor)));
  }
  function resample(y, step) {
    const n = Math.floor(y.length / step), z = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * step, a = Math.floor(p), f = p - a; z[i] = (y[a] || 0) * (1 - f) + (y[a + 1] || 0) * f; }
    return z;
  }
  const Disguise = {
    presets: {
      none: { label: "My own voice", emoji: "🙂", ratio: 1 },
      mouse: { label: "Little Mouse", emoji: "🐭", ratio: 1.42 },
      bear: { label: "Big Bear", emoji: "🐻", ratio: 0.72 },
      alien: { label: "Space Alien", emoji: "👽", ratio: 1.2, wobble: true }
    },
    /** Shift pitch by a constant ratio: every rise, fall and pause stays exactly where it was. */
    process(samples, preset = "mouse", sr = SR) {
      const p = this.presets[preset]; if (!p || p.ratio === 1) return samples;
      let y = resample(timeStretch(samples, p.ratio), p.ratio);
      if (p.wobble) { const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) z[i] = y[i] * (0.72 + 0.28 * Math.sin((2 * Math.PI * 38 * i) / sr)); y = z; }
      let peak = 0; for (let i = 0; i < y.length; i++) peak = Math.max(peak, Math.abs(y[i]));
      if (peak > 0) { const g = 0.9 / peak; for (let i = 0; i < y.length; i++) y[i] *= g; }
      return y;
    },
    async blob(wavBlob, preset) {
      if (!preset || preset === "none") return wavBlob;
      const { samples, sr } = await Analyse.decode(wavBlob);
      return encodeWav(this.process(samples, preset, sr), sr);
    }
  };

  PA.Recorder = Recorder; PA.Analyse = Analyse; PA.Disguise = Disguise; PA.encodeWav = encodeWav; PA.SR = SR;
})();
