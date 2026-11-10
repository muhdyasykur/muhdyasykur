/* PunctuAction — sound effects (synthesised, no audio files needed) + confetti */
(function () {
  const PA = (window.PA = window.PA || {});
  let ctx = null;
  const ac = () => { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === "suspended") ctx.resume(); return ctx; };

  function tone(freq, dur, { type = "sine", vol = 0.18, at = 0, glide = 0, attack = 0.01 } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, { vol = 0.12, at = 0, freq = 1200 } = {}) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + at;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  const SOUNDS = {
    pop: () => tone(520, 0.09, { glide: 900, vol: 0.15 }),
    tap: () => tone(700, 0.05, { type: "triangle", vol: 0.1 }),
    correct: () => { tone(784, 0.12, { type: "triangle" }); tone(1047, 0.12, { type: "triangle", at: 0.09 }); tone(1319, 0.22, { type: "triangle", at: 0.18 }); },
    wrong: () => { tone(260, 0.18, { type: "square", vol: 0.06, glide: 180 }); tone(200, 0.22, { type: "square", vol: 0.05, at: 0.14, glide: 140 }); },
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, { type: "triangle", at: i * 0.11, vol: 0.16 })),
    tick: () => tone(1500, 0.03, { type: "square", vol: 0.04 }),
    stop: () => { tone(180, 0.18, { vol: 0.25 }); noise(0.08, { vol: 0.05, freq: 300 }); },
    breath: () => noise(0.35, { vol: 0.08, freq: 1600 }),
    rise: () => tone(380, 0.35, { glide: 900, type: "sine", vol: 0.14 }),
    fall: () => tone(800, 0.35, { glide: 330, type: "sine", vol: 0.14 }),
    zing: () => [1200, 1600, 2100].forEach((f, i) => tone(f, 0.12, { type: "triangle", at: i * 0.05, vol: 0.09 })),
    whoosh: () => noise(0.25, { vol: 0.06, freq: 900 }),
    robot: () => [0, 0.12, 0.24].forEach((a) => tone(330, 0.08, { type: "square", vol: 0.05, at: a })),
    powerup: () => { tone(200, 0.6, { glide: 1200, type: "sawtooth", vol: 0.05 }); tone(1047, 0.25, { type: "triangle", at: 0.55 }); }
  };
  PA.sfx = function (name) {
    if (PA.settings && PA.settings.get("mute", false)) return;
    try { (SOUNDS[name] || SOUNDS.pop)(); } catch (e) {}
  };
  PA.markSfx = { ".": "stop", ",": "breath", "?": "rise", "!": "zing" };

  /* ---------- Sonic logo: four notes for . , ? ! then a bright chord ---------- */
  PA.jingle = function () {
    if (PA.settings && PA.settings.get("mute", false)) return;
    try {
      tone(392, 0.16, { type: "triangle", vol: 0.16 });                 // .  (firm stop)
      tone(523, 0.14, { type: "triangle", vol: 0.13, at: 0.17 });       // ,  (light)
      tone(523, 0.3, { type: "sine", vol: 0.14, at: 0.32, glide: 784 }); // ?  (rising)
      [1047, 1319, 1568].forEach((f, i) => tone(f, 0.5, { type: "triangle", vol: 0.09, at: 0.68 + i * 0.03 })); // ! (sparkle chord)
    } catch (e) {}
  };

  /* ---------- Gentle background music (generated, loops, off by default) ---------- */
  const Music = { on: false, timer: null, step: 0 };
  const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];
  const PATTERN = [0, 2, 4, 5, 4, 2, 3, 1, 0, 2, 4, 6, 5, 4, 3, 2];
  const BASS = [131, 131, 110, 110, 147, 147, 98, 98];
  Music.start = function () {
    const c = ac(); if (!c || Music.on) return;
    Music.on = true; Music.step = 0;
    const beat = 0.36;
    let next = c.currentTime + 0.05;
    Music.timer = setInterval(() => {
      while (next < c.currentTime + 0.4) {
        const s = Music.step++;
        const at = next - c.currentTime;
        tone(SCALE[PATTERN[s % 16]] * (s % 32 >= 16 ? 1 : 1), beat * 0.9, { type: "sine", vol: 0.035, at, attack: 0.02 });
        if (s % 2 === 0) tone(BASS[(s / 2) % 8], beat * 1.8, { type: "triangle", vol: 0.03, at });
        if (s % 8 === 4) tone(SCALE[PATTERN[s % 16]] * 2, beat * 0.5, { type: "sine", vol: 0.015, at: at + beat / 2 });
        next += beat;
      }
    }, 120);
  };
  Music.stop = function () { Music.on = false; clearInterval(Music.timer); };
  Music.toggle = function () { if (Music.on) Music.stop(); else Music.start(); PA.settings && PA.settings.set("music", Music.on); return Music.on; };
  PA.Music = Music;

  /* ---------- Confetti ---------- */
  let cv, cx2, parts = [], raf = 0;
  PA.confetti = function (n = 140, colors = ["#FF5C5C", "#14BC9C", "#4C7DFF", "#FFB21F", "#8E7BFF"]) {
    if (document.body.classList.contains("reduce-motion")) return;
    if (!cv) { cv = document.createElement("canvas"); cv.id = "fx-canvas"; document.body.appendChild(cv); cx2 = cv.getContext("2d"); }
    cv.width = innerWidth; cv.height = innerHeight;
    const marks = [".", ",", "?", "!"];
    for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 5,
      r: Math.random() * 6 + 5, c: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, t: Math.random() < 0.25 ? marks[i % 4] : null, life: 0 });
    if (!raf) loop();
  };
  function loop() {
    cx2.clearRect(0, 0, cv.width, cv.height);
    parts.forEach((p) => {
      p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99; p.life++;
      cx2.save(); cx2.translate(p.x, p.y); cx2.rotate(p.rot); cx2.fillStyle = p.c;
      if (p.t) { cx2.font = "bold 26px Fredoka, sans-serif"; cx2.fillText(p.t, -6, 8); } else cx2.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.66);
      cx2.restore();
    });
    parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 400);
    if (parts.length) raf = requestAnimationFrame(loop); else { raf = 0; cx2.clearRect(0, 0, cv.width, cv.height); }
  }
})();
