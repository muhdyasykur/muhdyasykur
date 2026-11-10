/* PunctuAction — Teacher Hub: dialogues builder, missions, evaluation analytics, data & settings, guide */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const T = PA.T;
  const csv = (rows, cols) => [cols.map((c) => c[0]).join(",")].concat(rows.map((r) => cols.map((c) => { const v = c[1](r); const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(","))).join("\n");
  const today = () => new Date().toISOString().slice(0, 10);

  /* =================== DIALOGUES =================== */
  T.pages.dialogues = async () => {
    T.setTab("dialogues");
    const all = await PA.Model.dialogues();
    T.mount(T.head("Dialogues", "12 ready-made role-plays (Year 1–6) plus your own. Write dialogues from your textbook unit; the app checks the punctuation as you type.", `<a class="btn btn-sm btn-ask" href="#/dialogues/new">➕ New dialogue</a>`) +
      `<div class="tcard tscroll"><table class="tt"><thead><tr><th></th><th>Title</th><th>Level</th><th>Lines</th><th>Marks used</th><th></th></tr></thead><tbody>${all.map((d) => { const mk = {}; d.lines.forEach((l) => PA.Lang.tokenize(l.text).forEach((t) => { if (t.type === "mark") { const m = PA.Lang.normMark(t.mark); mk[m] = (mk[m] || 0) + 1; } }));
        return `<tr><td style="font-size:1.6rem">${d.scene || "🎭"}</td><td><b>${esc(d.title)}</b><div class="small muted">${esc(d.setting || "")}</div></td><td>${T.LV[d.level] || d.level}<div class="small muted">${esc(d.years || "")}</div></td><td>${d.lines.length}</td>
          <td>${[".", ",", "?", "!"].map((m) => `<span class="pill pill-${PA.MARKS[m].key}">${m} ${mk[m] || 0}</span>`).join(" ")}</td>
          <td class="row" style="gap:6px;flex-wrap:nowrap"><a class="btn btn-sm btn-ghost" href="#/voices?d=${d.id}">🎙</a>${d.custom ? `<a class="btn btn-sm btn-ask" href="#/dialogues/${d.id}">✏️ Edit</a>` : `<a class="btn btn-sm btn-ghost" href="#/dialogues/copy-${d.id}">⧉ Copy & edit</a>`}</td></tr>`; }).join("")}</tbody></table></div>`);
  };
  T.pages.dialogueEdit = async ({ id }) => {
    T.setTab("dialogues");
    let d;
    if (id === "new") d = { id: PA.uid("dlg"), title: "", scene: "🎭", level: "medium", years: "Year 4", setting: "", cast: [{ name: "Ali", av: "👦", pitch: 1.2 }, { name: "Siti", av: "👧", pitch: 1.3 }], lines: [{ c: 0, text: "" }] };
    else if (id.startsWith("copy-")) { const src = await PA.Model.dialogue(id.slice(5)); d = JSON.parse(JSON.stringify(src)); d.id = PA.uid("dlg"); d.title += " (my version)"; delete d.custom; }
    else d = await PA.DB.get("dialogues", id);
    if (!d) return (location.hash = "#/dialogues");
    const PITCH = [[1.3, "Young child"], [1.15, "Child"], [1.0, "Adult (higher)"], [0.88, "Adult (lower)"], [0.78, "Older adult"]];
    function check(text, emo) {
      const t = text.trim(); if (!t) return "";
      const s = PA.Lang.sentences(t), out = [];
      if (!/[.?!]["”’]?$/.test(t)) out.push(`<span class="check-warn">⚠ Add an end mark (. ? !)</span>`);
      s.forEach((x) => { const c = PA.Lang.classify(x.text); const w = PA.Lang.firstWord(x.text);
        if (x.mark === "." && PA.Lang.WH.includes(w) && !/^(what an?|how)\b/i.test(x.text)) out.push(`<span class="check-warn">⚠ “${esc(x.text.slice(0, 24))}” starts with a WH word. Should it end with “?”</span>`);
        if (x.mark === "." && PA.Lang.AUX.includes(w)) out.push(`<span class="check-warn">⚠ “${esc(x.text.slice(0, 24))}” looks like a Yes/No question. Should it end with “?”</span>`);
        if (x.mark) out.push(`<span class="small">${{ wh: "↘ WH question", yn: "↗ Yes/No question", declq: "↗ Asking statement", excl: "💥 Exclamation", stmt: "🛑 Statement" }[c.type]}</span>`); });
      if (/!/.test(t) && !emo) out.push(`<span class="check-warn">⚠ Choose a feeling for the “!”</span>`);
      if (!out.some((o) => o.includes("check-warn"))) out.unshift(`<span class="check-ok">✓</span>`);
      return out.join(" · ");
    }
    function render() {
      T.mount(T.head(id === "new" ? "New dialogue" : "Edit dialogue", "Tip: give every “!” a feeling, and use a mix of . , ? ! so pupils practise all four.", `<a class="btn btn-sm btn-ghost" href="#/dialogues">⬅ Back</a>`) +
        `<div class="tgrid t2" style="align-items:start"><div class="tcard"><h3>About</h3>
          <div class="row"><div class="field" style="width:90px"><label>Picture</label><input class="input" id="de-scene" value="${esc(d.scene)}" maxlength="4"></div><div class="field grow"><label>Title</label><input class="input" id="de-title" value="${esc(d.title)}" placeholder="e.g. At the Pasar Malam"></div></div>
          <div class="field"><label>Setting (one sentence for pupils)</label><input class="input" id="de-set" value="${esc(d.setting || "")}"></div>
          <div class="row"><div class="field grow"><label>Level</label><select class="input" id="de-lv">${Object.entries(T.LV).map(([k, v]) => `<option value="${k}" ${k === d.level ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="field grow"><label>Years</label><input class="input" id="de-yr" value="${esc(d.years || "")}"></div></div></div>
        <div class="tcard"><h3>Characters</h3><div id="de-cast">${d.cast.map((c, i) => `<div class="cast-row"><input class="input" data-cn="${i}" value="${esc(c.name)}" placeholder="Name"><input class="input" data-ca="${i}" value="${esc(c.av)}" maxlength="4"><select class="input" data-cp="${i}">${PITCH.map(([v, l]) => `<option value="${v}" ${Math.abs(v - c.pitch) < 0.05 ? "selected" : ""}>${l}</option>`).join("")}</select>${d.cast.length > 1 ? `<button class="btn btn-sm btn-ghost" data-rmc="${i}">✕</button>` : ""}</div>`).join("")}</div>
          ${d.cast.length < 4 ? `<button class="btn btn-sm btn-ghost" id="de-addc">➕ Character</button>` : ""}</div></div>
        <div class="tcard" style="margin-top:16px"><h3>Lines</h3><div id="de-lines">${d.lines.map((l, i) => `<div class="dl-line"><select class="input" data-lc="${i}">${d.cast.map((c, j) => `<option value="${j}" ${j === l.c ? "selected" : ""}>${esc(c.av)} ${esc(c.name)}</option>`).join("")}</select>
          <div><input class="input read" data-lt="${i}" value="${esc(l.text)}" placeholder="Type the line with punctuation…"><div class="small" data-chk="${i}" style="margin-top:3px">${check(l.text, l.emo)}</div></div>
          <select class="input" data-le="${i}"><option value="">No feeling</option>${Object.entries(PA.EMOTIONS).map(([k, e]) => `<option value="${k}" ${k === l.emo ? "selected" : ""}>${e.emoji} ${e.label}</option>`).join("")}</select>
          <div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn btn-sm btn-ghost" data-lp="${i}" title="Preview">🔊</button>${d.lines.length > 1 ? `<button class="btn btn-sm btn-ghost" data-rml="${i}" title="Remove">✕</button>` : ""}</div></div>`).join("")}</div>
          <button class="btn btn-sm btn-ghost" id="de-addl">➕ Line</button></div>
        <div class="row" style="margin-top:16px"><button class="btn btn-good" id="de-save">💾 Save dialogue</button>${PA.DIALOGUES.some((x) => x.id === d.id) || id === "new" || id.startsWith("copy-") ? "" : `<button class="btn btn-stop" id="de-del">🗑 Delete</button>`}</div>`);
      const m = main();
      m.oninput = (e) => {
        const t = e.target;
        if (t.dataset.lt != null) { d.lines[+t.dataset.lt].text = t.value; $(`[data-chk="${t.dataset.lt}"]`).innerHTML = check(t.value, d.lines[+t.dataset.lt].emo); }
        if (t.dataset.cn != null) d.cast[+t.dataset.cn].name = t.value;
        if (t.dataset.ca != null) d.cast[+t.dataset.ca].av = t.value;
      };
      m.onchange = (e) => {
        const t = e.target;
        if (t.dataset.lc != null) d.lines[+t.dataset.lc].c = +t.value;
        if (t.dataset.le != null) { d.lines[+t.dataset.le].emo = t.value || undefined; $(`[data-chk="${t.dataset.le}"]`).innerHTML = check(d.lines[+t.dataset.le].text, t.value); }
        if (t.dataset.cp != null) d.cast[+t.dataset.cp].pitch = +t.value;
        if (t.dataset.cn != null || t.dataset.ca != null) render();
      };
      m.onclick = (e) => {
        const t = e.target.closest("button"); if (!t) return;
        if (t.id === "de-addl") { d.lines.push({ c: d.lines.length ? (d.lines[d.lines.length - 1].c + 1) % d.cast.length : 0, text: "" }); render(); }
        if (t.id === "de-addc") { d.cast.push({ name: "", av: "🧒", pitch: 1.15 }); render(); }
        if (t.dataset.rml != null) { d.lines.splice(+t.dataset.rml, 1); render(); }
        if (t.dataset.rmc != null) { const k = +t.dataset.rmc; d.cast.splice(k, 1); d.lines.forEach((l) => { if (l.c >= d.cast.length) l.c = 0; }); render(); }
        if (t.dataset.lp != null) { const l = d.lines[+t.dataset.lp]; PA.Voice.speak(l.text, { emotion: l.emo, pitch: (d.cast[l.c] || {}).pitch || 1, voice: PA.Voice.forCharacter(l.c) }); }
        if (t.id === "de-save") save();
        if (t.id === "de-del") del();
      };
    }
    async function save() {
      d.title = $("#de-title").value.trim(); d.scene = $("#de-scene").value.trim() || "🎭"; d.setting = $("#de-set").value.trim(); d.level = $("#de-lv").value; d.years = $("#de-yr").value.trim();
      d.lines = d.lines.filter((l) => l.text.trim());
      if (!d.title) return PA.toast("Please give the dialogue a title.", "bad");
      if (!d.lines.length) return PA.toast("Add at least one line.", "bad");
      if (d.cast.some((c) => !c.name.trim())) return PA.toast("Every character needs a name.", "bad");
      d.updatedAt = Date.now(); await PA.DB.put("dialogues", d); PA.toast("Saved! Pupils will see it in the Reading Studio.", "good"); location.hash = "#/dialogues";
    }
    async function del() { if (await PA.confirmBox("Delete dialogue?", "Pupils' recordings of it are kept.", "Delete")) { await PA.DB.del("dialogues", d.id); location.hash = "#/dialogues"; } }
    const main = () => $("#tmain");
    render();
  };

  /* =================== MISSIONS =================== */
  T.pages.missions = async () => {
    T.setTab("missions");
    const [list, pupils, dls] = [await PA.DB.all("assignments"), await PA.Model.pupils(), await PA.Model.dialogues()];
    const mode = PA.settings.get("checkMode", "pre");
    const tname = (a) => (a.type === "game" ? `${PA.Model.GAMES[a.ref].icon} ${PA.Model.GAMES[a.ref].name}` : `🎭 ${esc((dls.find((x) => x.id === a.ref) || PA.READING_CHECK).title)}`);
    T.mount(T.head("Missions", "Set work for the whole class or for selected pupils. Missions appear on the pupil's home page and tick themselves off when done.") +
      `<div class="tgrid t2" style="align-items:start"><div class="tcard"><h3>➕ New mission</h3>
        <div class="field"><label>Title</label><input class="input" id="m-title" placeholder="e.g. Practise question voices"></div>
        <div class="row"><div class="field grow"><label>Activity</label><select class="input" id="m-ref"><optgroup label="Games">${Object.entries(PA.Model.GAMES).map(([k, g]) => `<option value="game:${k}">${g.icon} ${g.name}</option>`).join("")}</optgroup><optgroup label="Reading Studio">${dls.concat([PA.READING_CHECK]).map((d) => `<option value="dialogue:${d.id}">${d.scene || "🎭"} ${esc(d.title)}</option>`).join("")}</optgroup></select></div>
        <div class="field" style="width:150px"><label>Level (games)</label><select class="input" id="m-lv"><option value="">Pupil's choice</option>${Object.entries(T.LV).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></div></div>
        <div class="field"><label>For</label><select class="input" id="m-to"><option value="all">Whole class</option><option value="some">Selected pupils…</option></select><div class="row" id="m-pp" hidden>${pupils.map((p) => `<label class="pill"><input type="checkbox" value="${p.id}"> ${p.avatar} ${esc(p.name)}</label>`).join("")}</div></div>
        <div class="row"><div class="field grow"><label>Due (optional)</label><input class="input" type="date" id="m-due"></div></div>
        <div class="field"><label>Note for pupils (optional)</label><input class="input" id="m-note" placeholder="e.g. Use your best question voice!"></div>
        <button class="btn btn-good" id="m-add">🎯 Give mission</button></div>
      <div class="tcard"><h3>🪁 Reading Check (pre-test / post-test)</h3><p class="small">All pupils read the same short dialogue (“The Kite”) with all four marks. Assess it with the rubric. Switch to <b>Post-test</b> after the practice period; the Evaluation page compares the two.</p>
        <div class="seg" id="m-mode" style="background:#F1F2F8"><button data-v="pre" class="${mode === "pre" ? "on" : ""}">Pre-test (before)</button><button data-v="post" class="${mode === "post" ? "on" : ""}">Post-test (after)</button></div>
        <p class="small muted" style="margin-top:10px">Tip: record your own voice for the Reading Check in “My model voices” so all pupils hear the same model.</p></div></div>
      <div class="tcard" style="margin-top:16px"><h3>Current missions</h3>${list.length ? `<div class="tscroll"><table class="tt"><thead><tr><th>Mission</th><th>Activity</th><th>For</th><th>Done</th><th>Due</th><th></th></tr></thead><tbody>${list.sort((a, b) => b.at - a.at).map((a) => { const target = a.to === "all" ? pupils : pupils.filter((p) => (a.to || []).includes(p.id)); const done = target.filter((p) => a.doneBy && a.doneBy[p.id]).length;
        return `<tr style="${a.active === false ? "opacity:.5" : ""}"><td><b>${esc(a.title)}</b>${a.note ? `<div class="small muted">${esc(a.note)}</div>` : ""}</td><td>${tname(a)}${a.level ? " · " + T.LV[a.level] : ""}</td><td>${a.to === "all" ? "Whole class" : target.map((p) => p.avatar).join(" ")}</td><td><div class="row" style="gap:6px"><span>${done}/${target.length}</span><div style="width:80px">${T.stack([{ v: done, color: T.C.pause, label: "Done" }, { v: target.length - done, color: "#E3E6F2", label: "Not yet" }])}</div></div></td><td class="small">${a.due ? PA.fmtDate(a.due, false) : "–"}</td>
          <td class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn btn-sm btn-ghost" data-tog="${a.id}">${a.active === false ? "▶ Resume" : "⏸ Pause"}</button><button class="btn btn-sm btn-ghost" data-del="${a.id}">🗑</button></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty-state">No missions yet.</div>`}</div>`);
    $("#m-to").onchange = (e) => ($("#m-pp").hidden = e.target.value !== "some");
    $("#m-mode").onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; PA.settings.set("checkMode", b.dataset.v); $$("#m-mode button").forEach((x) => x.classList.toggle("on", x === b)); PA.toast(`Reading Check now records as ${b.dataset.v === "pre" ? "PRE-test" : "POST-test"}.`, "good"); };
    $("#m-add").onclick = async () => {
      const [type, ref] = $("#m-ref").value.split(":");
      const to = $("#m-to").value === "all" ? "all" : $$("#m-pp input:checked").map((x) => x.value);
      if (Array.isArray(to) && !to.length) return PA.toast("Choose at least one pupil.", "bad");
      const title = $("#m-title").value.trim() || (type === "game" ? PA.Model.GAMES[ref].name : "Reading Studio mission");
      await PA.DB.put("assignments", { id: PA.uid("as"), title, type, ref, level: type === "game" ? $("#m-lv").value || null : null, to, due: $("#m-due").value ? new Date($("#m-due").value).getTime() : null, note: $("#m-note").value.trim(), at: Date.now(), active: true, doneBy: {} });
      PA.toast("Mission given! 🎯", "good"); T.pages.missions();
    };
    $("#tmain").onclick = async (e) => {
      const t = e.target.closest("[data-tog],[data-del]"); if (!t) return;
      if (t.dataset.tog) { const a = list.find((x) => x.id === t.dataset.tog); a.active = a.active === false; await PA.DB.put("assignments", a); T.pages.missions(); }
      if (t.dataset.del && (await PA.confirmBox("Delete mission?", "", "Delete"))) { await PA.DB.del("assignments", t.dataset.del); T.pages.missions(); }
    };
  };

  /* =================== EVALUATION =================== */
  T.pages.evaluation = async () => {
    T.setTab("evaluation");
    const [fb, attempts, recs, pupils] = [await PA.DB.all("feedback"), await PA.DB.all("attempts"), await PA.DB.all("recordings"), await PA.Model.pupils()];
    const sv = fb.filter((f) => f.kind === "survey"), gfb = fb.filter((f) => f.kind === "game");
    const FACES = [["😣", "Awful"], ["🙁", "Not very good"], ["🙂", "Good"], ["😀", "Really good"], ["🤩", "Brilliant"]];
    const smileC = [1, 2, 3, 4, 5].map((v) => sv.filter((s) => s.smiley === v).length);
    const AG = [["learn", "📚 Learn lessons"], ["practice", "🎮 Practice games"], ["studio", "🎭 Reading Studio"], ["chat", "🤖 Ask Bip"], ["disguise", "🎭 Voice disguise"]];
    const agC = (k, v) => sv.filter((s) => s.again && s.again[k] === v).length;
    const count = (arr) => arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
    const fav = count(sv.map((s) => s.fav).filter(Boolean)), helped = count(sv.map((s) => s.helped).filter(Boolean)), tricky = count(sv.flatMap((s) => s.tricky || []));
    const assessed = recs.filter((r) => r.status === "assessed");
    const crit = (kind, k) => { const v = assessed.filter((r) => r.kind === kind).map((r) => r.assessment.scores[k]).filter(Boolean); return v.length ? PA.avg(v) : null; };
    const pp = pupils.map((p) => { const a = (kind) => { const v = assessed.filter((r) => r.pupilId === p.id && r.kind === kind).map((r) => T.overall(r.assessment.scores)).filter((x) => x != null); return v.length ? PA.avg(v) : null; }; return { p, pre: a("pre"), post: a("post") }; }).filter((x) => x.pre != null || x.post != null);
    const both = pp.filter((x) => x.pre != null && x.post != null);
    const gain = both.length ? PA.avg(both.map((x) => x.post - x.pre)) : null;
    const games = Object.entries(PA.Model.GAMES).map(([k, g]) => { const a = attempts.filter((x) => x.game === k), f = gfb.filter((x) => x.game === k); return { k, g, plays: a.length, avg: a.length ? PA.avg(a.map((x) => x.pct)) : null, fun: f.filter((x) => x.fun).length ? PA.avg(f.filter((x) => x.fun).map((x) => x.fun)) : null, diff: count(f.map((x) => x.diff).filter(Boolean)) }; });
    const maxPlays = Math.max(1, ...games.map((x) => x.plays));
    T.mount(T.head("Evaluation & feedback", "Evidence for Stage 4 (Testing): pre/post-test results, pupils' Smileyometer and Again-Again ratings (Fun Toolkit), and usage analytics.",
      `<button class="btn btn-sm btn-ask" id="ev-csv">⬇ Export evaluation CSV</button><button class="btn btn-sm btn-ghost" onclick="window.print()">🖨 Print</button>`) +
      `<div class="kpis"><div class="kpi"><div class="v">${sv.length}</div><div class="l">Pupil surveys</div></div>
        <div class="kpi"><div class="v">${sv.length ? PA.avg(sv.map((s) => s.smiley)).toFixed(2) : "–"}</div><div class="l">Mean Smileyometer (1–5)</div></div>
        <div class="kpi"><div class="v">${sv.length ? Math.round(((helped.yes || 0) / sv.length) * 100) + "%" : "–"}</div><div class="l">Say it helped “a lot”</div></div>
        <div class="kpi"><div class="v">${gain == null ? "–" : (gain >= 0 ? "+" : "") + gain.toFixed(2)}</div><div class="l">Mean rubric gain (pre → post)</div><div class="s">${both.length} pupils with both tests</div></div></div>
      <div class="tgrid t2">
        <div class="tcard"><h3>📈 Pre-test vs post-test <span class="small muted">class average rubric band (1–4)</span></h3>${assessed.some((r) => r.kind !== "studio") ? T.gbars(T.RUBRIC.map((c) => ({ label: `${c.icon} ${c.name}`, vals: [crit("pre", c.k), crit("post", c.k)] })), { names: ["Pre-test", "Post-test"], colors: [T.C.muted, T.C.ask] })
          + `<div class="tscroll" style="margin-top:12px"><table class="tt"><thead><tr><th>Pupil</th><th>Pre</th><th>Post</th><th>Gain</th></tr></thead><tbody>${pp.map((x) => `<tr><td>${x.p.avatar} ${esc(x.p.name)}</td><td>${x.pre == null ? "–" : x.pre.toFixed(2)}</td><td>${x.post == null ? "–" : x.post.toFixed(2)}</td><td><b>${x.pre != null && x.post != null ? (x.post - x.pre >= 0 ? "+" : "") + (x.post - x.pre).toFixed(2) : "–"}</b></td></tr>`).join("")}</tbody></table></div>`
          : `<div class="empty-state">No assessed Reading Checks yet. Pupils do the Reading Check in the Studio (set Pre/Post under Missions), then assess them.</div>`}</div>
        <div class="tcard"><h3>😀 Smileyometer <span class="small muted">“How much did you enjoy it today?”</span></h3>${T.hbars(FACES.map(([e, l], i) => ({ label: `${e} ${l}`, value: smileC[i], text: String(smileC[i]), color: T.C.ask })), { max: Math.max(1, ...smileC) })}
          <h3 style="margin-top:18px">💪 “Did it help you read with feeling?”</h3>${T.hbars([["yes", "Yes, a lot"], ["little", "A little"], ["notyet", "Not yet"]].map(([k, l]) => ({ label: l, value: helped[k] || 0, text: String(helped[k] || 0), color: T.C.pause })), { max: Math.max(1, ...Object.values(helped), 1) })}</div>
        <div class="tcard"><h3>🔁 Again-Again table <span class="small muted">“Would you do it again?”</span></h3><div class="legend"><span><i style="background:${T.C.pause}"></i>Yes</span><span><i style="background:${T.C.feel}"></i>Maybe</span><span><i style="background:${T.C.stop}"></i>No</span></div>
          <table class="tt"><tbody>${AG.map(([k, l]) => { const y = agC(k, "yes"), m = agC(k, "maybe"), n = agC(k, "no"); return `<tr><td>${l}</td><td style="width:45%">${y + m + n ? T.stack([{ v: y, color: T.C.pause, label: "Yes" }, { v: m, color: T.C.feel, label: "Maybe" }, { v: n, color: T.C.stop, label: "No" }]) : '<span class="muted small">no data</span>'}</td><td class="small">${y} / ${m} / ${n}</td></tr>`; }).join("")}</tbody></table></div>
        <div class="tcard"><h3>🧩 What pupils found tricky</h3>${Object.keys(tricky).length ? T.hbars(Object.entries(tricky).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v, text: String(v), color: T.C.stop })), { max: Math.max(...Object.values(tricky)) }) : `<div class="empty-state">No data yet.</div>`}
          <h3 style="margin-top:18px">💛 Favourite character</h3><div class="row">${["dot", "koma", "quizzy", "zing", "bip"].map((k) => `<div class="center" style="width:70px">${PA.mascot(k, { size: 46 })}<b>${fav[k] || 0}</b></div>`).join("")}</div></div>
        <div class="tcard"><h3>🎮 Usage analytics by game</h3><table class="tt"><thead><tr><th>Game</th><th>Plays</th><th>Avg score</th><th>Fun (1–4)</th><th>Level felt…</th></tr></thead><tbody>${games.map((x) => `<tr><td>${x.g.icon} ${x.g.name}</td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><span style="display:inline-block;height:10px;border-radius:0 4px 4px 0;background:${T.C.ask};width:${(x.plays / maxPlays) * 70}px"></span>${x.plays}</div></td><td>${x.avg == null ? "–" : Math.round(x.avg) + "%"}</td><td>${x.fun == null ? "–" : x.fun.toFixed(1)}</td><td class="small">${x.diff.easy || 0} too easy · ${x.diff.right || 0} right · ${x.diff.hard || 0} too hard</td></tr>`).join("")}</tbody></table>
          <p class="small muted">Total practice time: ${Math.round(pupils.reduce((a, p) => a + (p.timeSpent || 0), 0) / 60)} min · sessions: ${pupils.reduce((a, p) => a + (p.sessions || 0), 0)} · recordings: ${recs.length}</p></div>
        <div class="tcard"><h3>💬 Pupils' ideas</h3>${sv.filter((s) => s.comment).length ? sv.filter((s) => s.comment).sort((a, b) => b.at - a.at).map((s) => `<div style="padding:8px 0;border-bottom:1px solid #F0F1F7">${FACES[s.smiley - 1][0]} “${esc(s.comment)}” <span class="small muted">· ${esc(s.pupilName)}, ${PA.ago(s.at)}</span></div>`).join("") : `<div class="empty-state">No comments yet.</div>`}</div>
      </div>`);
    $("#ev-csv").onclick = () => {
      const rows = sv.map((s) => ({ ...s }));
      PA.download(`PunctuAction-survey-${today()}.csv`, csv(rows, [["date", (r) => new Date(r.at).toISOString()], ["pupil", (r) => r.pupilName], ["year", (r) => r.year], ["smiley_1to5", (r) => r.smiley], ["helped", (r) => r.helped], ...AG.map(([k]) => ["again_" + k, (r) => (r.again || {})[k]]), ["favourite", (r) => r.fav], ["tricky", (r) => (r.tricky || []).join("; ")], ["comment", (r) => r.comment]]), "text/csv");
      PA.download(`PunctuAction-prepost-${today()}.csv`, csv(pp, [["pupil", (r) => r.p.name], ["pre_avg", (r) => r.pre && r.pre.toFixed(2)], ["post_avg", (r) => r.post && r.post.toFixed(2)], ["gain", (r) => r.pre != null && r.post != null ? (r.post - r.pre).toFixed(2) : ""]]), "text/csv");
    };
  };

  /* =================== DATA & SETTINGS =================== */
  T.pages.data = async () => {
    T.setTab("data");
    let usage = ""; try { const e = await navigator.storage.estimate(); usage = `${(e.usage / 1048576).toFixed(1)} MB used on this device`; } catch (e) {}
    T.mount(T.head("Data & settings", `All data stays on this device. ${usage}`) +
      `<div class="tgrid t2" style="align-items:start">
        <div class="tcard"><h3>⚙️ Class settings</h3>
          <div class="field"><label>Class name</label><input class="input" id="ds-class" value="${esc(PA.settings.get("className", ""))}"></div>
          <label class="row"><input type="checkbox" id="ds-self" ${PA.settings.get("allowSelfJoin", true) ? "checked" : ""}> Pupils may add themselves (“I'm new” button)</label>
          <div class="field" style="margin-top:10px"><label>Auto-lock the Teacher Hub after</label><select class="input" id="ds-lock">${[2, 5, 10, 20, 30].map((m) => `<option value="${m}" ${PA.settings.get("autoLockMin", 10) === m ? "selected" : ""}>${m} minutes idle</option>`).join("")}</select></div>
          <h3 style="margin-top:16px">🔑 Change PIN</h3><div class="row"><input class="input" type="password" id="ds-old" placeholder="Current PIN" inputmode="numeric" style="width:150px"><input class="input" type="password" id="ds-new" placeholder="New PIN" inputmode="numeric" style="width:150px"><button class="btn btn-sm btn-ink" id="ds-pin">Change</button></div></div>
        <div class="tcard"><h3>📥 Collect pupils' work (different devices)</h3><p class="small">On each pupil device: <b>Me → Save my work as a file</b>. Send the files to this device (USB, Bluetooth, Google Classroom, Telegram…), then import them here.</p>
          <button class="btn btn-ask" id="ds-imp">📥 Import pupil work / class pack / backup</button>
          <h3 style="margin-top:16px">📦 Share to pupil devices</h3><p class="small">The class pack has your pupil list, your dialogues, missions and your model voice recordings.</p><button class="btn btn-ghost" id="ds-pack">📦 Export class pack</button></div>
        <div class="tcard"><h3>⬇ Reports (CSV for Excel / Google Sheets)</h3><div class="row"><button class="btn btn-sm btn-ghost" data-csv="progress">Pupil progress</button><button class="btn btn-sm btn-ghost" data-csv="attempts">Practice rounds</button><button class="btn btn-sm btn-ghost" data-csv="assess">Assessments (rubric + TP)</button><button class="btn btn-sm btn-ghost" data-csv="feedback">Feedback</button></div>
          <h3 style="margin-top:16px">💾 Backup</h3><div class="row"><button class="btn btn-sm btn-good" id="ds-bk">Backup everything (with audio)</button><button class="btn btn-sm btn-ghost" id="ds-bk2">Backup without audio</button></div><p class="small muted">Restore a backup with the Import button.</p></div>
        <div class="tcard"><h3>✨ Demo data</h3><p class="small">Load a sample class (8 pupils with practice history, feedback and synthetic “hum” recordings that show flat vs expressive reading) to explore or present the dashboards. Remove it before using with your real class.</p><div class="row"><button class="btn btn-sm btn-feel" id="ds-demo">✨ Load demo class</button><button class="btn btn-sm btn-ghost" id="ds-undemo">Remove demo data</button></div>
          <h3 style="margin-top:16px;color:var(--bad)">⚠️ Delete everything</h3><p class="small">Removes all pupils, recordings, voices and feedback from this device. Export a backup first.</p><button class="btn btn-sm btn-stop" id="ds-wipe">Delete all data</button></div></div>`);
    $("#ds-class").onchange = (e) => PA.settings.set("className", e.target.value.trim());
    $("#ds-self").onchange = (e) => PA.settings.set("allowSelfJoin", e.target.checked);
    $("#ds-lock").onchange = (e) => PA.settings.set("autoLockMin", +e.target.value);
    $("#ds-pin").onclick = () => { const r = PA.settings.get("teacherPin"); if (PA.sha256(r.salt + "|" + $("#ds-old").value + "|punctuaction") !== r.hash) return PA.toast("Current PIN is wrong.", "bad"); if (!/^\d{4,8}$/.test($("#ds-new").value)) return PA.toast("New PIN: 4–8 digits.", "bad"); r.hash = PA.sha256(r.salt + "|" + $("#ds-new").value + "|punctuaction"); PA.settings.set("teacherPin", r); PA.toast("PIN changed.", "good"); $("#ds-old").value = $("#ds-new").value = ""; };
    $("#ds-imp").onclick = () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json"; i.multiple = true; i.onchange = async () => { for (const f of i.files) { try { PA.toast(await PA.Model.importFile(await PA.readText(f)), "good"); } catch (e) { PA.toast(f.name + ": " + e.message, "bad"); } } T.refreshBadge(); }; i.click(); };
    $("#ds-pack").onclick = async () => PA.download(`PunctuAction-classpack-${today()}.json`, await PA.Model.classPack());
    $("#ds-bk").onclick = async () => PA.download(`PunctuAction-backup-${today()}.json`, await PA.Model.exportAll({ includeAudio: true }));
    $("#ds-bk2").onclick = async () => PA.download(`PunctuAction-backup-noaudio-${today()}.json`, await PA.Model.exportAll({ includeAudio: false }));
    $("#ds-demo").onclick = async () => { await T.loadDemo(); T.refreshBadge(); };
    $("#ds-undemo").onclick = async () => { await T.clearDemo(); T.refreshBadge(); };
    $("#ds-wipe").onclick = async () => {
      const v = await PA.modal({ title: "Delete all data?", body: `<p>Type <b>DELETE</b> to confirm.</p><input class="input" id="wipe">`, actions: [{ label: "Cancel", cls: "btn-ghost", value: false }, { label: "Delete everything", cls: "btn-stop", value: true, onClick: (m) => $("#wipe", m).value === "DELETE" || (PA.toast("Type DELETE"), false) }] });
      if (!v) return; for (const s of PA.DB.stores) await PA.DB.clear(s); PA.toast("All data deleted."); T.refreshBadge();
    };
    $("#tmain").onclick = async (e) => {
      const b = e.target.closest("[data-csv]"); if (!b) return;
      const pupils = await PA.Model.pupils();
      if (b.dataset.csv === "progress") PA.download(`PunctuAction-progress-${today()}.csv`, csv(pupils, [["name", (p) => p.name], ["year", (p) => p.year], ["stars", (p) => p.stars], ...PA.SKILL_LIST.map((k) => [k + "_mastery_pct", (p) => PA.Model.mastery(p)[k]]), ...PA.SKILL_LIST.map((k) => [k + "_answers", (p) => p.skills[k].n]), ["lessons_done", (p) => Object.keys(p.lessons || {}).length], ["badges", (p) => (p.badges || []).length], ["minutes", (p) => Math.round((p.timeSpent || 0) / 60)], ["sessions", (p) => p.sessions || 0], ["last_active", (p) => p.lastActive ? new Date(p.lastActive).toISOString() : ""]]), "text/csv");
      if (b.dataset.csv === "attempts") PA.download(`PunctuAction-rounds-${today()}.csv`, csv(await PA.DB.all("attempts"), [["date", (a) => new Date(a.at).toISOString()], ["pupil", (a) => a.pupilName], ["game", (a) => a.game], ["level", (a) => a.level], ["correct", (a) => a.correct], ["total", (a) => a.total], ["pct", (a) => a.pct], ["seconds", (a) => a.duration]]), "text/csv");
      if (b.dataset.csv === "assess") PA.download(`PunctuAction-assessments-${today()}.csv`, csv((await PA.DB.all("recordings")).filter((r) => r.status === "assessed"), [["date", (r) => new Date(r.at).toISOString()], ["pupil", (r) => r.pupilName], ["type", (r) => r.kind], ["dialogue", (r) => r.dialogueTitle], ["line", (r) => r.text], ...T.RUBRIC.map((c) => [c.k, (r) => r.assessment.scores[c.k] || ""]), ["average", (r) => (T.overall(r.assessment.scores) || 0).toFixed(2)], ["suggested_TP", (r) => "TP" + T.tp(T.overall(r.assessment.scores))], ["comment", (r) => r.assessment.comment], ["robot_meter", (r) => (r.analysis || {}).robot]]), "text/csv");
      if (b.dataset.csv === "feedback") PA.download(`PunctuAction-feedback-${today()}.csv`, csv(await PA.DB.all("feedback"), [["date", (f) => new Date(f.at).toISOString()], ["kind", (f) => f.kind], ["pupil", (f) => f.pupilName], ["game", (f) => f.game], ["level", (f) => f.level], ["fun", (f) => f.fun], ["difficulty", (f) => f.diff], ["smiley", (f) => f.smiley], ["helped", (f) => f.helped], ["comment", (f) => f.comment]]), "text/csv");
    };
  };

  /* =================== GUIDE =================== */
  T.pages.guide = () => {
    T.setTab("guide");
    T.mount(T.head("Teacher guide", "How to use PunctuAction in your lessons. The full illustrated manual is in <a href='manual.html' target='_blank'>manual.html</a>.") +
      `<div class="tgrid t2 guide"><div class="tcard"><h3>🚀 Getting started (10 minutes)</h3><ol><li><b>Pupils</b> → add your class (use “Add many”). Optional: give each pupil 3 secret pictures.</li><li><b>My model voices</b> → record yourself reading the dialogues you plan to use. Pupils hear <i>your</i> voice first; the computer voice is only the backup.</li><li><b>Missions</b> → set the Reading Check to <b>Pre-test</b> and ask every pupil to read it once.</li><li>Teach with <b>Learn</b>, practise with the <b>games</b>, perform in the <b>Reading Studio</b>.</li><li>After 2–4 weeks switch to <b>Post-test</b>, assess, and open <b>Evaluation</b>.</li></ol>
        <h3>🔒 Privacy & ethics</h3><ul><li>No internet needed; no accounts; nothing is uploaded. Data lives in this browser only.</li><li>The Teacher Hub is PIN-locked, locks itself when idle, and pupils' app has no link to it.</li><li>Voice disguise lets shy pupils share recordings with their timing and intonation kept but their voice changed.</li><li>Use first names only. Get school and guardian permission before trials.</li></ul></div>
      <div class="tcard"><h3>🧑‍🏫 A 60-minute lesson (Year 4)</h3><ol><li><b>Set induction (5 min)</b>: play Fix the Robot on the projector. “Why does Bip sound like a robot?”</li><li><b>Presentation (15 min)</b>: Learn → Meet the Mark Crew. Sing the chant together.</li><li><b>Practice (20 min)</b>: pupils play games at their own level (🌱🌿🌳). Groups share one device in turns.</li><li><b>Production (15 min)</b>: Reading Studio → Role-play mode in pairs. Send best takes.</li><li><b>Closure (5 min)</b>: Feedback page (Smileyometer). Celebrate badges.</li></ol>
        <h3>🎯 Differentiation</h3><ul><li><b>🌱 Easy (Y1–2)</b>: end marks only, picture/story clues, fewer choices, voice signs on.</li><li><b>🌿 Medium (Y3–4)</b>: commas in lists, names and after Yes/Oh/Well; Yes/No vs WH questions.</li><li><b>🌳 Hard (Y5–6)</b>: several marks per passage, “same words, different feeling”, building questions, timed Pause Patrol, voice signs off.</li><li>The app suggests moving up (≥85%) or down (&lt;50%) after each round, and targets each pupil's weakest skill.</li></ul></div>
      <div class="tcard"><h3>📚 Curriculum fit</h3><ul><li><b>KSSR (Revised) English, Year 4</b> — Speaking (communicate intelligibly and appropriately to a group), Reading (reading aloud with understanding) and Writing (punctuate correctly). Please match the exact learning-standard codes to your DSKP and scheme of work.</li><li><b>CEFR (Companion Volume 2020) Phonological control — prosodic features</b>: using stress, intonation and rhythm intelligibly (A1–A2 target band for Year 4).</li><li><b>Role-play / dialogue</b> topics fit textbook units on daily routines, food, festivals and school events.</li></ul></div>
      <div class="tcard"><h3>📏 Rubric & PBD</h3><p>Five criteria × four bands (Beginning, Developing, Achieving, Excelling). Criteria a line does not contain are N/A. The Hub shows a <b>suggested TP</b> (1–6) from the average; your professional judgement is final.</p><table class="tt"><tbody>${T.RUBRIC.map((c) => `<tr><td><b>${c.icon} ${c.name}</b></td><td class="small">${c.bands.map((b, i) => `${i + 1}: ${b}`).join("<br>")}</td></tr>`).join("")}</tbody></table></div></div>`);
  };
})();
