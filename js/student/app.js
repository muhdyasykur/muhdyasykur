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

  /* ---------- Home ---------- */
  S.pages.home = async () => {
    S.setTab("home");
    const p = S.pupil, m = PA.Model.mastery(p), chips = PA.Model.chips(p);
    const lit = PA.SKILL_LIST.filter((k) => chips[k]).length;
    const missions = p.guest ? [] : await PA.Model.assignmentsFor(p);
    const bipSays = lit === 4 ? "Thank you! Now I can read with feeling! You are a Voice Hero!" : lit === 0 ? "Beep. I. Read. Like. A. Robot. Please. Help. Me." : `Beep! I have ${lit} voice chip${lit > 1 ? "s" : ""} now. Help me get the rest!`;
    const warm = PA.Content.randomSentence(S.level(), PA.Model.weights(p));
    S.mount(`
      <section class="hero" id="hero">
        <button class="btn-ghost" id="bipBtn" style="border:0;background:none;cursor:pointer" aria-label="Hear Bip">${PA.mascot("bip", { size: 150, mood: lit === 4 ? "happy" : lit ? "talk" : "flat", chips, cls: "bob" })}</button>
        <div>
          <h1>Hi ${esc(p.name)}! ${p.avatar}</h1>
          <div class="bubble">🤖 “${esc(bipSays)}”</div>
          ${S.bm("Bantu Bip membaca dengan perasaan. Kumpul 4 cip suara!")}
          <div class="chip-row" id="chipRow">${PA.SKILL_LIST.map((k) => `<span class="vchip ${k} ${chips[k] ? "on" : ""}">${PA.MARKS[PA.SKILLS[k]].cue} ${PA.SKILL_NAME[k]} · ${m[k]}%</span>`).join("")}</div>
          <p class="small muted" style="margin-top:8px">A chip lights up when that skill reaches 80%. Tap Bip to hear him.</p>
        </div>
      </section>
      ${missions.length ? `<h2 class="section-title">🎯 Missions from your teacher</h2><div class="grid g2" id="missions">${missions.map((a) => `<a class="mission ${a.done ? "done" : ""}" href="${a.type === "game" ? `#/play/${a.ref}?level=${a.level || S.level()}` : `#/studio/${a.ref}`}" style="text-decoration:none;color:inherit">
        <span class="ic">${a.done ? "✅" : a.type === "game" ? PA.Model.GAMES[a.ref].icon : "🎭"}</span><div class="grow"><b>${esc(a.title)}</b><div class="small muted">${a.type === "game" ? PA.Model.GAMES[a.ref].name : "Reading Studio"}${a.level ? " · " + S.LEVELS[a.level] : ""}${a.due ? " · due " + PA.fmtDate(a.due, false) : ""}</div>${a.note ? `<div class="small">${esc(a.note)}</div>` : ""}</div><span class="btn btn-sm ${a.done ? "btn-ghost" : "btn-feel"}">${a.done ? "Done" : "Go"}</span></a>`).join("")}</div>` : ""}
      <h2 class="section-title">🗺️ Your reading journey</h2>
      <div class="journey" id="journey">
        <a class="jstep" href="#/learn"><span class="n" style="background:var(--stop)">1</span><span class="ic">📚</span><h3>Learn</h3><p>Meet the Mark Crew and hear what each mark does to your voice.</p></a>
        <a class="jstep" href="#/practice"><span class="n" style="background:var(--pause)">2</span><span class="ic">🎮</span><h3>Practice</h3><p>Six games. Easy, Medium or Hard. New sentences every time!</p></a>
        <a class="jstep" href="#/studio"><span class="n" style="background:var(--ask)">3</span><span class="ic">🎭</span><h3>Reading Studio</h3><p>Role-play a dialogue, record your voice and see your voice melody.</p></a>
        <a class="jstep" href="#/me"><span class="n" style="background:var(--feel)">4</span><span class="ic">🏆</span><h3>Show &amp; grow</h3><p>Collect badges and read your teacher's feedback.</p></a>
      </div>
      <h2 class="section-title">🎵 The PunctuAction chant</h2>
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
    $("#bipBtn").onclick = () => PA.Voice.speak(bipSays, lit === 4 ? { emotion: "excited" } : { robot: true });
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
          <label class="row"><input type="checkbox" id="st-sfx" ${!g("mute", false) ? "checked" : ""}> Sound effects</label>
          <label class="row"><input type="checkbox" id="st-nar" ${g("narrate", true) ? "checked" : ""}> Bip reads the tutorials aloud</label>
          <label class="row"><input type="checkbox" id="st-rm" ${g("reduceMotion", false) ? "checked" : ""}> Less movement on screen</label>
          <hr style="border:0;border-top:2px solid var(--line-2);margin:14px 0">
          <div class="row"><button class="btn btn-sm btn-ghost" id="st-pack">📥 Load class pack</button><a class="btn btn-sm btn-ghost" href="manual.html#pupil" target="_blank">📘 User manual</a></div>
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
        $("#st-sfx", m).onchange = (e) => PA.settings.set("mute", !e.target.checked);
        $("#st-nar", m).onchange = (e) => PA.settings.set("narrate", e.target.checked);
        $("#st-rm", m).onchange = (e) => { PA.settings.set("reduceMotion", e.target.checked); applySettings(); };
        $("#st-pack", m).onclick = loadPack;
      } });
    router.run();
  }
  $("#settingsBtn").onclick = openSettings;
  $("#watchBtn").onclick = () => { const t = S.tutorials[S.current] || S.tutorials.home; if (t) PA.Tour.play(t.steps(), { title: t.title }); };

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
    feedback: guard(() => S.pages.feedback())
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
