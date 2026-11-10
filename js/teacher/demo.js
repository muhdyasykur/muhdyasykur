/* PunctuAction — Demo class generator (for presenting / exploring the Teacher Hub).
   Recordings are synthetic "hums": pre-test hums are flat with no pauses (robot reading),
   post-test hums pause at marks and rise/fall like real intonation, so the analyser shows the difference. */
(function () {
  const PA = window.PA; const T = PA.T;
  const SR = 16000;

  function synth(text, expressive, f0 = 230) {
    const toks = PA.Lang.tokenize(text), sents = PA.Lang.sentences(text);
    const plan = []; // {dur, st (semitones), voiced}
    const words = toks.filter((t) => t.type === "word");
    toks.forEach((t) => {
      if (t.type === "word") {
        const syl = Math.max(1, Math.round(t.text.length / 3.2));
        const s = sents.find((x) => t.start >= x.start && t.start <= x.end) || { text, start: 0, end: text.length, mark: "." };
        const pos = (t.start - s.start) / Math.max(1, s.end - s.start);
        const isLast = !words.some((w) => w.start > t.start && w.start <= s.end);
        const cls = PA.Lang.classify(s.text);
        for (let k = 0; k < syl; k++) {
          let st = 0;
          if (expressive) {
            st = 2 - pos * 3 + Math.sin(t.start + k) * 1.2;
            if (cls.type === "wh" && pos < 0.15) st += 3;
            if (isLast && k === syl - 1) st += cls.tone === "rise" ? 6 : cls.type === "excl" ? -1 : -3;
            if (cls.type === "excl") st += 3 + Math.sin(k * 2) * 2;
          } else st = (Math.random() - 0.5) * 0.5;
          plan.push({ dur: 0.17, st, voiced: true, rise: expressive && isLast && k === syl - 1 && cls.tone === "rise" });
        }
        plan.push({ dur: expressive ? 0.04 : 0.24, voiced: false });
      } else if (t.type === "mark" && expressive) plan.push({ dur: PA.Lang.normMark(t.mark) === "," ? 0.32 : 0.62, voiced: false });
    });
    const total = plan.reduce((a, p) => a + p.dur, 0.3);
    const out = new Float32Array(Math.ceil(total * SR)); let i = Math.floor(0.15 * SR), ph = 0;
    plan.forEach((p) => {
      const n = Math.floor(p.dur * SR);
      for (let j = 0; j < n && i < out.length; j++, i++) {
        if (!p.voiced) { out[i] = (Math.random() - 0.5) * 0.002; continue; }
        const glide = p.rise ? (j / n) * 4 : 0;
        const f = f0 * Math.pow(2, (p.st + glide) / 12);
        ph += (2 * Math.PI * f) / SR;
        const env = Math.min(1, j / (0.02 * SR)) * Math.min(1, (n - j) / (0.03 * SR));
        let v = 0; for (let h = 1; h <= 6; h++) v += Math.sin(ph * h) / h;
        out[i] = v * 0.22 * env;
      }
    });
    return out;
  }

  T.loadDemo = async () => {
    if ((await PA.DB.where("pupils", (p) => p.demo)).length) return PA.toast("Demo class is already loaded.");
    PA.toast("Creating demo class…");
    const names = [["Aina", "🦊", 4], ["Boon Kiat", "🐼", 4], ["Chandra", "🐯", 4], ["Dania", "🐰", 4], ["Ezra", "🐸", 3], ["Fatin", "🦄", 4], ["Gopal", "🐢", 5], ["Hana", "🐧", 4]];
    const now = Date.now(), day = 864e5;
    const check = PA.READING_CHECK;
    for (const [ni, [name, av, year]] of names.entries()) {
      const p = await PA.Model.addPupil({ name, avatar: av, year, level: year <= 3 ? "easy" : "medium" });
      p.demo = true; const ability = 0.45 + (ni % 4) * 0.12 + Math.random() * 0.08;
      const attempts = [];
      for (let k = 0; k < 10 + ni; k++) {
        const game = PA.pick(Object.keys(PA.Model.GAMES)), level = k > 8 && ability > 0.7 ? "hard" : k > 3 ? "medium" : "easy";
        const g = PA.Model.GAMES[game]; const results = [];
        for (let q = 0; q < 8; q++) { const sk = PA.pick(g.skills); const growth = (k / 20) * 0.35; results.push({ skill: sk, ok: Math.random() < Math.min(0.97, ability + growth - (sk === "ask" ? 0.08 : 0)) }); }
        const correct = results.filter((r) => r.ok).length;
        results.forEach((r) => { const s = p.skills[r.skill]; s.n++; if (r.ok) s.c++; s.ema = s.ema * 0.86 + (r.ok ? 0.14 : 0); });
        const at = now - (20 - k) * day * 0.9 - Math.random() * day;
        const bySkill = {}; results.forEach((r) => { bySkill[r.skill] = bySkill[r.skill] || [0, 0]; bySkill[r.skill][1]++; if (r.ok) bySkill[r.skill][0]++; });
        attempts.push({ id: PA.uid("a"), pupilId: p.id, pupilName: name, game, level, total: 8, correct, pct: Math.round((correct / 8) * 100), bySkill, duration: 120 + PA.rand(200), at, demo: true });
        p.games[game] = p.games[game] || { plays: 0, best: {} }; p.games[game].plays++; p.games[game].best[level] = Math.max(p.games[game].best[level] || 0, Math.round((correct / 8) * 100));
        p.stars += correct;
      }
      p.lessons = { dot: now - 19 * day, koma: now - 18 * day, quizzy: now - 17 * day, zing: now - 16 * day };
      p.timeSpent = attempts.reduce((a, x) => a + x.duration, 0); p.sessions = 6 + PA.rand(6); p.lastActive = now - PA.rand(3) * day - PA.rand(8) * 3600e3;
      if (ni === 6) p.lastActive = now - 9 * day;
      PA.Model.checkBadges(p);
      await PA.DB.put("pupils", p); await PA.DB.putMany("attempts", attempts);
      // reading check: pre (flat) and post (expressive) for lines 0 and 3
      for (const kind of ["pre", "post"]) for (const li of [0, 3]) {
        const l = check.lines[li], expressive = kind === "post" ? Math.random() < ability + 0.3 : Math.random() < 0.15;
        const samples = synth(l.text, expressive, 200 + ni * 12);
        const an = PA.Analyse.run(samples, SR), rep = PA.Analyse.report(an, l.text, { emotion: l.emo });
        const base = kind === "pre" ? 1 + (ability > 0.7 ? 1 : 0) : 2 + (ability > 0.6 ? 1 : 0) + (Math.random() < 0.4 ? 1 : 0);
        const sc = (has) => (has ? Math.max(1, Math.min(4, base + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0))) : null);
        const marks = l.text;
        await PA.DB.put("recordings", { id: PA.uid("r"), demo: true, pupilId: p.id, pupilName: name, dialogueId: "check", dialogueTitle: check.title, lineIdx: li, character: check.cast[l.c].name, text: l.text, emo: l.emo,
          blob: PA.encodeWav(samples, SR), disguise: "none", sharedAs: "real", duration: samples.length / SR, kind, level: "medium", at: now - (kind === "pre" ? 20 : 1) * day,
          analysis: rep.empty ? { empty: true } : { robot: rep.robot, stars: rep.stars, tips: rep.tips, endTone: an.endTone, pauses: an.pauses.length, pitchStd: +an.pitchStd.toFixed(2), pitchRange: +an.pitchRange.toFixed(1), choppy: rep.choppy },
          self: {}, status: "assessed", assessment: { scores: { stop: sc(true), pause: sc(marks.includes(",")), ask: sc(marks.includes("?")), feel: sc(marks.includes("!")), fluency: sc(true) }, stickers: kind === "post" ? ["star"] : [], comment: kind === "post" ? "Much more expression than before. Well done!" : "", at: now - (kind === "pre" ? 19 : 0.5) * day } });
      }
      if (ni < 5) { // one new studio recording to assess
        const d = PA.DIALOGUES[3 + (ni % 3)], li = ni % d.lines.length, l = d.lines[li];
        const samples = synth(l.text, Math.random() < 0.6, 210 + ni * 10); const an = PA.Analyse.run(samples, SR), rep = PA.Analyse.report(an, l.text, { emotion: l.emo });
        await PA.DB.put("recordings", { id: PA.uid("r"), demo: true, pupilId: p.id, pupilName: name, dialogueId: d.id, dialogueTitle: d.title, lineIdx: li, character: d.cast[l.c].name, text: l.text, emo: l.emo || null, blob: PA.encodeWav(samples, SR),
          disguise: ni === 2 ? "mouse" : "none", sharedAs: ni === 2 ? "disguised" : "real", duration: samples.length / SR, kind: "studio", level: d.level, at: now - ni * 3600e3, status: "new",
          analysis: rep.empty ? { empty: true } : { robot: rep.robot, stars: rep.stars, tips: rep.tips, endTone: an.endTone, pauses: an.pauses.length, pitchStd: +an.pitchStd.toFixed(2), pitchRange: +an.pitchRange.toFixed(1), choppy: rep.choppy }, self: { stop: true, ask: ni % 2 === 0 } });
      }
      // feedback
      const sm = Math.min(5, Math.max(2, Math.round(3.4 + ability * 1.6 + (Math.random() - 0.5))));
      const yn = () => PA.pick(["yes", "yes", "yes", "maybe", ability > 0.6 ? "yes" : "no"]);
      await PA.DB.put("feedback", { id: PA.uid("f"), demo: true, kind: "survey", pupilId: p.id, pupilName: name, year, at: now - PA.rand(4) * day, smiley: sm, again: { learn: yn(), practice: "yes", studio: yn(), chat: yn(), disguise: PA.pick(["yes", "maybe", "no"]) },
        helped: PA.pick(["yes", "yes", "little"]), fav: PA.pick(["dot", "koma", "quizzy", "zing", "bip", "bip"]), tricky: PA.sample(["Commas ,", "Questions ?", "Exclamations !", "Recording my voice", "Full stops ."], 1 + PA.rand(2)),
        comment: ["I like when Bip says beep boop!", "More stories about football please", "The mouse voice is so funny", "", "Can we play Fix the Robot every day?", "", "I want more hard levels", ""][ni] });
      for (let k = 0; k < 3; k++) await PA.DB.put("feedback", { id: PA.uid("f"), demo: true, kind: "game", pupilId: p.id, pupilName: name, game: PA.pick(Object.keys(PA.Model.GAMES)), level: "medium", fun: PA.pick([3, 4, 4, 4, 2]), diff: PA.pick(["right", "right", "easy", "hard"]), at: now - k * day });
    }
    PA.settings.set("className", PA.settings.get("className", "") || "4 Bestari (demo)");
    PA.toast("Demo class ready! ✨", "good");
    T.router.run();
  };
  T.clearDemo = async () => {
    const ids = (await PA.DB.where("pupils", (p) => p.demo)).map((p) => p.id);
    for (const s of ["pupils", "attempts", "recordings", "feedback"]) for (const r of await PA.DB.all(s)) if (r.demo || ids.includes(r.pupilId)) await PA.DB.del(s, r[PA.DB.keyOf(s)]);
    PA.toast("Demo data removed.", "good"); T.router.run();
  };
})();
