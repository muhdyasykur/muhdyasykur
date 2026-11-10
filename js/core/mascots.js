/* PunctuAction — the Mark Crew (original characters, drawn as SVG in code)
   Dotty (full stop) · Koma (comma — "koma" is also the Malay word) · Quizzy (question mark) · Zing (exclamation mark)
   Bip — the robot who reads with a flat voice and needs pupils' help to find its feelings. */
(function () {
  const PA = (window.PA = window.PA || {});

  PA.MARKS = {
    ".": { key: "stop", name: "Full stop", hero: "Dotty", mascot: "dot", color: "#FF5C5C", dark: "#D63D46", light: "#FFE4E2", verb: "STOP", cue: "🛑",
      rule: "Stop. Let your voice go down and rest.", kid: "When you see me, STOP and rest your voice.", bm: "Noktah: berhenti dan rehatkan suara." },
    ",": { key: "pause", name: "Comma", hero: "Koma", mascot: "koma", color: "#14BC9C", dark: "#0B8F77", light: "#D3F5EE", verb: "BREATHE", cue: "💨",
      rule: "Take a tiny breath, then keep going.", kid: "When you see me, take a tiny breath… then keep reading.", bm: "Koma: berhenti sekejap, tarik nafas, sambung baca." },
    "?": { key: "ask", name: "Question mark", hero: "Quizzy", mascot: "quizzy", color: "#4C7DFF", dark: "#2C58D3", light: "#E1EAFF", verb: "ASK", cue: "↗",
      rule: "Use an asking voice. Yes/No questions go UP at the end ↗. WH questions start strong and go down ↘.", kid: "When you see me, ASK! Your voice goes up for Yes/No questions.", bm: "Tanda soal: guna suara bertanya." },
    "!": { key: "feel", name: "Exclamation mark", hero: "Zing", mascot: "zing", color: "#FFB21F", dark: "#D98600", light: "#FFF0CC", verb: "FEEL", cue: "💥",
      rule: "Show the feeling: happy, excited, angry, surprised, scared…", kid: "When you see me, FEEL it! Show the feeling with your voice.", bm: "Tanda seru: tunjukkan perasaan dengan suara." }
  };
  PA.SKILLS = { stop: ".", pause: ",", ask: "?", feel: "!" };
  PA.SKILL_LIST = ["stop", "pause", "ask", "feel"];
  PA.SKILL_NAME = { stop: "Stop (.)", pause: "Pause (,)", ask: "Ask (?)", feel: "Feel (!)" };

  PA.EMOTIONS = {
    happy: { emoji: "😄", label: "Happy", color: "#FFC93C", bm: "Gembira" },
    excited: { emoji: "🤩", label: "Excited", color: "#FF8A3D", bm: "Teruja" },
    angry: { emoji: "😠", label: "Angry", color: "#F2545B", bm: "Marah" },
    surprised: { emoji: "😲", label: "Surprised", color: "#9B6BFF", bm: "Terkejut" },
    scared: { emoji: "😨", label: "Scared", color: "#5B8DEF", bm: "Takut" },
    sad: { emoji: "😢", label: "Sad", color: "#6C8EAD", bm: "Sedih" },
    worried: { emoji: "😟", label: "Worried", color: "#7FA37A", bm: "Risau" },
    urgent: { emoji: "🚨", label: "Warning", color: "#E8453C", bm: "Amaran" },
    proud: { emoji: "😎", label: "Proud", color: "#22B573", bm: "Bangga" },
    calm: { emoji: "🙂", label: "Calm", color: "#9AA3C7", bm: "Tenang" }
  };

  /* ---------- shared face ---------- */
  function face(cx, cy, s, mood, opt = {}) {
    const ex = 11 * s, ey = 0, er = 6.2 * s, pr = 3.4 * s;
    const ink = "#1F2547";
    const eyes = (dx) => {
      const x = cx + dx, y = cy + ey;
      if (mood === "sleepy") return `<path d="M${x - er} ${y} q${er} ${er * 0.8} ${er * 2} 0" stroke="${ink}" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"/>`;
      return `<g class="eye"><ellipse cx="${x}" cy="${y}" rx="${er}" ry="${er * 1.12}" fill="#fff"/>
        <circle cx="${x + (mood === "wow" ? 0 : 0.8 * s)}" cy="${y + 0.8 * s}" r="${pr}" fill="${ink}"/>
        <circle cx="${x + 2 * s}" cy="${y - 1.4 * s}" r="${1.3 * s}" fill="#fff"/></g>`;
    };
    let brows = "";
    if (mood === "angry") brows = `<path d="M${cx - ex - 7 * s} ${cy - 9 * s} l${12 * s} ${4 * s} M${cx + ex + 7 * s} ${cy - 9 * s} l${-12 * s} ${4 * s}" stroke="${ink}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
    if (mood === "sad" || mood === "worried") brows = `<path d="M${cx - ex - 6 * s} ${cy - 7 * s} l${10 * s} ${-3 * s} M${cx + ex + 6 * s} ${cy - 7 * s} l${-10 * s} ${-3 * s}" stroke="${ink}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
    if (mood === "wow") brows = `<path d="M${cx - ex - 5 * s} ${cy - 11 * s} q${5 * s} ${-4 * s} ${10 * s} 0 M${cx + ex - 5 * s} ${cy - 11 * s} q${5 * s} ${-4 * s} ${10 * s} 0" stroke="${ink}" stroke-width="${2.2 * s}" fill="none" stroke-linecap="round"/>`;
    const my = cy + 11 * s;
    const mouths = {
      happy: `<path d="M${cx - 8 * s} ${my - 2 * s} q${8 * s} ${10 * s} ${16 * s} 0" fill="#7A2335" stroke="${ink}" stroke-width="${2 * s}" stroke-linejoin="round"/>`,
      talk: `<ellipse cx="${cx}" cy="${my + 1 * s}" rx="${5.5 * s}" ry="${4.5 * s}" fill="#7A2335" stroke="${ink}" stroke-width="${2 * s}"><animate attributeName="ry" values="${4.5 * s};${1.5 * s};${4.5 * s}" dur=".35s" repeatCount="indefinite"/></ellipse>`,
      wow: `<ellipse cx="${cx}" cy="${my + 2 * s}" rx="${4.5 * s}" ry="${6 * s}" fill="#7A2335" stroke="${ink}" stroke-width="${2 * s}"/>`,
      angry: `<path d="M${cx - 7 * s} ${my + 4 * s} q${7 * s} ${-7 * s} ${14 * s} 0" fill="none" stroke="${ink}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`,
      sad: `<path d="M${cx - 7 * s} ${my + 4 * s} q${7 * s} ${-6 * s} ${14 * s} 0" fill="none" stroke="${ink}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`,
      worried: `<path d="M${cx - 7 * s} ${my + 2 * s} q${3.5 * s} ${-3 * s} ${7 * s} 0 q${3.5 * s} ${3 * s} ${7 * s} 0" fill="none" stroke="${ink}" stroke-width="${2.2 * s}" stroke-linecap="round"/>`,
      flat: `<path d="M${cx - 7 * s} ${my + 1 * s} h${14 * s}" stroke="${ink}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`,
      sleepy: `<path d="M${cx - 5 * s} ${my + 1 * s} q${5 * s} ${4 * s} ${10 * s} 0" fill="none" stroke="${ink}" stroke-width="${2.2 * s}" stroke-linecap="round"/>`
    };
    const cheeks = opt.noCheeks ? "" : `<circle cx="${cx - ex - 6 * s}" cy="${cy + 8 * s}" r="${4 * s}" fill="#FF8FA3" opacity=".55"/><circle cx="${cx + ex + 6 * s}" cy="${cy + 8 * s}" r="${4 * s}" fill="#FF8FA3" opacity=".55"/>`;
    return cheeks + brows + eyes(-ex) + eyes(ex) + (mouths[mood] || mouths.happy);
  }

  const DRAW = {
    dot(m) {
      return `<svg viewBox="0 0 120 124"><ellipse cx="60" cy="118" rx="30" ry="5" fill="#1F2547" opacity=".12"/>
        <path d="M22 70 q-14 -6 -12 -22" stroke="#D63D46" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="10" cy="44" r="8" fill="#fff" stroke="#D63D46" stroke-width="3"/>
        <path d="M98 70 q14 -6 12 -22" stroke="#D63D46" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="110" cy="44" r="8" fill="#fff" stroke="#D63D46" stroke-width="3"/>
        <circle cx="60" cy="66" r="46" fill="#FF5C5C"/><circle cx="60" cy="66" r="46" fill="url(#gD)"/>
        <ellipse cx="44" cy="40" rx="13" ry="8" fill="#fff" opacity=".35" transform="rotate(-25 44 40)"/>
        <defs><radialGradient id="gD" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#B8283A" stop-opacity=".35"/></radialGradient></defs>
        ${face(60, 64, 1.25, m)}</svg>`;
    },
    koma(m) {
      return `<svg viewBox="0 0 120 130"><ellipse cx="58" cy="124" rx="26" ry="5" fill="#1F2547" opacity=".12"/>
        <path d="M86 58 C 92 92, 70 116, 34 122 C 58 104, 64 92, 62 84 Z" fill="#0B8F77"/>
        <circle cx="56" cy="50" r="38" fill="#14BC9C"/><ellipse cx="42" cy="30" rx="11" ry="7" fill="#fff" opacity=".35" transform="rotate(-25 42 30)"/>
        <g class="puffs" opacity=".9"><circle cx="104" cy="34" r="6" fill="#BFF3E7"><animate attributeName="cx" values="98;112;98" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite"/></circle>
        <circle cx="110" cy="20" r="4" fill="#BFF3E7"><animate attributeName="cx" values="104;118;104" dur="2.4s" begin=".4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2.4s" begin=".4s" repeatCount="indefinite"/></circle></g>
        ${face(56, 48, 1.1, m)}</svg>`;
    },
    quizzy(m) {
      return `<svg viewBox="0 0 120 130"><ellipse cx="60" cy="125" rx="22" ry="5" fill="#1F2547" opacity=".12"/>
        <path d="M30 44 C 28 6, 96 2, 94 44 C 93 66, 62 66, 62 88" stroke="#2C58D3" stroke-width="32" stroke-linecap="round" fill="none"/>
        <path d="M30 44 C 28 6, 96 2, 94 44 C 93 66, 62 66, 62 88" stroke="#4C7DFF" stroke-width="27" stroke-linecap="round" fill="none"/>
        <circle cx="62" cy="111" r="12" fill="#4C7DFF" stroke="#2C58D3" stroke-width="3"/>
        <path d="M24 30 q2 -10 10 -14" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45" fill="none"/>
        ${face(78, 38, 0.82, m, { noCheeks: true })}</svg>`;
    },
    zing(m) {
      return `<svg viewBox="0 0 120 130"><ellipse cx="60" cy="125" rx="22" ry="5" fill="#1F2547" opacity=".12"/>
        <g stroke="#FFB21F" stroke-width="5" stroke-linecap="round" class="sparks"><path d="M14 22 l10 8"><animate attributeName="opacity" values="1;.1;1" dur="1s" repeatCount="indefinite"/></path>
        <path d="M106 22 l-10 8"><animate attributeName="opacity" values=".1;1;.1" dur="1s" repeatCount="indefinite"/></path><path d="M8 56 h12"><animate attributeName="opacity" values="1;.2;1" dur=".8s" repeatCount="indefinite"/></path><path d="M112 56 h-12"><animate attributeName="opacity" values=".2;1;.2" dur=".8s" repeatCount="indefinite"/></path></g>
        <path d="M34 24 Q34 4 60 4 Q86 4 86 24 L76 82 Q74 92 60 92 Q46 92 44 82 Z" fill="#D98600"/>
        <path d="M37 24 Q37 7 60 7 Q83 7 83 24 L74 80 Q72 88 60 88 Q48 88 46 80 Z" fill="#FFB21F"/>
        <ellipse cx="47" cy="20" rx="7" ry="5" fill="#fff" opacity=".45"/>
        <circle cx="60" cy="111" r="12" fill="#FFB21F" stroke="#D98600" stroke-width="3"/>
        ${face(60, 36, 0.92, m, { noCheeks: true })}</svg>`;
    },
    bip(m, opt = {}) {
      const chips = opt.chips || {};
      const chip = (x, k, c) => `<rect x="${x}" y="104" width="13" height="13" rx="3" fill="${chips[k] ? c : "#5B5F80"}" ${chips[k] ? `filter="url(#glow)"` : ""}/>`;
      const screenMood = m;
      const eye = (x) => screenMood === "flat"
        ? `<rect x="${x - 6}" y="45" width="12" height="4" rx="2" fill="#7CF5FF"/>`
        : `<g class="eye"><ellipse cx="${x}" cy="47" rx="5.5" ry="6.5" fill="#7CF5FF"/></g>`;
      const mouth = { flat: `<path d="M50 62 h20" stroke="#7CF5FF" stroke-width="3.5" stroke-linecap="round"/>`,
        happy: `<path d="M48 59 q12 10 24 0" stroke="#7CF5FF" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
        talk: `<rect x="52" y="57" width="16" height="7" rx="3.5" fill="#7CF5FF"><animate attributeName="height" values="7;2;7" dur=".3s" repeatCount="indefinite"/></rect>`,
        wow: `<circle cx="60" cy="61" r="5" fill="none" stroke="#7CF5FF" stroke-width="3"/>`,
        sad: `<path d="M50 64 q10 -7 20 0" stroke="#7CF5FF" stroke-width="3.5" fill="none" stroke-linecap="round"/>` }[screenMood] || "";
      return `<svg viewBox="0 0 120 150"><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <ellipse cx="60" cy="145" rx="30" ry="5" fill="#1F2547" opacity=".12"/>
        <line x1="60" y1="20" x2="60" y2="8" stroke="#6650E6" stroke-width="4"/><circle cx="60" cy="7" r="6" fill="#FFB21F"><animate attributeName="fill" values="#FFB21F;#FF5C5C;#14BC9C;#4C7DFF;#FFB21F" dur="4s" repeatCount="indefinite"/></circle>
        <rect x="16" y="44" width="10" height="22" rx="5" fill="#6650E6"/><rect x="94" y="44" width="10" height="22" rx="5" fill="#6650E6"/>
        <rect x="22" y="20" width="76" height="62" rx="20" fill="#8E7BFF"/><rect x="30" y="30" width="60" height="42" rx="13" fill="#23284D"/>
        ${eye(47)}${eye(73)}${mouth}
        <rect x="52" y="82" width="16" height="8" fill="#6650E6"/>
        <rect x="28" y="88" width="64" height="44" rx="14" fill="#8E7BFF"/><rect x="34" y="99" width="52" height="23" rx="7" fill="#33385E"/>
        ${chip(37, "stop", "#FF5C5C")}${chip(50.5, "pause", "#14BC9C")}${chip(64, "ask", "#4C7DFF")}${chip(77.5 - 0.5, "feel", "#FFB21F")}
        <rect x="14" y="94" width="12" height="28" rx="6" fill="#6650E6"/><rect x="94" y="94" width="12" height="28" rx="6" fill="#6650E6"/>
        <rect x="38" y="132" width="14" height="10" rx="4" fill="#6650E6"/><rect x="68" y="132" width="14" height="10" rx="4" fill="#6650E6"/></svg>`;
    }
  };

  /** PA.mascot("dot", {mood:"happy", size:120, cls:"bob"}) -> HTML string */
  PA.mascot = function (name, { mood = "happy", size = 120, cls = "", chips, title } = {}) {
    const fn = DRAW[name] || DRAW.dot;
    return `<span class="mascot ${cls}" style="width:${size}px" ${title ? `title="${title}"` : ""} aria-hidden="true">${fn(mood, { chips })}</span>`;
  };
  PA.markMascot = (mark, o) => PA.mascot(PA.MARKS[mark].mascot, o);

  /* Logo: a speech bubble that holds the four marks — "every mark has a voice" */
  PA.logo = function (size = 40) {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      <path d="M14 10 h72 a12 12 0 0 1 12 12 v42 a12 12 0 0 1 -12 12 h-40 l-20 16 v-16 h-12 a12 12 0 0 1 -12 -12 v-42 a12 12 0 0 1 12 -12z" fill="#1F2547"/>
      <circle cx="22" cy="58" r="6.5" fill="#FF5C5C"/>
      <path d="M40 52 a6.5 6.5 0 1 1 6 6 q1 8 -7 13 q3 -6 1 -11 z" fill="#14BC9C"/>
      <path d="M58 32 q0 -10 9 -10 q9 0 9 9 q0 7 -8 10 v6" stroke="#4C7DFF" stroke-width="6.5" fill="none" stroke-linecap="round"/><circle cx="68" cy="58" r="4.6" fill="#4C7DFF"/>
      <path d="M84 22 v24" stroke="#FFB21F" stroke-width="7" stroke-linecap="round"/><circle cx="84" cy="58" r="4.6" fill="#FFB21F"/>
    </svg>`;
  };
  PA.wordmark = () => `${PA.esc(PA.brand.name).replace(/Action$/, '<span class="a">Action</span>')}`;
})();
