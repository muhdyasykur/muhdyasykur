/* PunctuAction — Dialogue Scanner: bring ANY dialogue (type, paste or photo), Bip finds every mark,
   checks the punctuation, explains the voice for each sentence, reads it aloud, and turns it into a Studio role-play.
   Photo reading uses Tesseract OCR bundled with the app, so it works offline and nothing is uploaded. */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const S = PA.S;
  const OCR = "assets/vendor/tesseract/";
  const AVS = ["🧒", "👧", "👦", "👩", "👨", "👵", "👴", "🧑‍🏫", "🦸", "🤖"];
  const PITCH = [1.2, 1.3, 1.1, 1.0, 0.88, 1.05];
  const EXAMPLES = [
    "Mei: hello ravi\nRavi: Hi, Mei! Where are you going\nMei: I am going to the library. Do you want to come\nRavi: yes please I love books!",
    "Ali: Siti, look at the sky!\nSiti: Wow, it is so dark. Is it going to rain?\nAli: I think so. Let's go inside.\nSiti: Oh no, my bicycle is outside!",
    "\"Where is my hat?\" asked Grandpa.\n\"It's on your head, Grandpa!\" laughed Aina.\n\"Oh, silly me. Thank you, Aina.\""
  ];
  const LEAD = ["yes", "no", "oh", "well", "hello", "hi", "hey", "okay", "ok", "wow", "sorry", "please", "thanks", "goodness", "phew", "shh", "excuse"];
  const EMO_WORDS = [
    ["urgent", /\b(watch out|look out|careful|hurry|quick|run|now|come back)\b/i],
    ["scared", /\b(help|ghost|monster|snake|dark|scared|afraid|ahh+|scary)\b/i],
    ["angry", /\b(hey|stop it|how dare|naughty|not fair|go away|leave me|my seat|you broke|again)\b/i],
    ["sad", /\b(oh no|lost|ruined|gone|miss you|can't leave|cry|sad|wet)\b/i],
    ["excited", /\b(hooray|hurray|yay|we won|goal|champion|surprise|birthday|can't wait|let's go|amazing)\b/i],
    ["surprised", /\b(wow|really|goodness|what a|how (big|tall|lovely|beautiful)|can't believe|look)\b/i],
    ["happy", /\b(thank|love|great|lovely|beautiful|best|fun|nice|yes|welcome|laughed)\b/i]
  ];
  const guessEmo = (t) => { for (const [e, re] of EMO_WORDS) if (re.test(t)) return e; return "excited"; };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- parse raw text into speakers and lines ---------- */
  function clean(raw) {
    return raw.replace(/\r/g, "").replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/[|¦]/g, "I").replace(/[ \t]+/g, " ").replace(/ ([,.?!])/g, "$1").trim();
  }
  function parse(raw) {
    const src = clean(raw).split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const rows = [];
    const sp = /^([A-Z][A-Za-z'.]*(?: [A-Z][A-Za-z'.]*){0,2})\s*(?::|：|\s[-–—]\s)\s*(.+)$/;
    src.forEach((line) => {
      let m = line.match(sp);
      if (m && m[1].split(" ").length <= 3) return rows.push({ who: m[1].trim(), text: m[2].trim() });
      const q = [...line.matchAll(/"([^"]+)"/g)].map((x) => x[1].trim());
      if (q.length) {
        const rest = line.replace(/"[^"]+"/g, " ");
        const V = "said|asked|shouted|cried|replied|whispered|yelled|called|laughed|answered|screamed|exclaimed";
        const w = rest.match(new RegExp(`\\b(?:${V})\\s+(?:the\\s+|my\\s+)?([A-Za-z]+)`)) || rest.match(new RegExp(`\\b(?:the\\s+|my\\s+)?([A-Za-z]+)\\s+(?:${V})\\b`));
        const who = w && !/^(he|she|they|it|i|we|you)$/i.test(w[1]) ? cap(w[1]) : null;
        return rows.push({ who, text: q.join(" ").replace(/,$/, ".") });
      }
      // a line that continues the previous one (photo line-break)
      const prev = rows[rows.length - 1];
      if (prev && !/[.?!"]$/.test(prev.text) && /^[a-z]/.test(line)) { prev.text += " " + line; return; }
      rows.push({ who: null, text: line });
    });
    // a heading at the top (e.g. "Unit 5: At the Zoo") becomes the title, not a line
    let title = null;
    const hasNamed = rows.some((r) => r.who);
    if (rows.length > 1 && hasNamed) {
      const h = rows[0];
      const isHead = (!h.who || /\d/.test(h.who) || /^(unit|chapter|lesson|title|topic)\b/i.test(h.who)) && !/[.?!]$/.test(h.text) && (h.who ? h.who + ": " + h.text : h.text).split(" ").length <= 8;
      if (isHead) { title = h.who ? `${h.who}: ${h.text}` : h.text; rows.shift(); }
    }
    // fill missing speakers: quoted lines alternate between the two most recent speakers
    const named = [...new Set(rows.map((r) => r.who).filter(Boolean))];
    rows.forEach((r, i) => { if (!r.who) r.who = named.length ? (named.length >= 2 && rows[i - 1] ? named.find((n) => n !== rows[i - 1].who) || named[0] : "Narrator") : "Reader"; });
    const names = [...new Set(rows.map((r) => r.who))];
    const cast = names.map((n, i) => ({ name: n, av: AVS[i % AVS.length], pitch: PITCH[i % PITCH.length] }));
    return { title, cast, lines: rows.map((r) => ({ c: names.indexOf(r.who), text: r.text })) };
  }

  /* ---------- check punctuation, produce fixes ---------- */
  const knownNames = (d) => [...new Set(PA.BANK.Name.concat(d.cast.map((c) => c.name)).filter((n) => !/^(Reader|Narrator)$/.test(n)))];
  const capNames = (text, names) => names.reduce((t, n) => t.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), (m) => (m === m.toLowerCase() ? n : m)), text);
  function check(d) {
    const issues = [], names = d.cast.map((c) => c.name.toLowerCase()), NAMES = knownNames(d), lowNames = NAMES.map((n) => n.toLowerCase());
    d.lines.forEach((l, li) => {
      let t = l.text;
      if (!t) return;
      // no end mark: judge only the last, unfinished sentence (e.g. "Hi, Mei! Where are you going")
      if (!/[.?!]["']?$/.test(t)) {
        const cut = Math.max(t.lastIndexOf("."), t.lastIndexOf("?"), t.lastIndexOf("!")) + 1;
        const head = t.slice(0, cut).trim(), tail = t.slice(cut).trim();
        const sug = PA.Lang.suggest(tail, NAMES);
        const to = capNames((head ? head + " " : "") + sug.fixed, NAMES);
        issues.push({ li, kind: "end", icon: PA.MARKS[sug.mark].cue, msg: `Line ${li + 1}: “${tail.length > 26 ? tail.slice(0, 26) + "…" : tail}” has no end mark.`, why: sug.why + (sug.tips.length ? " " + sug.tips.join(" ") : ""), to, mark: sug.mark });
        return;
      }
      PA.Lang.sentences(t).forEach((s) => {
        // names need capital letters
        const lowName = s.text.split(/\s+/).map((w) => w.replace(/[^A-Za-z']/g, "")).find((w) => w && w === w.toLowerCase() && lowNames.includes(w));
        if (lowName) issues.push({ li, kind: "name", icon: "🔠", msg: `“${lowName}” is a name.`, why: "Names always start with a capital letter.", from: s.text, to: capNames(s.text, NAMES) });
        // comma before a name at the end: "Thank you, Aina."
        const ws = s.text.replace(/[.?!]+["']?$/, "").split(" ");
        if (ws.length >= 3) {
          const lastW = ws[ws.length - 1].toLowerCase(), prevW = ws[ws.length - 2];
          if (lowNames.includes(lastW) && !/,$/.test(prevW) && /^(you|me|please|morning|afternoon|evening|night|hello|hi|bye|later|thanks|too|here|there|now|go|it|this|that|ready|okay|sorry)$/i.test(prevW)) {
            const fromBit = prevW + " " + ws[ws.length - 1];
            issues.push({ li, kind: "comma2", icon: "💨", msg: `Add a comma before the name “${ws[ws.length - 1]}”.`, why: "When we talk to someone by name at the end of a sentence, Koma comes just before the name. Take a tiny breath.", from: s.text, to: s.text.replace(fromBit, prevW + ", " + ws[ws.length - 1]) });
          }
        }
        const w = PA.Lang.firstWord(s.text);
        const isQ = (PA.Lang.WH.includes(w) && !/^(what an?|how (big|tall|lovely|beautiful|cute|kind|clever|silly|nice|wonderful))\b/i.test(s.text)) || PA.Lang.AUX.includes(w);
        if (s.mark === "." && isQ) {
          const fixed = s.text.replace(/\.$/, "?");
          issues.push({ li, kind: "q", icon: "❓", msg: `“${s.text}” is a question.`, why: PA.Lang.WH.includes(w) ? `It starts with the WH word “${cap(w)}”, so it needs a question mark. Start strong, voice goes down ↘.` : `It starts with “${cap(w)}”, so it is a Yes/No question. It needs a question mark, and your voice goes UP ↗.`, from: s.text, to: fixed, mark: "?" });
        }
        if (/\bi\b|\bi'(m|ll|ve|d)\b/.test(s.text)) issues.push({ li, kind: "i", icon: "🔠", msg: `Write “I” as a capital letter.`, why: "The word “I” is always a capital letter, even in the middle of a sentence.", from: s.text, to: s.text.replace(/\bi\b/g, "I").replace(/\bi'(m|ll|ve|d)\b/g, "I'$1") });
        if (/^[a-z]/.test(s.text)) issues.push({ li, kind: "cap", icon: "🔠", msg: `“${s.text.slice(0, 18)}…” should start with a capital letter.`, why: "Every sentence starts with a capital letter. It helps you see where a new sentence begins.", from: s.text, to: cap(s.text) });
        const words = s.text.split(" ");
        const first = words[0].replace(/[^A-Za-z']/g, "").toLowerCase();
        if (words.length > 1 && !/,$/.test(words[0]) && (LEAD.includes(first) && !(first === "please" || first === "excuse" || (first === "no" && /^(one|more|way)/i.test(words[1]))) || (names.includes(first) && first !== d.cast[l.c].name.toLowerCase()))) {
          const to = words[0] + "," + s.text.slice(words[0].length);
          issues.push({ li, kind: "comma", icon: "💨", msg: `Add a comma after “${words[0]}”.`, why: names.includes(first) ? `“${words[0]}” is the person being spoken to, so Koma separates the name. Take a tiny breath.` : `After “${words[0]}” at the start, take a tiny breath. That's a comma!`, from: s.text, to });
        }
        if (/[!?]{2,}|\.{2,}/.test(s.text)) issues.push({ li, kind: "double", icon: "✌️", msg: `One mark is enough in “${s.text.slice(0, 20)}…”.`, why: "Use one end mark. Show the feeling with your voice, not with extra marks!", from: s.text, to: s.text.replace(/([!?])[!?]+/, "$1").replace(/\.{2,}$/, ".") });
      });
    });
    return issues;
  }
  function applyFix(d, iss) {
    const l = d.lines[iss.li];
    if (iss.kind === "end") l.text = iss.to; else l.text = l.text.replace(iss.from, iss.to);
  }

  /* ---------- voice script for one sentence ---------- */
  function voiceFor(s, emo) {
    const c = PA.Lang.classify(s.text), commas = (s.text.match(/,/g) || []).length;
    const breath = commas ? ` <span class="vtag vt-pause">💨 ${commas} tiny breath${commas > 1 ? "s" : ""}</span>` : "";
    if (c.type === "wh") return `<span class="vtag vt-ask">↘ WH question: start strong on “${esc(cap(c.cueWord))}”, voice goes down</span>${breath}`;
    if (c.type === "yn") return `<span class="vtag vt-ask">↗ Yes/No question (“${esc(cap(c.cueWord))}”): voice goes UP</span>${breath}`;
    if (c.type === "declq") return `<span class="vtag vt-ask">↗ Asking: voice goes UP</span>${breath}`;
    if (c.type === "excl") return `<span class="vtag vt-feel">💥 Feeling: ${PA.EMOTIONS[emo] ? PA.EMOTIONS[emo].emoji + " " + PA.EMOTIONS[emo].label : ""}</span>${breath}`;
    return `<span class="vtag vt-stop">🛑 Telling: voice goes down, then STOP</span>${breath}`;
  }

  /* ======================= PAGE ======================= */
  S.pages.scanner = () => {
    S.setTab("scanner");
    let d = null, issues = [];
    const draft = PA.settings.get("scanDraft:" + S.pupil.id, "");
    S.mount(`<div class="page-title">${PA.mascot("bip", { size: 72, mood: "talk", cls: "wiggle" })}<div><h1>Dialogue Scanner</h1><p>Bring any dialogue. Bip finds every mark and shows how your voice should sound.</p>${S.bm("Bawa apa-apa dialog. Bip akan mencari tanda baca dan menunjukkan cara membacanya.")}</div></div>
      <div class="card" id="scanInput">
        <div class="prompt" style="text-align:left;margin-bottom:10px">How do you want to bring your dialogue?</div>
        <div class="scan-modes" id="scanModes">
          <button data-mode="type" class="on"><span>✍️</span>Type</button>
          <button data-mode="paste"><span>📋</span>Paste</button>
          <button data-mode="camera" id="scanPhoto"><span>📷</span>Take a photo</button>
          <button data-mode="picture"><span>🖼️</span>Upload a picture</button>
          <button data-mode="example" id="scanExample"><span>💡</span>Try an example</button>
        </div>
        <div class="scan-photo" id="scanPhotoBox" hidden><img id="scanImg" alt="Your dialogue photo"><div class="col grow"><b id="ocrMsg">Bip is reading your picture…</b><div class="bar"><i id="ocrBar" style="width:0;background:var(--bip)"></i></div><span class="small muted">Photo reading happens on this device. Nothing is uploaded.</span></div></div>
        <textarea class="input scan-text" id="scanText" rows="7" spellcheck="false" placeholder="Ali: Siti, where is my bag?&#10;Siti: Is it under the table?&#10;Ali: Yes, here it is. Thank you!">${esc(draft)}</textarea>
        <div class="small muted" style="margin:6px 0 12px">Tip: write each line as <b>Name: words</b>. Lines with "quotation marks" work too.</div>
        <div class="row"><button class="btn btn-bip btn-lg" id="scanGo">🔍 Scan my dialogue</button><button class="btn btn-ghost" id="scanClear">🧹 Clear</button></div>
        <input type="file" accept="image/*" capture="environment" id="camIn" hidden><input type="file" accept="image/*" id="picIn" hidden>
      </div>
      <div id="scanResult"></div>`);
    const ta = $("#scanText");
    // quietly download the photo reader once while online, so it also works offline later
    if (navigator.onLine && /^https?:/.test(location.protocol)) ["tesseract.min.js", "worker.min.js", "core/tesseract-core-simd-lstm.wasm.js", "lang/eng.traineddata.gz"].forEach((f) => fetch(OCR + f).catch(() => {}));
    ta.oninput = () => PA.settings.set("scanDraft:" + S.pupil.id, ta.value);
    $("#scanModes").onclick = (e) => {
      const b = e.target.closest("[data-mode]"); if (!b) return;
      $$("#scanModes button").forEach((x) => x.classList.toggle("on", x === b)); PA.sfx("tap");
      const mode = b.dataset.mode;
      if (mode === "type") ta.focus();
      if (mode === "paste") { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then((t) => { if (t) { ta.value = t; ta.oninput(); PA.toast("Pasted! Now press Scan.", "good"); } }).catch(() => { ta.focus(); PA.toast("Long-press in the box and choose Paste."); }); else ta.focus(); }
      if (mode === "camera") $("#camIn").click();
      if (mode === "picture") $("#picIn").click();
      if (mode === "example") { ta.value = EXAMPLES[(+(ta.dataset.ex || -1) + 1) % EXAMPLES.length]; ta.dataset.ex = EXAMPLES.indexOf(ta.value); ta.oninput(); scan(); }
    };
    ["#camIn", "#picIn"].forEach((id) => ($(id).onchange = (e) => { const f = e.target.files[0]; if (f) readPhoto(f); e.target.value = ""; }));
    $("#scanClear").onclick = () => { ta.value = ""; ta.oninput(); $("#scanResult").innerHTML = ""; $("#scanPhotoBox").hidden = true; };
    $("#scanGo").onclick = () => scan();

    async function readPhoto(file) {
      const box = $("#scanPhotoBox"); box.hidden = false;
      $("#scanImg").src = URL.createObjectURL(file);
      $("#ocrMsg").textContent = "Bip is reading your picture…"; $("#ocrBar").style.width = "5%";
      try {
        if (!window.Tesseract) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = OCR + "tesseract.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        // shrink & grey the photo for faster, cleaner reading
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = $("#scanImg").src; });
        const k = Math.min(1, 2000 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext("2d"); g.filter = "grayscale(1) contrast(1.35)"; g.drawImage(img, 0, 0, c.width, c.height);
        const w = await Tesseract.createWorker("eng", 1, { workerPath: OCR + "worker.min.js", corePath: OCR + "core", langPath: OCR + "lang", gzip: true, workerBlobURL: false,
          logger: (m) => { if (m.status === "recognizing text") { $("#ocrBar").style.width = Math.round(10 + m.progress * 90) + "%"; $("#ocrMsg").textContent = `Bip is reading… ${Math.round(m.progress * 100)}%`; } } });
        const r = await w.recognize(c); await w.terminate();
        const text = clean(r.data.text).split("\n").filter((l) => l.trim().length > 1).join("\n");
        if (!text.trim()) throw new Error("empty");
        ta.value = text; ta.oninput();
        $("#ocrBar").style.width = "100%"; $("#ocrMsg").innerHTML = "✅ Done! <b>Check the words below</b> and fix any mistakes. Then press Scan.";
        PA.sfx("correct"); ta.focus();
      } catch (e) {
        $("#ocrMsg").innerHTML = /^file:/.test(location.protocol) ? "Photo reading needs the app opened from its web address or installed. You can still type or paste." : "Bip couldn't read this picture. Try a brighter, straighter photo, or type the dialogue.";
        PA.sfx("wrong");
      }
    }

    function scan() {
      const raw = ta.value.trim();
      if (!raw) { PA.toast("Type, paste or photograph a dialogue first ✍️"); ta.focus(); return; }
      d = parse(raw);
      d.lines.forEach((l) => { if (/!/.test(l.text)) l.emo = guessEmo(l.text); });
      PA.sfx("powerup");
      render();
    }
    function render() {
      issues = check(d);
      const all = d.lines.map((l) => l.text).join(" ");
      const toks = PA.Lang.tokenize(all).filter((t) => t.type === "mark").map((t) => PA.Lang.normMark(t.mark));
      const count = (m) => toks.filter((x) => x === m).length;
      const sents = d.lines.reduce((a, l) => a + PA.Lang.sentences(l.text).length, 0);
      const score = Math.max(0, Math.round(100 * (1 - issues.length / Math.max(1, sents))));
      const out = $("#scanResult");
      out.innerHTML = `
        <div class="card scan-sum" id="scanSummary">
          <div class="scan-score" style="--p:${score}"><b>${score}%</b><span>voice-ready</span></div>
          <div class="grow"><h3 style="margin:0 0 6px">Bip found ${toks.length} mark${toks.length === 1 ? "" : "s"} in ${d.lines.length} line${d.lines.length === 1 ? "" : "s"}</h3>
            <div class="row">${[".", ",", "?", "!"].map((m) => `<span class="mark-count" style="--c:${PA.MARKS[m].color}">${PA.markMascot(m, { size: 34 })}<b>${count(m)}</b> ${PA.MARKS[m].name.toLowerCase()}${count(m) === 1 ? "" : "s"}</span>`).join("")}</div>
            <div class="row" style="margin-top:8px">${d.cast.map((c) => `<span class="pill">${c.av} ${esc(c.name)}</span>`).join("")}</div></div>
        </div>
        <div class="card" id="scanFixes"><h3 style="margin:0 0 8px">🩺 Bip's punctuation check ${issues.length ? `<span class="pill pill-feel">${issues.length} to fix</span>` : `<span class="pill pill-good">All good!</span>`}</h3>
          ${issues.length ? `<div class="col">${issues.map((x, i) => `<div class="fix"><span class="fix-ic">${x.icon}</span><div class="grow"><b>${esc(x.msg)}</b><div class="small read">${esc(x.why)}</div>${x.to ? `<div class="small" style="margin-top:4px">➡ <span class="read">${PA.ReadAlong.html(x.to, { cues: false })}</span></div>` : ""}</div><button class="btn btn-sm btn-good" data-fix="${i}">✅ Fix</button></div>`).join("")}
            <div class="row"><button class="btn btn-sm btn-good" id="fixAll">✅ Fix all</button><span class="small muted">Bip's suggestions follow common rules. Think: does it make sense?</span></div></div>`
            : `<p class="read">${PA.mascot("zing", { size: 40 })} Every sentence has the right end mark. Great punctuation!</p>`}</div>
        <h2 class="section-title">🗺️ Voice map <span class="small muted" style="font-weight:500">tap any coloured mark to learn why</span></h2>
        <div id="scanMap">${d.lines.map((l, i) => { const c = d.cast[l.c]; return `<div class="line scan-line" data-i="${i}"><div><div class="who-av">${c.av}</div><div class="who-n">${esc(c.name)}</div></div>
          <div><div class="txt" data-t="${i}">${PA.ReadAlong.html(l.text, { cues: true, emotion: l.emo })}</div>
          <div class="vscript">${PA.Lang.sentences(l.text).map((s) => voiceFor(s, l.emo)).join(" ")}</div>
          <div class="line-tools"><button class="btn btn-sm btn-ask" data-hear="${i}">🔊 Listen</button>${/!/.test(l.text) ? `<label class="tool">Feeling: <select data-emo="${i}">${Object.entries(PA.EMOTIONS).map(([k, e]) => `<option value="${k}" ${k === l.emo ? "selected" : ""}>${e.emoji} ${e.label}</option>`).join("")}</select></label>` : ""}</div></div></div>`; }).join("")}</div>
        <div class="card" id="scanActions"><div class="row"><button class="btn btn-ask btn-lg" id="scanListen">▶ Listen to the whole dialogue</button>
          <input class="input" id="scanTitle" style="max-width:280px" maxlength="40" placeholder="Name your dialogue" value="${esc(d.title || PA.settings.get("scanTitle", "My dialogue"))}">
          <button class="btn btn-stop btn-lg" id="scanSave">🎭 Practise it in the Studio</button><button class="btn btn-ghost" id="scanCopy">📝 Copy the text</button></div>
          <div class="legend-row small muted">Signs: 🛑 stop · 💨 breathe · ↗ voice up · ↘ strong start, voice down · 😄😠😨 feeling</div></div>`;
      out.scrollIntoView({ behavior: "smooth", block: "start" });
      out.onclick = async (e) => {
        const f = e.target.closest("[data-fix]"); if (f) { applyFix(d, issues[+f.dataset.fix]); sync(); PA.sfx("correct"); return render(); }
        if (e.target.closest("#fixAll")) { for (let k = 0; k < 6; k++) { const is = check(d); if (!is.length) break; is.forEach((x) => applyFix(d, x)); } sync(); PA.sfx("win"); PA.confetti(60); return render(); }
        const h = e.target.closest("[data-hear]"); if (h) return hear(+h.dataset.hear);
        const mk = e.target.closest(".mk"); if (mk) { const txt = mk.closest("[data-t]"); if (!txt) return; const i = +txt.dataset.t, at = +mk.dataset.m, m = PA.Lang.normMark(mk.textContent.trim()[0]);
          PA.sfx(PA.markSfx[m]); PA.modal({ title: `${PA.MARKS[m].hero} · ${PA.MARKS[m].name} ${m}`, body: `<div class="row" style="flex-wrap:nowrap">${PA.markMascot(m, { size: 80, mood: "talk" })}<div class="read" style="font-size:1.1rem">${S.explain(d.lines[i].text, at, m, d.lines[i].emo)}</div></div>`, actions: [{ label: "Got it!", cls: "btn-good" }] }); return; }
        if (e.target.closest("#scanListen")) return listenAll(e.target.closest("#scanListen"));
        if (e.target.closest("#scanCopy")) { const t = d.lines.map((l) => `${d.cast[l.c].name}: ${l.text}`).join("\n"); try { await navigator.clipboard.writeText(t); PA.toast("Copied! 📋", "good"); } catch (er) { ta.value = t; PA.toast("The fixed text is in the box above."); } return; }
        if (e.target.closest("#scanSave")) return save();
      };
      out.onchange = (e) => { const s = e.target.closest("[data-emo]"); if (s) { d.lines[+s.dataset.emo].emo = s.value; render(); hear(+s.dataset.emo); } };
    }
    function sync() { ta.value = (d.title ? d.title + "\n" : "") + d.lines.map((l) => `${d.cast[l.c].name}: ${l.text}`).join("\n"); ta.oninput(); }
    function hear(i) { const l = d.lines[i], c = d.cast[l.c]; return PA.ReadAlong.play($(`[data-t="${i}"]`), l.text, { emotion: l.emo, voice: PA.Voice.forCharacter(l.c), pitch: c.pitch }); }
    async function listenAll(btn) {
      if (btn.dataset.on) { btn.dataset.on = ""; PA.Voice.stop(); btn.textContent = "▶ Listen to the whole dialogue"; return; }
      btn.dataset.on = 1; btn.textContent = "⏹ Stop";
      for (let i = 0; i < d.lines.length && btn.dataset.on; i++) {
        const row = $(`.scan-line[data-i="${i}"]`); row.classList.add("live"); row.scrollIntoView({ block: "center", behavior: "smooth" });
        const ok = await hear(i); row.classList.remove("live"); if (ok === false) break; await PA.sleep(400);
      }
      btn.dataset.on = ""; btn.textContent = "▶ Listen to the whole dialogue";
    }
    async function save() {
      if (S.pupil.guest) return PA.toast("Guests can't save. Ask your teacher to add your name! 🙂");
      const left = check(d).filter((x) => x.kind === "end" || x.kind === "q").length;
      if (left && !(await PA.confirmBox("Some marks are still missing", `Bip found ${left} line${left > 1 ? "s" : ""} that may need a different end mark. Save anyway?`, "Save anyway", "btn-ask"))) return;
      const title = ($("#scanTitle").value || "My dialogue").trim(); PA.settings.set("scanTitle", title);
      const nComma = d.lines.reduce((a, l) => a + (l.text.match(/,/g) || []).length, 0);
      const level = d.lines.length <= 4 && nComma <= 1 ? "easy" : nComma > 4 || d.lines.length > 8 ? "hard" : "medium";
      const dlg = { id: PA.uid("my"), title, scene: "📝", level, years: "My dialogue", setting: `Made by ${S.pupil.name} with the Dialogue Scanner`, cast: d.cast, lines: d.lines.map((l) => ({ c: l.c, text: l.text, emo: l.emo || undefined })), owner: S.pupil.id, ownerName: S.pupil.name, createdAt: Date.now() };
      await PA.DB.put("dialogues", dlg);
      S.pupil.stars = (S.pupil.stars || 0) + 3; await S.save();
      PA.sfx("win"); PA.confetti();
      PA.toast("Saved to your Studio! +3 ⭐", "good");
      location.hash = "#/studio/" + dlg.id;
    }
    if (draft) setTimeout(() => {}, 0);
  };
  S.scanParse = parse; S.scanCheck = check;
})();
