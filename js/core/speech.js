/* PunctuAction — "PunctuVoice" engine: punctuation-aware text-to-speech + Read-Along highlighter.
   How it reads (works offline with the device's built-in voices):
   •  ,  → the clause is spoken with a "continue" tone, then a short breath pause
   •  .  → falling tone, then a full STOP (longer pause)
   •  ?  → Yes/No & asking statements keep "?" so the voice RISES ↗; WH-questions are voiced as a
            statement so the voice FALLS ↘ at the end (correct English intonation), with a stronger start
   •  !  → the line's emotion (happy, angry, scared…) changes pitch, speed and loudness
   Teachers can replace any computer voice with their own recording (Teacher Hub → Model Voices). */
(function () {
  const PA = (window.PA = window.PA || {});
  const L = () => PA.Lang;
  const synth = window.speechSynthesis;

  const EMO = {
    neutral: { p: 1, r: 1, v: 0.88 }, happy: { p: 1.25, r: 1.06, v: 1 }, excited: { p: 1.45, r: 1.16, v: 1 },
    angry: { p: 0.72, r: 1.1, v: 1 }, surprised: { p: 1.55, r: 0.95, v: 1 }, scared: { p: 1.32, r: 1.22, v: 0.95 },
    sad: { p: 0.78, r: 0.8, v: 0.72 }, worried: { p: 1.12, r: 0.94, v: 0.85 }, urgent: { p: 1.25, r: 1.28, v: 1 },
    proud: { p: 1.15, r: 0.98, v: 1 }, calm: { p: 0.96, r: 0.9, v: 0.85 }
  };
  const PAUSES = { natural: { ",": 380, ".": 820, "?": 820, "!": 820 }, teach: { ",": 650, ".": 1250, "?": 1250, "!": 1250 } };

  let voices = [];
  let ready = false;
  function loadVoices() {
    if (!synth) return [];
    voices = synth.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
    voices.sort((a, b) => (b.localService - a.localService) || (/GB|MY|AU|IN|SG/i.test(b.lang) - /GB|MY|AU|IN|SG/i.test(a.lang)) || a.name.localeCompare(b.name));
    ready = voices.length > 0;
    return voices;
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = () => { loadVoices(); Voice._listeners.forEach((f) => f()); }; }

  const Voice = {
    _tok: 0, _listeners: [],
    supported: () => !!synth,
    hasVoices: () => (loadVoices(), voices.length > 0),
    list: () => loadVoices(),
    onVoices(f) { this._listeners.push(f); },
    byURI(uri) { return loadVoices().find((v) => v.voiceURI === uri) || null; },
    narrator() { return this.byURI(PA.settings.get("voiceURI", "")) || loadVoices()[0] || null; },
    /** voice for a dialogue character: honours teacher's cast choice, else cycles through available voices */
    forCharacter(idx = 0, cast) {
      const all = loadVoices();
      if (cast && cast.voiceURI) { const v = this.byURI(cast.voiceURI); if (v) return v; }
      const pref = PA.settings.get("castVoices", []);
      if (pref[idx]) { const v = this.byURI(pref[idx]); if (v) return v; }
      if (!all.length) return null;
      const multi = PA.settings.get("multiVoice", true);
      return multi ? all[idx % all.length] : this.narrator();
    },
    mode: () => PA.settings.get("voiceMode", "teach"),

    /** Build the speaking plan for a text */
    plan(text, { emotion = null, mode = Voice.mode(), pitch = 1, rate = 1, robot = false } = {}) {
      const steps = [];
      const baseRate = (mode === "teach" ? 0.84 : 0.96) * rate * PA.settings.get("rate", 1);
      if (robot) {
        const toks = L().tokenize(text).filter((t) => t.type === "word");
        toks.forEach((t) => { steps.push({ say: t.text.toLowerCase(), start: t.start, end: t.end, pitch: 0.55, rate: 0.95, volume: 0.9 }); steps.push({ pause: 70 }); });
        return steps;
      }
      const P = PAUSES[mode] || PAUSES.natural;
      const sents = L().sentences(text);
      sents.forEach((s, si) => {
        const cls = L().classify(s.text);
        // split into clauses at commas/semicolons/colons, keep offsets
        const re = /[^,;:]+(?:[,;:]|$)/g; let m; const chunks = [];
        while ((m = re.exec(s.text))) { if (!m[0].trim()) continue; const lead = m[0].length - m[0].replace(/^\s+/, "").length; chunks.push({ t: m[0].trim(), off: s.start + m.index + lead }); }
        chunks.forEach((c, ci) => {
          const isLast = ci === chunks.length - 1;
          let say = c.t;
          const endMark = isLast ? s.mark : ",";
          let prof = EMO.neutral;
          if (s.mark === "!") prof = EMO[emotion] || EMO.excited;
          else if (emotion && EMO[emotion]) { const e = EMO[emotion]; prof = { p: 1 + (e.p - 1) * 0.5, r: 1 + (e.r - 1) * 0.5, v: (e.v + 0.88) / 2 }; }
          let p = pitch * prof.p, r = baseRate * prof.r;
          if (s.mark === "?") {
            if (cls.type === "wh") {
              if (isLast) say = say.replace(/\?+["”’]?$/, "."); // guarantees a falling tone for WH-questions
              if (ci === 0) p *= 1.1; // stronger start
            } else if (isLast) p *= 1.08; // gentle lift; engine adds the rise on "?"
          }
          steps.push({ say, start: c.off, end: c.off + c.t.length, pitch: Math.max(0.1, Math.min(2, p)), rate: Math.max(0.5, Math.min(1.6, r)), volume: Math.min(1, prof.v), type: cls.type, mark: isLast ? s.mark : c.t.slice(-1) });
          const mk = isLast ? s.mark : L().normMark(c.t.slice(-1));
          const lastOfAll = isLast && si === sents.length - 1;
          if ([",", ".", "?", "!"].includes(mk)) steps.push({ pause: lastOfAll ? 250 : P[mk] || 400, mark: mk, at: isLast ? s.end - 1 : c.off + c.t.length - 1, type: cls.type, final: lastOfAll });
        });
      });
      return steps;
    },

    /** speak(text, {emotion, voice, pitch, rate, mode, robot, onStep, onWord, onMark, onEnd}) -> Promise */
    async speak(text, opts = {}) {
      this.stop();
      const tok = ++this._tok;
      const steps = this.plan(text, opts);
      const voice = opts.voice !== undefined ? opts.voice : this.narrator();
      for (const st of steps) {
        if (tok !== this._tok) return false;
        if (st.pause != null) { opts.onMark && opts.onMark(st); await PA.sleep(st.pause); continue; }
        opts.onStep && opts.onStep(st);
        await this._utter(st, voice, opts, tok);
      }
      if (tok === this._tok) { opts.onEnd && opts.onEnd(); }
      return tok === this._tok;
    },
    _utter(st, voice, opts, tok) {
      const words = st.say.split(/\s+/).length;
      const est = (words * 380) / st.rate + 400;
      if (!synth || !this.hasVoices() || PA.settings.get("silentTTS", false)) {
        // no voice on this device: simulate timing so animations & practice still work
        return new Promise((res) => {
          const ws = [...st.say.matchAll(/\S+/g)];
          ws.forEach((w, i) => setTimeout(() => tok === this._tok && opts.onWord && opts.onWord(st.start + w.index), (i * est) / ws.length));
          setTimeout(res, est);
        });
      }
      return new Promise((res) => {
        let done = false;
        const finish = () => { if (!done) { done = true; clearTimeout(t); res(); } };
        const u = new SpeechSynthesisUtterance(st.say);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-GB";
        u.pitch = st.pitch; u.rate = st.rate; u.volume = st.volume;
        u.onboundary = (e) => { if (e.name === "word" || e.name === undefined) opts.onWord && opts.onWord(st.start + e.charIndex); };
        u.onend = finish; u.onerror = finish;
        const t = setTimeout(finish, est * 2.2 + 2500);
        if (synth.paused) synth.resume();
        synth.speak(u);
      });
    },
    stop() { this._tok++; if (synth) synth.cancel(); PA.stopAudio && PA.stopAudio(); },
    EMO
  };
  PA.Voice = Voice;

  /* ======================= Read-Along ======================= */
  const toneCue = (type) => (type === "wh" ? "↘" : "↗");
  const ReadAlong = {
    /** render text to HTML with word spans + coloured mark chips (+ voice cue icons when cues=true) */
    html(text, { cues = true, emotion = null, blanks = null } = {}) {
      const toks = L().tokenize(text);
      const sents = L().sentences(text);
      const sentAt = (i) => sents.find((s) => i >= s.start && i < s.end + 1);
      return `<span class="ra ${cues ? "cues" : ""}">` + toks.map((t) => {
        if (t.type === "word") return `<span class="w" data-s="${t.start}">${PA.esc(t.text)}</span>`;
        if (t.type === "mark") {
          const mk = L().normMark(t.mark);
          const meta = PA.MARKS[mk];
          if (!meta) return PA.esc(t.text);
          let cue = meta.cue;
          if (mk === "?") { const s = sentAt(t.start); cue = toneCue(s ? L().classify(s.text).type : "yn"); }
          if (mk === "!" && emotion && PA.EMOTIONS[emotion]) cue = PA.EMOTIONS[emotion].emoji;
          return `<span class="mk mk-${meta.key}" data-m="${t.start}"><b>${PA.esc(t.text)}</b>${cues ? `<span class="cue">${cue}</span>` : ""}</span>`;
        }
        return PA.esc(t.text);
      }).join("") + `</span>`;
    },
    /** play text inside container that holds ReadAlong.html(text); returns promise */
    play(container, text, opts = {}) {
      const words = PA.$$(".w", container);
      const marks = PA.$$(".mk", container);
      const clear = () => { words.forEach((w) => w.classList.remove("now", "reading")); marks.forEach((m) => m.classList.remove("pulse")); };
      clear();
      const nowAt = (pos) => {
        let best = null; for (const w of words) { if (+w.dataset.s <= pos) best = w; else break; }
        words.forEach((w) => w.classList.remove("now")); if (best) best.classList.add("now");
      };
      return Voice.speak(text, Object.assign({}, opts, {
        onStep(st) {
          marks.forEach((m) => m.classList.remove("pulse"));
          words.forEach((w) => { const s = +w.dataset.s; w.classList.toggle("reading", s >= st.start && s < st.end); });
          nowAt(st.start);
          opts.onStep && opts.onStep(st);
        },
        onWord(pos) { nowAt(pos); opts.onWord && opts.onWord(pos); },
        onMark(st) {
          words.forEach((w) => w.classList.remove("now"));
          const m = marks.find((x) => +x.dataset.m === st.at) || marks.find((x) => Math.abs(+x.dataset.m - st.at) <= 1);
          if (m) m.classList.add("pulse");
          if (!st.final && opts.markSounds !== false) PA.sfx(PA.markSfx[st.mark] === "stop" ? "tap" : "tap");
          opts.onMark && opts.onMark(st, m);
        },
        onEnd() { setTimeout(clear, 300); opts.onEnd && opts.onEnd(); }
      })).then((r) => { clear(); return r; });
    }
  };
  PA.ReadAlong = ReadAlong;
})();
