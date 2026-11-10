/* PunctuAction — Pupil app: shell, sign-in, home, settings, routing */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA;
  const S = (PA.S = { pupil: null, pages: {}, tutorials: {}, current: "home" });
  const app = $("#app");
  const KEY_PICS = ["🍎", "🚗", "⭐", "🐟", "🌸", "⚽", "🎈", "🍌", "🐱"];

  /* ---------- helpers ---------- */
  S.bm = (t) => (PA.settings.get("bm", false) && t ? `<div class="bm">${esc(t)}</div>` : "");
  S.mount = (html) => { PA.Voice.stop(); PA.Recorder.cancel(); app.innerHTML = html; window.scrollTo(0, 0); };
  S.level = () => PA.settings.get("lvl:" + S.pupil.id, S.pupil.level || "easy");
  S.setLevel = (l) => PA.settings.set("lvl:" + S.pupil.id, l);
  S.LEVELS = { easy: "🌱 Easy", medium: "🌿 Medium", hard: "🌳 Hard" };
  S.levelSeg = (cur) => `<div class="seg" role="radiogroup" aria-label="Level">${Object.entries(S.LEVELS).map(([k, v]) => `<button data-lvl="${k}" class="${k === cur ? "on" : ""}" role="radio" aria-checked="${k === cur}">${v}</button>`).join("")}</div>`;
  S.bindSeg = (root, fn) => root.addEventListener("click", (e) => { const b = e.target.closest("[data-lvl]"); if (!b) return; $$("[data-lvl]", root).forEach((x) => x.classList.toggle("on", x === b)); PA.sfx("tap"); fn(b.dataset.lvl); });
  S.save = async () => { await PA.Model.save(S.pupil); refreshTop(); };
  S.setTab = (t) => { S.current = t; $$("#tabs a").forEach((a) => a.classList.toggle("on", a.dataset.tab === t)); };
  S.celebrate = async (badges) => {
    if (!badges || !badges.length) return;
    PA.confetti(); PA.sfx("win");
    await PA.modal({ title: "New badge! 🎉", body: `<div class="badges">${badges.map((b) => `<div class="badge"><div class="bi">${b.icon}</div><b>${b.name}</b><small>${b.desc}</small></div>`).join("")}</div>`, actions: [{ label: "Yay!", cls: "btn-feel" }] });
  };
  function refreshTop() {
    if (!S.pupil) return;
    $("#starCount").textContent = "⭐ " + (S.pupil.stars || 0);
    $("#meBtn").textContent = S.pupil.avatar;
  }
  S.refreshTop = refreshTop;

  function applySettings() {
    const size = PA.settings.get("textSize", "m");
    document.documentElement.style.setProperty("--read-size", { s: "1.15rem", m: "1.35rem", l: "1.6rem" }[size]);
    document.body.classList.toggle("reduce-motion", PA.settings.get("reduceMotion", false));
    document.body.style.fontSize = { s: "15px", m: "16px", l: "18px" }[size];
  }

  /* ---------- Sign-in ---------- */
  async function renderLogin() {
    $("#topbar").hidden = true;
    const pupils = await PA.Model.pupils();
    const allowSelf = PA.settings.get("allowSelfJoin", true);
    S.mount(`<section class="login">
      <div>${PA.logo(84)}</div>
      <h1>${PA.wordmark()}</h1>
      <div class="tag">${esc(PA.brand.tagline)}</div>
      <div class="crew-row">${PA.mascot("dot", { size: 76, cls: "bob" })}${PA.mascot("koma", { size: 76, cls: "bob" })}${PA.mascot("bip", { size: 96, cls: "bob", mood: "flat" })}${PA.mascot("quizzy", { size: 76, cls: "bob" })}${PA.mascot("zing", { size: 76, cls: "bob" })}</div>
      <h2 style="margin-top:8px">Who is reading today?</h2>
      ${PA.settings.get("className", "") ? `<div class="pill">${esc(PA.settings.get("className", ""))}</div>` : ""}
      <div class="who">
        ${pupils.map((p) => `<button data-p="${p.id}"><span class="av">${p.avatar}</span>${esc(p.name)}</button>`).join("")}
        ${allowSelf ? `<button data-new><span class="av">➕</span>I'm new</button>` : ""}
        <button data-guest><span class="av">🧭</span>Guest</button>
      </div>
      ${pupils.length ? "" : `<p class="muted" style="max-width:520px">No class list yet. Your teacher can add your name in the <b>Teacher Hub</b>, or you can tap <b>I'm new</b>.</p>`}
      <div class="row" style="justify-content:center;margin-top:8px"><button class="btn btn-sm btn-ghost" id="loadPack">📥 Load class pack</button><a class="btn btn-sm btn-ghost" href="index.html">⬅ Front page</a></div>
    </section>`);
    app.querySelector(".who").addEventListener("click", async (e) => {
      const b = e.target.closest("button"); if (!b) return;
      PA.sfx("pop");
      if (b.dataset.guest !== undefined) return login(PA.Model.loadGuest());
      if (b.dataset.new !== undefined) return newPupil();
      const p = await PA.Model.pupil(b.dataset.p);
      if (p.key && p.key.length) { if (await askKey(p)) login(p); } else login(p);
    });
    $("#loadPack").onclick = loadPack;
  }
  async function loadPack() {
    const f = await PA.pickFile(".json"); if (!f) return;
    try { const msg = await PA.Model.importFile(await PA.readText(f)); PA.toast(msg, "good"); renderLogin(); } catch (e) { PA.toast(e.message, "bad"); }
  }
  async function newPupil() {
    let av = PA.pick(PA.Model.AVATARS);
    const ok = await PA.modal({ title: "Hello, new reader! 👋", body: `<div class="field"><label>Your name</label><input class="input" id="np-name" maxlength="24" placeholder="e.g. Aisyah"></div>
      <div class="field"><label>Pick your animal</label><div class="row" id="np-av">${PA.Model.AVATARS.map((a) => `<button class="icon-btn" data-a="${a}" style="${a === av ? "outline:3px solid var(--ask)" : ""}">${a}</button>`).join("")}</div></div>
      <div class="field"><label>Year</label><select class="input" id="np-year">${[1, 2, 3, 4, 5, 6].map((y) => `<option ${y === 4 ? "selected" : ""}>${y}</option>`).join("")}</select></div>`,
      actions: [{ label: "Cancel", cls: "btn-ghost", value: false }, { label: "Let's go!", cls: "btn-good", value: true, onClick: (m) => { if (!$("#np-name", m).value.trim()) { PA.toast("Type your name first 🙂"); return false; } S._np = { name: $("#np-name", m).value, year: $("#np-year", m).value }; } }],
      onOpen: (m) => $("#np-av", m).addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (!b) return; av = b.dataset.a; $$("#np-av button", m).forEach((x) => (x.style.outline = x === b ? "3px solid var(--ask)" : "")); }) });
    if (!ok) return;
    const y = +S._np.year;
    const p = await PA.Model.addPupil({ name: S._np.name, avatar: av, year: y, level: y <= 2 ? "easy" : y <= 4 ? "medium" : "hard" });
    login(p);
  }
  function askKey(p) {
    return new Promise((resolve) => {
      let got = [];
      const back = document.createElement("div"); back.className = "modal-back";
      back.innerHTML = `<div class="modal center"><h2>${p.avatar} Hi ${esc(p.name)}!</h2><p>Tap your 3 secret pictures.</p><div class="key-dots" id="kd"></div>
        <div class="keypad">${KEY_PICS.map((k) => `<button data-k="${k}">${k}</button>`).join("")}</div><button class="btn btn-ghost" data-c>Cancel</button></div>`;
      document.body.appendChild(back);
      back.addEventListener("click", (e) => {
        if (e.target.closest("[data-c]")) { back.remove(); return resolve(false); }
        const b = e.target.closest("[data-k]"); if (!b) return;
        PA.sfx("tap"); got.push(b.dataset.k); $("#kd", back).textContent = got.map(() => "⬤").join(" ");
        if (got.length === 3) {
          if (got.join("") === p.key.join("")) { PA.sfx("correct"); back.remove(); resolve(true); }
          else { PA.sfx("wrong"); PA.toast("Not quite. Try again!"); got = []; setTimeout(() => ($("#kd", back).textContent = ""), 300); }
        }
      });
    });
  }
  PA.KEY_PICS = KEY_PICS;

  let timer = null, lastInput = Date.now();
  async function login(p) {
    S.pupil = p; PA.currentPupil = p;
    p.sessions = (p.sessions || 0) + 1; p.lastActive = Date.now();
    await PA.Model.save(p);
    PA.settings.set("lastPupil", p.id);
    try { sessionStorage.setItem("pa:session", p.id); } catch (e) {}
    $("#topbar").hidden = false; refreshTop();
    if (!PA.Chat.fab) PA.Chat.mount({ names: (await PA.Model.pupils()).map((x) => x.name) });
    PA.sfx("powerup");
    clearInterval(timer);
    timer = setInterval(() => { if (S.pupil && !document.hidden && Date.now() - lastInput < 90000) { S.pupil.timeSpent = (S.pupil.timeSpent || 0) + 30; if (Date.now() % 60000 < 31000) PA.Model.save(S.pupil); } }, 30000);
    if (!location.hash || location.hash === "#/login") location.hash = "#/home"; else router.run();
  }
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => (lastInput = Date.now()), { passive: true }));
  $("#meBtn").onclick = async () => { if (await PA.confirmBox("Switch reader?", "Do you want to go back to the sign-in page?", "Switch", "btn-ask")) { S.pupil = null; PA.currentPupil = null; try { sessionStorage.removeItem("pa:session"); } catch (e) {} location.hash = "#/login"; } };

  /* ---------- Home: the living "Voice Island" ---------- */
  S.nextStep = async (p) => {
    const order = ["dot", "koma", "quizzy", "zing"], names = { dot: "Dotty", koma: "Koma", quizzy: "Quizzy", zing: "Zing" };
    const todo = order.find((k) => !(p.lessons || {})[k]);
    if (todo) return { href: "#/learn/" + todo, label: `Continue: meet ${names[todo]}`, icon: "📚" };
    if (!p.guest) { const ms = (await PA.Model.assignmentsFor(p)).filter((a) => !a.done); if (ms.length) { const a = ms[0]; return { href: a.type === "game" ? `#/play/${a.ref}?level=${a.level || S.level()}` : `#/studio/${a.ref}`, label: `Mission: ${a.title}`, icon: "🎯" }; } }
    if (!(p.recCount > 0)) return { href: "#/studio", label: "Continue: record in the Studio", icon: "🎭" };
    const m = PA.Model.mastery(p); const weak = PA.SKILL_LIST.slice().sort((a, b) => m[a] - m[b])[0];
    const g = { stop: "patrol", pause: "patrol", ask: "tone", feel: "feelings" }[weak];
    return { href: `#/play/${g}?level=${S.level()}`, label: `Continue: ${PA.Model.GAMES[g].name}`, icon: PA.Model.GAMES[g].icon };
  };
  S.pages.home = async () => {
    S.setTab("home");
    const p = S.pupil, m = PA.Model.mastery(p), chips = PA.Model.chips(p);
    const lit = PA.SKILL_LIST.filter((k) => chips[k]).length;
    const missions = p.guest ? [] : await PA.Model.assignmentsFor(p);
    const recs = p.guest ? 0 : (await PA.Model.recordingsFor(p.id)).length;
    const next = await S.nextStep(p);
    const bipSays = lit === 4 ? "Thank you! Now I can read with feeling! You are a Voice Hero!" : lit === 0 ? "Beep. I. Read. Like. A. Robot. Please. Help. Me." : `Beep! I have ${lit} voice chip${lit > 1 ? "s" : ""} now. Help me get the rest!`;
    const warm = PA.Content.randomSentence(S.level(), PA.Model.weights(p));
    const lessonsDone = Object.keys(p.lessons || {}).length, tried = Object.keys(p.games || {}).length, badges = (p.badges || []).length;
    const floats = Array.from({ length: 14 }, (_, i) => { const mk = [".", ",", "?", "!"][i % 4]; return `<span class="fl" style="left:${(i * 7.3 + 3) % 96}%;animation-delay:${(i * 1.37) % 9}s;animation-duration:${8 + (i % 5)}s;color:${PA.MARKS[mk].color}">${mk}</span>`; }).join("");
    const isl = (n, cls = "") => `<button class="isl-m ${cls}" data-m="${n}" aria-label="${n === "bip" ? "Bip" : PA.MARKS[{ dot: ".", koma: ",", quizzy: "?", zing: "!" }[n]].hero}">${n === "bip" ? PA.mascot("bip", { size: 140, mood: lit === 4 ? "happy" : lit ? "talk" : "flat", chips }) : PA.mascot(n, { size: 84 })}<i class="isl-land"></i></button>`;
    S.mount(`
      <section class="island" id="hero">
        <div class="isl-sky"><i class="sun"></i><i class="cl a"></i><i class="cl b"></i><i class="cl c"></i>${floats}</div>
        <svg class="isl-sea" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="M0 40 Q 150 0 300 40 T 600 40 T 900 40 T 1200 40 T 1500 40 T 1800 40 V120 H0Z"/><path class="w2" d="M0 60 Q 150 25 300 60 T 600 60 T 900 60 T 1200 60 T 1500 60 T 1800 60 V120 H0Z"/></svg>
        <div class="isl-cast" id="islCast">${isl("dot", "d1")}${isl("koma", "d2")}${isl("bip", "bipm")}${isl("quizzy", "d3")}${isl("zing", "d4")}</div>
        <div class="isl-card">
          <div class="isl-hi"><span class="isl-av">${p.avatar}</span><div><div class="small muted">${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}</div><h1>Hi ${esc(p.name)}!</h1></div></div>
          <div class="bubble" id="islSay">🤖 “${esc(bipSays)}”</div>
          ${S.bm("Bantu Bip membaca dengan perasaan. Kumpul 4 cip suara!")}
          <div class="chip-row" id="chipRow">${PA.SKILL_LIST.map((k) => `<span class="vchip ${k} ${chips[k] ? "on" : ""}" title="${PA.SKILL_NAME[k]} ${m[k]}%">${PA.MARKS[PA.SKILLS[k]].cue} ${PA.SKILL_NAME[k]} · ${m[k]}%</span>`).join("")}</div>
          <div class="row" style="margin-top:12px"><a class="btn btn-good" id="continueBtn" href="${next.href}">${next.icon} ${esc(next.label)} ➡</a><button class="btn btn-ghost" data-video="welcome" id="welcomeVid">🎬 Welcome video</button></div>
        </div>
        <div class="isl-tip">👆 Tap a friend to hear them!</div>
      </section>
      ${missions.length ? `<h2 class="section-title">🎯 Missions from your teacher</h2><div class="grid g2" id="missions">${missions.map((a) => `<a class="mission ${a.done ? "done" : ""}" href="${a.type === "game" ? `#/play/${a.ref}?level=${a.level || S.level()}` : `#/studio/${a.ref}`}" style="text-decoration:none;color:inherit">
        <span class="ic">${a.done ? "✅" : a.type === "game" ? PA.Model.GAMES[a.ref].icon : "🎭"}</span><div class="grow"><b>${esc(a.title)}</b><div class="small muted">${a.type === "game" ? PA.Model.GAMES[a.ref].name : "Reading Studio"}${a.level ? " · " + S.LEVELS[a.level] : ""}${a.due ? " · due " + PA.fmtDate(a.due, false) : ""}</div>${a.note ? `<div class="small">${esc(a.note)}</div>` : ""}</div><span class="btn btn-sm ${a.done ? "btn-ghost" : "btn-feel"}">${a.done ? "Done" : "Go"}</span></a>`).join("")}</div>` : ""}
      <h2 class="section-title">🗺️ Your reading journey</h2>
      <div class="journey" id="journey">
        ${[["#/learn", "var(--stop)", "📚", "Learn", "Meet the Mark Crew and hear what each mark does to your voice.", lessonsDone, 4, "lessons"],
           ["#/practice", "var(--pause)", "🎯", "Practice", "Six activities at Easy, Medium or Hard. New sentences every time.", tried, 6, "activities tried"],
           ["#/studio", "var(--ask)", "🎭", "Reading Studio", "Role-play a dialogue, record your voice and see your voice melody.", Math.min(recs, 10), 10, "recordings"],
           ["#/me", "var(--feel)", "🏆", "Show &amp; grow", "Collect badges and read your teacher's feedback.", badges, 12, "badges"]].map(([h, c, ic, t, d, v, mx, u], i) => `
          <a class="jstep" href="${h}"><span class="n" style="background:${c}">${i + 1}</span><span class="ic">${ic}</span><h3>${t}</h3><p>${d}</p>
          <div class="jprog"><div class="bar"><i style="width:${Math.round((v / mx) * 100)}%;background:${c}"></i></div><span class="small muted">${v}/${mx} ${u}</span></div></a>`).join("")}
      </div>
      <div class="grid g2" style="margin-top:16px">
        <a class="feature-tile" href="#/scanner" id="scanTile"><span class="ft-ic">🔍</span><div><span class="pill pill-stop">NEW</span><h3>Dialogue Scanner</h3><p>Type, paste or take a photo of any dialogue. Bip finds every mark and shows how your voice should sound.</p></div></a>
        <a class="feature-tile" href="#/help" id="helpTile"><span class="ft-ic">🎬</span><div><span class="pill pill-ask">VIDEOS</span><h3>Video tutorials</h3><p>Short animated videos show you how to use every part of ${esc(PA.brand.name)}.</p></div></a>
      </div>
      <h2 class="section-title">🎵 The ${esc(PA.brand.name)} chant</h2>
      <div class="chant-card" id="chant">
        <div class="chant-lines">${PA.brand.chant.map((c, i) => `<div data-i="${i}">${PA.ReadAlong.html(c.line, { cues: false, emotion: "excited" })}</div>`).join("")}</div>
        <div class="col" style="align-items:center"><div class="crew-row">${PA.mascot("dot", { size: 46 })}${PA.mascot("koma", { size: 46 })}${PA.mascot("quizzy", { size: 46 })}${PA.mascot("zing", { size: 46 })}</div><button class="btn btn-feel btn-lg" id="chantBtn">▶ Sing it</button></div>
      </div>
      <h2 class="section-title">🔥 Voice warm-up</h2>
      <div class="card col" id="warm" style="align-items:center;text-align:center">
        ${warm.ctx ? `<div class="ctx"><span class="scene">${warm.scene}</span><span>${esc(warm.ctx)}</span></div>` : ""}
        <div class="sentence" id="warmText">${PA.ReadAlong.html(warm.text, { cues: true, emotion: warm.emo })}</div>
        <div class="row" style="justify-content:center"><button class="btn btn-ask" id="warmPlay">🔊 Listen</button><button class="btn btn-ghost" id="warmNew">🔁 New sentence</button></div>
        <p class="small muted">Listen, then read it aloud yourself. Look at the little signs above the marks!</p>
      </div>`);
    // tap a friend: each one speaks its rule and does its move
    $("#islCast").onclick = (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      const n = b.dataset.m;
      b.classList.remove("hop"); void b.offsetWidth; b.classList.add("hop");
      if (n === "bip") { $("#islSay").textContent = `🤖 “${bipSays}”`; return PA.Voice.speak(bipSays, lit === 4 ? { emotion: "excited" } : { robot: true }); }
      const mk = { dot: ".", koma: ",", quizzy: "?", zing: "!" }[n], M = PA.MARKS[mk];
      PA.sfx(PA.markSfx[mk]);
      const line = { dot: "I'm Dotty, the full stop. When you see me, stop and rest your voice.", koma: "I'm Koma, the comma. When you see me, take a tiny breath, then keep going.", quizzy: "I'm Quizzy, the question mark. Do you know my trick? Yes or No questions go up!", zing: "I'm Zing, the exclamation mark. Hooray! Show the feeling with your voice!" }[n];
      $("#islSay").innerHTML = `${M.cue} <span class="read">${PA.ReadAlong.html(line, { cues: true, emotion: "excited" })}</span>`;
      PA.ReadAlong.play($("#islSay"), line, { emotion: "excited", mode: "natural", markSounds: false });
    };
    // welcome jingle + greeting, once per session
    const gk = "pa:greeted:" + p.id;
    let greeted = false; try { greeted = sessionStorage.getItem(gk); sessionStorage.setItem(gk, "1"); } catch (e) {}
    if (!greeted) {
      PA.jingle();
      setTimeout(() => { if (location.hash.startsWith("#/home") && !document.querySelector(".vp-back")) PA.Voice.speak(`Welcome${p.sessions > 1 ? " back" : ""}, ${p.name}! ${lit === 4 ? "You are a Voice Hero!" : "Let's read with feeling today!"}`, { emotion: "happy", mode: "natural" }); }, 1100);
      if (!p.guest && !p.onboarded) { p.onboarded = true; PA.Model.save(p); setTimeout(() => S.onboard(), 2600); }
    }
    $("#chantBtn").onclick = async (e) => {
      const btn = e.currentTarget; btn.disabled = true;
      for (const [i, c] of PA.brand.chant.entries()) {
        const el = $(`.chant-lines [data-i="${i}"]`); if (!el) break;
        $$(".chant-lines div").forEach((d) => d.classList.toggle("on", d === el));
        $$("#chant .crew-row .mascot").forEach((mm, j) => mm.classList.toggle("bob", j === i));
        PA.sfx(PA.markSfx[c.mark]);
        const ok = await PA.ReadAlong.play(el, c.line, { emotion: "excited", mode: "natural" });
        if (!ok) break;
        await PA.sleep(250);
      }
      $$(".chant-lines div").forEach((d) => d.classList.remove("on")); btn.disabled = false;
    };
    let cur = warm;
    $("#warmPlay").onclick = () => PA.ReadAlong.play($("#warmText"), cur.text, { emotion: cur.emo });
    $("#warmNew").onclick = () => { cur = PA.Content.randomSentence(S.level(), PA.Model.weights(p)); const box = $("#warm");
      const ctx = box.querySelector(".ctx"); if (ctx) ctx.remove();
      if (cur.ctx) box.insertAdjacentHTML("afterbegin", `<div class="ctx"><span class="scene">${cur.scene}</span><span>${esc(cur.ctx)}</span></div>`);
      $("#warmText").innerHTML = PA.ReadAlong.html(cur.text, { cues: true, emotion: cur.emo }); PA.sfx("pop"); };
  };

  /* first-time welcome for a new pupil */
  S.onboard = async () => {
    if (!location.hash.startsWith("#/home")) return;
    const v = await PA.modal({ title: `Welcome, ${esc(S.pupil.name)}! 🎉`, body: `<div class="row" style="flex-wrap:nowrap;align-items:center">${PA.mascot("bip", { size: 110, mood: "talk", cls: "bob" })}<div class="read" style="font-size:1.15rem">I'm Bip. I read like a robot, and I need your help to find my voice. Watch a short video to see how ${esc(PA.brand.name)} works!</div></div>`,
      actions: [{ label: "Later", cls: "btn-ghost", value: false }, { label: "▶ Watch the welcome video", cls: "btn-feel", value: true }] });
    if (v) PA.Video.play("welcome");
  };

  /* ---------- Settings ---------- */
  async function openSettings() {
    const vs = PA.Voice.list();
    const cur = PA.settings.get("voiceURI", "");
    const g = (k, d) => PA.settings.get(k, d);
    await PA.modal({ title: "⚙️ Settings", wide: true, body: `
      <div class="grid g2">
        <div>
          <div class="field"><label>Computer voice</label>
            <select class="input" id="st-voice">${vs.length ? vs.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === cur ? "selected" : ""}>${esc(v.name)} (${v.lang})${v.localService ? " · offline" : ""}</option>`).join("") : `<option>No English voice found on this device</option>`}</select>
            <div class="row"><button class="btn btn-sm btn-ask" id="st-test">🔊 Test</button><label class="small"><input type="checkbox" id="st-multi" ${g("multiVoice", true) ? "checked" : ""}> Different voices for different characters</label></div>
            <span class="small muted">Tip: your teacher can record their own voice for every dialogue line. That voice is always used first.</span></div>
          <div class="field"><label>Reading style</label><div class="seg" id="st-mode"><button data-v="teach" class="${g("voiceMode", "teach") === "teach" ? "on" : ""}">🐢 Teaching (clear pauses)</button><button data-v="natural" class="${g("voiceMode", "teach") === "natural" ? "on" : ""}">🐇 Natural</button></div></div>
          <div class="field"><label>Voice speed: <span id="st-rv">${g("rate", 1)}</span>×</label><input type="range" min="0.7" max="1.3" step="0.05" value="${g("rate", 1)}" id="st-rate"></div>
        </div>
        <div>
          <div class="field"><label>Text size</label><div class="seg" id="st-size">${["s", "m", "l"].map((k) => `<button data-v="${k}" class="${g("textSize", "m") === k ? "on" : ""}" style="font-size:${{ s: ".9rem", m: "1.05rem", l: "1.25rem" }[k]}">A</button>`).join("")}</div></div>
          <label class="row"><input type="checkbox" id="st-bm" ${g("bm", false) ? "checked" : ""}> Show Bahasa Melayu help (BM)</label>
          <label class="row"><input type="checkbox" id="st-auto" ${g("autoRead", false) ? "checked" : ""}> Read every instruction aloud automatically (good for Year 1–2)</label>
          <label class="row"><input type="checkbox" id="st-sfx" ${!g("mute", false) ? "checked" : ""}> Sound effects</label>
          <label class="row"><input type="checkbox" id="st-nar" ${g("narrate", true) ? "checked" : ""}> Bip reads the tutorials aloud</label>
          <label class="row"><input type="checkbox" id="st-rm" ${g("reduceMotion", false) ? "checked" : ""}> Less movement on screen</label>
          <hr style="border:0;border-top:2px solid var(--line-2);margin:14px 0">
          <div class="row"><button class="btn btn-sm btn-ghost" id="st-pack">📥 Load class pack</button><a class="btn btn-sm btn-ghost" href="manual.html#pupil" target="_blank">📘 User manual</a><a class="btn btn-sm btn-ghost" href="#/help">🎬 Help Centre</a><a class="btn btn-sm btn-ghost" href="#/about">ℹ️ About</a></div>
        </div>
      </div>`, actions: [{ label: "Done", cls: "btn-good" }],
      onOpen: (m) => {
        const seg = (id, key) => $(id, m).addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; $$(id + " button", m).forEach((x) => x.classList.toggle("on", x === b)); PA.settings.set(key, b.dataset.v); applySettings(); });
        seg("#st-mode", "voiceMode"); seg("#st-size", "textSize");
        $("#st-voice", m).onchange = (e) => PA.settings.set("voiceURI", e.target.value);
        $("#st-test", m).onclick = () => PA.Voice.speak("Hello, Ali! Are you ready? Let's read with feeling!", { emotion: "happy" });
        $("#st-rate", m).oninput = (e) => { PA.settings.set("rate", +e.target.value); $("#st-rv", m).textContent = e.target.value; };
        $("#st-multi", m).onchange = (e) => PA.settings.set("multiVoice", e.target.checked);
        $("#st-bm", m).onchange = (e) => PA.settings.set("bm", e.target.checked);
        $("#st-auto", m).onchange = (e) => PA.settings.set("autoRead", e.target.checked);
        $("#st-sfx", m).onchange = (e) => PA.settings.set("mute", !e.target.checked);
        $("#st-nar", m).onchange = (e) => PA.settings.set("narrate", e.target.checked);
        $("#st-rm", m).onchange = (e) => { PA.settings.set("reduceMotion", e.target.checked); applySettings(); };
        $("#st-pack", m).onclick = loadPack;
      } });
    router.run();
  }
  $("#settingsBtn").onclick = openSettings;

  /* ---------- Router ---------- */
  const guard = (fn) => (params) => { if (!S.pupil) return renderLogin(); return fn(params); };
  const router = PA.Router({
    login: () => renderLogin(),
    home: guard(() => S.pages.home()),
    learn: guard(() => S.pages.learn()),
    "learn/:id": guard((p) => S.pages.lesson(p)),
    practice: guard(() => S.pages.practice()),
    "play/:game": guard((p) => S.pages.play(p)),
    studio: guard(() => S.pages.studio()),
    "studio/:id": guard((p) => S.pages.dialogue(p)),
    me: guard(() => S.pages.me()),
    feedback: guard(() => S.pages.feedback()),
    scanner: guard(() => S.pages.scanner()),
    help: guard(() => S.pages.help()),
    about: guard(() => S.pages.about())
  }, "home");
  S.router = router;

  /* ---------- Boot ---------- */
  $(".logo-mark").innerHTML = PA.logo(40);
  $(".brand-name").innerHTML = PA.wordmark();
  applySettings();
  window.addEventListener("DOMContentLoaded", async () => {
    // auto re-open last pupil on this device only within the same browser session
    let last = null; try { last = sessionStorage.getItem("pa:session"); } catch (e) {}
    if (last) { const p = last === "guest" ? PA.Model.loadGuest() : await PA.Model.pupil(last); if (p) { S.pupil = p; PA.currentPupil = p; $("#topbar").hidden = false; refreshTop(); PA.Chat.mount({ names: (await PA.Model.pupils()).map((x) => x.name) }); } }
    router.run();
  });
})();
