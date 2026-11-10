/* PunctuAction — Help Centre (video tutorials + FAQ), About page, and shell extras:
   page-matched "Watch how" videos, music toggle, offline indicator, splash, read-aloud instructions. */
(function () {
  const PA = window.PA; const { $, $$, esc } = PA; const S = PA.S;

  /* ---------- "Watch how": open the video for the page you are on ---------- */
  const GAME_SHOT = { detective: 2, ears: 4, patrol: 5, tone: 6, feelings: 7, robot: 8 };
  $("#watchBtn").onclick = () => {
    const parts = (location.hash.replace(/^#\/?/, "").split("?")[0] || "home").split("/");
    const map = { home: "welcome", learn: "learn", practice: "practice", play: "practice", studio: "studio", scanner: "scanner", me: "me", feedback: "me", help: "welcome", about: "welcome" };
    const id = map[parts[0]] || "welcome";
    const start = parts[0] === "play" ? GAME_SHOT[parts[1]] || 0 : parts[0] === "feedback" ? 4 : parts[0] === "studio" && parts[1] ? 3 : 0;
    PA.Video.play(id, { startShot: start });
  };

  /* ---------- music toggle ---------- */
  const mb = $("#musicBtn");
  const paintMusic = () => { mb.classList.toggle("on", PA.Music.on); mb.title = PA.Music.on ? "Music on (tap to stop)" : "Music off (tap to play)"; };
  mb.onclick = () => { PA.Music.toggle(); paintMusic(); PA.toast(PA.Music.on ? "🎵 Music on" : "🔇 Music off"); };
  document.addEventListener("pointerdown", function once() { if (PA.settings.get("music", false) && !PA.Music.on) { PA.Music.start(); paintMusic(); } document.removeEventListener("pointerdown", once); });
  paintMusic();

  /* ---------- offline indicator ---------- */
  const net = () => { $("#offlinePill").hidden = navigator.onLine; };
  window.addEventListener("online", net); window.addEventListener("offline", () => { net(); PA.toast("📴 You're offline. Don't worry, everything still works!"); }); net();

  /* ---------- splash ---------- */
  const sp = $("#splash");
  if (sp) { sp.querySelector(".splash-logo").innerHTML = PA.logo(110); sp.querySelector(".splash-name").innerHTML = PA.wordmark(); setTimeout(() => sp.classList.add("out"), 1400); setTimeout(() => sp.remove(), 2100); }

  /* ---------- 🔊 read-aloud button on every instruction ---------- */
  const decorate = (root) => {
    $$(".prompt", root).forEach((el) => {
      if (el.querySelector(".say-btn")) return;
      const b = document.createElement("button");
      b.className = "say-btn"; b.type = "button"; b.setAttribute("aria-label", "Read this instruction aloud"); b.textContent = "🔊";
      b.onclick = (e) => { e.stopPropagation(); const t = el.cloneNode(true); t.querySelectorAll(".say-btn").forEach((x) => x.remove()); PA.Voice.speak(t.textContent.trim(), { mode: "natural" }); };
      el.appendChild(b);
      if (PA.settings.get("autoRead", false) && !document.querySelector(".vp-back")) setTimeout(() => b.click(), 250);
    });
  };
  new MutationObserver(() => decorate($("#app"))).observe($("#app"), { childList: true, subtree: true });

  /* ---------- Help Centre ---------- */
  const FAQ = [
    ["I can't hear the computer voice.", "Turn up the volume. In ⚙️ Settings, choose another voice and press Test. If there is no English voice on this device, ask your teacher to record the model voices."],
    ["The microphone doesn't work.", "When the browser asks, tap Allow. Recording works in Chrome, Edge and Safari. If it still doesn't work, read aloud to a friend and use the self-check."],
    ["I'm shy about my voice.", "In the Reading Studio, choose a disguise voice (🐭 🐻 👽). Your pauses and your up-and-down voice stay the same, so your teacher can still see how well you read."],
    ["Why are the sentences different every time?", "So you learn the rule, not the answer! Look at the first word, the story box and the marks to decide."],
    ["What do the little signs above the marks mean?", "🛑 stop, 💨 breathe, ↗ voice goes up, ↘ start strong then go down, and a face shows the feeling for “!”."],
    ["How do I bring my own dialogue?", "Open 🔍 Scanner. Type it, paste it, or take a photo. Then press Scan."],
    ["Does it need the internet?", "No. After the first visit everything works offline, even the photo scanner."]
  ];
  S.pages.help = () => {
    S.setTab("");
    S.mount(`<div class="page-title">${PA.mascot("bip", { size: 70, mood: "happy", cls: "wiggle" })}<div><h1>Help Centre</h1><p>Watch a short video, or find an answer below.</p>${S.bm("Tonton video pendek atau cari jawapan di bawah.")}</div></div>
      <h2 class="section-title">🎬 Video tutorials</h2><div class="vgrid" id="vids">${PA.PUPIL_VIDEOS.map((id) => PA.videoCard(id)).join("")}</div>
      <h2 class="section-title">❓ Questions & answers</h2><div class="col" id="faq">${FAQ.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p class="read">${esc(a)}</p></details>`).join("")}</div>
      <div class="row" style="margin-top:18px"><a class="btn btn-ghost" href="manual.html#pupil" target="_blank">📘 User manual</a><a class="btn btn-ghost" href="#/about">ℹ️ About ${esc(PA.brand.name)}</a></div>`);
  };

  /* ---------- About ---------- */
  S.pages.about = () => {
    S.setTab("");
    S.mount(`<div class="about">
      <div class="about-hero">${PA.logo(90)}<div><h1>${PA.wordmark()}</h1><div class="tag">${esc(PA.brand.tagline)}</div><div class="small" style="opacity:.8">Version ${PA.brand.version} · ${PA.brand.year}</div></div></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>📖 Our story</h3><p class="read">Many pupils read dialogues like robots: every word sounds the same. They rush past commas and full stops, and their questions and exclamations have no feeling. ${esc(PA.brand.name)} turns each punctuation mark into a friend who tells your voice what to do.</p></div>
        <div class="card"><h3>🧭 How it works</h3><ol class="read"><li><b>Learn</b> what each mark does to your voice.</li><li><b>Practise</b> with new sentences every time, at your level.</li><li><b>Perform</b> dialogues, record, and see your voice melody.</li><li><b>Grow</b> with your teacher's feedback.</li></ol></div>
        <div class="card"><h3>🎵 Remember the chant</h3>${PA.brand.chant.map((c) => `<div class="read" style="font-size:1.2rem">${PA.ReadAlong.html(c.line, { cues: true, emotion: "excited" })}</div>`).join("")}</div>
        <div class="card"><h3>🔐 Our privacy promise</h3><ul class="read"><li>No accounts and no internet needed.</li><li>Your name, voice and results stay on this device.</li><li>Only your teacher can see your work, in the PIN-locked Teacher Hub.</li><li>Bip, the helper, never sends your words anywhere.</li></ul></div>
        <div class="card"><h3>🎨 Made with care</h3><p class="read">The characters, pictures and sounds were made especially for ${esc(PA.brand.name)}. Fonts: Fredoka and Andika (SIL Open Font License). Photo reading: Tesseract OCR (Apache 2.0), which works offline. Natural character voices: generated with ElevenLabs.</p></div>
        <div class="card"><h3>🏫 For teachers</h3><p class="read">A digital innovation for English Language Teaching (TSLB3402). Aligned to KSSR English skills (speaking, reading aloud, punctuation) and CEFR prosodic features. See the <a href="manual.html" target="_blank">user manual</a>.</p></div>
      </div></div>`);
  };
})();
