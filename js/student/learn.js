/* PunctuAction — Learn: "Meet the Mark Crew" lessons (Meet → Trace → Hear the difference → Spot → Say it) */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const S = PA.S;

  const LESSONS = {
    dot: { mark: ".", hello: "Hi, I'm Dotty, the full stop! When you see me, STOP. Let your voice go down and rest, then start the next sentence.",
      bm: "Saya Dotty, noktah. Bila nampak saya, BERHENTI dan rehatkan suara.",
      compare: [{ label: "🤖 No full stops", text: "I like rice I like fish I like cake", robot: true, note: "It runs on and on, like a robot!" }, { label: "✅ With full stops", text: "I like rice. I like fish. I like cake.", note: "Stop at each dot. Much clearer!" }],
      spot: "Ali has a cat. It is black, white and brown. Where is it now? It is asleep on the sofa. Shh! Do not wake it up.", say: "My name is Ali. I am nine years old.", sayTip: "Stop at the dot in the middle." },
    koma: { mark: ",", hello: "Hi, I'm Koma, the comma! When you see me, take a tiny breath, then keep reading. I'm shorter than a full stop.",
      bm: "Saya Koma. Bila nampak saya, berhenti sekejap, tarik nafas, kemudian sambung baca.",
      compare: [{ label: "😱 No comma", text: "Let's eat Grandma!", emo: "excited", note: "Oh no! This sounds like we will eat Grandma!" }, { label: "😊 With a comma", text: "Let's eat, Grandma!", emo: "happy", note: "Phew! Now we are inviting Grandma to eat." }],
      spot: "Yes, I bought apples, oranges and grapes. Siti, do you want one? Well, take two! They are sweet, juicy and fresh.", say: "I like apples, bananas and mangoes.", sayTip: "Take a tiny breath at each comma." },
    quizzy: { mark: "?", hello: "Hi, I'm Quizzy, the question mark! When you see me, ASK. For Yes/No questions, your voice goes UP at the end. For WH questions, start strong and let your voice go down.",
      bm: "Saya Quizzy, tanda soal. Soalan Ya/Tidak: suara naik di hujung. Soalan WH: mula kuat, suara turun.",
      compare: [{ label: "🛑 Telling", text: "You are hungry.", note: "Your voice goes down. You are telling." }, { label: "↗ Asking (Yes/No)", text: "You are hungry?", note: "Your voice goes UP. You are asking!" }, { label: "↘ WH question", text: "Where is my bag?", note: "Start strong on 'Where', then go down." }],
      spot: "Do you like durian? I love it! Where is Ali? He is at the canteen. Can we go now? Yes, let's go.", say: "Do you like nasi lemak?", sayTip: "Make your voice go UP at the end." },
    zing: { mark: "!", hello: "Hi, I'm Zing, the exclamation mark! When you see me, FEEL it! Think: how does the character feel? Happy, angry, surprised or scared? Show it with your voice!",
      bm: "Saya Zing, tanda seru. Tunjukkan perasaan: gembira, marah, terkejut atau takut!",
      compare: [{ label: "😢 Picnic is ruined", text: "It's raining!", emo: "sad", note: "Sad voice: lower and slower." }, { label: "🌾 The farm was dry", text: "It's raining!", emo: "excited", note: "Excited voice: higher and faster." }],
      spot: "Wow! Look at that cake. Is it for me? Hooray, thank you! I love it. You are the best!", say: "Hooray, we won the game!", sayTip: "Sound really happy and excited!", emo: "excited" }
  };
  const ORDER = ["dot", "koma", "quizzy", "zing"];
  const NAMES = { dot: "Dotty", koma: "Koma", quizzy: "Quizzy", zing: "Zing" };

  /* ---------- Learn home ---------- */
  S.pages.learn = () => {
    S.setTab("learn");
    const done = S.pupil.lessons || {};
    S.mount(`<div class="page-title">${PA.mascot("koma", { size: 70, cls: "wiggle" })}<div><h1>Meet the Mark Crew</h1><p>Each mark tells your voice what to do. Tap a friend to start.</p>${S.bm("Setiap tanda baca memberitahu suara anda apa yang perlu dibuat.")}</div></div>
      <div class="crew-cards" id="crew">${ORDER.map((id) => { const L = LESSONS[id], M = PA.MARKS[L.mark]; return `<button class="crew-card" data-id="${id}" style="background:linear-gradient(160deg,#fff 30%,${M.light})">
        ${done[id] ? `<span class="done">✓ Done</span>` : `<span class="big" style="color:${M.color}">${L.mark}</span>`}
        ${PA.mascot(M.mascot, { size: 110, cls: "bob" })}<h3>${NAMES[id]}</h3><div class="pill" style="background:${M.color};color:${L.mark === "!" ? "#3A2600" : "#fff"};align-self:flex-start">${M.name} ${L.mark}</div>
        <div style="font-family:var(--f-read);font-size:1.08rem">${esc(M.kid)}</div></button>`; }).join("")}</div>
      <h2 class="section-title">📋 Voice rules poster</h2>
      <div class="card" id="poster"><div class="grid g4">${Object.entries(PA.MARKS).map(([mk, M]) => `<div class="col" style="align-items:center;text-align:center;gap:6px">
        <div style="font-size:3.2rem;font-weight:700;color:${M.color};line-height:1">${mk}</div><b>${M.name}</b><div class="pill" style="background:${M.light};color:${M.dark}">${M.cue} ${M.verb}</div>
        <div class="small" style="font-family:var(--f-read)">${esc(M.rule)}</div>${S.bm(M.bm)}</div>`).join("")}</div>
        <p class="small muted center" style="margin-top:14px">Tip: <b>Yes/No</b> questions start with words like <i>Do, Is, Are, Can, Did</i> ↗. <b>WH</b> questions start with <i>What, Where, When, Who, Why, Which, How</i> ↘.</p></div>`);
    $("#crew").onclick = (e) => { const b = e.target.closest("[data-id]"); if (b) { PA.sfx("pop"); location.hash = "#/learn/" + b.dataset.id; } };
  };

  /* ---------- One lesson ---------- */
  S.pages.lesson = ({ id }) => {
    S.setTab("learn");
    const L = LESSONS[id]; if (!L) return (location.hash = "#/learn");
    const M = PA.MARKS[L.mark];
    let step = 0;
    const STEPS = ["Meet", "Trace", "Hear", "Spot", "Say"];
    S.mount(`<div class="lesson" id="lesson"><div class="lesson-head" style="background:${M.color};${L.mark === "!" ? "color:#3A2600" : ""}">
      <a href="#/learn" class="btn btn-sm" style="--b:rgba(255,255,255,.25);--bd:rgba(0,0,0,.12);--bt:inherit">⬅</a><b style="font-size:1.2rem">${NAMES[id]} · ${M.name} ${L.mark}</b>
      <div class="lesson-steps">${STEPS.map(() => "<i></i>").join("")}</div></div>
      <div class="lesson-body" id="lbody"></div>
      <div class="lesson-foot"><button class="btn btn-ghost" id="lprev">⬅ Back</button><span class="muted" id="lname"></span><button class="btn btn-good" id="lnext">Next ➡</button></div></div>`);
    const body = $("#lbody");
    function show() {
      PA.Voice.stop(); PA.Recorder.cancel(); body.onclick = null;
      $$(".lesson-steps i").forEach((x, i) => x.classList.toggle("on", i <= step));
      $("#lname").textContent = `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`;
      $("#lprev").style.visibility = step ? "visible" : "hidden";
      $("#lnext").textContent = step === STEPS.length - 1 ? "Finish 🎉" : "Next ➡";
      [meet, trace, hear, spot, say][step]();
    }
    function meet() {
      body.innerHTML = `<div class="row" style="gap:24px;align-items:center;justify-content:center">${PA.mascot(M.mascot, { size: 190, mood: "talk", cls: "bob" })}
        <div class="col" style="max-width:520px"><div class="speech">${esc(L.hello)}</div>${S.bm(L.bm)}<div class="row"><button class="btn btn-ask" id="hearMe">🔊 Hear ${NAMES[id]}</button></div></div></div>`;
      $("#hearMe").onclick = () => PA.Voice.speak(L.hello, { mode: "natural", emotion: L.mark === "!" ? "excited" : null });
      setTimeout(() => PA.Voice.speak(L.hello, { mode: "natural", emotion: L.mark === "!" ? "excited" : null }), 400);
    }
    function trace() {
      body.innerHTML = `<div class="col" style="align-items:center;text-align:center"><h2>✍️ Trace ${NAMES[id]}</h2><p class="prompt">Use your finger to draw over the light shape.</p>
        <div class="trace-wrap" id="tw"><canvas id="tg"></canvas><canvas id="ti"></canvas></div>
        <div class="bar" style="width:min(100%,340px)"><i id="tp" style="width:0;background:${M.color}"></i></div>
        <div class="row" style="justify-content:center"><button class="btn btn-ghost btn-sm" id="tclear">🧽 Clear</button></div><div id="tmsg" class="muted"></div></div>`;
      setupTrace($("#tw"), L.mark, M.color, (pct) => {
        $("#tp").style.width = Math.round(pct * 100) + "%";
        if (pct >= 0.62 && !body.dataset.traced) { body.dataset.traced = 1; PA.sfx("correct"); PA.confetti(60, [M.color]); $("#tmsg").innerHTML = `<b style="color:var(--good)">Beautiful! That's me! ${L.mark}</b>`; }
      });
    }
    function hear() {
      body.innerHTML = `<div class="col" style="align-items:center;text-align:center"><h2>👂 Hear the difference</h2><p class="prompt">Press each 🔊 and listen. What changes?</p>${S.bm("Dengar perbezaannya.")}
        <div class="compare" style="width:100%;${L.compare.length === 3 ? "grid-template-columns:repeat(auto-fit,minmax(220px,1fr))" : ""}">${L.compare.map((c, i) => `<div class="card-flat"><span class="tag">${c.label}</span>
          <div class="sentence" data-c="${i}" style="font-size:1.6rem">${c.robot ? esc(c.text) : PA.ReadAlong.html(c.text, { cues: true, emotion: c.emo })}</div>
          <button class="btn btn-ask btn-sm" data-play="${i}">🔊 Listen</button><span class="small muted" style="font-family:var(--f-read)">${esc(c.note)}</span></div>`).join("")}</div></div>`;
      body.onclick = (e) => { const b = e.target.closest("[data-play]"); if (!b) return; const c = L.compare[+b.dataset.play];
        if (c.robot) PA.Voice.speak(c.text, { robot: true }); else PA.ReadAlong.play($(`[data-c="${b.dataset.play}"]`, body), c.text, { emotion: c.emo }); };
    }
    function spot() {
      const need = PA.Lang.tokenize(L.spot).filter((t) => t.type === "mark" && PA.Lang.normMark(t.mark) === L.mark).length;
      let found = 0;
      body.innerHTML = `<div class="col" style="align-items:center;text-align:center"><h2>🔎 Spot ${NAMES[id]}</h2><p class="prompt">Tap every <b style="color:${M.color}">${M.name} ${L.mark}</b> you can find. Found: <b id="sf">0</b> / ${need}</p>
        <div class="spot-text card-flat" id="st">${PA.ReadAlong.html(L.spot, { cues: false })}</div><div id="smsg"></div></div>`;
      body.onclick = (e) => {
        const mk = e.target.closest(".mk"); if (!mk || mk.classList.contains("found")) return;
        const ch = mk.textContent.trim()[0];
        if (ch === L.mark) { mk.classList.add("found"); found++; $("#sf").textContent = found; PA.sfx(PA.markSfx[L.mark]);
          if (found === need) { PA.sfx("correct"); PA.confetti(70); $("#smsg").innerHTML = `<div class="explain good">${PA.mascot(M.mascot, { size: 48 })} You found all of me! Now press 🔊 to hear the passage.<button class="btn btn-sm btn-ask" id="spPlay">🔊 Listen</button></div>`;
            $("#spPlay").onclick = (ev) => { ev.stopPropagation(); PA.ReadAlong.play($("#st"), L.spot, { emotion: "excited" }); }; } }
        else { mk.classList.remove("nope"); void mk.offsetWidth; mk.classList.add("nope"); PA.sfx("wrong"); const other = PA.MARKS[ch];
          $("#smsg").innerHTML = other ? `<div class="explain bad">That one is <b>${other.hero}</b>, the ${other.name.toLowerCase()} ${ch}. Look for ${NAMES[id]} ${L.mark}!</div>` : ""; }
      };
    }
    function say() {
      body.innerHTML = `<div class="col" style="align-items:center;text-align:center"><h2>🎙️ Your turn!</h2><p class="prompt">${esc(L.sayTip)}</p>
        <div class="sentence" id="sayT">${PA.ReadAlong.html(L.say, { cues: true, emotion: L.emo })}</div>
        <div class="row" style="justify-content:center"><button class="btn btn-ask" id="sayHear">🔊 Listen first</button><button class="btn btn-stop rec-btn" id="sayRec">🎙 Record</button><span class="meter"><i id="sayM"></i></span></div>
        <div id="sayOut" style="width:100%;max-width:760px"></div>
        <p class="small muted">No microphone? That's okay. Read it aloud to a friend, then press Finish.</p></div>`;
      $("#sayHear").onclick = () => PA.ReadAlong.play($("#sayT"), L.say, { emotion: L.emo });
      S.quickRecord($("#sayRec"), $("#sayM"), $("#sayOut"), L.say, L.emo);
    }
    $("#lprev").onclick = () => { if (step > 0) { step--; show(); } };
    $("#lnext").onclick = async () => {
      if (step < STEPS.length - 1) { step++; PA.sfx("whoosh"); return show(); }
      S.pupil.lessons = S.pupil.lessons || {}; S.pupil.lessons[id] = Date.now();
      const nb = PA.Model.checkBadges(S.pupil); S.pupil.stars = (S.pupil.stars || 0) + 3; await S.save();
      PA.confetti(); PA.sfx("win");
      await PA.modal({ title: `You know ${NAMES[id]}! ⭐⭐⭐`, body: `<div class="center">${PA.mascot(M.mascot, { size: 120, cls: "bob" })}<p class="read">${esc(M.kid)}</p><p>+3 stars</p></div>`, actions: [{ label: "Practise now 🎮", cls: "btn-feel", value: "p" }, { label: "Next friend ➡", cls: "btn-good", value: "n" }] }).then((v) => {
        if (v === "p") location.hash = "#/practice"; else { const nx = ORDER[(ORDER.indexOf(id) + 1) % 4]; location.hash = "#/learn/" + nx; }
      });
      S.celebrate(nb);
    };
    show();
  };

  /* ---------- Trace canvas ---------- */
  function setupTrace(wrap, mark, color, onProgress) {
    const g = $("#tg", wrap), ink = $("#ti", wrap);
    const W = wrap.clientWidth, dpr = window.devicePixelRatio || 1;
    [g, ink].forEach((c) => { c.width = W * dpr; c.height = W * dpr; c.getContext("2d").scale(dpr, dpr); });
    const gc = g.getContext("2d"), ic = ink.getContext("2d");
    const sw = W * 0.1;
    const shape = (ctx, strokeW) => {
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = strokeW; ctx.beginPath();
      if (mark === ".") { ctx.arc(W * 0.5, W * 0.6, W * 0.11, 0, Math.PI * 2); ctx.fill(); }
      if (mark === ",") { ctx.arc(W * 0.52, W * 0.42, W * 0.11, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(W * 0.6, W * 0.45); ctx.quadraticCurveTo(W * 0.62, W * 0.68, W * 0.4, W * 0.8); ctx.stroke(); }
      if (mark === "?") { ctx.moveTo(W * 0.32, W * 0.3); ctx.bezierCurveTo(W * 0.32, W * 0.08, W * 0.7, W * 0.08, W * 0.68, W * 0.3); ctx.bezierCurveTo(W * 0.67, W * 0.44, W * 0.5, W * 0.44, W * 0.5, W * 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(W * 0.5, W * 0.8, W * 0.06, 0, Math.PI * 2); ctx.fill(); }
      if (mark === "!") { ctx.moveTo(W * 0.5, W * 0.14); ctx.lineTo(W * 0.5, W * 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(W * 0.5, W * 0.8, W * 0.065, 0, Math.PI * 2); ctx.fill(); }
    };
    gc.fillStyle = gc.strokeStyle = color; gc.globalAlpha = 0.22; shape(gc, sw);
    gc.globalAlpha = 1; gc.setLineDash([6, 8]); gc.strokeStyle = color; gc.lineWidth = 2;
    // sample guide pixels
    const data = gc.getImageData(0, 0, g.width, g.height).data, step = Math.max(3, Math.round(5 * dpr)), pts = [];
    for (let y = 0; y < g.height; y += step) for (let x = 0; x < g.width; x += step) if (data[(y * g.width + x) * 4 + 3] > 20) pts.push([x / dpr, y / dpr]);
    ic.strokeStyle = color; ic.fillStyle = color; ic.lineCap = "round"; ic.lineJoin = "round"; ic.lineWidth = sw * 0.95;
    let drawing = false, last = null; const covered = new Set();
    const pos = (e) => { const r = ink.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (W / r.height)]; };
    const mark2 = (p) => { pts.forEach((q, i) => { if (!covered.has(i) && Math.hypot(q[0] - p[0], q[1] - p[1]) < sw * 0.6) covered.add(i); }); onProgress(covered.size / Math.max(1, pts.length)); };
    ink.addEventListener("pointerdown", (e) => { drawing = true; ink.setPointerCapture(e.pointerId); last = pos(e); ic.beginPath(); ic.arc(last[0], last[1], sw * 0.47, 0, Math.PI * 2); ic.fill(); mark2(last); });
    ink.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); ic.beginPath(); ic.moveTo(last[0], last[1]); ic.lineTo(p[0], p[1]); ic.stroke();
      const n = Math.ceil(Math.hypot(p[0] - last[0], p[1] - last[1]) / 4); for (let k = 1; k <= n; k++) mark2([last[0] + ((p[0] - last[0]) * k) / n, last[1] + ((p[1] - last[1]) * k) / n]); last = p; });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => ink.addEventListener(ev, () => (drawing = false)));
    $("#tclear").onclick = () => { ic.clearRect(0, 0, W, W); covered.clear(); onProgress(0); };
  }

  /* ---------- quick record + coach (used by lessons & studio) ---------- */
  S.quickRecord = (btn, meterEl, outEl, text, emo, onDone) => {
    btn.onclick = async () => {
      if (PA.Recorder.active) return stop();
      if (!PA.Recorder.supported()) return PA.toast("This device has no microphone access. Try Chrome on a tablet or laptop.", "bad");
      try {
        PA.Voice.stop();
        await PA.Recorder.start({ maxSec: 20, onLevel: (l) => { if (meterEl) meterEl.style.width = Math.min(100, l.rms * 400) + "%"; }, onAutoStop: (r) => finish(r) });
        btn.classList.add("recording"); btn.textContent = "⏹ Stop"; PA.sfx("tap");
      } catch (e) { PA.toast("Please allow the microphone to record. 🎤", "bad"); }
    };
    async function stop() { const r = await PA.Recorder.stop(); finish(r); }
    function finish(r) {
      btn.classList.remove("recording"); btn.textContent = "🎙 Record again"; if (meterEl) meterEl.style.width = "0";
      if (!r) return;
      const an = PA.Analyse.run(r.samples, r.sr);
      const rep = PA.Analyse.report(an, text, { emotion: emo });
      outEl.innerHTML = S.coachHtml(rep);
      const cv = outEl.querySelector("canvas"); if (cv) PA.Analyse.draw(cv, an);
      outEl.querySelector("[data-playme]").onclick = () => PA.playBlob(r.wav);
      if (!rep.empty) PA.sfx("correct");
      onDone && onDone(r, an, rep);
    }
  };
  S.coachHtml = (rep, extra = "") => {
    if (rep.empty) return `<div class="coach"><p class="tips">${rep.tips.join("")}</p><button class="btn btn-sm btn-ghost" data-playme>▶ Play my voice</button></div>`;
    const starRow = Object.entries(rep.stars).map(([k, v]) => `<span class="pill pill-${k}">${PA.MARKS[PA.SKILLS[k]].cue} ${PA.SKILL_NAME[k]} ${"⭐".repeat(v)}${"☆".repeat(3 - v)}</span>`).join("");
    return `<div class="coach"><div class="row" style="justify-content:space-between"><b>🎵 My voice melody line</b><button class="btn btn-sm btn-ghost" data-playme>▶ Play my voice</button></div>
      <canvas aria-label="Voice melody line"></canvas>
      <div class="small muted" style="text-align:left">Blue line = how high or low your voice went. Green bands = your pauses. Arrow = how your last word ended.</div>
      <div class="robo"><b>🤖 Robot</b><div class="robo-bar"><i style="left:calc(${rep.robot}% - 3px)"></i></div><b>🎭 Feeling</b></div>
      <div class="stars">${starRow}</div><ul class="tips" style="text-align:left">${rep.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <div class="small muted" style="text-align:left">Bip's ears are still learning. Your teacher gives the final score. ${extra}</div></div>`;
  };
})();
