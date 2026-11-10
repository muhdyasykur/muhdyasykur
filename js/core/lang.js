/* PunctuAction — language helpers: tokenizer, sentence-type classifier, sentence checker */
(function () {
  const PA = (window.PA = window.PA || {});
  const WH = ["what", "where", "when", "who", "whom", "whose", "which", "why", "how"];
  const AUX = ["do", "does", "did", "is", "are", "am", "was", "were", "can", "could", "will", "would", "shall", "should", "may", "might", "must", "have", "has", "had",
    "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "can't", "won't", "shouldn't", "couldn't", "haven't", "hasn't", "wouldn't"];
  const INTERJ = ["wow", "hooray", "hurray", "yay", "ouch", "oops", "yikes", "help", "congratulations", "yippee", "ow", "eek", "boo", "bravo", "whoa", "hurrah"];
  const EXCL_START = [/^what an? /i, /^how (big|lovely|beautiful|tall|fast|cute|clever|kind|silly|strange|funny|wonderful|amazing|smart|brave|delicious|nice|pretty|scary|loud|cold|hot|tired|lucky|happy|sad|wonderful|huge|tiny|wet|dirty|messy)\b/i,
    /^(watch|look) out\b/i, /^oh no\b/i, /^stop\b/i, /^get out\b/i, /^hurry\b/i, /^run\b/i, /^well done\b/i, /^happy birthday\b/i, /^thank you so much\b/i, /^i did it\b/i, /^we won\b/i, /^be careful\b/i];
  const LEAD_COMMA = ["yes", "no", "oh", "well", "hello", "hi", "hey", "okay", "ok", "please", "sorry", "wow", "ah", "so", "first", "then", "finally", "suddenly", "luckily", "however", "actually"];

  /** tokens: [{type:'word'|'mark'|'space'|'other', text, start, end}] — marks are . , ? ! ; : */
  function tokenize(text) {
    const out = []; const re = /([A-Za-z0-9’'\-]+)|([.,?!;:]+)|(\s+)|([^\sA-Za-z0-9.,?!;:]+)/g; let m;
    while ((m = re.exec(text))) {
      const type = m[1] ? "word" : m[2] ? "mark" : m[3] ? "space" : "other";
      if (type === "mark" && m[2].length > 1 && /^[.?!]+$/.test(m[2])) {
        // "?!" or "..." -> keep the first meaningful mark, treat rest as part of it
        out.push({ type, text: m[2], start: m.index, end: m.index + m[2].length, mark: m[2].includes("?") ? "?" : m[2].includes("!") ? "!" : "." });
      } else out.push({ type, text: m[0], start: m.index, end: m.index + m[0].length, mark: type === "mark" ? m[2][0] : undefined });
    }
    return out;
  }
  const normMark = (m) => (m === ";" || m === ":" ? "," : m);

  /** Split into sentences that end with . ? ! (keeps offsets) */
  function sentences(text) {
    const res = []; const re = /[^.?!]+(?:[.?!]+["”’]?|$)/g; let m;
    while ((m = re.exec(text))) {
      const raw = m[0]; if (!raw.trim()) continue;
      const lead = raw.length - raw.replace(/^\s+/, "").length;
      const t = raw.trim();
      const endMark = (t.match(/[.?!]+["”’]?$/) || [""])[0];
      res.push({ text: t, start: m.index + lead, end: m.index + lead + t.length, mark: endMark.includes("?") ? "?" : endMark.includes("!") ? "!" : endMark.includes(".") ? "." : "" });
    }
    return res;
  }
  const firstWord = (s) => ((s.trim().match(/^[A-Za-z’']+/) || [""])[0]).toLowerCase().replace("’", "'");

  /** classify("Where are you going?") -> {type:'wh'|'yn'|'declq'|'excl'|'stmt', tone:'fall'|'rise'|'feel', cue} */
  function classify(sentence) {
    const s = sentence.trim();
    const mark = (s.match(/[.?!]+["”’]?$/) || [""])[0];
    const m = mark.includes("?") ? "?" : mark.includes("!") ? "!" : mark.includes(".") ? "." : "";
    const clauses = s.replace(/[.?!]+["”’]?$/, "").split(/[,;:]/).map((c) => c.trim()).filter(Boolean);
    let kind = "plain", cueWord = "";
    for (const c of clauses) {
      const w = firstWord(c);
      if (WH.includes(w)) {
        if (/^(what an?|how (?!many|much|old|long|far|often|do|does|did|is|are|was|were|can|could|will|would|should|about))\b/i.test(c) && m !== "?") { kind = "exclwh"; cueWord = w; break; }
        kind = "wh"; cueWord = w; break;
      }
      if (AUX.includes(w)) { kind = "aux"; cueWord = w; break; }
    }
    if (m === "?") {
      if (kind === "wh") return { type: "wh", tone: "fall", mark: m, cueWord, label: "WH question" };
      if (kind === "aux") return { type: "yn", tone: "rise", mark: m, cueWord, label: "Yes/No question" };
      return { type: "declq", tone: "rise", mark: m, cueWord, label: "Asking statement" };
    }
    if (m === "!") return { type: "excl", tone: "feel", mark: m, cueWord, label: "Exclamation" };
    return { type: "stmt", tone: "fall", mark: m || ".", cueWord, label: "Statement" };
  }

  /** Suggest punctuation for an unpunctuated sentence (used by Ask Bip "check my sentence") */
  function suggest(raw, names = []) {
    let s = raw.trim().replace(/\s+/g, " ");
    if (!s) return null;
    const hadMark = /[.?!]$/.test(s);
    const body = s.replace(/[.?!]+$/, "");
    // look past greetings and names at the start ("hi siti how are you" -> the real sentence starts at "how")
    const nameSetL = names.map((n) => n.toLowerCase());
    const allW = body.split(" ");
    let k0 = 0;
    while (k0 < allW.length - 1 && (LEAD_COMMA.includes(allW[k0].toLowerCase().replace(/,$/, "")) || nameSetL.includes(allW[k0].toLowerCase().replace(/,$/, "")))) k0++;
    const w = firstWord(allW.slice(k0).join(" ")) || firstWord(body);
    let mark = ".", why = "It tells us something, so it ends with a full stop. Stop and let your voice go down.";
    if (EXCL_START.some((r) => r.test(body)) || INTERJ.includes(w)) { mark = "!"; why = "It shows a strong feeling, so it ends with an exclamation mark. FEEL it!"; }
    else if (WH.includes(w)) { mark = "?"; why = `It starts with the WH word “${w}”, so it is a question. Start strong and let your voice go down at the end ↘.`; }
    else if (AUX.includes(w)) { mark = "?"; why = `It starts with “${w}”, so it is a Yes/No question. Your voice goes UP at the end ↗.`; }
    let fixed = body;
    const tips = [];
    const lw = body.split(" ");
    // comma after a leading word (Yes, / Oh, / Well,)
    if (LEAD_COMMA.includes(lw[0].toLowerCase().replace(/,$/, "")) && lw.length > 1 && !/,$/.test(lw[0])) {
      if (!(lw[0].toLowerCase() === "so" || lw[0].toLowerCase() === "please" || lw[0].toLowerCase() === "no" && /^(one|more|way)$/i.test(lw[1] || ""))) {
        lw[0] = lw[0] + ","; tips.push(`Put a comma after “${lw[0].replace(",", "")}”: take a tiny breath there.`);
      }
    }
    // "Hi Siti how are you" -> "Hi, Siti, how are you": a name right after a greeting also gets a comma
    const nameSet = names.map((n) => n.toLowerCase());
    if (lw.length > 2 && /,$/.test(lw[0]) && nameSet.includes(lw[1].toLowerCase()) && !/,$/.test(lw[1])) { lw[1] = lw[1] + ","; tips.push(`“${lw[1].replace(",", "")}” is the person you are talking to, so put a comma after the name.`); }
    // comma after a name at the start (Ali, come here.)
    if (nameSet.includes(lw[0].toLowerCase().replace(/,$/, "")) && lw.length > 2 && !/,$/.test(lw[0]) && (WH.includes((lw[1] || "").toLowerCase()) || AUX.includes((lw[1] || "").toLowerCase()) || /^(come|look|please|wait|stop|help|give|go|sit|listen|run|hurry|let|don't|be)$/i.test(lw[1]))) {
      lw[0] = lw[0] + ","; tips.push(`“${lw[0].replace(",", "")}” is the person you are talking to, so put a comma after the name.`);
    }
    // comma before a name at the end (Thank you, Ali.)
    const last = lw[lw.length - 1];
    if (lw.length > 2 && nameSet.includes(last.toLowerCase()) && !/,$/.test(lw[lw.length - 2]) && /^(you|me|please|morning|afternoon|night|later|thanks|hello|hi)$/i.test(lw[lw.length - 2])) {
      lw[lw.length - 2] += ","; tips.push(`Put a comma before the name “${last}” at the end.`);
    }
    fixed = lw.join(" ").replace(/\bi\b/g, "I").replace(/\bi'(m|ll|ve|d)\b/g, "I'$1");
    fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
    if (!/^[A-Z]/.test(body)) tips.push("Start your sentence with a capital letter.");
    return { input: raw, fixed: fixed + mark, mark, why, tips, hadMark, cls: classify(fixed + mark) };
  }

  PA.Lang = { WH, AUX, tokenize, sentences, classify, suggest, normMark, firstWord };
})();
