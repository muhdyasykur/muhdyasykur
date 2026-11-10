/* PunctuAction — Reading Studio: role-play dialogues, model voices, recording, voice coach, voice disguise */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const S = PA.S;

  /* ---------- Studio home ---------- */
  S.pages.studio = async () => {
    S.setTab("studio");
    const all = await PA.Model.dialogues();
    const models = await PA.DB.all("models");
    const hasModel = (id) => models.some((m) => m.key.startsWith(id + ":"));
    const mine = S.pupil.guest ? [] : await PA.Model.recordingsFor(S.pupil.id);
    const filt = PA.settings.get("studioFilter", "all");
    const card = (d) => { const n = mine.filter((r) => r.dialogueId === d.id).length; return `<button class="dlg-card" data-d="${d.id}" data-l="${d.level}">
      <span class="scene">${d.scene || "🎭"}</span><h3>${esc(d.title)}</h3><div class="small muted">${esc(d.setting || "")}</div>
      <div class="row" style="gap:6px"><span class="pill">${S.LEVELS[d.level] || d.level}</span><span class="pill">${esc(d.years || "")}</span>${hasModel(d.id) ? `<span class="pill pill-good">👩‍🏫 Teacher's voice</span>` : ""}${d.custom ? `<span class="pill pill-bip">New from teacher</span>` : ""}${n ? `<span class="pill pill-feel">🎙 ${n}</span>` : ""}</div>
      <div class="row" style="gap:4px;font-size:1.4rem">${d.cast.map((c) => c.av).join(" ")}</div></button>`; };
    S.mount(`<div class="page-title">${PA.mascot("quizzy", { size: 66, cls: "wiggle" })}<div><h1>Reading Studio</h1><p>Choose a dialogue, pick your character, listen, then record your voice!</p>${S.bm("Pilih dialog, pilih watak, dengar, kemudian rakam suara anda.")}</div></div>
      <div class="card row" style="margin-bottom:16px;background:linear-gradient(120deg,#FFF5DA,#fff)" id="checkCard"><span style="font-size:3rem">🪁</span><div class="grow"><b style="font-size:1.2rem">Reading Check</b><div class="small muted">A short dialogue your teacher uses to see how much you grow (${PA.settings.get("checkMode", "pre") === "post" ? "after" : "before"} practising).</div></div><a class="btn btn-feel" href="#/studio/check">Start</a></div>
      <div class="row" style="margin-bottom:14px" id="dfilter"><b>Show:</b><div class="seg">${[["all", "All"], ["easy", "🌱 Easy"], ["medium", "🌿 Medium"], ["hard", "🌳 Hard"]].map(([k, v]) => `<button data-f="${k}" class="${filt === k ? "on" : ""}">${v}</button>`).join("")}</div></div>
      <div class="grid g3" id="dlgs">${all.map(card).join("")}</div>`);
    const apply = (f) => $$("#dlgs .dlg-card").forEach((c) => (c.style.display = f === "all" || c.dataset.l === f ? "" : "none"));
    apply(filt);
    $("#dfilter").onclick = (e) => { const b = e.target.closest("[data-f]"); if (!b) return; $$("#dfilter button").forEach((x) => x.classList.toggle("on", x === b)); PA.settings.set("studioFilter", b.dataset.f); apply(b.dataset.f); };
    $("#dlgs").onclick = (e) => { const c = e.target.closest("[data-d]"); if (c) { PA.sfx("pop"); location.hash = "#/studio/" + c.dataset.d; } };
  };

  /* ---------- One dialogue ---------- */
  S.pages.dialogue = async ({ id }) => {
    S.setTab("studio");
    const d = await PA.Model.dialogue(id);
    if (!d) return (location.hash = "#/studio");
    const pid = S.pupil.id;
    const models = {}; for (let i = 0; i < d.lines.length; i++) models[i] = await PA.Model.model(d.id, i);
    const anyModel = Object.values(models).some(Boolean);
    let role = id === "check" ? "all" : PA.settings.get(`role:${pid}:${id}`, null);
    let useTeacher = anyModel && PA.settings.get("useTeacherVoice", true);
    let cues = PA.settings.get("cues", d.level !== "hard");
    let disguise = PA.settings.get("disguise:" + pid, "none");
    const takes = {};
    const isMine = (i) => role === "all" || String(d.lines[i].c) === String(role);

    S.mount(`<div class="stage-banner" id="banner"><span class="scene">${d.scene || "🎭"}</span><div class="grow"><h1>${esc(d.title)}</h1><div style="opacity:.85">${esc(d.setting || "")}</div></div>
        <div class="col" style="gap:6px"><b>I am reading:</b><div class="cast" id="cast">${d.cast.map((c, i) => `<button data-r="${i}"><span class="av">${c.av}</span>${esc(c.name)}</button>`).join("")}<button data-r="all"><span class="av">👥</span>All parts</button></div></div></div>
      <div class="studio-tools" id="tools">
        <a class="btn btn-sm btn-ghost" href="#/studio">⬅ Studio</a>
        <span class="tool">Model voice: ${anyModel ? `<select id="mv"><option value="t" ${useTeacher ? "selected" : ""}>👩‍🏫 Teacher</option><option value="c" ${!useTeacher ? "selected" : ""}>💻 Computer</option></select>` : "💻 Computer"}</span>
        <label class="tool"><input type="checkbox" id="cueT" ${cues ? "checked" : ""}> Voice signs above marks</label>
        <span class="tool">🎭 Disguise: <span class="disguise" id="dis">${Object.entries(PA.Disguise.presets).map(([k, v]) => `<button data-v="${k}" class="${k === disguise ? "on" : ""}" title="${v.label}">${v.emoji}</button>`).join("")}</span></span>
        <button class="btn btn-sm btn-ask" id="playAll">▶ Listen to the whole dialogue</button>
        <button class="btn btn-sm btn-stop" id="rp">🎬 Role-play mode</button>
      </div>
      <div class="small muted" id="disNote" style="margin:-6px 0 12px"></div>
      <div id="lines"></div>`);

    const linesEl = $("#lines");
    const lineText = (l) => PA.ReadAlong.html(l.text, { cues, emotion: l.emo });
    function renderLines() {
      linesEl.innerHTML = d.lines.map((l, i) => { const c = d.cast[l.c] || d.cast[0]; const mine = isMine(i); return `<div class="line ${mine ? "mine" : ""}" data-i="${i}">
        <div><div class="who-av">${c.av}</div><div class="who-n">${esc(c.name)}</div></div>
        <div><div class="txt" data-t="${i}">${lineText(l)}</div>
          <div class="line-tools"><button class="btn btn-sm btn-ask" data-a="hear" data-i="${i}">🔊 Listen${useTeacher && models[i] ? " (teacher)" : ""}</button>
          ${mine ? `<button class="btn btn-sm btn-stop rec-btn" data-a="rec" data-i="${i}">🎙 Record</button><span class="meter"><i data-m="${i}"></i></span>` : ""}
          ${l.emo ? `<span class="pill">${PA.EMOTIONS[l.emo] ? PA.EMOTIONS[l.emo].emoji + " " + PA.EMOTIONS[l.emo].label : ""}</span>` : ""}</div>
          <div data-out="${i}"></div></div></div>`; }).join("");
      Object.keys(takes).forEach((i) => showTake(+i));
    }
    function setRole(r) { role = r; if (id !== "check") PA.settings.set(`role:${pid}:${id}`, r); $$("#cast button").forEach((b) => b.classList.toggle("on", b.dataset.r === String(r))); renderLines(); }
    function disNote() { const p = PA.Disguise.presets[disguise]; $("#disNote").innerHTML = disguise === "none" ? "🙂 Your teacher will hear your real voice. Feeling shy? Pick a disguise 🐭 🐻 👽. Your pauses and up-and-down voice stay the same!" : `${p.emoji} Voice disguise is ON: everyone (including your teacher) will hear a <b>${p.label}</b> voice. Your pauses and intonation stay exactly the same.`; }
    if (role == null) { setTimeout(() => PA.toast("Tap a character at the top to choose your part 👆"), 400); role = "all"; }
    setRole(role); disNote();

    $("#cast").onclick = (e) => { const b = e.target.closest("[data-r]"); if (b) { PA.sfx("pop"); setRole(b.dataset.r === "all" ? "all" : +b.dataset.r); } };
    if ($("#mv")) $("#mv").onchange = (e) => { useTeacher = e.target.value === "t"; PA.settings.set("useTeacherVoice", useTeacher); renderLines(); };
    $("#cueT").onchange = (e) => { cues = e.target.checked; PA.settings.set("cues", cues); renderLines(); };
    $("#dis").onclick = async (e) => { const b = e.target.closest("[data-v]"); if (!b) return; disguise = b.dataset.v; PA.settings.set("disguise:" + pid, disguise); $$("#dis button").forEach((x) => x.classList.toggle("on", x === b)); disNote(); PA.sfx("pop");
      for (const i of Object.keys(takes)) { takes[i].dis = null; showTake(+i); } };

    /* model voice for a line */
    async function playModel(i) {
      const l = d.lines[i], c = d.cast[l.c] || d.cast[0], el = $(`[data-t="${i}"]`);
      if (useTeacher && models[i]) {
        $$(".w", el).forEach((w) => w.classList.add("reading"));
        const p = PA.playBlob(models[i]); await p.promise;
        $$(".w", el).forEach((w) => w.classList.remove("reading")); return true;
      }
      return PA.ReadAlong.play(el, l.text, { emotion: l.emo, voice: PA.Voice.forCharacter(l.c, c), pitch: c.pitch || 1 });
    }
    async function takeBlob(i) {
      const t = takes[i]; if (!t) return null;
      if (disguise === "none") return t.r.wav;
      if (!t.dis || t.disKind !== disguise) { t.dis = PA.encodeWav(PA.Disguise.process(t.r.samples, disguise), PA.SR); t.disKind = disguise; }
      return t.dis;
    }

    linesEl.onclick = async (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const i = +b.dataset.i;
      if (b.dataset.a === "hear") { PA.Voice.stop(); playModel(i); }
      if (b.dataset.a === "rec") recordLine(i, b);
      if (b.dataset.a === "playme") { const bl = await takeBlob(i); if (bl) PA.playBlob(bl); }
      if (b.dataset.a === "both") { await playModel(i); await PA.sleep(300); const bl = await takeBlob(i); if (bl) PA.playBlob(bl); }
      if (b.dataset.a === "send") sendTake(i, b);
    };

    /* record one line (manual stop, or auto-stop after silence) */
    let autoDone = null;
    async function recordLine(i, btn, auto = false) {
      if (PA.Recorder.active) {
        const r = await PA.Recorder.stop(); const t = await gotTake(i, r, btn);
        if (autoDone) { const f = autoDone; autoDone = null; f(t); }
        return t;
      }
      if (!PA.Recorder.supported()) { PA.toast("No microphone on this device. Try Chrome on a tablet or laptop. 🎤", "bad"); return null; }
      PA.Voice.stop();
      const meter = $(`[data-m="${i}"]`);
      let spoke = 0, quiet = 0;
      return new Promise(async (resolve) => {
        let settled = false;
        const finish = async (r) => { if (settled) return; settled = true; autoDone = null; resolve(await gotTake(i, r, btn)); };
        if (auto) autoDone = (t) => { if (!settled) { settled = true; resolve(t); } };
        try {
          await PA.Recorder.start({ maxSec: 20, onAutoStop: finish, onLevel: async (lv) => {
            if (meter) meter.style.width = Math.min(100, lv.rms * 400) + "%";
            if (!auto) return;
            if (lv.rms > 0.035) { spoke++; quiet = 0; } else if (spoke > 8) quiet++;
            if (spoke > 8 && quiet > 85 && PA.Recorder.active) { const r = await PA.Recorder.stop(); finish(r); }
          } });
          btn.classList.add("recording"); btn.textContent = "⏹ Stop"; PA.sfx("tap");
          if (!auto) { btn.onclick = null; resolve(null); }
        } catch (err) { PA.toast("Please allow the microphone. 🎤", "bad"); resolve(null); }
      });
    }
    async function gotTake(i, r, btn) {
      btn = btn || $(`[data-a="rec"][data-i="${i}"]`);
      if (btn) { btn.classList.remove("recording"); btn.textContent = "🎙 Record again"; }
      const meter = $(`[data-m="${i}"]`); if (meter) meter.style.width = "0";
      if (!r) return null;
      const l = d.lines[i];
      const an = PA.Analyse.run(r.samples, r.sr);
      const rep = PA.Analyse.report(an, l.text, { emotion: l.emo });
      let modelAn = null;
      if (models[i]) { try { const dm = await PA.Analyse.decode(models[i]); modelAn = PA.Analyse.run(dm.samples, dm.sr); } catch (e) {} }
      takes[i] = { r, an, rep, modelAn, sent: false };
      showTake(i);
      PA.sfx(rep.empty ? "wrong" : "correct");
      return takes[i];
    }
    function showTake(i) {
      const t = takes[i]; const out = $(`[data-out="${i}"]`); if (!t || !out) return;
      const l = d.lines[i];
      const marks = new Set(PA.Lang.tokenize(l.text).filter((x) => x.type === "mark").map((x) => PA.Lang.normMark(x.mark)));
      const checks = [[".", "stop", "I stopped at the full stop 🛑"], [",", "pause", "I took a breath at the comma 💨"], ["?", "ask", "My voice asked the question ❓"], ["!", "feel", "I showed the feeling 💥"]].filter(([m]) => marks.has(m));
      out.innerHTML = S.coachHtml(t.rep, t.modelAn ? "Grey dashed line = your teacher's voice." : "") +
        `<div class="coach" style="margin-top:8px"><b>✅ Check yourself</b><div class="selfcheck">${checks.map(([, k, txt]) => `<label><input type="checkbox" data-sc="${k}" ${t.self && t.self[k] ? "checked" : ""}> ${txt}</label>`).join("")}</div>
        <div class="row"><button class="btn btn-sm btn-ghost" data-a="both" data-i="${i}">🔁 Model, then me</button><button class="btn btn-sm btn-good" data-a="send" data-i="${i}" ${t.sent ? "disabled" : ""}>${t.sent ? "✓ Sent to teacher" : "📨 Send to my teacher"}</button>
        <span class="small muted">${disguise !== "none" ? `Sends as ${PA.Disguise.presets[disguise].emoji} ${PA.Disguise.presets[disguise].label}` : "Sends your real voice"}</span></div></div>`;
      const cv = out.querySelector("canvas"); if (cv) PA.Analyse.draw(cv, t.an, { model: t.modelAn });
      const pm = out.querySelector("[data-playme]"); if (pm) { pm.dataset.a = "playme"; pm.dataset.i = i; }
      out.querySelectorAll("[data-sc]").forEach((c) => (c.onchange = () => { t.self = t.self || {}; t.self[c.dataset.sc] = c.checked; }));
    }
    async function sendTake(i, btn) {
      const t = takes[i]; if (!t || t.sent) return;
      if (S.pupil.guest) return PA.toast("Guests can't send work. Ask your teacher to add your name! 🙂");
      btn.disabled = true;
      const l = d.lines[i];
      const blob = await takeBlob(i);
      await PA.Model.saveRecording({ pupilId: pid, pupilName: S.pupil.name, dialogueId: d.id, dialogueTitle: d.title, lineIdx: i, character: (d.cast[l.c] || {}).name, text: l.text, emo: l.emo || null,
        blob, disguise, sharedAs: disguise === "none" ? "real" : "disguised", duration: t.r.duration,
        analysis: t.rep.empty ? { empty: true } : { robot: t.rep.robot, stars: t.rep.stars, tips: t.rep.tips, endTone: t.an.endTone, pauses: t.an.pauses.length, pitchStd: +t.an.pitchStd.toFixed(2), pitchRange: +t.an.pitchRange.toFixed(1), choppy: t.rep.choppy },
        self: t.self || {}, kind: d.id === "check" ? PA.settings.get("checkMode", "pre") : "studio", level: d.level });
      t.sent = true;
      S.pupil.recCount = (S.pupil.recCount || 0) + 1; S.pupil.stars = (S.pupil.stars || 0) + 2;
      const nb = PA.Model.checkBadges(S.pupil); await S.save();
      // complete dialogue missions when every line of my part has been sent
      const sent = (await PA.Model.recordingsFor(pid)).filter((r) => r.dialogueId === d.id).map((r) => r.lineIdx);
      if (d.lines.every((ln, k) => !isMine(k) || sent.includes(k))) await PA.Model.completeAssignments(S.pupil, (a) => a.type === "dialogue" && a.ref === d.id);
      showTake(i); PA.toast("Sent to your teacher! +2 ⭐", "good"); PA.sfx("correct");
      S.celebrate(nb);
    }

    /* whole dialogue with model voices */
    $("#playAll").onclick = async (e) => {
      const btn = e.currentTarget; if (btn.dataset.on) { btn.dataset.on = ""; PA.Voice.stop(); return; }
      btn.dataset.on = 1; btn.textContent = "⏹ Stop";
      for (let i = 0; i < d.lines.length && btn.dataset.on; i++) {
        const row = $(`.line[data-i="${i}"]`); row.classList.add("live"); row.scrollIntoView({ block: "center", behavior: "smooth" });
        const ok = await playModel(i); row.classList.remove("live"); if (ok === false) break; await PA.sleep(450);
      }
      btn.dataset.on = ""; btn.textContent = "▶ Listen to the whole dialogue";
    };

    /* Role-play mode: the app reads the other parts, the pupil reads theirs when it's their turn */
    $("#rp").onclick = async () => {
      if (role === "all" && d.cast.length > 1 && id !== "check") { PA.toast("First choose your character at the top 👆"); $("#cast").scrollIntoView({ behavior: "smooth" }); return; }
      if (!PA.Recorder.supported()) return PA.toast("Role-play mode needs a microphone. 🎤", "bad");
      const ok = await PA.modal({ title: "🎬 Role-play mode", body: `<p class="read">The app will read the other characters. When it's <b>your turn</b>, the line turns red and the microphone starts. Read your line, then stay quiet for a moment and the app will continue. You can also press <b>⏹ Stop</b>.</p>`, actions: [{ label: "Not now", cls: "btn-ghost", value: false }, { label: "Action! 🎬", cls: "btn-stop", value: true }] });
      if (!ok) return;
      let banner;
      for (let i = 0; i < d.lines.length; i++) {
        const row = $(`.line[data-i="${i}"]`); row.classList.add("live"); row.scrollIntoView({ block: "center", behavior: "smooth" });
        if (isMine(i)) {
          banner = document.createElement("div"); banner.className = "turn-banner"; banner.textContent = "🎙 Your turn! Read now…"; document.body.appendChild(banner);
          PA.sfx("pop"); await PA.sleep(450);
          const btn = $(`[data-a="rec"][data-i="${i}"]`);
          await recordLine(i, btn, true);
          banner.remove();
        } else await playModel(i);
        row.classList.remove("live"); await PA.sleep(350);
      }
      PA.confetti(); PA.sfx("win");
      const v = await PA.modal({ title: "🎉 Scene complete!", body: `<div class="center">${PA.mascot("bip", { size: 110, mood: "happy", cls: "bob" })}<p class="read">Great acting! Do you want to hear your whole scene together?</p></div>`, actions: [{ label: "Close", cls: "btn-ghost", value: 0 }, { label: "▶ Play our scene", cls: "btn-ask", value: 1 }] });
      if (v) for (let i = 0; i < d.lines.length; i++) {
        const row = $(`.line[data-i="${i}"]`); row.classList.add("live"); row.scrollIntoView({ block: "center", behavior: "smooth" });
        if (isMine(i) && takes[i]) { const p = PA.playBlob(await takeBlob(i)); await p.promise; } else await playModel(i);
        row.classList.remove("live"); await PA.sleep(300);
      }
    };
  };
})();
