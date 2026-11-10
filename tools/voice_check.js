/* Checks generated voice clips with the app's own analyser: does each Yes/No question rise, each WH question fall,
   and is there a pause at each comma / full stop? Usage: node tools/voice_check.js <timings.json> <clip_dir> [id ...]
   (app served at http://127.0.0.1:8765) */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
(async () => {
  const [tj, dir, ...only] = process.argv.slice(2);
  const T = JSON.parse(fs.readFileSync(tj, "utf8"));
  const ids = only.length ? only : Object.keys(T);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto("http://127.0.0.1:8765/student.html"); await p.waitForTimeout(1200);
  const bad = [];
  for (const id of ids) {
    const t = T[id]; const text = t.key.split("|")[0];
    const b64 = fs.readFileSync(path.join(dir, t.f)).toString("base64");
    const r = await p.evaluate(async ([b64, text]) => {
      const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const { samples, sr } = await PA.Analyse.decode(new Blob([u8], { type: "audio/mpeg" }));
      const an = PA.Analyse.run(samples, sr);
      const s = PA.Lang.sentences(text); const last = s[s.length - 1] || { text, mark: "." };
      const cls = PA.Lang.classify(last.text);
      return { endTone: an.endTone, delta: +(an.endDelta || 0).toFixed(1), pauses: an.pauses ? an.pauses.length : 0, range: +(an.pitchRange || 0).toFixed(1), type: cls.type };
    }, [b64, text]);
    let verdict = "ok";
    if (r.type === "yn" || r.type === "declq") verdict = r.endTone === "rise" ? "ok" : r.endTone === "level" ? "weak" : "WRONG";
    if (r.type === "wh") verdict = r.endTone === "rise" ? "rising-WH" : "ok";
    if (verdict !== "ok") bad.push(id);
    console.log(`${id} ${r.type.padEnd(5)} end=${r.endTone.padEnd(5)} Δ${String(r.delta).padStart(5)}st range=${r.range} pauses=${r.pauses} ${verdict === "ok" ? "✓" : "⚠ " + verdict} | ${text.slice(0, 55)}`);
  }
  console.log(bad.length ? "TO REVIEW: " + bad.join(" ") : "ALL OK");
  await b.close();
})();
