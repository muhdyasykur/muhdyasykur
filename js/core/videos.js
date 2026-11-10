/* PunctuAction — scripts for the video tutorials (PunctuAction TV).
   Each part ("shot") lists the narration sentences in `say` and what happens on screen as each sentence starts (`acts`).
   Screen shots use real screenshots of the app (assets/video/*.jpg) with positions from js/core/shotmap.js. */
(function () {
  const PA = (window.PA = window.PA || {});
  const NAMES = { dot: "Dotty", koma: "Koma", quizzy: "Quizzy", zing: "Zing", bip: "Bip" };

  /* ---------- scene builders ---------- */
  const crew = (startFlat = true) => () => `<div class="vs-col"><div class="vs-crew">${["dot", "koma", "bip", "quizzy", "zing"].map((n) => `<div class="vs-m ${n === "bip" ? "big in" : ""}" data-m="${n}">${PA.mascot(n, { mood: n === "bip" && startFlat ? "flat" : "happy", cls: "bob" })}<span>${NAMES[n]}</span></div>`).join("")}</div>
    <div class="vs-card vs-demo vp-demo" style="font-size:clamp(1rem,2.6vw,1.9rem)">${PA.ReadAlong.html("Hello. My. Name. Is. Bip.", { cues: false })}</div></div>`;
  const light = (n, sfx) => ({ fn: (L) => { const m = L.querySelector(`[data-m="${n}"]`); if (m) m.classList.add("in"); }, keep: true, sfx });
  const bipHappy = { fn: (L) => { const m = L.querySelector('[data-m="bip"]'); if (m) m.innerHTML = PA.mascot("bip", { mood: "happy", cls: "bob", chips: { stop: 1, pause: 1, ask: 1, feel: 1 } }) + "<span>Bip</span>"; const d = L.querySelector(".vp-demo"); if (d) d.innerHTML = PA.ReadAlong.html("Hello! My name is Bip. Are you ready to read with feeling?", { cues: true, emotion: "excited" }); PA.confetti(60); }, keep: true, sfx: "powerup" };
  const rule = (mark, example, emo) => () => { const M = PA.MARKS[mark]; return `<div class="vs-col"><div class="vs-rule">${PA.markMascot(mark, { mood: "talk", cls: "bob" })}<div><h3>${M.hero} · ${M.name} ${mark}</h3><p>${M.rule}</p></div></div>
    <div class="vs-card vs-demo vp-demo">${PA.ReadAlong.html(example, { cues: true, emotion: emo })}</div></div>`; };
  const pair = (a, b, emoA, emoB, labA, labB) => () => `<div class="vs-col" style="gap:14px">
    <div class="vs-card" style="padding:3% 4%"><div class="small muted" style="font-weight:700">${labA}</div><div class="vs-demo vd-a">${PA.ReadAlong.html(a, { cues: true, emotion: emoA })}</div></div>
    <div class="vs-card" style="padding:3% 4%"><div class="small muted" style="font-weight:700">${labB}</div><div class="vs-demo vd-b">${PA.ReadAlong.html(b, { cues: true, emotion: emoB })}</div></div></div>`;
  const list = (title, items) => () => `<div class="vs-col" style="align-items:flex-start"><h3 style="color:#fff;font-size:clamp(1.1rem,3vw,2rem);margin:0 0 8px">${title}</h3><ul class="vs-list">${items.map(([ic, t]) => `<li><b>${ic}</b><span>${t}</span></li>`).join("")}</ul></div>`;
  const item = (i) => ({ fn: (L) => { const li = L.querySelectorAll(".vs-list li")[i]; if (li) li.classList.add("in"); }, keep: true, sfx: "pop" });
  const S = (img, label, say, acts) => ({ kind: "screen", img, label, say, acts });
  const T = (title, sub, mascot, kicker) => ({ kind: "title", title, sub, mascot, kicker });
  const C = (html, say, acts, label, presenter) => ({ kind: "scene", html, say, acts, label, presenter });

  PA.VIDEOS = {
    /* ======================= PUPIL VIDEOS ======================= */
    welcome: { title: "Welcome to PunctuAction", icon: "👋", blurb: "Meet Bip and the Mark Crew, and find your way around.", go: "#/home", goLabel: "Go to my home page", shots: [
      T("Welcome to PunctuAction!", "Every mark has a voice.", "bip", "Video 1"),
      Object.assign(C(crew(true), ["Hello! I'm Bip, a reading robot.", "But I have a problem. Listen to how I read.", "I read like a robot. Every word sounds the same, and I never stop or ask or feel.", "Four friends are going to help me."],
        { 1: { demo: { text: "Hello. My. Name. Is. Bip.", robot: true } }, 3: { sfx: "zing" } }, "Bip's problem"), { wide: true }),
      Object.assign(C(crew(true), ["Dotty is the full stop. Dotty says: stop!", "Koma is the comma. Koma says: take a tiny breath.", "Quizzy is the question mark. Quizzy says: ask!", "Zing is the exclamation mark. Zing says: feel it!", "With all four friends, I can read with feeling. Listen!"],
        { 0: light("dot", "stop"), 1: light("koma", "breath"), 2: light("quizzy", "rise"), 3: light("zing", "zing"), 4: Object.assign({}, bipHappy, { demo: { text: "Hello! My name is Bip. Are you ready to read with feeling?", emo: "excited" } }) }, "The Mark Crew"), { wide: true }),
      S("p-signin", "Sign in", ["First, find your name and tap it.", "If your teacher gave you secret pictures, tap your three pictures."], { 0: { point: ".who", ring: ".who", tap: true, zoom: 1 } }),
      S("p-home", "Your home page", ["This is your home page, on Voice Island. Tap any friend to hear them.", "These four chips are your reading skills. A chip lights up when you reach eighty percent.", "Tap Continue, and I will take you to the best next step for you."],
        { 0: { ring: "#hero", zoom: 1 }, 1: { ring: "#chipRow", point: "#chipRow", zoom: 1.6 }, 2: { ring: "#continueBtn", point: "#continueBtn", tap: true, zoom: 1.6 } }),
      S("p-home-2", "Your journey", ["Follow your journey: Learn, then Practice, then the Reading Studio. The bars show how far you have gone.", "Sing the chant here. It helps you remember the four voice rules.", "Need help? Press Watch how on any page, or tap me in the corner to ask a question."],
        { 0: { ring: "#journey", zoom: 1 }, 1: { ring: "#chant", point: "#chantBtn", tap: true, zoom: 1.3 }, 2: { ring: "#watchBtn", point: "#watchBtn", tap: true, zoom: 1.6 } })
    ] },

    learn: { title: "Learn: the four voice rules", icon: "📚", blurb: "What each mark tells your voice to do, with examples.", go: "#/learn", goLabel: "Start a lesson", shots: [
      T("The four voice rules", "Stop. Breathe. Ask. Feel.", "dot", "Video 2"),
      C(rule(".", "I have a cat. Her name is Comel."), ["A full stop ends a telling sentence.", "When you see Dotty, let your voice go down, and stop. Listen."], { 1: { demo: { text: "I have a cat. Her name is Comel." } } }, "Full stop", "dot"),
      C(rule(",", "I like apples, bananas and mangoes."), ["A comma is a short pause.", "When you see Koma, take a tiny breath, then keep reading. Listen."], { 1: { demo: { text: "I like apples, bananas and mangoes." } } }, "Comma", "koma"),
      C(pair("Do you like durian?", "Where is my school bag?", null, null, "↗ Yes/No question", "↘ WH question"), ["There are two kinds of questions.", "A Yes or No question starts with words like do, is, can or are. Your voice goes up at the end.", "A WH question starts with what, where, who, why, when or how. Start strong, and let your voice go down."],
        { 1: { demo: { text: "Do you like durian?", el: ".vd-a" } }, 2: { demo: { text: "Where is my school bag?", el: ".vd-b" } } }, "Question mark", "quizzy"),
      C(pair("It's raining!", "It's raining!", "sad", "excited", "😢 The picnic is ruined", "🌾 The farm was dry for weeks"), ["An exclamation mark shows a big feeling.", "Read the story first. How does the person feel? Here, they are sad.", "But here, the farmer is excited. Same words, different feeling!"],
        { 1: { demo: { text: "It's raining!", emo: "sad", el: ".vd-a" } }, 2: { demo: { text: "It's raining!", emo: "excited", el: ".vd-b" } } }, "Exclamation mark", "zing"),
      S("p-learn", "Meet the Mark Crew", ["Now open Learn. Tap a friend to start a lesson.", "The poster reminds you what each mark tells your voice to do."], { 0: { ring: "#crew", point: '.crew-card[data-id="dot"]', tap: true, zoom: 1 }, 1: { ring: "#poster", zoom: 1.3 } }),
      S("p-lesson-meet", "Step 1: Meet", ["Each lesson has five small steps. First, meet your friend and listen."], { 0: { ring: ".lesson-steps", point: "#hearMe", tap: true, zoom: 1 } }),
      S("p-lesson-trace", "Step 2: Trace", ["Next, trace the mark with your finger. Stay on the light shape."], { 0: { ring: "#tw", point: "#tw", zoom: 1.3 } }),
      S("p-lesson-hear", "Step 3: Hear", ["Then press Listen on each card, and hear how one mark changes the voice."], { 0: { ring: ".compare", point: '[data-play="0"]', tap: true, zoom: 1.2 } }),
      S("p-lesson-spot", "Step 4: Spot", ["Find and tap every mark of that kind in the story."], { 0: { ring: "#st", point: "#st", tap: true, zoom: 1.3 } }),
      S("p-lesson-say", "Step 5: Say it", ["Last, press Record and read the sentence yourself. I will give you tips. Then press Finish to earn three stars!"], { 0: { ring: "#sayRec", point: "#sayRec", tap: true, zoom: 1.5 } })
    ] },

    practice: { title: "Practice activities", icon: "🎯", blurb: "Six activities at Easy, Medium and Hard levels.", go: "#/practice", goLabel: "Start practising", shots: [
      T("Practice activities", "New sentences every time, so think about the rule!", "zing", "Video 3"),
      S("p-practice", "Choose your level", ["Choose your level first: Easy, Medium or Hard.", "I look at your skills and suggest an activity for you.", "There are six activities. The sentences are new every time, so think about the rule, not the answer."], { 0: { ring: "#lvlRow", point: "#lvlRow", tap: true, zoom: 1.6 }, 1: { ring: "#suggest", zoom: 1.4 }, 2: { ring: "#games", zoom: 1 } }),
      S("g-detective", "Mark Detective", ["In Mark Detective, find the missing mark.", "Read the sentence, then tap the right mark. Stuck? Tap Clue."], { 0: { ring: "#dsent", zoom: 1.4 }, 1: { ring: "#dtiles", point: "#dtiles", tap: true, zoom: 1.3 } }),
      S("g-detective-answer", "Learn from every answer", ["After every answer, you see why, and you hear how the sentence should sound. Then press Next."], { 0: { ring: ".explain", point: "[data-next]", tap: true, zoom: 1.2 } }),
      S("g-ears", "Ears On!", ["In Ears On, close your eyes and listen to the voice.", "Did it go up for a question, down for a full stop, or full of feeling?"], { 0: { ring: "#eplay", point: "#eplay", tap: true, zoom: 1.5 }, 1: { ring: "#eopts", zoom: 1.3 } }),
      S("g-patrol", "Pause Patrol", ["In Pause Patrol, watch the reader move word by word.", "When it reaches a mark, press the right button: breathe, stop, ask or feel."], { 0: { ring: "#track", zoom: 1.3 }, 1: { ring: "#pbtns", point: "#pbtns", tap: true, zoom: 1.4 } }),
      S("g-tone", "Voice Elevator", ["In Voice Elevator, decide where your voice goes at the end. Up for Yes or No questions, down for WH questions."], { 0: { ring: "#topts", point: "#topts", tap: true, zoom: 1.3 } }),
      S("g-feelings", "Feelings Theatre", ["In Feelings Theatre, read the story box and choose the feeling. Then say it with feeling!"], { 0: { ring: ".ctx", point: ".choice", tap: true, zoom: 1.3 } }),
      S("g-robot", "Fix the Robot", ["In Fix the Robot, I read with no marks. Tap the gaps and add the marks.", "Press Power up Bip to hear me read your way, then press Check."], { 0: { ring: "#gaps", point: "#gaps", tap: true, zoom: 1.3 }, 1: { ring: "#rpower", point: "#rpower", tap: true, zoom: 1.5 } }),
      S("g-results", "Your stars", ["At the end, see your stars and your skills. Tell us if it was too easy, just right, or too hard."], { 0: { ring: ".results", point: "#diff", tap: true, zoom: 1 } })
    ] },

    studio: { title: "Reading Studio", icon: "🎭", blurb: "Listen, record, see your voice melody and role-play.", go: "#/studio", goLabel: "Open the Studio", shots: [
      T("The Reading Studio", "Listen, record, and act it out!", "quizzy", "Video 4"),
      S("p-studio", "Choose a dialogue", ["Choose a dialogue at your level.", "A green badge means your teacher recorded the voices."], { 0: { ring: "#dlgs", point: ".dlg-card", tap: true, zoom: 1 } }),
      S("p-studio-mine", "My dialogues", ["Dialogues you made in the Scanner are on your own shelf, ready to record."], { 0: { ring: "#myDlgs", point: "#myDlgs .dlg-card", tap: true, zoom: 1.2 } }),
      S("p-dialogue", "Pick your part", ["Tap the character you want to be. Your lines get a yellow border.", "Voice signs above the marks remind you what to do. Turn them off for a challenge.", "Feeling shy? Choose a disguise voice. Your pauses and your up and down voice stay the same.", "Press Listen to hear the model, then press Record and read your line."],
        { 0: { ring: "#cast", point: "#cast", tap: true, zoom: 1.5 }, 1: { ring: "#cueTool", zoom: 1.6 }, 2: { ring: "#dis", point: "#dis", tap: true, zoom: 1.7 }, 3: { ring: ".line.mine", point: ".line.mine .rec-btn", tap: true, zoom: 1.3 } }),
      S("p-record", "Your voice melody", ["After you record, you see your voice melody line. The green bands are your pauses.", "The robot meter shows if your voice was flat or full of feeling.", "Tick the checklist, then send your best reading to your teacher."],
        { 0: { ring: ".coach canvas", zoom: 1.4 }, 1: { ring: ".robo", zoom: 1.6 }, 2: { ring: '[data-a="send"]', point: '[data-a="send"]', tap: true, zoom: 1.5 } }),
      S("p-dialogue", "Role-play mode", ["Ready to act? Press Role-play mode.", "I read the other characters. When it is your turn, the line turns red and the microphone listens. At the end, hear your whole scene!"], { 0: { ring: "#rp", point: "#rp", tap: true, zoom: 1.6 }, 1: { ring: "#lines", zoom: 1 } })
    ] },

    scanner: { title: "Dialogue Scanner", icon: "🔍", blurb: "Type, paste or photograph any dialogue and hear its voice.", go: "#/scanner", goLabel: "Open the Scanner", shots: [
      T("The Dialogue Scanner", "Bring your own dialogue. I will find the voice!", "bip", "Video 5"),
      S("p-scanner", "Bring a dialogue", ["You can bring any dialogue: from your textbook, a story, or one you wrote.", "Type it, paste it, or take a photo of the page.", "Write each line like this: the name, a colon, then the words.", "Then press Scan."],
        { 0: { ring: "#scanInput", zoom: 1 }, 1: { ring: "#scanModes", point: "#scanPhoto", tap: true, zoom: 1.5 }, 2: { ring: "#scanText", zoom: 1.4 }, 3: { ring: "#scanGo", point: "#scanGo", tap: true, zoom: 1.6 } }),
      S("p-scanner-result", "Bip's check", ["I count every mark, and give your dialogue a voice-ready score.", "If a mark is missing, I tell you why. Tap Fix, or Fix all."],
        { 0: { ring: "#scanSummary", zoom: 1.4 }, 1: { ring: "#scanFixes", point: '[data-fix="0"]', tap: true, zoom: 1.3 } }),
      S("p-scanner-map", "Your voice map", ["The voice map shows what your voice should do at every mark. Tap any coloured mark to learn why.", "For an exclamation mark, I guess the feeling. You can change it."],
        { 0: { ring: "#scanMap", zoom: 1.1 }, 1: { ring: "[data-emo]", point: "[data-emo]", tap: true, zoom: 1.6 } }),
      S("p-scanner-save", "Listen & practise", ["Press Listen to hear it, then press Practise it in the Studio to record and role-play your own dialogue!"], { 0: { ring: "#scanActions", point: "#scanSave", tap: true, zoom: 1.4 } })
    ] },

    me: { title: "My progress & feedback", icon: "🏆", blurb: "Badges, teacher messages, feedback and Ask Bip.", go: "#/me", goLabel: "See my progress", shots: [
      T("My progress", "See how you grow!", "zing", "Video 6"),
      S("p-me", "My page", ["On your Me page, the bars show your four skills, your stars and your time."], { 0: { ring: "#meHero", zoom: 1.2 } }),
      S("p-me-2", "Teacher messages", ["When your teacher checks your recording, their stars, stickers and comments appear here."], { 0: { ring: "#mail", zoom: 1.2 } }),
      S("p-me-3", "Badges", ["Collect all twelve badges!"], { 0: { ring: "#badges", zoom: 1.1 } }),
      S("p-feedback", "Feedback", ["Please tell us what you think. Choose a face for how much you enjoyed it today."], { 0: { ring: "#smile", point: "#smile", tap: true, zoom: 1.4 } }),
      S("p-feedback-2", "Send", ["Answer the questions, write one idea if you like, and press Send. Your feedback floats up to the class sky!"], { 0: { ring: "#fbSend", point: "#fbSend", tap: true, zoom: 1.5 } }),
      S("p-chat", "Ask Bip", ["Tap me in the corner to ask a question.", "Or type a sentence, and I will add the marks and read it for you."], { 0: { ring: ".chat-panel", zoom: 1.2 }, 1: { ring: ".chat-input", point: ".chat-input", tap: true, zoom: 1.5 } })
    ] },

    /* ======================= TEACHER VIDEOS ======================= */
    tstart: { title: "Teacher Hub: getting started", icon: "🔒", blurb: "PIN, dashboard and adding your class.", presenter: "bip", go: "#/pupils", goLabel: "Add my pupils", shots: [
      T("Teacher Hub", "Set up your class in ten minutes.", "bip", "Teacher video 1"),
      S("t-setup", "Create a PIN", ["The first time, create a PIN and write down the recovery code.", "Pupils cannot open the Teacher Hub, and it locks itself when you are away."], { 0: { ring: ".lockcard", zoom: 1.2 } }),
      S("t-overview", "Overview", ["The overview shows your class at a glance.", "Class mastery shows the four skills: stop, pause, ask and feel.", "Needs attention lists pupils who need help, with a suggested activity.", "Use the menu on the left to reach every part of the Hub."],
        { 0: { ring: ".kpis", zoom: 1.3 }, 1: { ring: "#classMastery", zoom: 1.4 }, 2: { ring: "#attention", zoom: 1.4 }, 3: { ring: "#tnav", point: "#tnav", zoom: 1.2 } }),
      S("t-pupils", "Pupils", ["Add pupils one by one, or paste the whole class with Add many.", "If pupils use their own tablets, export a class pack and load it on each device."], { 0: { ring: "#bulkP", point: "#bulkP", tap: true, zoom: 1.6 }, 1: { ring: "#packP", point: "#packP", tap: true, zoom: 1.6 } })
    ] },
    tvoices: { title: "Record your model voice", icon: "🎙️", blurb: "The most accurate model is you.", go: "#/voices", goLabel: "Record my voice", shots: [
      T("Your voice is the best model", "Record each line once.", "quizzy", "Teacher video 2"),
      S("t-voices", "My model voices", ["Choose a dialogue, then press Record on each line.", "Stop fully at full stops, breathe at commas, rise for Yes or No questions, fall for WH questions, and act the feelings.", "Your recording replaces the computer voice for every pupil, and it becomes the grey guide line on their voice melody.", "On the right, choose computer voices for lines you have not recorded yet."],
        { 0: { ring: "#vsel", point: '[data-a="rec"]', tap: true, zoom: 1.4 }, 1: { ring: ".vline", zoom: 1.5 }, 3: { ring: "#vnarCard", zoom: 1.3 } })
    ] },
    tassess: { title: "Assess recordings", icon: "🎧", blurb: "Rubric, voice analysis and feedback to pupils.", go: "#/assess", goLabel: "Assess now", shots: [
      T("Assess pupils' reading", "Listen, look, score, reply.", "dot", "Teacher video 3"),
      S("t-assess", "Assess", ["New recordings appear on the left.", "Listen, and look at the voice melody line. Pauses are green. The arrow shows a rising or falling end."],
        { 0: { ring: "#alist", zoom: 1.2 }, 1: { ring: "#acv", zoom: 1.5 } }),
      S("t-assess-2", "Rubric", ["Press Start from Bip's suggestion to pre-fill the rubric, then listen and adjust.", "Five criteria, four bands each. The Hub suggests a PBD level, but your judgement is final."],
        { 0: { ring: "#asug", point: "#asug", tap: true, zoom: 1.6 }, 1: { ring: ".rubric", zoom: 1.15 } }),
      S("t-assess-3", "Reply", ["Add stickers and a comment, then save. The pupil sees it in their mailbox."], { 0: { ring: "#asave", point: "#asave", tap: true, zoom: 1.4 } })
    ] },
    tplan: { title: "Dialogues, missions & evaluation", icon: "📈", blurb: "Write dialogues, set missions, prove impact.", go: "#/evaluation", goLabel: "See evaluation", shots: [
      T("Plan, set and evaluate", "From your textbook to evidence of impact.", "zing", "Teacher video 4"),
      S("t-dialogues-new", "Write a dialogue", ["Write dialogues from your textbook unit. The app checks the punctuation as you type, and warns you if a question is missing its question mark."], { 0: { ring: "#de-lines", zoom: 1.2 } }),
      S("t-missions", "Missions", ["Give missions to the whole class or to selected pupils.", "Set the Reading Check to pre-test before you start, and to post-test at the end."], { 0: { ring: "#m-add", point: "#m-add", tap: true, zoom: 1.4 }, 1: { ring: "#m-mode", point: "#m-mode", tap: true, zoom: 1.6 } }),
      S("t-evaluation", "Evaluation", ["Evaluation compares pre-test and post-test scores, and shows the pupils' Smileyometer and Again-Again answers.", "Export it as CSV for your report."], { 0: { ring: "#ev-prepost", zoom: 1.2 }, 1: { ring: "#ev-csv", point: "#ev-csv", tap: true, zoom: 1.6 } }),
      S("t-data", "Data", ["Collect work from other tablets, export class packs and backups here. All data stays on your device."], { 0: { ring: "#ds-imp", point: "#ds-imp", tap: true, zoom: 1.4 } })
    ] }
  };
  PA.PUPIL_VIDEOS = ["welcome", "learn", "practice", "studio", "scanner", "me"];
  PA.TEACHER_VIDEOS = ["tstart", "tvoices", "tassess", "tplan"];
})();
