/* Captures every screen used by the video tutorials (assets/video/*.jpg) and writes js/core/shotmap.js,
   which stores where each highlighted element sits inside each screenshot (as fractions 0–1).
   Usage (from the repo root, with the app served at http://127.0.0.1:8765):  node tools/capture.js
   Needs Playwright with Chromium. Uses a fake microphone, so recordings are a test tone. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, ".."), OUT = path.join(ROOT, "assets/video"), B = process.env.BASE || "http://127.0.0.1:8765/";
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 }, permissions: ["microphone"] });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const MAP = {};
  const wait = (ms) => p.waitForTimeout(ms);
  const close = async () => { for (let k = 0; k < 4; k++) { const m = await p.$(".modal-actions .btn"); if (m) { await m.click({ force: true }); await wait(300); } } };
  const quiet = () => p.evaluate(() => { const s = document.getElementById("splash"); if (s) s.remove(); document.querySelectorAll(".toast-wrap").forEach((t) => t.remove()); if (window.PA && PA.Voice) PA.Voice.stop(); });
  async function shot(name, scrollSel, offset = 84) {
    await quiet();
    if (scrollSel) { await p.evaluate(([s, o]) => { const e = document.querySelector(s); if (e) { const r = e.getBoundingClientRect(); window.scrollBy(0, r.top - o); } }, [scrollSel, offset]); await wait(500); }
    else await p.evaluate(() => window.scrollTo(0, 0));
    await wait(350);
    const sels = await p.evaluate((img) => {
      const out = new Set();
      Object.values((window.PA && PA.VIDEOS) || {}).forEach((v) => v.shots.forEach((s) => { if (s.img !== img) return; Object.values(s.acts || {}).forEach((a) => ["ring", "point", "focus"].forEach((k) => { if (typeof a[k] === "string") out.add(a[k]); })); }));
      return [...out];
    }, name);
    MAP[name] = await p.evaluate((sels) => {
      const W = innerWidth, H = innerHeight, o = {};
      sels.forEach((s) => { const e = document.querySelector(s); if (!e) return; const r = e.getBoundingClientRect();
        const x0 = Math.max(0, r.left) / W, y0 = Math.max(0, r.top) / H, x1 = Math.min(W, r.right) / W, y1 = Math.min(H, r.bottom) / H;
        if (x1 > x0 && y1 > y0) o[s] = [+x0.toFixed(4), +y0.toFixed(4), +(x1 - x0).toFixed(4), +(y1 - y0).toFixed(4)]; });
      return o;
    }, sels);
    const missing = sels.filter((s) => !MAP[name][s]); if (missing.length) console.log(`  ! ${name}: not visible -> ${missing.join(", ")}`);
    await p.screenshot({ path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 74 });
    console.log("✓", name);
  }

  /* ---------- teacher: setup + demo class ---------- */
  await p.goto(B + "teacher.html"); await wait(900);
  await shot("t-setup");
  await p.fill("#su-class", "4 Bestari"); await p.fill("#su-pin", "2468"); await p.fill("#su-pin2", "2468"); await p.click("#su-go"); await wait(300); await close();
  await p.click("#demoBtn"); await wait(9500);
  await p.click("#lockBtn"); await wait(300); await shot("t-lock");

  /* ---------- front page ---------- */
  await p.goto(B + "index.html"); await wait(8500); await shot("p-front");

  /* ---------- pupil ---------- */
  await p.goto(B + "student.html"); await wait(2400); await shot("p-signin");
  await p.click(".who button", { force: true }); await wait(3800); await close();
  await shot("p-home");
  await shot("p-home-2", "#journey");
  await p.goto(B + "student.html#/learn"); await wait(700); await shot("p-learn");
  await p.goto(B + "student.html#/learn/quizzy"); await wait(800); await shot("p-lesson-meet");
  await p.click("#lnext"); await wait(600);
  const tw = await p.$("#tw"); const bb = await tw.boundingBox();
  await p.mouse.move(bb.x + bb.width * 0.32, bb.y + bb.height * 0.3); await p.mouse.down();
  for (let t = 0; t <= 1; t += 0.05) await p.mouse.move(bb.x + bb.width * (0.32 + 0.36 * Math.sin(t * Math.PI / 1.3)), bb.y + bb.height * (0.3 - 0.15 * Math.sin(t * Math.PI)));
  await p.mouse.up(); await wait(300); await shot("p-lesson-trace");
  await p.click("#lnext"); await wait(600); await shot("p-lesson-hear");
  await p.click("#lnext"); await wait(600); const mks = await p.$$("#st .mk-ask"); for (const m of mks.slice(0, 2)) await m.click(); await wait(300); await shot("p-lesson-spot");
  await p.click("#lnext"); await wait(600); await shot("p-lesson-say");
  await p.goto(B + "student.html#/practice"); await wait(700); await shot("p-practice");
  await p.goto(B + "student.html#/play/detective?level=medium&c=1"); await wait(800); await shot("g-detective");
  await p.click("#dtiles [data-mark='.']"); await wait(900); await shot("g-detective-answer", ".explain");
  for (const g of ["ears", "patrol", "tone", "feelings", "robot"]) { await p.goto(`${B}student.html#/play/${g}?level=medium&c=1`); await wait(900); await shot("g-" + g); }
  await p.goto(B + "student.html#/play/detective?level=easy&c=2"); await wait(700);
  for (let i = 0; i < 8; i++) { await p.click("#dtiles [data-mark='?']"); await wait(250); await p.click("[data-next]"); await wait(350); }
  await wait(900); await close(); await p.click("#diff [data-v='right']"); await shot("g-results", ".results");
  await p.goto(B + "student.html#/scanner"); await wait(700);
  await p.fill("#scanText", "Mei: hello ravi\nRavi: Hi, Mei! Where are you going\nMei: I am going to the library. Do you want to come\nRavi: Yes, please! I love books!");
  await shot("p-scanner");
  await p.click("#scanGo"); await wait(900); await shot("p-scanner-result", "#scanSummary");
  await p.click("#fixAll"); await wait(800); await shot("p-scanner-map", "#scanMap");
  await shot("p-scanner-save", "#scanActions", 480);
  await p.fill("#scanTitle", "Going to the Library"); await p.click("#scanSave"); await wait(1500); await close();
  await p.goto(B + "student.html#/studio"); await wait(800); await shot("p-studio");
  await shot("p-studio-mine", "#myDlgs", 200);
  await p.goto(B + "student.html#/studio/d-durian"); await wait(900); await p.click("#cast [data-r='1']"); await wait(400); await shot("p-dialogue");
  await p.click("[data-a='rec'][data-i='1']"); await wait(2600); await p.click("[data-a='rec'][data-i='1']"); await wait(1800);
  await shot("p-record", ".line[data-i='1']");
  await p.goto(B + "student.html#/me"); await wait(900); await shot("p-me");
  await shot("p-me-2", "#mail", 140);
  await shot("p-me-3", "#badges", 140);
  await p.goto(B + "student.html#/feedback"); await wait(700); await p.click("#smile [data-v='4']"); await shot("p-feedback");
  await p.fill("#idea", "More football stories please!"); await shot("p-feedback-2", "#fbSend", 520);
  await p.click(".chat-fab"); await wait(300); await p.fill(".chat-input input", "where is my bag"); await p.click(".chat-input button"); await wait(800); await shot("p-chat");

  /* ---------- teacher pages ---------- */
  await p.goto(B + "teacher.html"); await wait(600);
  for (const k of "2468") await p.click(`#pp [data-n='${k}']`); await p.click("#pp [data-n='ok']"); await wait(900);
  await shot("t-overview");
  for (const r of ["pupils", "voices", "dialogues/new", "missions", "evaluation", "data"]) { await p.goto(B + "teacher.html#/" + r); await wait(1000); await shot("t-" + r.replace("/", "-")); }
  await p.goto(B + "teacher.html#/assess"); await wait(800); await p.click("#alist .rec-row"); await wait(1600); await p.click("#asug"); await wait(2800); await shot("t-assess");
  await shot("t-assess-2", "#asug", 60);
  await p.click("#ast [data-s='star']"); await p.click("[data-q]"); await shot("t-assess-3", "#asave", 520);

  fs.writeFileSync(path.join(ROOT, "js/core/shotmap.js"), "/* Positions of on-screen elements inside the tutorial screenshots (generated by tools/capture.js). */\nwindow.PA = window.PA || {};\nPA.SHOTMAP = " + JSON.stringify(MAP, null, 0).replace(/\],"/g, '],\n  "').replace(/\},"/g, '},\n"') + ";\n");
  console.log(errs.length ? "PAGE ERRORS:\n" + errs.join("\n") : "NO PAGE ERRORS");
  await b.close();
})();
