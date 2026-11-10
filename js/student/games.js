/* PunctuAction — Practice Playground: 6 games × 3 levels. Every round generates new sentences. */
(function () {
  const PA = window.PA; const { $, $$, esc, pick, shuffle, sample } = PA; const S = PA.S;
  const G = PA.Model.GAMES;
  const SK = { ".": "stop", ",": "pause", "?": "ask", "!": "feel" };
  const TILE = (m, small) => { const M = PA.MARKS[m]; return `<button class="tile t-${M.key}" data-mark="${m}" aria-label="${M.name}"><b>${m}</b>${small ? "" : `<small>${M.verb}</small>`}</button>`; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- explanation of a mark in context ---------- */
  function explain(text, at, mark, emo) {
    const s = PA.Lang.sentences(text).find((x) => at >= x.start && at <= x.end) || { text };
    const M = PA.MARKS[mark];
    if (mark === ".") return `${M.hero} 🛑: this sentence <b>tells</b> us something, so it ends with a full stop. STOP and let your voice go down.`;
    if (mark === "!") return `${M.hero} 💥: there is a <b>big feeling</b> here${emo && PA.EMOTIONS[emo] ? ` (${PA.EMOTIONS[emo].label.toLowerCase()} ${PA.EMOTIONS[emo].emoji})` : ""}, so we use an exclamation mark. FEEL it!`;
    if (mark === "?") {
      const c = PA.Lang.classify(s.text.replace(/[.!]$/, "?"));
      if (c.type === "wh") return `${M.hero} ↘: “${cap(c.cueWord)}” is a <b>WH word</b>, so this is a question. Start strong and let your voice go down at the end.`;
      if (c.type === "yn") return `${M.hero} ↗: it starts with “${cap(c.cueWord)}”, so it is a <b>Yes/No question</b>. Your voice goes UP at the end.`;
      return `${M.hero} ↗: it looks like telling, but we are <b>asking</b>. Your voice goes UP at the end.`;
    }
    // comma reasons
    const before = (text.slice(0, at).match(/([A-Za-z']+)\s*$/) || [, ""])[1];
    const after = (text.slice(at + 1).match(/^\s*([A-Za-z']+)/) || [, ""])[1];
    const sentStart = s.start != null ? text.slice(s.start, at).trim().split(/\s+/).length === 1 : false;
    const lead = ["yes", "no", "oh", "well", "hello", "hi", "hey", "okay", "wow", "luckily", "suddenly", "phew", "shh", "sorry", "please", "goodness"];
    const names = PA.BANK.Name.concat(["Grandpa", "Grandma", "Mum", "Dad", "Mak", "Aunty", "Coach", "teacher", "sir", "everyone"]).map((x) => x.toLowerCase());
    if (sentStart && lead.includes(before.toLowerCase())) return `Koma 💨: after “${before}” at the start, take a tiny breath. That's a comma!`;
    if (names.includes(before.toLowerCase()) || names.includes(after.toLowerCase())) return `Koma 💨: when we <b>talk to someone by name</b>, a comma separates the name. Take a tiny breath.`;
    const rest = text.slice(at + 1, s.end != null ? s.end : undefined);
    if (/\b(and|or)\b/.test(rest) && rest.split(/\b(?:and|or)\b/)[0].split(/\s+/).filter(Boolean).length <= 4) return `Koma 💨: commas separate things in a <b>list</b>. Breathe between each one.`;
    return `Koma 💨: the first part of the sentence ends here. Take a <b>tiny breath</b>, then keep going.`;
  }
  S.explain = explain;

  /* ======================= Practice home ======================= */
  S.pages.practice = () => {
    S.setTab("practice");
    const p = S.pupil, m = PA.Model.mastery(p), lvl = S.level();
    const weakest = PA.SKILL_LIST.slice().sort((a, b) => m[a] - m[b])[0];
    const sugg = { stop: "patrol", pause: "patrol", ask: "tone", feel: "feelings" }[weakest];
    S.mount(`<div class="page-title">${PA.mascot("zing", { size: 66, cls: "wiggle" })}<div><h1>Practice Activities</h1><p>Pick a level, then an activity. Every round has new sentences, so think about the rule!</p>${S.bm("Pilih tahap, kemudian pilih aktiviti.")}</div></div>
      <div class="row" style="margin-bottom:14px" id="lvlRow"><b>Level:</b> ${S.levelSeg(lvl)}<span class="small muted">🌱 Year 1–2 · 🌿 Year 3–4 · 🌳 Year 5–6 (choose what feels right)</span></div>
      <div class="suggest" id="suggest">${PA.mascot("bip", { size: 56, mood: "talk" })}<div class="grow"><b>Bip suggests:</b> your <b>${PA.SKILL_NAME[weakest]}</b> skill is ${m[weakest]}%. Try <b>${G[sugg].icon} ${G[sugg].name}</b>!</div><a class="btn btn-sm btn-feel" href="#/play/${sugg}?level=${lvl}" id="suggBtn">Play</a></div>
      <div class="grid g3" id="games">${Object.entries(G).map(([id, g]) => {
        const best = (p.games && p.games[id] && p.games[id].best) || {};
        return `<a class="game-card" href="#/play/${id}?level=${lvl}" data-g="${id}"><span class="gi" style="background:${g.color}">${g.icon}</span><h3>${g.name}</h3><p>${g.blurb}</p>
          <div class="row" style="gap:6px">${g.skills.map((k) => `<span class="pill pill-${k}">${PA.SKILLS[k]} ${k}</span>`).join("")}</div>
          <div class="best">${["easy", "medium", "hard"].map((l) => `<span>${S.LEVELS[l].split(" ")[0]} ${best[l] != null ? best[l] + "%" : "–"}</span>`).join("")}</div></a>`; }).join("")}</div>`);
    S.bindSeg($("#lvlRow"), (l) => { S.setLevel(l); $$("#games a").forEach((a) => (a.href = `#/play/${a.dataset.g}?level=${l}`)); $("#suggBtn").href = `#/play/${sugg}?level=${l}`; });
  };

  /* ======================= Round runner ======================= */
  S.pages.play = ({ game, query }) => {
    S.setTab("practice");
    const level = ["easy", "medium", "hard"].includes(query.level) ? query.level : S.level();
    const def = GAMES[game]; if (!def) return (location.hash = "#/practice");
    const n = def.n[level];
    const st = { i: 0, results: [], dots: [], t0: Date.now() };
    S.mount(`<div class="gshell" id="gshell"><div class="ghead"><a class="btn btn-sm btn-ghost" href="#/practice" aria-label="Back">⬅</a>
      <span style="font-size:1.8rem">${G[game].icon}</span><h2>${G[game].name}</h2><span class="pill">${S.LEVELS[level]}</span>
      <div class="gdots" id="gdots">${Array.from({ length: n }, () => "<i></i>").join("")}</div></div>
      <div class="gbody" id="gbody"></div></div>`);
    const body = $("#gbody");
    const ctx = { level, body, pupil: S.pupil, weights: PA.Model.weights(S.pupil), game,
      done(res, keepGoing) { // res: [{skill, ok}]
        st.results.push(...res);
        const allOk = res.every((r) => r.ok);
        const dot = $$("#gdots i")[st.i]; if (dot) { dot.classList.remove("cur"); dot.classList.add(allOk ? "ok" : "no"); }
        PA.sfx(allOk ? "correct" : "wrong"); if (allOk) PA.confetti(30);
      },
      next() { st.i++; PA.Voice.stop(); if (st.i >= n) finish(); else showQ(); }
    };
    function showQ() { $$("#gdots i").forEach((d, j) => d.classList.toggle("cur", j === st.i)); body.innerHTML = ""; body.onclick = null; delete body.dataset.locked; def.q(ctx, st.i); window.scrollTo({ top: 0, behavior: "smooth" }); }
    async function finish() {
      const dur = Math.round((Date.now() - st.t0) / 1000);
      const { attempt, earned, newBadges } = await PA.Model.recordAttempt(S.pupil, { game, level, results: st.results, duration: dur });
      S.refreshTop();
      const pct = attempt.pct, stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;
      const up = pct >= 85 && level !== "hard" ? { easy: "medium", medium: "hard" }[level] : null;
      const down = pct < 50 && level !== "easy" ? { medium: "easy", hard: "medium" }[level] : null;
      const bySkill = Object.entries(attempt.bySkill).map(([k, [c, t]]) => `<span class="pill pill-${k}">${PA.SKILLS[k]} ${PA.SKILL_NAME[k]}: ${c}/${t}</span>`).join("");
      if (stars >= 2) { PA.sfx("win"); PA.confetti(); }
      body.innerHTML = `<div class="results">${PA.mascot("bip", { size: 120, mood: stars >= 2 ? "happy" : "talk", chips: PA.Model.chips(S.pupil), cls: "bob" })}
        <div class="big-stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
        <h2>${pct >= 90 ? "Amazing reading power!" : pct >= 70 ? "Great job!" : pct >= 40 ? "Good try, keep going!" : "Practice makes progress!"}</h2>
        <p><b>${attempt.correct}</b> out of <b>${attempt.total}</b> correct · +${earned} ⭐</p><div class="row" style="justify-content:center">${bySkill}</div>
        ${up ? `<div class="explain good">🚀 You're ready for <b>${S.LEVELS[up]}</b>! <a class="btn btn-sm btn-good" href="#/play/${game}?level=${up}" data-setlvl="${up}">Try it</a></div>` : ""}
        ${down ? `<div class="explain bad">💡 Try <b>${S.LEVELS[down]}</b> to warm up, then come back! <a class="btn btn-sm btn-ask" href="#/play/${game}?level=${down}" data-setlvl="${down}">Go</a></div>` : ""}
        <div class="card-flat" style="width:100%;max-width:560px"><b>Quick feedback</b><div class="small muted">Did you enjoy this activity?</div>
          <div class="rate-row" id="fun">${["😀", "🙂", "😐", "🙁"].map((f, i) => `<button class="face" data-v="${4 - i}">${f}</button>`).join("")}</div>
          <div class="small muted" style="margin-top:6px">How was the level?</div>
          <div class="rate-row" id="diff"><button data-v="easy">Too easy</button><button data-v="right">Just right</button><button data-v="hard">Too hard</button></div></div>
        <div class="gfoot"><a class="btn btn-feel btn-lg" href="#/play/${game}?level=${level}&r=${Date.now()}">🔁 Try again with new sentences</a><a class="btn btn-ghost" href="#/practice">🎯 Other activities</a></div></div>`;
      const fb = { id: PA.uid("f"), kind: "game", pupilId: S.pupil.id, pupilName: S.pupil.name, game, level, at: Date.now() };
      const saveFb = () => { if (!S.pupil.guest) PA.DB.put("feedback", fb); };
      $("#fun").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; $$("#fun button").forEach((x) => x.classList.toggle("on", x === b)); fb.fun = +b.dataset.v; PA.sfx("pop"); saveFb(); };
      $("#diff").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; $$("#diff button").forEach((x) => x.classList.toggle("on", x === b)); fb.diff = b.dataset.v; PA.sfx("pop"); saveFb(); };
      body.addEventListener("click", (e) => { const a = e.target.closest("[data-setlvl]"); if (a) S.setLevel(a.dataset.setlvl); });
      S.celebrate(newBadges);
    }
    if (game === "ears" && !PA.Voice.hasVoices()) PA.toast("No computer voice found on this device. Ask your teacher to add an English voice.", "bad");
    showQ();
  };

  /* helpers */
  const hearBtn = (label = "🔊 Hear it") => `<button class="btn btn-ask" data-hear>${label}</button>`;
  const nextBtn = (last) => `<button class="btn btn-good btn-lg" data-next>${last ? "See my stars ⭐" : "Next ➡"}</button>`;
  function after(ctx, html, { text, emo, sentEl } = {}) {
    const wrap = document.createElement("div"); wrap.className = "col"; wrap.style.alignItems = "center";
    wrap.innerHTML = html + `<div class="gfoot">${text ? hearBtn() : ""}${nextBtn(false)}</div>`;
    ctx.body.appendChild(wrap);
    if (text) $("[data-hear]", wrap).onclick = () => sentEl ? PA.ReadAlong.play(sentEl, text, { emotion: emo }) : PA.Voice.speak(text, { emotion: emo });
    $("[data-next]", wrap).onclick = () => ctx.next();
    if (text && sentEl) setTimeout(() => PA.ReadAlong.play(sentEl, text, { emotion: emo }), 350);
    wrap.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ======================= GAMES ======================= */
  const GAMES = {
    /* ---------- 1. Mark Detective: fill in the missing mark(s) ---------- */
    detective: {
      n: { easy: 8, medium: 8, hard: 5 },
      q(ctx) {
        const { level } = ctx;
        let item, blanks;
        if (level === "hard") {
          const useDlg = Math.random() < 0.5;
          if (useDlg) { const d = pick(PA.DIALOGUES.filter((x) => x.level !== "easy")); const i = PA.rand(d.lines.length - 1); item = { text: d.lines[i].text + " " + d.lines[i + 1].text, emo: d.lines[i].emo || d.lines[i + 1].emo }; }
          else item = { text: PA.Content.passage("hard") };
        } else item = PA.Content.randomSentence(level, ctx.weights);
        const marks = PA.Lang.tokenize(item.text).filter((t) => t.type === "mark");
        if (level === "easy") blanks = [marks[marks.length - 1]];
        else if (level === "medium") { const commas = marks.filter((t) => t.mark === ","); blanks = [commas.length && Math.random() < 0.5 ? pick(commas) : marks[marks.length - 1]]; }
        else blanks = sample(marks, Math.min(4, marks.length)).sort((a, b) => a.start - b.start);
        const opts = level === "easy" ? [".", "?", "!"] : [".", ",", "?", "!"];
        let html = "", last = 0;
        blanks.forEach((b, i) => { html += esc(item.text.slice(last, b.start)) + `<span class="slot" data-b="${i}"></span>`; last = b.end; });
        html += esc(item.text.slice(last));
        const cueWord = level !== "hard" ? PA.Lang.classify(item.text).cueWord : "";
        ctx.body.innerHTML = `<div class="prompt">${blanks.length > 1 ? "Tap a box, then tap the right mark." : "Which mark is missing?"}</div>${S.bm("Tanda baca manakah yang hilang?")}
          ${item.ctx ? `<div class="ctx"><span class="scene">${item.scene}</span><span>${esc(item.ctx)}</span></div>` : ""}
          <div class="sentence" id="dsent">${html}</div>
          <div class="tiles" id="dtiles">${opts.map((m) => TILE(m)).join("")}</div>
          <div class="row" style="justify-content:center">${level !== "hard" ? `<button class="btn btn-sm btn-ghost" id="clue">🔍 Clue</button>` : ""}${blanks.length > 1 ? `<button class="btn btn-good" id="dcheck" disabled>✅ Check</button>` : ""}</div><div id="clueOut"></div>`;
        const slots = $$(".slot", ctx.body); let sel = 0; const ans = [];
        const selSlot = (i) => { sel = i; slots.forEach((s, j) => s.classList.toggle("sel", j === i)); };
        selSlot(0);
        $("#dsent").onclick = (e) => { const s = e.target.closest(".slot"); if (s && !ctx.body.dataset.locked) selSlot(+s.dataset.b); };
        $("#dtiles").onclick = (e) => {
          const t = e.target.closest("[data-mark]"); if (!t || ctx.body.dataset.locked) return;
          PA.sfx("tap"); ans[sel] = t.dataset.mark; slots[sel].textContent = t.dataset.mark; slots[sel].classList.add("filled");
          const nextEmpty = slots.findIndex((s, j) => !ans[j]);
          if (blanks.length === 1) return check();
          if (nextEmpty >= 0) selSlot(nextEmpty); else { selSlot(-1); $("#dcheck").disabled = false; }
        };
        if ($("#clue")) $("#clue").onclick = () => {
          const b = blanks[0];
          let msg = b.mark === "," ? "Read the words around the box. Is there a list, a name, or a word like Yes/Oh/Well?" : item.ctx ? "Read the story box. How does the person feel?" : cueWord ? `Look at the first word: <b>“${cap(cueWord)}”</b>. What kind of sentence starts like this?` : "Is the sentence telling, asking or feeling?";
          $("#clueOut").innerHTML = `<div class="explain good" style="background:var(--feel-l)">${PA.mascot("bip", { size: 40 })} ${msg}</div>`;
          PA.sfx("pop");
        };
        if ($("#dcheck")) $("#dcheck").onclick = check;
        function check() {
          ctx.body.dataset.locked = 1; slots.forEach((s) => s.classList.remove("sel"));
          const res = blanks.map((b, i) => { const ok = ans[i] === b.mark; slots[i].classList.add(ok ? "ok" : "no"); if (!ok) slots[i].innerHTML = `<s style="opacity:.5">${ans[i] || ""}</s>${b.mark}`; return { skill: SK[PA.Lang.normMark(b.mark)], ok }; });
          ctx.done(res);
          const wrongI = blanks.findIndex((b, i) => ans[i] !== b.mark);
          const focus = blanks[wrongI >= 0 ? wrongI : 0];
          const allOk = wrongI < 0;
          const exp = explain(item.text, focus.start, PA.Lang.normMark(focus.mark), item.emo);
          ctx.body.insertAdjacentHTML("beforeend", `<div class="explain ${allOk ? "good" : "bad"}">${PA.markMascot(PA.Lang.normMark(focus.mark), { size: 48 })}<div>${allOk ? "<b>Correct!</b> " : "<b>Not quite.</b> "}${exp}</div></div>
            <div class="sentence" id="dfull" style="font-size:1.5rem">${PA.ReadAlong.html(item.text, { cues: true, emotion: item.emo })}</div>`);
          after(ctx, "", { text: item.text, emo: item.emo, sentEl: $("#dfull") });
        }
      }
    },

    /* ---------- 2. Ears On!: listen to the intonation, pick the mark (or the feeling) ---------- */
    ears: {
      n: { easy: 8, medium: 8, hard: 8 },
      q(ctx) {
        const { level } = ctx;
        const base = PA.Content.earBase();
        const feelingMode = level === "hard" && Math.random() < 0.5;
        const marks = level === "easy" ? [".", "?"] : [".", "?", "!"];
        const mark = pick(marks);
        const emo = feelingMode ? pick(["happy", "angry", "sad", "scared", "surprised"]) : mark === "!" ? pick(["excited", "angry", "surprised", "happy"]) : null;
        const text = base + (feelingMode ? "!" : mark);
        const play = () => PA.Voice.speak(text, { emotion: emo, mode: "natural" });
        let opts;
        if (feelingMode) { const others = shuffle(["happy", "angry", "sad", "scared", "surprised"].filter((e) => e !== emo)).slice(0, 2); opts = shuffle([emo, ...others]); }
        ctx.body.innerHTML = `<div class="prompt">${feelingMode ? "Listen. How does the speaker <b>feel</b>?" : "Listen to the voice. Which mark did you hear at the end?"}</div>${S.bm(feelingMode ? "Dengar. Apakah perasaan penutur?" : "Dengar. Tanda baca apa di hujung ayat?")}
          <button class="btn btn-bip btn-lg" id="eplay">🔊 Play the voice</button>
          <div class="sentence" id="esent">${esc(base)}<span class="slot">${feelingMode ? "!" : ""}</span></div>
          ${feelingMode ? `<div class="tiles" id="eopts">${opts.map((e) => `<button class="choice" data-e="${e}"><span class="em">${PA.EMOTIONS[e].emoji}</span>${PA.EMOTIONS[e].label}</button>`).join("")}</div>`
            : `<div class="tiles" id="eopts">${marks.map((m) => TILE(m)).join("")}</div>`}
          <p class="small muted">Tip: listen to the <b>end</b> of the sentence. Up ↗ = asking. Down ↘ = telling. Big change = feeling!</p>`;
        $("#eplay").onclick = play; setTimeout(play, 300);
        $("#eopts").onclick = (e) => {
          const b = e.target.closest("[data-mark],[data-e]"); if (!b || ctx.body.dataset.locked) return;
          ctx.body.dataset.locked = 1;
          const ok = feelingMode ? b.dataset.e === emo : b.dataset.mark === mark;
          b.classList.add(ok ? "ok" : "no"); if (!ok && !feelingMode) b.classList.add("wrong");
          ctx.done([{ skill: feelingMode ? "feel" : SK[mark], ok }]);
          const cls = PA.Lang.classify(text);
          const why = feelingMode ? `It was a <b>${PA.EMOTIONS[emo].label.toLowerCase()}</b> voice ${PA.EMOTIONS[emo].emoji}. ${{ happy: "Higher and bright.", angry: "Lower, strong and fast.", sad: "Lower, slower and quieter.", scared: "Higher and fast.", surprised: "Very high, with a big jump." }[emo]}`
            : mark === "?" ? "The voice went <b>UP ↗</b> at the end, so it was a question. We were asking!" : mark === "!" ? `The voice was full of <b>feeling</b> (${PA.EMOTIONS[emo].label.toLowerCase()} ${PA.EMOTIONS[emo].emoji}), so it was an exclamation!` : "The voice went <b>down ↘</b> and stopped, so it was telling. Full stop!";
          $("#esent").innerHTML = PA.ReadAlong.html(text, { cues: true, emotion: emo });
          ctx.body.insertAdjacentHTML("beforeend", `<div class="explain ${ok ? "good" : "bad"}">${PA.markMascot(feelingMode ? "!" : mark, { size: 48 })}<div>${ok ? "<b>Great listening!</b> " : "<b>Listen again.</b> "}${why}</div></div>`);
          after(ctx, "", { text, emo, sentEl: $("#esent") });
          void cls;
        };
      }
    },

    /* ---------- 3. Pause Patrol: rhythm game — breathe at commas, stop at end marks ---------- */
    patrol: {
      n: { easy: 3, medium: 3, hard: 3 },
      q(ctx) {
        const { level } = ctx;
        const text = PA.Content.passage(level);
        const tempo = { easy: 720, medium: 580, hard: 460 }[level];
        const btns = level === "easy" ? [{ k: "breathe", l: "💨 Breathe", c: "btn-pause", marks: [","] }, { k: "stop", l: "🛑 Stop", c: "btn-stop", marks: [".", "?", "!"] }]
          : [{ k: "breathe", l: "💨 Breathe ,", c: "btn-pause", marks: [","] }, { k: "stop", l: "🛑 Stop .", c: "btn-stop", marks: ["."] }, { k: "ask", l: "↗ Ask ?", c: "btn-ask", marks: ["?"] }, { k: "feel", l: "💥 Feel !", c: "btn-feel", marks: ["!"] }];
        ctx.body.innerHTML = `<div class="prompt">Watch the reader move. At each mark, press the right button! ${level === "hard" ? "Be quick — 2.5 seconds!" : ""}</div>${S.bm("Tekan butang yang betul pada setiap tanda baca.")}
          <div class="track card-flat" id="track">${PA.ReadAlong.html(text, { cues: false })}</div>
          <div class="patrol-btns" id="pbtns">${btns.map((b) => `<button class="btn ${b.c}" data-k="${b.k}">${b.l}</button>`).join("")}</div>
          <div class="row" style="justify-content:center"><button class="btn btn-good btn-lg" id="pgo">▶ Start</button></div><div id="pmsg" class="muted"></div>`;
        const items = $$("#track .w, #track .mk", ctx.body);
        const res = []; let waiting = null, falsePress = 0, running = false;
        const expect = (mk) => btns.find((b) => b.marks.includes(mk)).k;
        $("#pbtns").onclick = (e) => {
          const b = e.target.closest("[data-k]"); if (!b || !running) return;
          if (!waiting) { if (falsePress < 3) { falsePress++; res.push({ skill: "pause", ok: false }); } PA.sfx("wrong"); $("#pmsg").innerHTML = "Oops! No mark here. Keep reading the words smoothly. 🌊"; return; }
          waiting.resolve(b.dataset.k);
        };
        $("#pgo").onclick = async () => {
          $("#pgo").disabled = true; running = true; $("#pmsg").textContent = "";
          for (const el of items) {
            if (el.classList.contains("w")) { el.classList.add("now"); PA.sfx("tick"); await PA.sleep(tempo); el.classList.remove("now"); el.classList.add("done"); continue; }
            const mk = PA.Lang.normMark(el.textContent.trim()[0]); if (!SK[mk]) continue;
            el.classList.add("waiting");
            const want = expect(mk);
            const got = await new Promise((resolve) => { waiting = { resolve }; if (level === "hard") setTimeout(() => resolve(null), 2500); });
            waiting = null; el.classList.remove("waiting");
            const ok = got === want;
            el.classList.add(ok ? "hit" : "miss");
            res.push({ skill: level === "easy" && mk !== "," ? "stop" : SK[mk], ok });
            if (ok) { PA.sfx(mk === "," ? "breath" : PA.markSfx[mk]); $("#pmsg").innerHTML = mk === "," ? "💨 Breathe…" : "🛑 Stop… and rest."; }
            else { PA.sfx("wrong"); $("#pmsg").innerHTML = got ? `That was <b>${PA.MARKS[mk].name} ${mk}</b> → ${btns.find((b) => b.k === want).l}` : `Too slow! That was <b>${PA.MARKS[mk].name} ${mk}</b>.`; }
            await PA.sleep(mk === "," ? 500 : 1000);
          }
          running = false;
          ctx.done(res);
          const c = res.filter((r) => r.ok).length;
          ctx.body.insertAdjacentHTML("beforeend", `<div class="explain ${c === res.length ? "good" : "bad"}">${PA.mascot("koma", { size: 46 })}<div><b>${c} / ${res.length}</b> correct. Now listen: hear how the voice breathes at commas and stops at full stops.</div></div>`);
          after(ctx, "", { text, emo: text.includes("!") ? "excited" : null, sentEl: $("#track") });
        };
      }
    },

    /* ---------- 4. Voice Elevator: up or down? ---------- */
    tone: {
      n: { easy: 8, medium: 8, hard: 6 },
      q(ctx) {
        const { level } = ctx;
        if (level === "hard") return buildQ(ctx);
        let item;
        if (level === "easy") item = PA.Content.sentence(pick(["yn", "wh"]), pick(["easy", "medium"]));
        else {
          const r = Math.random();
          if (r < 0.3) item = PA.Content.sentence("yn", "medium"); else if (r < 0.6) item = PA.Content.sentence("wh", "medium");
          else if (r < 0.8) item = PA.Content.sentence("declq", "medium");
          else { const t = pick(["What a {adj} {animal}!", "What a lovely {item}!", "How cute your {animal} is!", "What a big {food} stall!", "How tall you are, {Name}!"]); item = { text: PA.Content.fill(t), type: "excl", emo: "surprised" }; }
        }
        const cls = PA.Lang.classify(item.text);
        const answer = cls.type === "wh" ? "down" : cls.type === "excl" ? "feel" : "up";
        const opts = [{ k: "up", a: "↗", t: level === "easy" ? "Yes/No question" : "Asking: voice goes UP", c: "var(--ask)" }, { k: "down", a: "↘", t: "WH question: strong start, voice goes DOWN", c: "var(--bip)" }];
        if (level !== "easy") opts.push({ k: "feel", a: "💥", t: "Not a question: FEEL it!", c: "var(--feel)" });
        ctx.body.innerHTML = `<div class="prompt">Where does your voice go?</div>${S.bm("Suara naik atau turun?")}
          <div class="row" style="justify-content:center;gap:24px">${PA.mascot("quizzy", { size: 96, cls: "bob" })}<div class="sentence" id="tsent">${PA.ReadAlong.html(item.text, { cues: false, emotion: item.emo })}</div></div>
          <div class="elev" id="topts">${opts.map((o) => `<button class="choice" data-k="${o.k}" style="border-color:${o.c}"><span class="arrow" style="color:${o.c}">${o.a}</span>${o.t}</button>`).join("")}</div>`;
        $("#topts").onclick = (e) => {
          const b = e.target.closest("[data-k]"); if (!b || ctx.body.dataset.locked) return; ctx.body.dataset.locked = 1;
          const ok = b.dataset.k === answer; b.classList.add(ok ? "ok" : "no");
          ctx.done([{ skill: answer === "feel" ? "feel" : "ask", ok }]);
          PA.sfx(answer === "up" ? "rise" : answer === "down" ? "fall" : "zing");
          const why = answer === "down" ? `“${cap(cls.cueWord)}” is a WH word. Start strong, then your voice goes down ↘.`
            : answer === "feel" ? `It starts with “${item.text.split(" ")[0]}”, but it ends with <b>!</b>. It is not a question. It shows surprise. FEEL it! 💥`
            : cls.type === "yn" ? `It starts with “${cap(cls.cueWord)}”: a Yes/No question. Voice goes UP ↗ at the end.` : "It sounds like telling, but the ? says we are asking. Voice goes UP ↗.";
          $("#tsent").innerHTML = PA.ReadAlong.html(item.text, { cues: true, emotion: item.emo });
          ctx.body.insertAdjacentHTML("beforeend", `<div class="explain ${ok ? "good" : "bad"}">${PA.mascot(answer === "feel" ? "zing" : "quizzy", { size: 48 })}<div>${ok ? "<b>Yes!</b> " : "<b>Not this time.</b> "}${why}</div></div>`);
          after(ctx, "", { text: item.text, emo: item.emo, sentEl: $("#tsent") });
        };
      }
    },

    /* ---------- 5. Feelings Theatre: read the situation, choose the feeling ---------- */
    feelings: {
      n: { easy: 6, medium: 6, hard: 4 },
      q(ctx) {
        const { level } = ctx;
        const ALL = ["happy", "excited", "angry", "surprised", "scared", "sad", "worried", "urgent", "proud"];
        const optsFor = (emo, ok, n) => { const bad = ALL.filter((e) => e !== emo && !ok.includes(e)); return shuffle([emo, ...shuffle(bad).slice(0, n - 1)]); };
        const card = (scene, ctxText, text, emo, opts, id) => `<div class="card-flat col" style="align-items:center;max-width:620px;width:100%" data-card="${id}">
          <div class="ctx"><span class="scene">${scene}</span><span>${esc(ctxText)}</span></div>
          <div class="sentence" data-s="${id}">${PA.ReadAlong.html(text, { cues: false })}</div>
          <div class="tiles">${opts.map((e) => `<button class="choice" data-e="${e}" data-id="${id}"><span class="em">${PA.EMOTIONS[e].emoji}</span>${PA.EMOTIONS[e].label}</button>`).join("")}</div><div data-out="${id}"></div></div>`;
        let parts;
        if (level === "hard") {
          const t = PA.Content.twin();
          parts = [{ id: "a", scene: t.a.scene, ctx: t.a.ctx, text: t.text, emo: t.a.emo, ok: t.a.ok }, { id: "b", scene: t.b.scene, ctx: t.b.ctx, text: t.text, emo: t.b.emo, ok: t.b.ok }];
          parts.forEach((p) => (p.opts = optsFor(p.emo, p.ok, 3)));
        } else {
          const e = PA.Content.excl(level === "easy" ? "easy" : pick(["easy", "medium", "medium"]));
          parts = [{ id: "a", scene: e.scene, ctx: e.ctx, text: e.text, emo: e.emo, ok: e.ok, opts: optsFor(e.emo, e.ok, level === "easy" ? 2 : 4) }];
        }
        ctx.body.innerHTML = `<div class="prompt">${level === "hard" ? "Same words, two different stories! Choose the feeling for each." : "Read the story. How does the speaker feel?"}</div>${S.bm("Baca situasi. Apakah perasaan penutur?")}
          ${parts.map((p) => card(p.scene, p.ctx, p.text, p.emo, p.opts, p.id)).join("")}`;
        const res = {};
        ctx.body.onclick = (e) => {
          const b = e.target.closest("[data-e]"); if (!b) return;
          const p = parts.find((x) => x.id === b.dataset.id); if (res[p.id] !== undefined) return;
          const ok = b.dataset.e === p.emo || p.ok.includes(b.dataset.e);
          res[p.id] = ok; b.classList.add(ok ? "ok" : "no");
          const chosen = ok ? b.dataset.e : p.emo;
          if (!ok) $$(`[data-id="${p.id}"]`, ctx.body).forEach((x) => { if (x.dataset.e === p.emo) x.classList.add("ok"); });
          const sEl = $(`[data-s="${p.id}"]`, ctx.body); sEl.innerHTML = PA.ReadAlong.html(p.text, { cues: true, emotion: chosen });
          $(`[data-out="${p.id}"]`, ctx.body).innerHTML = `<div class="explain ${ok ? "good" : "bad"}">${PA.mascot("zing", { size: 44 })}<div>${ok ? `<b>Yes!</b> In this story the speaker feels <b>${PA.EMOTIONS[chosen].label.toLowerCase()}</b> ${PA.EMOTIONS[chosen].emoji}.` : `<b>Think again.</b> In this story the speaker feels <b>${PA.EMOTIONS[p.emo].label.toLowerCase()}</b> ${PA.EMOTIONS[p.emo].emoji}.`} Listen to that feeling:</div></div>
            <div class="row" style="justify-content:center"><button class="btn btn-sm btn-feel" data-hearp="${p.id}">🔊 Hear it ${PA.EMOTIONS[chosen].emoji}</button><button class="btn btn-sm btn-stop" data-recp="${p.id}">🎙 Say it with feeling</button><span class="meter"><i data-m="${p.id}"></i></span></div><div data-rec="${p.id}" style="width:100%"></div>`;
          const hearP = () => PA.ReadAlong.play(sEl, p.text, { emotion: chosen });
          $(`[data-hearp="${p.id}"]`, ctx.body).onclick = (ev) => { ev.stopPropagation(); hearP(); };
          S.quickRecord($(`[data-recp="${p.id}"]`, ctx.body), $(`[data-m="${p.id}"]`, ctx.body), $(`[data-rec="${p.id}"]`, ctx.body), p.text, chosen);
          setTimeout(hearP, 300);
          if (Object.keys(res).length === parts.length) { ctx.done(parts.map((x) => ({ skill: "feel", ok: res[x.id] }))); after(ctx, ""); }
        };
      }
    },

    /* ---------- 6. Fix the Robot: add marks so Bip reads with feeling ---------- */
    robot: {
      n: { easy: 6, medium: 5, hard: 4 },
      q(ctx) {
        const { level } = ctx;
        let text, emo = null;
        if (level === "easy") { const it = PA.Content.randomSentence("easy", ctx.weights); text = it.text; emo = it.emo; }
        else if (level === "medium") { if (Math.random() < 0.5) { const it = PA.Content.randomSentence("medium", ctx.weights); text = it.text; emo = it.emo; } else text = PA.Content.passage("medium"); }
        else { if (Math.random() < 0.5) text = PA.Content.passage("hard"); else { const d = pick(PA.DIALOGUES.filter((x) => x.level === "hard")); const l = pick(d.lines); text = l.text; emo = l.emo; } }
        if (!emo && text.includes("!")) emo = "excited";
        const toks = PA.Lang.tokenize(text);
        const words = []; toks.forEach((t) => { if (t.type === "word") words.push({ w: t.text, mark: null }); else if (t.type === "mark" && words.length) words[words.length - 1].mark = PA.Lang.normMark(t.mark); });
        const editable = level === "easy" ? [words.length - 1] : words.map((_, i) => i);
        const chosen = words.map(() => null);
        const plain = words.map((x) => x.w).join(" ");
        ctx.body.innerHTML = `<div class="robot-stage">${PA.mascot("bip", { size: 130, mood: "flat" })}
          <div class="col" style="align-items:flex-start;text-align:left"><div class="prompt">🤖 Bip reads like a robot because the marks are missing! ${level === "easy" ? "Add the mark at the end." : "Tap the gaps between words and add the marks."}</div>${S.bm("Bip membaca seperti robot. Tambah tanda baca supaya Bip membaca dengan perasaan.")}
          <div class="row"><button class="btn btn-sm btn-ghost" id="rflat">▶ Hear robot Bip</button></div></div></div>
          <div class="gaps card-flat" id="gaps" style="max-width:900px;width:100%">${words.map((x, i) => `${esc(x.w)}${editable.includes(i) ? `<span class="gap empty" data-g="${i}" role="button" aria-label="gap after ${esc(x.w)}"></span>` : ""}`).join(" ")}</div>
          <div class="mark-picker" id="picker"><button class="tile t-none" data-mark=""><b>·</b><small>none</small></button>${[".", ",", "?", "!"].map((m) => TILE(m)).join("")}</div>
          <div class="row" style="justify-content:center"><button class="btn btn-bip btn-lg" id="rpower">⚡ Power up Bip</button><button class="btn btn-good btn-lg" id="rcheck">✅ Check</button></div><div id="rout" style="width:100%;display:flex;flex-direction:column;align-items:center;gap:12px"></div>`;
        const gaps = $$(".gap", ctx.body); let sel = editable[editable.length - 1];
        const selG = (i) => { sel = i; gaps.forEach((g) => g.classList.toggle("sel", +g.dataset.g === i)); };
        selG(editable.length === 1 ? editable[0] : editable[0]);
        const build = () => words.map((x, i) => x.w + (chosen[i] || "")).join(" ");
        $("#rflat").onclick = () => PA.Voice.speak(plain, { robot: true });
        setTimeout(() => { PA.sfx("robot"); PA.Voice.speak(plain, { robot: true }); }, 300);
        $("#gaps").onclick = (e) => { const g = e.target.closest(".gap"); if (g && !ctx.body.dataset.locked) { selG(+g.dataset.g); PA.sfx("tap"); } };
        $("#picker").onclick = (e) => {
          const t = e.target.closest("[data-mark]"); if (!t || ctx.body.dataset.locked) return;
          const m = t.dataset.mark || null; chosen[sel] = m; PA.sfx(m ? PA.markSfx[m] : "tap");
          const g = gaps.find((x) => +x.dataset.g === sel);
          g.className = "gap" + (m ? " m-" + SK[m] : " empty"); g.textContent = m || "";
          const idx = editable.indexOf(sel); if (idx < editable.length - 1) selG(editable[idx + 1]); else selG(sel);
        };
        $("#rpower").onclick = () => {
          const t = build();
          $(".robot-stage .mascot", ctx.body).outerHTML = PA.mascot("bip", { size: 130, mood: "talk" });
          PA.sfx("powerup"); setTimeout(() => PA.Voice.speak(t, { emotion: emo }), 500);
        };
        $("#rcheck").onclick = () => {
          if (ctx.body.dataset.locked) return; ctx.body.dataset.locked = 1;
          const res = [];
          editable.forEach((i) => {
            const want = words[i].mark, got = chosen[i];
            const g = gaps.find((x) => +x.dataset.g === i);
            if (want) { const ok = got === want; res.push({ skill: SK[want], ok }); g.classList.add(ok ? "ok" : "no"); if (!ok) { g.className = `gap m-${SK[want]} no`; g.textContent = want; } }
            else if (got) {
              const okComma = got === "," && /^(and|or)$/i.test((words[i + 1] || {}).w || "");
              if (!okComma) { res.push({ skill: SK[got] || "pause", ok: false }); g.classList.add("no"); g.innerHTML = `<s>${got}</s>`; }
            }
          });
          if (!res.length) res.push({ skill: "stop", ok: true });
          ctx.done(res);
          const okAll = res.every((r) => r.ok);
          $(".robot-stage .mascot", ctx.body).outerHTML = PA.mascot("bip", { size: 130, mood: okAll ? "happy" : "sad" });
          $("#rout").innerHTML = `<div class="explain ${okAll ? "good" : "bad"}">${PA.mascot("bip", { size: 44, mood: okAll ? "happy" : "talk" })}<div>${okAll ? "<b>Beep boop… I have FEELINGS now!</b> Thank you for fixing me!" : `<b>${res.filter((r) => r.ok).length} / ${res.length}</b> marks right. The red ones show the correct marks. Listen to how I should sound:`}</div></div>
            <div class="sentence" id="rfull" style="font-size:1.5rem">${PA.ReadAlong.html(text, { cues: true, emotion: emo })}</div>`;
          after(ctx, "", { text, emo, sentEl: $("#rfull") });
        };
      }
    }
  };

  /* Voice Elevator · Hard: build the question, then choose the tone */
  function buildQ(ctx) {
    const b = PA.Content.buildable();
    const target = b.words.join(" ") + "?";
    const tiles = shuffle(b.words.map((w, i) => ({ w: i === 0 ? w.toLowerCase() === w ? w : w.toLowerCase() : w, i })));
    const isName = (w) => PA.BANK.Name.includes(w);
    tiles.forEach((t) => { if (isName(b.words[t.i])) t.w = b.words[t.i]; });
    const got = [];
    ctx.body.innerHTML = `<div class="prompt">Build the question. Tap the words in order.</div>${S.bm("Bina soalan. Tekan perkataan mengikut susunan.")}
      <div class="ctx"><span class="scene">🧱</span><span>${esc(b.from)}</span></div>
      <div class="build" id="bout"></div><div class="tiles" id="btiles">${tiles.map((t, k) => `<button class="wtile" data-k="${k}">${esc(t.w)}</button>`).join("")}</div>
      <div class="row" style="justify-content:center"><button class="btn btn-sm btn-ghost" id="bundo">↩ Undo</button></div><div id="bstep2"></div>`;
    const render = () => { $("#bout").innerHTML = got.map((k, j) => `<span class="wtile">${esc(j === 0 ? cap(tiles[k].w) : tiles[k].w)}</span>`).join("") + (got.length === tiles.length ? `<span class="wtile" style="color:var(--ask-d);font-weight:700">?</span>` : ""); $$("#btiles .wtile").forEach((x) => x.classList.toggle("used", got.includes(+x.dataset.k))); };
    $("#btiles").onclick = (e) => { const t = e.target.closest("[data-k]"); if (!t || got.length === tiles.length) return; got.push(+t.dataset.k); PA.sfx("tap"); render(); if (got.length === tiles.length) step2(); };
    $("#bundo").onclick = () => { if (ctx.body.dataset.locked) return; got.pop(); render(); $("#bstep2").innerHTML = ""; };
    function step2() {
      $("#bstep2").innerHTML = `<div class="prompt">Now: where does your voice go at the end?</div><div class="elev" id="b2"><button class="choice" data-k="up"><span class="arrow" style="color:var(--ask)">↗</span>UP: Yes/No question</button><button class="choice" data-k="down"><span class="arrow" style="color:var(--bip)">↘</span>DOWN: WH question</button></div>`;
      $("#b2").onclick = (e) => {
        const c = e.target.closest("[data-k]"); if (!c || ctx.body.dataset.locked) return; ctx.body.dataset.locked = 1;
        const built = got.map((k) => b.words[tiles[k].i]).join(" ");
        const okBuild = built.toLowerCase() === b.words.join(" ").toLowerCase();
        const okTone = (c.dataset.k === "up") === (b.type === "yn");
        c.classList.add(okTone ? "ok" : "no");
        ctx.done([{ skill: "ask", ok: okBuild }, { skill: "ask", ok: okTone }]);
        ctx.body.insertAdjacentHTML("beforeend", `<div class="explain ${okBuild && okTone ? "good" : "bad"}">${PA.mascot("quizzy", { size: 48 })}<div>${okBuild ? "✅ Word order is right." : `❌ The question is: <b>${esc(target)}</b>`} ${okTone ? "✅" : "❌"} ${b.type === "yn" ? `“${b.words[0]}” starts a Yes/No question: voice UP ↗.` : `“${b.words[0]}” is a WH word: strong start, voice DOWN ↘.`}</div></div>
          <div class="sentence" id="bfull">${PA.ReadAlong.html(target, { cues: true })}</div>`);
        after(ctx, "", { text: target, sentEl: $("#bfull") });
      };
    }
  }
  S.GAMES = GAMES;
})();
