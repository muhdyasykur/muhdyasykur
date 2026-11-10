/* PunctuAction — "Me" (progress, badges, teacher mailbox) and Feedback (Smileyometer + Again-Again table) */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const S = PA.S;
  const STICKERS = { star: "🌟", fire: "🔥", rocket: "🚀", heart: "💖", trophy: "🏆", clap: "👏", brain: "🧠", rainbow: "🌈" };
  PA.STICKERS = STICKERS;
  const RUBRIC_LABEL = { stop: "Stop .", pause: "Pause ,", ask: "Ask ?", feel: "Feel !", fluency: "Smooth reading" };

  S.pages.me = async () => {
    S.setTab("me");
    const p = S.pupil, m = PA.Model.mastery(p), chips = PA.Model.chips(p);
    const recs = p.guest ? [] : await PA.Model.recordingsFor(p.id);
    const mail = recs.filter((r) => r.status === "assessed");
    const lessons = Object.keys(p.lessons || {}).length;
    const plays = Object.values(p.games || {}).reduce((a, g) => a + g.plays, 0);
    S.mount(`<div class="card me-hero" id="meHero">${PA.mascot("bip", { size: 160, chips, mood: PA.SKILL_LIST.every((k) => chips[k]) ? "happy" : "talk", cls: "bob" })}
        <div><h1 style="margin:0">${p.avatar} ${esc(p.name)}</h1><div class="row" style="margin:6px 0 10px"><span class="star-count">⭐ ${p.stars || 0} stars</span><span class="pill">📚 ${lessons}/4 lessons</span><span class="pill">🎮 ${plays} games</span><span class="pill">🎙 ${recs.length} recordings</span><span class="pill">⏱ ${Math.round((p.timeSpent || 0) / 60)} min</span></div>
        ${PA.SKILL_LIST.map((k) => `<div class="skill-row"><span>${PA.MARKS[PA.SKILLS[k]].cue} ${PA.SKILL_NAME[k]}</span><div class="bar"><i style="width:${m[k]}%;background:${PA.MARKS[PA.SKILLS[k]].color}"></i></div><b>${m[k]}%</b></div>`).join("")}
        <p class="small muted">Each skill grows when you answer correctly. At 80% Bip gets a new voice chip!</p></div></div>
      <h2 class="section-title">📬 Messages from my teacher ${mail.length ? `<span class="pill pill-good">${mail.length}</span>` : ""}</h2>
      <div class="grid g2" id="mail">${mail.length ? mail.map((r) => `<div class="mail"><div class="row"><span class="sticker">${(r.assessment.stickers || []).map((s) => STICKERS[s] || "").join("") || "📝"}</span><div class="grow"><b>${esc(r.dialogueTitle || "")}</b><div class="small muted">${PA.fmtDate(r.assessment.at)}</div></div><button class="btn btn-sm btn-ask" data-play="${r.id}">▶ My voice</button></div>
          <div class="read">“${esc(r.text)}”</div>
          <div class="rubric-mini">${Object.entries(r.assessment.scores || {}).filter(([, v]) => v).map(([k, v]) => `<span class="pill ${k !== "fluency" ? "pill-" + k : ""}">${RUBRIC_LABEL[k]} ${"⭐".repeat(v)}</span>`).join("")}</div>
          ${r.assessment.comment ? `<div class="explain good">👩‍🏫 ${esc(r.assessment.comment)}</div>` : ""}</div>`).join("") : `<div class="card-flat muted">No messages yet. Send a recording from the Reading Studio and your teacher will reply here. 🎙</div>`}</div>
      <h2 class="section-title">🏅 My badges</h2>
      <div class="badges" id="badges">${PA.Model.BADGES.map((b) => `<div class="badge ${(p.badges || []).includes(b.id) ? "" : "locked"}"><div class="bi">${b.icon}</div><b>${b.name}</b><small>${b.desc}</small></div>`).join("")}</div>
      <h2 class="section-title">🎙 My recordings</h2>
      <div class="card-flat" id="myRecs">${recs.length ? recs.slice(0, 12).map((r) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line-2)"><button class="btn btn-sm btn-ask" data-play="${r.id}">▶</button><span class="grow read" style="font-size:1.05rem">${esc(r.text)}</span><span class="small muted">${r.sharedAs === "disguised" ? PA.Disguise.presets[r.disguise].emoji : "🙂"} ${PA.ago(r.at)}</span><span class="pill ${r.status === "assessed" ? "pill-good" : ""}">${r.status === "assessed" ? "✓ Checked" : "Sent"}</span></div>`).join("") : `<span class="muted">No recordings yet.</span>`}</div>
      <div class="row" style="margin-top:16px">${p.guest ? "" : `<button class="btn btn-ghost" id="exportWork">📤 Save my work as a file (for my teacher)</button>`}<span class="small muted">Use this when your teacher uses a different device.</span></div>`);
    const onPlay = (e) => { const b = e.target.closest("[data-play]"); if (!b) return; const r = recs.find((x) => x.id === b.dataset.play); if (r && r.blob) PA.playBlob(r.blob); };
    $("#mail").onclick = onPlay; $("#myRecs").onclick = onPlay;
    if ($("#exportWork")) $("#exportWork").onclick = async () => { PA.download(`PunctuAction-work-${p.name.replace(/\W+/g, "_")}-${new Date().toISOString().slice(0, 10)}.json`, await PA.Model.exportPupilWork(p)); PA.toast("Saved! Give this file to your teacher. 📁", "good"); };
  };

  /* ---------- Feedback ---------- */
  S.pages.feedback = () => {
    S.setTab("feedback");
    const FACES = [["😣", "Awful"], ["🙁", "Not very good"], ["🙂", "Good"], ["😀", "Really good"], ["🤩", "Brilliant"]];
    const AGAIN = [["learn", "📚 Learn lessons"], ["practice", "🎮 Practice games"], ["studio", "🎭 Reading Studio"], ["chat", "🤖 Ask Bip"], ["disguise", "🎭 Voice disguise"]];
    const FAV = [["dot", "Dotty"], ["koma", "Koma"], ["quizzy", "Quizzy"], ["zing", "Zing"], ["bip", "Bip"]];
    const TRICKY = ["Full stops .", "Commas ,", "Questions ?", "Exclamations !", "Recording my voice", "Reading the words", "Nothing!"];
    const f = { again: {}, tricky: [] };
    S.mount(`<div class="page-title">${PA.mascot("bip", { size: 70, mood: "happy", cls: "wiggle" })}<div><h1>Tell us what you think!</h1><p>Your ideas help your teacher make ${esc(PA.brand.name)} even better.</p>${S.bm("Pendapat anda membantu guru menambah baik aplikasi ini.")}</div></div>
      <div class="col" id="fbForm">
        <div class="card"><h3>1. How much did you enjoy ${esc(PA.brand.name)} today?</h3><div class="smileys" id="smile">${FACES.map(([e, l], i) => `<button data-v="${i + 1}"><span class="f">${e}</span>${l}</button>`).join("")}</div></div>
        <div class="card"><h3>2. Would you do these again?</h3><table class="again"><tbody>${AGAIN.map(([k, l]) => `<tr><td>${l}</td>${["Yes", "Maybe", "No"].map((v) => `<td><button data-k="${k}" data-v="${v.toLowerCase()}">${{ Yes: "👍 Yes", Maybe: "🤔 Maybe", No: "👎 No" }[v]}</button></td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="card"><h3>3. Did ${esc(PA.brand.name)} help you read dialogues with feeling?</h3><div class="rate-row" id="helped"><button data-v="yes">💪 Yes, a lot</button><button data-v="little">🙂 A little</button><button data-v="notyet">🌱 Not yet</button></div></div>
        <div class="card"><h3>4. Who is your favourite?</h3><div class="row" id="fav" style="justify-content:center">${FAV.map(([k, n]) => `<button class="choice" data-v="${k}">${PA.mascot(k, { size: 60, mood: k === "bip" ? "happy" : "happy" })}${n}</button>`).join("")}</div></div>
        <div class="card"><h3>5. What was tricky? <span class="small muted">(tap all that fit)</span></h3><div class="rate-row" id="tricky">${TRICKY.map((t) => `<button data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>
        <div class="card"><h3>6. One idea to make it better ✏️ <span class="small muted">(optional)</span></h3><textarea class="input" id="idea" maxlength="300" placeholder="I wish the app could…"></textarea></div>
        <div class="row" style="justify-content:center"><button class="btn btn-good btn-lg" id="fbSend">💌 Send my feedback</button></div>
      </div>
      <h2 class="section-title">🎈 Our class feedback sky</h2><div class="fb-sky" id="sky"></div>`);
    const one = (sel, key) => $(sel).addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; $$(sel + " [data-v]").forEach((x) => x.classList.toggle("on", x === b)); f[key] = b.dataset.v; PA.sfx("pop"); });
    one("#smile", "smiley"); one("#helped", "helped"); one("#fav", "fav");
    $(".again").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (!b) return; $$(`.again [data-k="${b.dataset.k}"]`).forEach((x) => x.classList.toggle("on", x === b)); f.again[b.dataset.k] = b.dataset.v; PA.sfx("tap"); });
    $("#tricky").addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; b.classList.toggle("on"); f.tricky = $$("#tricky .on").map((x) => x.dataset.v); PA.sfx("tap"); });
    // the sky shows earlier balloons (anonymous)
    PA.DB.where("feedback", (x) => x.kind === "survey").then((list) => { const sky = $("#sky"); if (!sky) return; list.slice(-30).forEach((x, i) => { const b = document.createElement("span"); b.className = "balloon stay"; b.textContent = ["🎈", "💌", "⭐", "💛", "🎈"][i % 5]; b.style.left = ((i * 37) % 92) + "%"; b.style.top = 10 + ((i * 53) % 60) + "%"; b.title = FACES[(x.smiley || 3) - 1][0]; sky.appendChild(b); }); });
    $("#fbSend").onclick = async () => {
      if (!f.smiley) { PA.toast("Please choose a face in question 1 🙂"); $("#smile").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      const rec = Object.assign({ id: PA.uid("f"), kind: "survey", pupilId: S.pupil.id, pupilName: S.pupil.name, year: S.pupil.year, at: Date.now(), smiley: +f.smiley, comment: $("#idea").value.trim() }, f);
      rec.smiley = +f.smiley;
      if (!S.pupil.guest) await PA.DB.put("feedback", rec); else PA.DB.put("feedback", Object.assign(rec, { pupilName: "Guest" }));
      S.pupil.gaveFeedback = true; S.pupil.stars = (S.pupil.stars || 0) + 2; const nb = PA.Model.checkBadges(S.pupil); await S.save();
      const sky = $("#sky"); for (let i = 0; i < 6; i++) { const b = document.createElement("span"); b.className = "balloon"; b.textContent = ["🎈", "💌", "⭐", FACES[f.smiley - 1][0], "🎈", "💛"][i]; b.style.left = 10 + i * 14 + "%"; b.style.animationDelay = i * 0.25 + "s"; sky.appendChild(b); }
      sky.scrollIntoView({ behavior: "smooth", block: "center" });
      PA.sfx("win"); PA.confetti(80);
      $("#fbForm").innerHTML = `<div class="card center">${PA.mascot("bip", { size: 120, mood: "happy", cls: "bob" })}<h2>Thank you, ${esc(S.pupil.name)}! 💛</h2><p>Your feedback floated up to the class sky. +2 ⭐</p><a class="btn btn-feel" href="#/home">🏝️ Back home</a></div>`;
      S.celebrate(nb);
    };
  };
})();
