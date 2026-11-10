/* PunctuAction — Teacher Hub: assess recordings (rubric) + record your own model voices */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const T = PA.T;

  T.RUBRIC = [
    { k: "stop", name: "Full stop .", icon: "🛑", bands: ["Runs through full stops", "Stops sometimes", "Stops at most full stops", "Always stops; voice falls and rests"] },
    { k: "pause", name: "Comma ,", icon: "💨", bands: ["Ignores commas or pauses after every word", "Pauses at some commas", "Short pause at most commas", "Natural short breath at every comma"] },
    { k: "ask", name: "Question ?", icon: "❓", bands: ["Questions sound like statements", "Some asking tone", "Rising tone on most Yes/No questions", "Correct rise (Yes/No) and fall (WH)"] },
    { k: "feel", name: "Exclamation !", icon: "💥", bands: ["Flat, no feeling", "Some feeling, may not fit", "Feeling fits most lines", "Expressive; feeling fits the context"] },
    { k: "fluency", name: "Expression & fluency", icon: "🎭", bands: ["Robotic, word by word", "Hesitant, little expression", "Mostly smooth and expressive", "Smooth and natural, like real talk"] }
  ];
  T.BANDS = ["Beginning", "Developing", "Achieving", "Excelling"];
  const QUICK = ["Great stops at the full stops! 🛑", "Remember to take a tiny breath at each comma. 💨", "Lift your voice at the end of Yes/No questions ↗", "WH questions: start strong, then let your voice fall ↘", "Show more feeling at the exclamation mark! 💥", "Lovely expression, not a robot at all! 🎭", "Try reading the words between the marks smoothly, like a wave 🌊"];
  /* suggested PBD Tahap Penguasaan (TP1–6) from the rubric average — teacher's judgement is final */
  T.tp = (avg) => (avg == null ? null : Math.max(1, Math.min(6, Math.round(1 + ((avg - 1) * 5) / 3))));

  T.pages.assess = async ({ query = {} } = {}) => {
    T.setTab("assess");
    const all = (await PA.DB.all("recordings")).sort((a, b) => b.at - a.at);
    const pupils = await PA.Model.pupils();
    const f = Object.assign({ status: "new", kind: "all", pupil: "all" }, PA.settings.get("assessFilter", {}));
    if (query.r) { f.status = "all"; f.pupil = "all"; }
    T.mount(T.head("Assess recordings", "Listen, look at the voice melody line, then score with the rubric. Pupils see your stars, stickers and comment in their mailbox.") +
      `<div class="row" style="margin-bottom:12px" id="af">
        <select class="input" style="width:auto" data-f="status"><option value="new">🟡 To assess</option><option value="assessed">✅ Assessed</option><option value="all">All</option></select>
        <select class="input" style="width:auto" data-f="kind"><option value="all">All types</option><option value="studio">Studio practice</option><option value="pre">Pre-test</option><option value="post">Post-test</option></select>
        <select class="input" style="width:auto" data-f="pupil"><option value="all">All pupils</option>${pupils.map((p) => `<option value="${p.id}">${p.avatar} ${esc(p.name)}</option>`).join("")}</select></div>
      <div class="tgrid" style="grid-template-columns:minmax(260px,380px) 1fr;align-items:start" id="agrid"><div class="tcard" id="alist" style="max-height:75vh;overflow:auto"></div><div class="tcard" id="adetail"><div class="empty-state">Choose a recording on the left.</div></div></div>`);
    if (innerWidth < 900) $("#agrid").style.gridTemplateColumns = "1fr";
    $$("#af select").forEach((s) => { s.value = f[s.dataset.f]; s.onchange = () => { f[s.dataset.f] = s.value; PA.settings.set("assessFilter", f); list(); }; });
    let cur = null;
    function list() {
      const rows = all.filter((r) => (f.status === "all" || r.status === f.status) && (f.kind === "all" || r.kind === f.kind) && (f.pupil === "all" || r.pupilId === f.pupil));
      const pmap = Object.fromEntries(pupils.map((p) => [p.id, p]));
      $("#alist").innerHTML = rows.length ? rows.map((r) => `<div class="rec-row ${cur && cur.id === r.id ? "on" : ""}" data-r="${r.id}"><span style="font-size:1.6rem">${(pmap[r.pupilId] || {}).avatar || "🙂"}</span><div><b>${esc(r.pupilName)}</b> <span class="small muted">${PA.ago(r.at)}</span><div class="t">${esc(r.text.length > 60 ? r.text.slice(0, 60) + "…" : r.text)}</div><div class="small muted">${esc(r.dialogueTitle || "")}${r.kind !== "studio" ? ` · <b>${r.kind.toUpperCase()}</b>` : ""}${r.sharedAs === "disguised" ? " · " + PA.Disguise.presets[r.disguise].emoji : ""}</div></div>${r.status === "assessed" ? `<span class="pill pill-good">${(T.overall(r.assessment.scores) || 0).toFixed(1)}</span>` : `<span class="pill pill-feel">New</span>`}</div>`).join("")
        : `<div class="empty-state">Nothing here. ${f.status === "new" ? "All caught up! 🎉" : ""}</div>`;
    }
    $("#alist").onclick = (e) => { const r = e.target.closest("[data-r]"); if (r) show(all.find((x) => x.id === r.dataset.r)); };
    list();
    const first = query.r ? all.find((x) => x.id === query.r) : null;
    if (first) show(first);

    async function show(r) {
      cur = r; list();
      const marks = new Set(PA.Lang.tokenize(r.text).filter((t) => t.type === "mark").map((t) => PA.Lang.normMark(t.mark)));
      const applies = { stop: marks.has(".") || PA.Lang.sentences(r.text).length > 0, pause: marks.has(","), ask: marks.has("?"), feel: marks.has("!"), fluency: true };
      const sc = Object.assign({}, (r.assessment && r.assessment.scores) || {});
      let stickers = (r.assessment && r.assessment.stickers) ? r.assessment.stickers.slice() : [];
      const a = r.analysis || {};
      const d = $("#adetail");
      d.innerHTML = `<div class="row"><h3 style="margin:0">${esc(r.pupilName)} · ${esc(r.dialogueTitle || "")}</h3><span class="small muted">${esc(r.character || "")} · ${PA.fmtDate(r.at)}</span>${r.kind !== "studio" ? `<span class="pill pill-bip">${r.kind === "pre" ? "Pre-test" : "Post-test"}</span>` : ""}</div>
        <div class="read" style="font-size:1.5rem;margin:12px 0;line-height:2" id="atext">${PA.ReadAlong.html(r.text, { cues: true, emotion: r.emo })}</div>
        <div class="row"><audio controls src="${r.blob ? URL.createObjectURL(r.blob) : ""}" style="height:40px;max-width:100%"></audio><button class="btn btn-sm btn-ghost" id="amodel">🔊 Model voice</button>
          ${r.sharedAs === "disguised" ? `<span class="pill pill-bip">${PA.Disguise.presets[r.disguise].emoji} Pupil chose a disguised voice (timing & intonation kept)</span>` : ""}</div>
        <div class="coach" style="margin-top:12px;background:#F7F8FF;border-radius:16px;padding:12px"><b>🎵 Voice melody line</b> <span class="small muted">(blue = pupil; grey dashed = your model voice, if recorded)</span><canvas id="acv"></canvas>
          ${a.empty ? `<div class="small muted">Bip could not hear a clear voice in this recording.</div>` : `<div class="robo" style="margin-top:8px"><span class="small">🤖 Robot</span><div class="robo-bar"><i style="left:calc(${a.robot || 0}% - 3px)"></i></div><span class="small">🎭 Expressive</span></div>
          <div class="row small" style="margin-top:6px">${Object.entries(a.stars || {}).map(([k, v]) => `<span class="pill pill-${k}">${PA.SKILL_NAME[k]} ${"⭐".repeat(v)}</span>`).join("")}<span class="pill">Pauses heard: ${a.pauses}</span><span class="pill">End tone: ${{ rise: "↗ rising", fall: "↘ falling", level: "→ level" }[a.endTone] || "–"}</span><span class="pill">Pitch range: ${a.pitchRange} st</span>${a.choppy ? '<span class="pill pill-bad">Word-by-word reading</span>' : ""}</div>`}
          <div class="small" style="margin-top:6px"><b>Pupil's self-check:</b> ${Object.entries(r.self || {}).filter(([, v]) => v).map(([k]) => `✅ ${PA.SKILL_NAME[k]}`).join(" · ") || "<span class='muted'>none ticked</span>"}</div></div>
        <h3 style="margin-top:16px">Rubric <button class="btn btn-sm btn-ghost" id="asug" style="margin-left:auto">🤖 Start from Bip's suggestion</button></h3>
        <div class="tscroll"><table class="rubric"><tbody>${T.RUBRIC.map((c) => `<tr><td class="crit">${c.icon} ${c.name}</td>${applies[c.k] ? c.bands.map((b, i) => `<td><button class="band ${sc[c.k] === i + 1 ? "on" : ""}" data-c="${c.k}" data-v="${i + 1}"><b>${i + 1} · ${T.BANDS[i]}</b>${b}</button></td>`).join("") : `<td colspan="4"><span class="small muted">Not in this line (N/A)</span></td>`}</tr>`).join("")}</tbody></table></div>
        <div class="row" style="margin:8px 0"><b>Overall:</b> <span id="aov">–</span></div>
        <div class="field"><label>Stickers</label><div class="stickers" id="ast">${Object.entries(PA.STICKERS || { star: "🌟", fire: "🔥", rocket: "🚀", heart: "💖", trophy: "🏆", clap: "👏", brain: "🧠", rainbow: "🌈" }).map(([k, v]) => `<button data-s="${k}" class="${stickers.includes(k) ? "on" : ""}">${v}</button>`).join("")}</div></div>
        <div class="field"><label>Comment for the pupil</label><div class="row" style="gap:6px;margin-bottom:6px">${QUICK.map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q.slice(0, 28))}…</button>`).join("")}</div><textarea class="input" id="acom">${esc((r.assessment && r.assessment.comment) || "")}</textarea></div>
        <div class="row"><button class="btn btn-good" id="asave">💾 Save & send to pupil</button><button class="btn btn-ghost" id="anext">Skip ➡</button><button class="btn btn-sm btn-stop" id="adel" style="margin-left:auto">🗑 Delete recording</button></div>`;
      const overall = () => { const v = Object.entries(sc).filter(([k, x]) => applies[k] && x).map(([, x]) => x); const avg = v.length ? PA.avg(v) : null;
        $("#aov").innerHTML = avg == null ? "–" : `<b>${avg.toFixed(1)} / 4</b> (${T.BANDS[Math.round(avg) - 1]}) · suggested PBD level <b>TP${T.tp(avg)}</b> <span class="small muted">(your judgement is final)</span>`; };
      overall();
      // waveform analysis
      if (r.blob) (async () => { try { const dd = await PA.Analyse.decode(r.blob); const an = PA.Analyse.run(dd.samples, dd.sr); let model = null; const mb = await PA.Model.model(r.dialogueId, r.lineIdx); if (mb) { const md = await PA.Analyse.decode(mb); model = PA.Analyse.run(md.samples, md.sr); } PA.Analyse.draw($("#acv"), an, { model }); } catch (e) { PA.Analyse.draw($("#acv"), { empty: true }); } })();
      $("#amodel").onclick = async () => { const mb = await PA.Model.model(r.dialogueId, r.lineIdx); if (mb) PA.playBlob(mb); else PA.ReadAlong.play($("#atext"), r.text, { emotion: r.emo }); };
      d.onclick = (e) => {
        const b = e.target.closest(".band"); if (b) { sc[b.dataset.c] = +b.dataset.v; $$(`.band[data-c="${b.dataset.c}"]`, d).forEach((x) => x.classList.toggle("on", x === b)); overall(); }
        const s = e.target.closest("[data-s]"); if (s) { s.classList.toggle("on"); stickers = $$("#ast .on", d).map((x) => x.dataset.s); }
        const q = e.target.closest("[data-q]"); if (q) { const t = $("#acom"); t.value = (t.value ? t.value + " " : "") + q.dataset.q; }
      };
      $("#asug").onclick = () => { const st = a.stars || {}; T.RUBRIC.forEach((c) => { if (!applies[c.k]) return; let v = c.k === "fluency" ? (a.choppy ? 1 : a.robot > 70 ? 4 : a.robot > 40 ? 3 : 2) : st[c.k] ? Math.min(4, st[c.k] + 1) : null; if (v) { sc[c.k] = v; $$(`.band[data-c="${c.k}"]`, d).forEach((x) => x.classList.toggle("on", +x.dataset.v === v)); } }); overall(); PA.toast("Filled from Bip's analysis. Please listen and adjust. 🎧"); };
      $("#asave").onclick = async () => {
        const scores = {}; T.RUBRIC.forEach((c) => (scores[c.k] = applies[c.k] ? sc[c.k] || null : null));
        if (!Object.values(scores).some(Boolean)) return PA.toast("Choose at least one band.", "bad");
        r.assessment = { scores, stickers, comment: $("#acom").value.trim(), at: Date.now() }; r.status = "assessed";
        await PA.DB.put("recordings", r); PA.toast("Saved. The pupil will see it in their mailbox. 📬", "good"); PA.sfx("correct");
        nextOne();
      };
      $("#anext").onclick = nextOne;
      $("#adel").onclick = async () => { if (!(await PA.confirmBox("Delete this recording?", "It will be removed from this device.", "Delete"))) return; await PA.DB.del("recordings", r.id); all.splice(all.indexOf(r), 1); cur = null; list(); d.innerHTML = `<div class="empty-state">Deleted.</div>`; };
      function nextOne() { const rows = all.filter((x) => x.status === "new" && x.id !== r.id && (f.pupil === "all" || x.pupilId === f.pupil)); list(); if (rows.length) show(rows[0]); else d.innerHTML = `<div class="empty-state">${PA.mascot("bip", { size: 80, mood: "happy" })}<p>All caught up! 🎉</p></div>`; }
    }
  };

  /* =================== MODEL VOICES =================== */
  T.pages.voices = async ({ query = {} } = {}) => {
    T.setTab("voices");
    const dls = (await PA.Model.dialogues()).concat([PA.READING_CHECK]);
    const models = await PA.DB.all("models");
    const count = (id) => models.filter((m) => m.key.startsWith(id + ":")).length;
    const sel = query.d || PA.settings.get("voicesSel", dls[0].id);
    const d = dls.find((x) => x.id === sel) || dls[0];
    const vs = PA.Voice.list();
    const opt = (cur) => `<option value="">(automatic)</option>` + vs.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === cur ? "selected" : ""}>${esc(v.name)} (${v.lang})${v.localService ? " · offline" : ""}</option>`).join("");
    const cast = PA.settings.get("castVoices", []);
    T.mount(T.head("My model voices", "Your own voice is the most accurate model. Record each line once; pupils hear your voice first, and the computer voice is only a backup.") +
      `<div class="tgrid" style="grid-template-columns:1fr 340px;align-items:start" id="vgrid">
        <div class="tcard"><div class="row"><select class="input" id="vsel" style="width:auto">${dls.map((x) => `<option value="${x.id}" ${x.id === d.id ? "selected" : ""}>${x.scene || "🎭"} ${esc(x.title)} (${count(x.id)}/${x.lines.length})</option>`).join("")}</select>
          <label class="small"><input type="checkbox" id="vauto" checked> After I stop, go to the next line</label></div>
          <p class="small muted">Tips: read slowly and clearly, stop fully at full stops, breathe at commas, rise for Yes/No questions, fall for WH questions, and act the feeling at exclamation marks. Recording happens on this device only.</p>
          <div id="vlines">${d.lines.map((l, i) => { const c = d.cast[l.c] || d.cast[0]; const has = models.find((m) => m.key === `${d.id}:${i}`); return `<div class="vline" data-i="${i}"><div style="font-size:1.8rem;text-align:center">${c.av}<div class="small muted" style="font-size:.7rem">${esc(c.name)}</div></div>
            <div><div class="t">${PA.ReadAlong.html(l.text, { cues: true, emotion: l.emo })}</div><div class="small muted">${l.emo && PA.EMOTIONS[l.emo] ? "Feeling: " + PA.EMOTIONS[l.emo].emoji + " " + PA.EMOTIONS[l.emo].label : ""}</div></div>
            <div class="row" style="gap:6px;justify-content:flex-end"><button class="btn btn-sm btn-ghost" data-a="tts" data-i="${i}" title="Computer voice">💻</button><button class="btn btn-sm btn-stop rec-btn" data-a="rec" data-i="${i}">${has ? "🎙 Re-record" : "🎙 Record"}</button>
            ${has ? `<button class="btn btn-sm btn-ask" data-a="play" data-i="${i}">▶</button><button class="btn btn-sm btn-ghost" data-a="del" data-i="${i}" title="Delete">🗑</button><span class="check-ok">✓</span>` : `<span class="small muted">not yet</span>`}</div></div>`; }).join("")}</div></div>
        <div class="tcard"><h3>💻 Computer voice settings</h3><p class="small muted">Used only when no teacher recording exists. Voices marked “offline” work without internet.</p>
          <div class="field"><label>Narrator voice</label><select class="input" id="vnar">${opt(PA.settings.get("voiceURI", ""))}</select></div>
          ${[0, 1, 2, 3].map((i) => `<div class="field"><label>Character ${i + 1} voice</label><select class="input" data-cv="${i}">${opt(cast[i] || "")}</select></div>`).join("")}
          <div class="field"><label>Reading style</label><select class="input" id="vmode"><option value="teach" ${PA.Voice.mode() === "teach" ? "selected" : ""}>Teaching (slower, clear pauses)</option><option value="natural" ${PA.Voice.mode() === "natural" ? "selected" : ""}>Natural</option></select></div>
          <button class="btn btn-sm btn-ask" id="vtest">🔊 Test all four marks</button>
          ${vs.length ? "" : `<p class="small" style="color:var(--bad)">No English computer voice was found on this device. Install one in the device's text-to-speech settings, or record your own voice.</p>`}</div></div>`);
    if (innerWidth < 1000) $("#vgrid").style.gridTemplateColumns = "1fr";
    $("#vsel").onchange = (e) => { PA.settings.set("voicesSel", e.target.value); T.pages.voices({ query: { d: e.target.value } }); };
    $("#vnar").onchange = (e) => PA.settings.set("voiceURI", e.target.value);
    $$("[data-cv]").forEach((s) => (s.onchange = () => { const c = PA.settings.get("castVoices", []); c[+s.dataset.cv] = s.value; PA.settings.set("castVoices", c); }));
    $("#vmode").onchange = (e) => PA.settings.set("voiceMode", e.target.value);
    $("#vtest").onclick = () => PA.Voice.speak("Ali, are you ready? Where is your bag? Hooray, we won!", { emotion: "excited" });
    let recI = null;
    $("#vlines").onclick = async (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return; const i = +b.dataset.i; const l = d.lines[i];
      if (b.dataset.a === "tts") PA.ReadAlong.play($(`.vline[data-i="${i}"] .t`), l.text, { emotion: l.emo, pitch: (d.cast[l.c] || {}).pitch || 1, voice: PA.Voice.forCharacter(l.c) });
      if (b.dataset.a === "play") PA.playBlob(await PA.Model.model(d.id, i));
      if (b.dataset.a === "del") { if (await PA.confirmBox("Delete this recording?", "Pupils will hear the computer voice for this line instead.", "Delete")) { await PA.DB.del("models", `${d.id}:${i}`); T.pages.voices({ query: { d: d.id } }); } }
      if (b.dataset.a === "rec") {
        if (PA.Recorder.active) {
          const r = await PA.Recorder.stop(); b.classList.remove("recording");
          if (r && r.duration > 0.4) {
            await PA.DB.put("models", { key: `${d.id}:${recI}`, dialogueId: d.id, lineIdx: recI, blob: r.wav, at: Date.now() });
            PA.toast("Saved your voice for line " + (recI + 1) + " ✓", "good");
            const nxt = recI + 1, auto = $("#vauto").checked; await T.pages.voices({ query: { d: d.id } });
            if (auto && nxt < d.lines.length) { const nb = $(`[data-a="rec"][data-i="${nxt}"]`); if (nb) { nb.scrollIntoView({ block: "center", behavior: "smooth" }); nb.focus(); } }
          }
          return;
        }
        if (!PA.Recorder.supported()) return PA.toast("No microphone available on this device.", "bad");
        try { PA.Voice.stop(); recI = i; await PA.Recorder.start({ maxSec: 25 }); b.classList.add("recording"); b.textContent = "⏹ Stop"; } catch (err) { PA.toast("Please allow the microphone.", "bad"); }
      }
    };
  };
})();
