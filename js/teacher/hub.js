/* PunctuAction — Teacher Hub: PIN lock, shell, overview dashboard, pupils */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA;
  const T = (PA.T = { pages: {} });
  const main = () => $("#tmain");
  T.C = { stop: "#D93F48", pause: "#0B8F77", ask: "#2C58D3", feel: "#B87000", fluency: "#6650E6", muted: "#9AA0BC" };
  T.LV = { easy: "🌱 Easy", medium: "🌿 Medium", hard: "🌳 Hard" };

  /* ---------- chart helpers (thin bars, rounded data-end, ink labels, native hover tooltip) ---------- */
  T.hbars = (items, { max = 100, unit = "%" } = {}) => `<div class="hbars" role="list">${items.map((it) => {
    const txt = it.text != null ? it.text : Math.round(it.value) + unit;
    return `<div class="hbar" role="listitem" title="${esc(it.label)}: ${esc(txt)}"><span class="hb-l">${esc(it.label)}</span><span class="hb-t"><i style="width:${PA.clamp((it.value / (max || 1)) * 100, 0, 100)}%;background:${it.color || T.C.ask}"></i></span><span class="hb-v">${txt}</span></div>`; }).join("")}</div>`;
  T.gbars = (groups, { names = ["A", "B"], colors = [T.C.muted, T.C.ask], max = 4, fmt = (v) => v.toFixed(1) } = {}) =>
    `<div class="legend">${names.map((n, i) => `<span><i style="background:${colors[i]}"></i>${esc(n)}</span>`).join("")}</div><div class="gbars">${groups.map((g) => `<div class="gbar"><span class="hb-l">${esc(g.label)}</span><div class="pair">${g.vals.map((v, i) => `<div title="${esc(g.label)} · ${esc(names[i])}: ${v == null ? "no data" : fmt(v)}"><i style="width:${v == null ? 0 : PA.clamp((v / max) * 85, 0, 85)}%;background:${colors[i]}"></i>${v == null ? '<span class="muted">–</span>' : fmt(v)}</div>`).join("")}</div></div>`).join("")}</div>`;
  T.stack = (parts) => { const tot = parts.reduce((a, p) => a + p.v, 0) || 1; return `<div class="stack">${parts.filter((p) => p.v).map((p) => `<i style="width:${(p.v / tot) * 100}%;background:${p.color}" title="${esc(p.label)}: ${p.v}"></i>`).join("")}</div>`; };
  T.miniSkills = (p) => { const m = PA.Model.mastery(p); return `<div class="mini" title="Stop ${m.stop}% · Pause ${m.pause}% · Ask ${m.ask}% · Feel ${m.feel}%">${PA.SKILL_LIST.map((k) => `<span><i style="width:${m[k]}%;background:${T.C[k]}"></i></span>`).join("")}</div>`; };
  const PAGE_VIDEO = { overview: "tstart", pupils: "tstart", assess: "tassess", voices: "tvoices", dialogues: "tplan", missions: "tplan", evaluation: "tplan", data: "tplan", guide: "tstart" };
  T.head = (title, sub, actions = "") => { const pg = (location.hash.replace(/^#\/?/, "").split(/[/?]/)[0]) || "overview"; const vid = PAGE_VIDEO[pg];
    return `<div class="thead"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}${vid ? `<button class="btn btn-sm btn-feel" data-video="${vid}" title="Watch the video tutorial">🎬 Watch how</button>` : ""}</div></div>`; };
  T.mount = (html) => { if ($("#shell").hidden) return; PA.Voice.stop(); PA.stopAudio(); PA.Recorder.cancel(); const m = main(); m.onclick = m.oninput = m.onchange = null; m.innerHTML = html; window.scrollTo(0, 0); };
  T.setTab = (t) => $$("#tnav a").forEach((a) => a.classList.toggle("on", a.dataset.t === t));
  T.refreshBadge = async () => { const n = (await PA.DB.where("recordings", (r) => r.status === "new")).length; $("#newCount").textContent = n || ""; };

  /* =================== PIN LOCK =================== */
  const pinRec = () => PA.settings.get("teacherPin", null);
  const hashPin = (pin, salt) => PA.sha256(salt + "|" + pin + "|punctuaction");
  const autoMin = () => PA.settings.get("autoLockMin", 10);
  let lastAct = Date.now();
  function isUnlocked() { try { const t = +sessionStorage.getItem("pa:tu"); return t && Date.now() - t < autoMin() * 60000; } catch (e) { return false; } }
  function touch() { lastAct = Date.now(); try { sessionStorage.setItem("pa:tu", String(Date.now())); } catch (e) {} }
  T.lock = () => { try { sessionStorage.removeItem("pa:tu"); } catch (e) {} PA.Voice.stop(); PA.stopAudio(); $("#shell").hidden = true; main().innerHTML = ""; renderLock(); };
  setInterval(() => { if (!$("#shell").hidden && Date.now() - lastAct > autoMin() * 60000) { T.lock(); PA.toast("Locked after inactivity 🔒"); } }, 15000);
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => { if (!$("#shell").hidden) touch(); }, { passive: true }));

  function renderLock(mode) {
    const rec = pinRec();
    mode = mode || (rec ? "enter" : "setup");
    const L = $("#lock");
    if (mode === "setup") {
      L.innerHTML = `<div class="lockwrap"><div class="lockcard" style="text-align:left">${PA.logo(56)}<h2 style="margin-top:10px">Set up your Teacher Hub</h2>
        <p class="muted">Create a PIN so pupils cannot open the Teacher Hub. Everything stays on this device.</p>
        <div class="field"><label>Class name</label><input class="input" id="su-class" placeholder="e.g. 4 Bestari · SK Taman Ilmu" value="${esc(PA.settings.get("className", ""))}"></div>
        <div class="field"><label>New PIN (4–8 digits)</label><input class="input" id="su-pin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div>
        <div class="field"><label>Type the PIN again</label><input class="input" id="su-pin2" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div>
        <button class="btn btn-ink" id="su-go" style="width:100%">Create PIN 🔒</button><p class="small muted" style="margin-top:12px">Pupils use <b>student.html</b>. This page is only for teachers.</p></div></div>`;
      $("#su-go").onclick = async () => {
        const a = $("#su-pin").value, b = $("#su-pin2").value;
        if (!/^\d{4,8}$/.test(a)) return PA.toast("PIN must be 4 to 8 digits.", "bad");
        if (a !== b) return PA.toast("The two PINs are different.", "bad");
        const salt = PA.uid("s"), code = Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[PA.rand(32)]).join("");
        PA.settings.set("teacherPin", { salt, hash: hashPin(a, salt), rec: hashPin(code, salt) });
        PA.settings.set("className", $("#su-class").value.trim());
        await PA.modal({ title: "Write down your recovery code", body: `<p>If you forget your PIN, this code lets you set a new one. Keep it somewhere safe (not with pupils).</p><div style="font-size:2rem;font-weight:700;letter-spacing:.2em;text-align:center;background:var(--feel-l);border-radius:14px;padding:14px">${code}</div>`, actions: [{ label: "I've saved it", cls: "btn-good" }], dismissable: false });
        touch(); open();
      };
      return;
    }
    if (mode === "recover") {
      L.innerHTML = `<div class="lockwrap"><div class="lockcard" style="text-align:left"><h2>Reset PIN</h2><div class="field"><label>Recovery code</label><input class="input" id="rc-code" style="text-transform:uppercase"></div>
        <div class="field"><label>New PIN</label><input class="input" id="rc-pin" type="password" inputmode="numeric" maxlength="8"></div><div class="row"><button class="btn btn-ghost" id="rc-back">Back</button><button class="btn btn-ink" id="rc-go">Reset</button></div></div></div>`;
      $("#rc-back").onclick = () => renderLock("enter");
      $("#rc-go").onclick = () => { const r = pinRec(); if (hashPin($("#rc-code").value.trim().toUpperCase(), r.salt) !== r.rec) return PA.toast("Recovery code is not correct.", "bad");
        if (!/^\d{4,8}$/.test($("#rc-pin").value)) return PA.toast("PIN must be 4 to 8 digits.", "bad");
        r.hash = hashPin($("#rc-pin").value, r.salt); PA.settings.set("teacherPin", r); PA.settings.set("pinFails", { n: 0, until: 0 }); PA.toast("PIN changed.", "good"); touch(); open(); };
      return;
    }
    let pin = "";
    L.innerHTML = `<div class="lockwrap"><div class="lockcard" id="lc">${PA.mascot("bip", { size: 90, mood: "happy" })}<h2 style="margin:8px 0 0">Teacher Hub</h2><div class="muted">${esc(PA.settings.get("className", ""))}</div>
      <div class="pin-dots" id="pd">${"<i></i>".repeat(Math.max(4, 4))}</div><div id="pmsg" class="small" style="min-height:20px;color:var(--bad)"></div>
      <div class="pinpad" id="pp">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join("")}<button data-n="del" aria-label="Delete">⌫</button><button data-n="0">0</button><button data-n="ok" style="background:var(--ink);color:#fff">OK</button></div>
      <div class="row" style="justify-content:space-between;margin-top:14px"><a class="small" href="index.html">⬅ Front page</a><a class="small" href="#" id="forgot">Forgot PIN?</a></div></div></div>`;
    const dots = () => { const n = Math.max(4, pin.length); $("#pd").innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < pin.length ? "on" : ""}"></i>`).join(""); };
    const tryPin = () => {
      const f = PA.settings.get("pinFails", { n: 0, until: 0 });
      if (Date.now() < f.until) { $("#pmsg").textContent = `Too many tries. Wait ${Math.ceil((f.until - Date.now()) / 1000)} s.`; return; }
      if (hashPin(pin, pinRec().salt) === pinRec().hash) { PA.settings.set("pinFails", { n: 0, until: 0 }); touch(); open(); return; }
      f.n++; if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; }
      PA.settings.set("pinFails", f); pin = ""; dots(); $("#lc").classList.remove("shake"); void $("#lc").offsetWidth; $("#lc").classList.add("shake");
      $("#pmsg").textContent = f.until > Date.now() ? "Locked for 60 seconds." : "Wrong PIN.";
    };
    $("#pp").onclick = (e) => { const b = e.target.closest("[data-n]"); if (!b) return; const n = b.dataset.n;
      if (n === "del") pin = pin.slice(0, -1); else if (n === "ok") return tryPin(); else if (pin.length < 8) pin += n; dots(); };
    document.onkeydown = (e) => { if ($("#shell").hidden && $("#pp")) { if (/^\d$/.test(e.key) && pin.length < 8) { pin += e.key; dots(); } if (e.key === "Backspace") { pin = pin.slice(0, -1); dots(); } if (e.key === "Enter") tryPin(); } };
    $("#forgot").onclick = (e) => { e.preventDefault(); renderLock("recover"); };
  }
  function open() { $("#lock").innerHTML = ""; $("#shell").hidden = false; T.refreshBadge(); router.run(); }

  /* =================== OVERVIEW =================== */
  T.pages.overview = async () => {
    T.setTab("overview");
    const [pupils, attempts, recs, fb] = await Promise.all([PA.Model.pupils(), PA.DB.all("attempts"), PA.DB.all("recordings"), PA.DB.all("feedback")]);
    const week = Date.now() - 7 * 864e5;
    const active = pupils.filter((p) => p.lastActive > week).length;
    const pending = recs.filter((r) => r.status === "new").length;
    const surveys = fb.filter((f) => f.kind === "survey");
    const smile = surveys.length ? PA.avg(surveys.map((s) => s.smiley)) : null;
    const minutes = Math.round(pupils.reduce((a, p) => a + (p.timeSpent || 0), 0) / 60);
    const withData = pupils.filter((p) => PA.SKILL_LIST.some((k) => p.skills[k].n > 0));
    const classM = {}; PA.SKILL_LIST.forEach((k) => (classM[k] = withData.length ? PA.avg(withData.map((p) => PA.Model.mastery(p)[k])) : 0));
    const attention = [];
    withData.forEach((p) => { const m = PA.Model.mastery(p); PA.SKILL_LIST.forEach((k) => { if (p.skills[k].n >= 6 && m[k] < 50) attention.push({ p, k, v: m[k] }); }); });
    pupils.filter((p) => p.lastActive && p.lastActive < week).forEach((p) => attention.push({ p, inactive: true }));
    const feed = attempts.map((a) => ({ at: a.at, html: `${PA.Model.GAMES[a.game] ? PA.Model.GAMES[a.game].icon : "🎮"} <b>${esc(a.pupilName)}</b> played ${PA.Model.GAMES[a.game] ? PA.Model.GAMES[a.game].name : a.game} (${a.level}) · <b>${a.pct}%</b>` }))
      .concat(recs.map((r) => ({ at: r.at, html: `🎙 <b>${esc(r.pupilName)}</b> sent a recording: “${esc(r.text.slice(0, 40))}${r.text.length > 40 ? "…" : ""}”` })))
      .sort((a, b) => b.at - a.at).slice(0, 8);
    T.mount(T.head(`Good day, teacher 👋`, `${esc(PA.settings.get("className", "") || "Your class")} · ${PA.fmtDate(Date.now(), false)}`,
      `<a class="btn btn-sm btn-ask" href="#/assess">🎧 Assess (${pending})</a><a class="btn btn-sm btn-ghost" href="#/pupils">➕ Add pupils</a>`) +
      (pupils.length ? "" : `<div class="tcard" style="margin-bottom:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">${PA.mascot("bip", { size: 80, mood: "happy" })}<div class="grow"><h3>Welcome! Let's get started.</h3><p class="muted" style="margin:0">1) Add your pupils · 2) record your own model voice for the dialogues · 3) give a mission. Want to explore first? Load a demo class with sample data.</p></div><a class="btn btn-ask" href="#/pupils">➕ Add pupils</a><button class="btn btn-feel" id="demoBtn">✨ Load demo class</button></div>`) +
      `<div class="kpis">
        <div class="kpi"><div class="v">${pupils.length}</div><div class="l">Pupils</div><div class="s">${active} active this week</div></div>
        <div class="kpi"><div class="v">${pending}</div><div class="l">Recordings to assess</div><div class="s">${recs.length} received in total</div></div>
        <div class="kpi"><div class="v">${attempts.length}</div><div class="l">Practice rounds</div><div class="s">${attempts.length ? Math.round(PA.avg(attempts.map((a) => a.pct))) + "% average score" : "–"}</div></div>
        <div class="kpi"><div class="v">${minutes}</div><div class="l">Minutes of practice</div><div class="s">across the class</div></div>
        <div class="kpi"><div class="v">${smile ? ["😣", "🙁", "🙂", "😀", "🤩"][Math.round(smile) - 1] + " " + smile.toFixed(1) : "–"}</div><div class="l">Enjoyment (out of 5)</div><div class="s">${surveys.length} pupil surveys</div></div>
      </div>
      <div class="tgrid t2">
        <div class="tcard" id="classMastery"><h3>Class skill mastery <span class="small muted">average of ${withData.length} active pupil${withData.length === 1 ? "" : "s"}</span></h3>
          ${T.hbars(PA.SKILL_LIST.map((k) => ({ label: PA.SKILL_NAME[k], value: classM[k], color: T.C[k] })))}
          <p class="small muted" style="margin:10px 0 0">Mastery = recent accuracy on that skill across all games (weighted towards the latest answers). 80% lights a voice chip for the pupil.</p></div>
        <div class="tcard" id="attention"><h3>⚠️ Needs attention</h3>${attention.length ? `<table class="tt"><tbody>${attention.slice(0, 7).map((a) => `<tr class="click" data-p="${a.p.id}"><td class="av">${a.p.avatar}</td><td><b>${esc(a.p.name)}</b></td><td>${a.inactive ? `<span class="pill">Inactive since ${PA.ago(a.p.lastActive)}</span>` : `<span class="pill pill-${a.k}">${PA.SKILL_NAME[a.k]} ${a.v}%</span>`}</td><td class="small muted">${a.inactive ? "Send a mission" : `Suggest: ${{ stop: "Pause Patrol", pause: "Pause Patrol", ask: "Voice Elevator", feel: "Feelings Theatre" }[a.k]}`}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">Nobody needs extra help right now. 🎉</div>`}</div>
      </div>
      <div class="tgrid t2" style="margin-top:16px">
        <div class="tcard"><h3>Pupils <a class="small" href="#/pupils" style="margin-left:auto">See all</a></h3>${pupilTable(pupils.slice(0, 10), recs)}</div>
        <div class="tcard"><h3>Recent activity</h3>${feed.length ? feed.map((f) => `<div class="row" style="padding:7px 0;border-bottom:1px solid #F0F1F7;gap:8px"><span class="grow">${f.html}</span><span class="small muted">${PA.ago(f.at)}</span></div>`).join("") : `<div class="empty-state">No activity yet.</div>`}</div>
      </div>`);
    main().onclick = (e) => { const r = e.target.closest("[data-p]"); if (r) location.hash = "#/pupils/" + r.dataset.p; };
    if ($("#demoBtn")) $("#demoBtn").onclick = async () => { await T.loadDemo(); router.run(); };
  };
  function pupilTable(pupils, recs) {
    if (!pupils.length) return `<div class="empty-state">No pupils yet.</div>`;
    return `<div class="tscroll"><table class="tt"><thead><tr><th></th><th>Name</th><th>Year</th><th>Stop · Pause · Ask · Feel</th><th>⭐</th><th>🎙</th><th>Last active</th></tr></thead><tbody>${pupils.map((p) => `<tr class="click" data-p="${p.id}"><td class="av">${p.avatar}</td><td><b>${esc(p.name)}</b></td><td>${p.year}</td><td>${T.miniSkills(p)}</td><td>${p.stars || 0}</td><td>${recs.filter((r) => r.pupilId === p.id).length}</td><td class="small muted">${PA.ago(p.lastActive)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  /* =================== PUPILS =================== */
  T.pages.pupils = async () => {
    T.setTab("pupils");
    const pupils = await PA.Model.pupils(); const recs = await PA.DB.all("recordings");
    T.mount(T.head("Pupils", "Add your class. Pupils tap their name (and secret pictures, if you set them) to sign in.", `<button class="btn btn-sm btn-ask" id="addP">➕ Add pupil</button><button class="btn btn-sm btn-ghost" id="bulkP">📋 Add many</button><button class="btn btn-sm btn-ghost" id="packP">📦 Class pack for pupil devices</button>`) +
      `<div class="tcard">${pupilTable(pupils, recs)}</div><p class="small muted">Privacy: names and recordings are stored only in this browser. Use first names or nicknames.</p>`);
    main().onclick = (e) => { const r = e.target.closest("[data-p]"); if (r) location.hash = "#/pupils/" + r.dataset.p; };
    $("#addP").onclick = () => editPupil();
    $("#bulkP").onclick = async () => {
      const ok = await PA.modal({ title: "Add many pupils", body: `<div class="field"><label>One name per line</label><textarea class="input" id="bulk" rows="8" placeholder="Ali\nSiti\nMei Ling"></textarea></div><div class="field"><label>Year</label><select class="input" id="bulkY">${[1, 2, 3, 4, 5, 6].map((y) => `<option ${y === 4 ? "selected" : ""}>${y}</option>`).join("")}</select></div>`,
        actions: [{ label: "Cancel", cls: "btn-ghost", value: false }, { label: "Add", cls: "btn-good", value: true, onClick: (m) => { T._bulk = { names: $("#bulk", m).value.split("\n").map((s) => s.trim()).filter(Boolean), y: +$("#bulkY", m).value }; } }] });
      if (!ok) return;
      const used = new Set(pupils.map((p) => p.avatar));
      for (const n of T._bulk.names) { const av = PA.Model.AVATARS.find((a) => !used.has(a)) || PA.pick(PA.Model.AVATARS); used.add(av); await PA.Model.addPupil({ name: n, avatar: av, year: T._bulk.y, level: T._bulk.y <= 2 ? "easy" : T._bulk.y <= 4 ? "medium" : "hard" }); }
      PA.toast(`${T._bulk.names.length} pupils added.`, "good"); T.pages.pupils();
    };
    $("#packP").onclick = async () => { PA.download(`PunctuAction-classpack-${new Date().toISOString().slice(0, 10)}.json`, await PA.Model.classPack()); PA.toast("Class pack saved. On each pupil device: Settings → Load class pack.", "good"); };
  };
  async function editPupil(p) {
    const isNew = !p; p = p || { name: "", avatar: PA.pick(PA.Model.AVATARS), year: 4, level: "medium", key: null };
    let av = p.avatar, key = p.key ? p.key.slice() : [];
    const ok = await PA.modal({ title: isNew ? "Add pupil" : "Edit " + esc(p.name), body: `
      <div class="field"><label>Name or nickname</label><input class="input" id="ep-n" value="${esc(p.name)}" maxlength="24"></div>
      <div class="field"><label>Avatar</label><div class="row" id="ep-av">${PA.Model.AVATARS.map((a) => `<button class="icon-btn" data-a="${a}" style="${a === av ? "outline:3px solid var(--ask)" : ""}">${a}</button>`).join("")}</div></div>
      <div class="row"><div class="field grow"><label>Year</label><select class="input" id="ep-y">${[1, 2, 3, 4, 5, 6].map((y) => `<option ${y === +p.year ? "selected" : ""}>${y}</option>`).join("")}</select></div>
      <div class="field grow"><label>Starting level</label><select class="input" id="ep-l">${Object.entries(T.LV).map(([k, v]) => `<option value="${k}" ${k === p.level ? "selected" : ""}>${v}</option>`).join("")}</select></div></div>
      <div class="field"><label>Secret pictures (optional — 3 taps to sign in)</label><div class="row" id="ep-key">${(PA.KEY_PICS || ["🍎", "🚗", "⭐", "🐟", "🌸", "⚽", "🎈", "🍌", "🐱"]).map((k) => `<button class="icon-btn" data-k="${k}">${k}</button>`).join("")}<button class="btn btn-sm btn-ghost" data-clear>Clear</button></div><div id="ep-kv" style="font-size:1.6rem;min-height:36px">${key.join(" ")}</div></div>`,
      actions: [{ label: "Cancel", cls: "btn-ghost", value: false }, { label: "Save", cls: "btn-good", value: true, onClick: (m) => { if (!$("#ep-n", m).value.trim()) { PA.toast("Name needed"); return false; } if (key.length && key.length !== 3) { PA.toast("Choose exactly 3 pictures, or clear them."); return false; } T._ep = { name: $("#ep-n", m).value.trim(), year: +$("#ep-y", m).value, level: $("#ep-l", m).value }; } }],
      onOpen: (m) => { $("#ep-av", m).onclick = (e) => { const b = e.target.closest("[data-a]"); if (!b) return; av = b.dataset.a; $$("#ep-av button", m).forEach((x) => (x.style.outline = x === b ? "3px solid var(--ask)" : "")); };
        $("#ep-key", m).onclick = (e) => { if (e.target.closest("[data-clear]")) key = []; const b = e.target.closest("[data-k]"); if (b && key.length < 3) key.push(b.dataset.k); $("#ep-kv", m).textContent = key.join(" "); }; } });
    if (!ok) return;
    if (isNew) await PA.Model.addPupil(Object.assign(T._ep, { avatar: av, key: key.length ? key : null }));
    else { Object.assign(p, T._ep, { avatar: av, key: key.length ? key : null }); await PA.DB.put("pupils", p); }
    PA.toast("Saved.", "good"); router.run();
  }

  T.pages.pupil = async ({ id }) => {
    T.setTab("pupils");
    const p = await PA.Model.pupil(id); if (!p) return (location.hash = "#/pupils");
    const att = (await PA.DB.where("attempts", (a) => a.pupilId === id)).sort((a, b) => b.at - a.at);
    const recs = await PA.Model.recordingsFor(id);
    const fb = await PA.DB.where("feedback", (f) => f.pupilId === id && f.kind === "survey");
    const m = PA.Model.mastery(p);
    const scored = recs.filter((r) => r.status === "assessed");
    const avgOf = (list) => { const v = list.map((r) => T.overall(r.assessment.scores)).filter((x) => x != null); return v.length ? PA.avg(v) : null; };
    const pre = avgOf(scored.filter((r) => r.kind === "pre")), post = avgOf(scored.filter((r) => r.kind === "post"));
    T.mount(T.head(`${p.avatar} ${esc(p.name)}`, `Year ${p.year} · starts at ${T.LV[p.level]} · ${p.sessions || 0} sessions · ${Math.round((p.timeSpent || 0) / 60)} min · ⭐ ${p.stars || 0}`,
      `<a class="btn btn-sm btn-ghost" href="#/pupils">⬅ Pupils</a><button class="btn btn-sm btn-ask" id="edP">✏️ Edit</button><button class="btn btn-sm btn-ghost" id="exP">📤 Export work</button><button class="btn btn-sm btn-ghost" id="prP">🖨 Print report</button><button class="btn btn-sm btn-stop" id="delP">🗑 Delete</button>`) +
      `<div class="tgrid t2"><div class="tcard"><h3>Skill mastery</h3>${T.hbars(PA.SKILL_LIST.map((k) => ({ label: `${PA.SKILLS[k]} ${PA.SKILL_NAME[k]} (${p.skills[k].n} answers)`, value: m[k], color: T.C[k] })))}
        <h3 style="margin-top:16px">Pre-test → Post-test (rubric average, 1–4)</h3>${pre == null && post == null ? `<div class="muted small">No assessed Reading Check yet. Pupils do the Reading Check in Studio; set Pre/Post in Missions.</div>` : T.gbars([{ label: "Reading Check", vals: [pre, post] }], { names: ["Pre-test", "Post-test"] })}</div>
        <div class="tcard"><h3>Games</h3><table class="tt"><thead><tr><th>Game</th><th>Plays</th><th>Best 🌱</th><th>Best 🌿</th><th>Best 🌳</th></tr></thead><tbody>${Object.entries(PA.Model.GAMES).map(([g, d]) => { const s = (p.games || {})[g] || { plays: 0, best: {} }; return `<tr><td>${d.icon} ${d.name}</td><td>${s.plays}</td>${["easy", "medium", "hard"].map((l) => `<td>${s.best[l] != null ? s.best[l] + "%" : "–"}</td>`).join("")}</tr>`; }).join("")}</tbody></table>
        <div class="row" style="margin-top:10px">${PA.Model.BADGES.filter((b) => (p.badges || []).includes(b.id)).map((b) => `<span class="pill" title="${esc(b.desc)}">${b.icon} ${b.name}</span>`).join("") || '<span class="muted small">No badges yet</span>'}</div></div></div>
      <div class="tgrid t2" style="margin-top:16px"><div class="tcard"><h3>Recordings</h3>${recs.length ? recs.map((r) => `<div class="rec-row" data-r="${r.id}"><button class="btn btn-sm btn-ask" data-play="${r.id}">▶</button><div><div class="t">${esc(r.text)}</div><div class="small muted">${esc(r.dialogueTitle || "")} · ${PA.fmtDate(r.at)} ${r.kind !== "studio" ? `· <b>${r.kind.toUpperCase()}</b>` : ""}</div></div><span class="pill ${r.status === "assessed" ? "pill-good" : "pill-feel"}">${r.status === "assessed" ? "Band " + (T.overall(r.assessment.scores) || 0).toFixed(1) : "To assess"}</span></div>`).join("") : `<div class="empty-state">No recordings yet.</div>`}</div>
      <div class="tcard"><h3>Practice history</h3>${att.length ? `<div class="tscroll"><table class="tt"><thead><tr><th>When</th><th>Game</th><th>Level</th><th>Score</th><th>Time</th></tr></thead><tbody>${att.slice(0, 25).map((a) => `<tr><td class="small">${PA.fmtDate(a.at)}</td><td>${PA.Model.GAMES[a.game].icon} ${PA.Model.GAMES[a.game].name}</td><td>${T.LV[a.level]}</td><td><b>${a.correct}/${a.total}</b> (${a.pct}%)</td><td class="small">${Math.round(a.duration / 60 * 10) / 10} min</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state">No games played yet.</div>`}
        ${fb.length ? `<h3 style="margin-top:14px">Feedback from ${esc(p.name)}</h3>${fb.map((f) => `<div class="small">${["😣", "🙁", "🙂", "😀", "🤩"][f.smiley - 1]} ${PA.fmtDate(f.at, false)} ${f.comment ? "· “" + esc(f.comment) + "”" : ""}</div>`).join("")}` : ""}</div></div>`);
    main().onclick = (e) => { const b = e.target.closest("[data-play]"); if (b) { e.stopPropagation(); const r = recs.find((x) => x.id === b.dataset.play); if (r && r.blob) PA.playBlob(r.blob); return; } const row = e.target.closest("[data-r]"); if (row) location.hash = "#/assess?r=" + row.dataset.r; };
    $("#edP").onclick = () => editPupil(p);
    $("#exP").onclick = async () => PA.download(`PunctuAction-work-${p.name.replace(/\W+/g, "_")}.json`, await PA.Model.exportPupilWork(p));
    $("#prP").onclick = () => window.print();
    $("#delP").onclick = async () => { if (!(await PA.confirmBox("Delete " + esc(p.name) + "?", "This removes the pupil, their practice history and their recordings from this device.", "Delete"))) return;
      await PA.DB.del("pupils", id); for (const a of att) await PA.DB.del("attempts", a.id); for (const r of recs) await PA.DB.del("recordings", r.id); PA.toast("Deleted."); location.hash = "#/pupils"; };
  };

  /* overall rubric average (ignores N/A) */
  T.overall = (scores) => { const v = Object.values(scores || {}).filter((x) => x); return v.length ? PA.avg(v) : null; };

  /* =================== ROUTER & BOOT =================== */
  const router = PA.Router({
    overview: () => T.pages.overview(),
    pupils: () => T.pages.pupils(),
    "pupils/:id": (p) => T.pages.pupil(p),
    assess: (p) => T.pages.assess(p),
    voices: (p) => T.pages.voices(p),
    dialogues: () => T.pages.dialogues(),
    "dialogues/:id": (p) => T.pages.dialogueEdit(p),
    missions: () => T.pages.missions(),
    evaluation: () => T.pages.evaluation(),
    data: () => T.pages.data(),
    guide: () => T.pages.guide()
  }, "overview");
  T.router = router;
  const guarded = router.run;
  router.run = () => { if ($("#shell").hidden) return; guarded(); };
  window.addEventListener("hashchange", () => { if ($("#shell").hidden) return; });
  $(".logo-mark").innerHTML = PA.logo(40);
  $(".brand-name").innerHTML = PA.wordmark();
  $("#lockBtn").onclick = () => T.lock();
  PA.DB.on("recordings", () => T.refreshBadge());
  window.addEventListener("DOMContentLoaded", () => { if (pinRec() && isUnlocked()) { touch(); open(); } else renderLock(); });
})();
