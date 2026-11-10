/* PunctuAction — data model shared by Pupil app and Teacher Hub */
(function () {
  const PA = (window.PA = window.PA || {});
  const DB = PA.DB;

  const AVATARS = ["🐯", "🐼", "🦊", "🐸", "🐨", "🐵", "🦁", "🐰", "🐧", "🐢", "🦄", "🐙", "🐳", "🦋", "🐝", "🦉", "🐬", "🦖", "🐞", "🐮", "🐱", "🐶", "🐹", "🦜"];
  const GAMES = {
    detective: { name: "Mark Detective", icon: "🔍", skills: ["stop", "pause", "ask", "feel"], color: "var(--ask)", blurb: "Find the missing mark." },
    ears: { name: "Ears On!", icon: "👂", skills: ["stop", "ask", "feel"], color: "var(--bip)", blurb: "Listen to the voice. Which mark did you hear?" },
    patrol: { name: "Pause Patrol", icon: "🚦", skills: ["stop", "pause"], color: "var(--pause)", blurb: "Stop and breathe at the right time." },
    tone: { name: "Voice Elevator", icon: "🛗", skills: ["ask"], color: "var(--ask)", blurb: "Does your voice go up or down?" },
    feelings: { name: "Feelings Theatre", icon: "🎭", skills: ["feel"], color: "var(--feel)", blurb: "Read the situation. Choose the feeling." },
    robot: { name: "Fix the Robot", icon: "🤖", skills: ["stop", "pause", "ask", "feel"], color: "var(--stop)", blurb: "Add marks so Bip can read with feeling." }
  };
  const BADGES = [
    { id: "first", icon: "🌟", name: "First Steps", desc: "Finished your first activity" },
    { id: "crew", icon: "🤝", name: "Mark Crew Friend", desc: "Met all four marks in Learn" },
    { id: "stop", icon: "🛑", name: "Stop Star", desc: "Stop skill reached 80%" },
    { id: "pause", icon: "💨", name: "Pause Pro", desc: "Pause skill reached 80%" },
    { id: "ask", icon: "❓", name: "Question Quest", desc: "Ask skill reached 80%" },
    { id: "feel", icon: "💥", name: "Feeling Star", desc: "Feel skill reached 80%" },
    { id: "explorer", icon: "🧭", name: "Explorer", desc: "Tried all six practice activities" },
    { id: "fixer", icon: "🔧", name: "Robot Fixer", desc: "Fixed Bip 3 times with 80% or more" },
    { id: "hard", icon: "🏔️", name: "Hard Hero", desc: "Scored 80% or more on a Hard round" },
    { id: "studio", icon: "🎙️", name: "Studio Star", desc: "Made 5 recordings in the Reading Studio" },
    { id: "feedback", icon: "💌", name: "Helpful Voice", desc: "Gave feedback about the app" },
    { id: "hero", icon: "🦸", name: "Voice Hero", desc: "Lit all four of Bip's voice chips" }
  ];
  const emptySkills = () => ({ stop: { n: 0, c: 0, ema: 0.3 }, pause: { n: 0, c: 0, ema: 0.3 }, ask: { n: 0, c: 0, ema: 0.3 }, feel: { n: 0, c: 0, ema: 0.3 } });

  const Model = {
    AVATARS, GAMES, BADGES,
    async pupils() { return (await DB.all("pupils")).sort((a, b) => a.name.localeCompare(b.name)); },
    pupil: (id) => DB.get("pupils", id),
    async addPupil({ name, avatar, year = 4, level = "easy", key = null }) {
      const p = { id: PA.uid("p"), name: name.trim(), avatar: avatar || PA.pick(AVATARS), year: +year, level, key, createdAt: Date.now(), skills: emptySkills(), stars: 0, badges: [], lessons: {}, games: {}, lastActive: 0, timeSpent: 0, sessions: 0 };
      await DB.put("pupils", p); return p;
    },
    guest() { return { id: "guest", name: "Guest Explorer", avatar: "🧭", year: 4, level: "easy", skills: emptySkills(), stars: 0, badges: [], lessons: {}, games: {}, guest: true }; },
    async save(p) { if (p.guest) { PA.settings.set("guest", p); return p; } return DB.put("pupils", p); },
    loadGuest() { const g = PA.settings.get("guest", null); return g ? Object.assign(this.guest(), g) : this.guest(); },

    mastery(p) { const o = {}; PA.SKILL_LIST.forEach((k) => (o[k] = Math.round((p.skills && p.skills[k] ? p.skills[k].ema : 0) * 100))); return o; },
    chips(p) { const m = this.mastery(p), o = {}; PA.SKILL_LIST.forEach((k) => (o[k] = m[k] >= 80 && p.skills[k].n >= 8)); return o; },
    /** weights for item generation: weaker skill -> more practice */
    weights(p) { const m = this.mastery(p), o = {}; PA.SKILL_LIST.forEach((k) => (o[k] = 0.6 + (100 - m[k]) / 100)); return o; },

    /** record a finished round. results: [{skill, ok}] */
    async recordAttempt(p, { game, level, results, duration = 0, extra = {} }) {
      const correct = results.filter((r) => r.ok).length;
      const a = { id: PA.uid("a"), pupilId: p.id, pupilName: p.name, game, level, total: results.length, correct, pct: results.length ? Math.round((correct / results.length) * 100) : 0,
        bySkill: {}, duration, at: Date.now(), extra };
      p.skills = p.skills || emptySkills();
      results.forEach((r) => {
        const s = p.skills[r.skill]; if (!s) return;
        s.n++; if (r.ok) s.c++; s.ema = s.ema * 0.86 + (r.ok ? 1 : 0) * 0.14;
        a.bySkill[r.skill] = a.bySkill[r.skill] || [0, 0]; a.bySkill[r.skill][1]++; if (r.ok) a.bySkill[r.skill][0]++;
      });
      const earned = correct + (level === "medium" ? Math.ceil(correct / 3) : level === "hard" ? Math.ceil(correct / 2) : 0);
      p.stars = (p.stars || 0) + earned;
      p.games = p.games || {}; p.games[game] = p.games[game] || { plays: 0, best: {} };
      p.games[game].plays++; p.games[game].best[level] = Math.max(p.games[game].best[level] || 0, a.pct);
      p.lastActive = Date.now(); p.timeSpent = (p.timeSpent || 0) + duration;
      const newBadges = this.checkBadges(p, { game, level, pct: a.pct });
      if (!p.guest) await DB.put("attempts", a);
      await this.save(p);
      // complete assignments
      if (!p.guest) await this.completeAssignments(p, (as) => as.type === "game" && as.ref === game && (!as.level || as.level === level));
      return { attempt: a, earned, newBadges };
    },
    checkBadges(p, ctx = {}) {
      const have = new Set(p.badges || []); const add = [];
      const give = (id) => { if (!have.has(id)) { have.add(id); add.push(id); } };
      if ((p.games && Object.keys(p.games).length) || Object.keys(p.lessons || {}).length) give("first");
      if (["dot", "koma", "quizzy", "zing"].every((k) => p.lessons && p.lessons[k])) give("crew");
      const m = this.mastery(p);
      PA.SKILL_LIST.forEach((k) => { if (m[k] >= 80 && p.skills[k].n >= 8) give(k); });
      if (p.games && Object.keys(GAMES).every((g) => p.games[g])) give("explorer");
      if (ctx.game === "robot" && ctx.pct >= 80) { p.fixes = (p.fixes || 0) + 1; if (p.fixes >= 3) give("fixer"); }
      if (ctx.level === "hard" && ctx.pct >= 80) give("hard");
      if ((p.recCount || 0) >= 5) give("studio");
      if (p.gaveFeedback) give("feedback");
      const ch = this.chips(p); if (PA.SKILL_LIST.every((k) => ch[k])) give("hero");
      p.badges = Array.from(have);
      return add.map((id) => BADGES.find((b) => b.id === id));
    },

    /* ---------- dialogues ---------- */
    async dialogues() { const custom = await DB.all("dialogues"); return PA.DIALOGUES.concat(custom.map((d) => Object.assign({ custom: true }, d))); },
    async dialogue(id) { if (id === "check") return PA.READING_CHECK; return PA.DIALOGUES.find((d) => d.id === id) || DB.get("dialogues", id); },
    modelKey: (did, i) => `${did}:${i}`,
    async model(did, i) { const m = await DB.get("models", `${did}:${i}`); return m ? m.blob : null; },

    /* ---------- recordings ---------- */
    async saveRecording(rec) { const r = Object.assign({ id: PA.uid("r"), at: Date.now(), status: "new" }, rec); await DB.put("recordings", r); return r; },
    async recordingsFor(pid) { return (await DB.where("recordings", (r) => r.pupilId === pid)).sort((a, b) => b.at - a.at); },

    /* ---------- assignments ---------- */
    async assignmentsFor(p) {
      const all = await DB.all("assignments");
      return all.filter((a) => a.active !== false && (a.to === "all" || (Array.isArray(a.to) && a.to.includes(p.id)))).map((a) => Object.assign({}, a, { done: !!(a.doneBy && a.doneBy[p.id]) }));
    },
    async completeAssignments(p, match) {
      const all = await DB.all("assignments");
      for (const a of all) if (match(a) && (a.to === "all" || (a.to || []).includes(p.id)) && !(a.doneBy && a.doneBy[p.id])) { a.doneBy = a.doneBy || {}; a.doneBy[p.id] = Date.now(); await DB.put("assignments", a); }
    },

    /* ---------- export / import ---------- */
    async exportPupilWork(p) {
      const recs = await this.recordingsFor(p.id);
      const out = { kind: "punctuaction-pupil-work", v: 1, exportedAt: Date.now(), pupil: p,
        attempts: await DB.where("attempts", (a) => a.pupilId === p.id), feedback: await DB.where("feedback", (f) => f.pupilId === p.id), recordings: [] };
      for (const r of recs) out.recordings.push(Object.assign({}, r, { blob: r.blob ? await PA.blobToB64(r.blob) : null }));
      return JSON.stringify(out);
    },
    async exportAll({ includeAudio = true } = {}) {
      const out = { kind: "punctuaction-backup", v: 1, exportedAt: Date.now(), data: {} };
      for (const s of DB.stores) {
        const rows = await DB.all(s);
        if (s === "kv") { out.data[s] = rows; continue; }
        out.data[s] = [];
        for (const r of rows) { const c = Object.assign({}, r); if (c.blob) c.blob = includeAudio ? await PA.blobToB64(c.blob) : null; out.data[s].push(c); }
      }
      return JSON.stringify(out);
    },
    async classPack() {
      const out = { kind: "punctuaction-class-pack", v: 1, exportedAt: Date.now(), className: PA.settings.get("className", ""), pupils: (await DB.all("pupils")).map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, year: p.year, level: p.level, key: p.key })),
        dialogues: await DB.all("dialogues"), assignments: await DB.all("assignments"), models: [] };
      for (const m of await DB.all("models")) out.models.push({ key: m.key, at: m.at, blob: await PA.blobToB64(m.blob) });
      return JSON.stringify(out);
    },
    /** import any PunctuAction file; returns a summary string */
    async importFile(json) {
      const d = JSON.parse(json);
      const fixBlob = (o) => { if (o.blob && typeof o.blob === "string") o.blob = PA.b64ToBlob(o.blob); return o; };
      if (d.kind === "punctuaction-pupil-work") {
        const existing = await DB.get("pupils", d.pupil.id);
        const p = existing ? Object.assign({}, existing) : d.pupil;
        if (existing) { // merge progress: keep the more advanced numbers
          PA.SKILL_LIST.forEach((k) => { if ((d.pupil.skills[k].n || 0) > (p.skills[k].n || 0)) p.skills[k] = d.pupil.skills[k]; });
          p.stars = Math.max(p.stars || 0, d.pupil.stars || 0); p.badges = Array.from(new Set((p.badges || []).concat(d.pupil.badges || [])));
          p.lessons = Object.assign({}, d.pupil.lessons, p.lessons); p.games = Object.assign({}, d.pupil.games, p.games);
          p.lastActive = Math.max(p.lastActive || 0, d.pupil.lastActive || 0); p.timeSpent = Math.max(p.timeSpent || 0, d.pupil.timeSpent || 0);
        }
        await DB.put("pupils", p);
        await DB.putMany("attempts", d.attempts || []);
        await DB.putMany("feedback", d.feedback || []);
        const recs = (d.recordings || []).map(fixBlob);
        const have = new Set((await DB.all("recordings")).map((r) => r.id));
        await DB.putMany("recordings", recs.filter((r) => !have.has(r.id) || r.status !== "assessed"));
        return `Imported work from ${p.name}: ${(d.attempts || []).length} activities, ${recs.length} recordings.`;
      }
      if (d.kind === "punctuaction-class-pack") {
        for (const p of d.pupils || []) { const ex = await DB.get("pupils", p.id); if (!ex) await DB.put("pupils", Object.assign({ skills: emptySkills(), stars: 0, badges: [], lessons: {}, games: {}, createdAt: Date.now() }, p)); else await DB.put("pupils", Object.assign(ex, { name: p.name, avatar: p.avatar, year: p.year, key: p.key })); }
        await DB.putMany("dialogues", d.dialogues || []);
        await DB.putMany("assignments", d.assignments || []);
        await DB.putMany("models", (d.models || []).map(fixBlob));
        if (d.className) PA.settings.set("className", d.className);
        return `Class pack loaded: ${(d.pupils || []).length} pupils, ${(d.dialogues || []).length} teacher dialogues, ${(d.models || []).length} teacher voice recordings.`;
      }
      if (d.kind === "punctuaction-backup") {
        for (const s of Object.keys(d.data)) { if (!DB.stores.includes(s)) continue; await DB.clear(s); await DB.putMany(s, d.data[s].map(fixBlob)); }
        return "Backup restored.";
      }
      throw new Error("This is not a PunctuAction file.");
    }
  };
  PA.Model = Model;
})();
