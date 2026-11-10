/* PunctuAction — "Ask Bip": an offline helper chatbot for pupils.
   Rule-based on purpose: it runs without internet and never sends pupils' words anywhere. */
(function () {
  const PA = (window.PA = window.PA || {});
  const say = (text, emo) => `<div class="say"><button class="btn btn-sm btn-bip" data-say="${PA.esc(text)}" ${emo ? `data-emo="${emo}"` : ""}>🔊 Hear it</button> <span class="read">${PA.ReadAlong.html(text, { cues: true, emotion: emo })}</span></div>`;

  const INTENTS = [
    { re: /\b(hi|hello|hey|assalam|salam|selamat|morning|good (morning|afternoon))\b/i, a: () => `Hello! I'm <b>Bip</b> 🤖. I used to read like a robot, but the Mark Crew taught me to read with feeling. Ask me about <b>. , ? !</b> or type a sentence and I'll find the marks!` },
    { re: /(full ?stop|period|\bdot\b|noktah|titik)/i, a: () => `<b>Full stop (.)</b> — Dotty 🛑 says <b>STOP</b>. It ends a telling sentence. Let your voice go down and rest before the next sentence.${say("I have a cat. Her name is Comel.")}` },
    { re: /(comma|koma|pause|breath|nafas)/i, a: () => `<b>Comma (,)</b> — Koma 💨 says <b>take a tiny breath</b>, then keep going. We use commas in lists, after words like <i>Yes, Oh, Well,</i> and when we call someone's name.${say("Ali, can you buy eggs, bread and milk?")}` },
    { re: /(yes.?no|y\/n)/i, a: () => `A <b>Yes/No question</b> starts with words like <i>Do, Is, Are, Can, Did, Will</i>. You answer it with yes or no. Your voice goes <b>UP ↗</b> at the end.${say("Do you like durian?")}` },
    { re: /(\bwh\b|wh-|wh word|wh question|what words)/i, a: () => `<b>WH words</b>: what, where, when, who, which, why, how. A WH question starts <b>strong</b> and the voice usually goes <b>DOWN ↘</b> at the end.${say("Where is my school bag?")}` },
    { re: /(question|\bask|tanda soal|soalan)/i, a: () => `<b>Question mark (?)</b> — Quizzy says <b>ASK!</b><br>• Yes/No question → voice goes UP ↗<br>• WH question (what, where, why…) → strong start, voice goes down ↘${say("Are you hungry?")}${say("What do you want to eat?")}` },
    { re: /(exclamation|tanda seru|\bfeel|emotion|feeling|perasaan)/i, a: () => `<b>Exclamation mark (!)</b> — Zing 💥 says <b>FEEL it!</b> Show the feeling: happy 😄, angry 😠, surprised 😲, scared 😨… Think: <i>how does the character feel?</i>${say("Hooray, we won!", "excited")}${say("Hey, that is my seat!", "angry")}` },
    { re: /(robot|flat|boring|monoton|bosan.*suara)/i, a: () => `Reading like a robot 🤖 means every word sounds the same. To sound human: <b>stop</b> at . , <b>breathe</b> at , , go <b>up</b> for Yes/No ?, and <b>feel</b> the !. Try the <b>Fix the Robot</b> activity to help me!` },
    { re: /(record|mic|microphone|rakam)/i, a: () => `To record: go to <b>Reading Studio 🎭</b>, choose a dialogue, press <b>🎙 Record</b>, read your line, then press <b>⏹ Stop</b>. I will show your voice melody line and give you tips!` },
    { re: /(disguise|change.*voice|shy|malu|voice changer|mouse|bear|alien)/i, a: () => `Feeling shy? 🙈 Use <b>Voice Disguise</b> in the Studio. You can sound like a 🐭 mouse, 🐻 bear or 👽 alien. Your pauses and your up-and-down voice stay the same, so your teacher can still hear your great reading!` },
    { re: /(easy|medium|hard|level|susah|senang)/i, a: () => `Every activity has 3 levels: 🌱 <b>Easy</b>, 🌿 <b>Medium</b> and 🌳 <b>Hard</b>. Start where you feel comfortable. After each round, I'll tell you if you're ready to move up!` },
    { re: /(joke|funny|lawak|kelakar)/i, a: () => PA.pick([`Commas save lives! 😂 Listen to the difference:${say("Let's eat, Grandma!", "happy")}${say("Let's eat Grandma!", "excited")}One invites Grandma to eat. The other… eats Grandma! 😱`,
      `Why did the full stop go to bed early? Because it knew when to <b>STOP</b>! 😴🛑`,
      `What did the question mark say to the exclamation mark? "Why are you always so excited?" "Because I have big FEELINGS!" 💥`]) },
    { re: /(sad|bored|tired|difficult|can't|cannot|susah|penat|sedih)/i, a: () => `It's okay to find it tricky. Even I needed practice! 🤖💪 Try an <b>Easy</b> activity first, or ask me a question. Every mark you learn gives me a new voice chip!` },
    { re: /(thank|terima kasih|tq)/i, a: () => `You're welcome! Keep reading with feeling! 💛` },
    { re: /(who are you|your name|siapa)/i, a: () => `I'm <b>Bip</b>, a reading robot. I had no feelings in my voice until I met Dotty, Koma, Quizzy and Zing. Collect all four voice chips to make me a Voice Hero!` },
    { re: /(scan|photo|picture|my own dialogue|textbook)/i, a: () => `Open the <b>🔍 Scanner</b>! You can type, paste or take a photo of any dialogue. I will find every mark, fix missing ones and read it with feeling. Then practise it in the Studio. 📷` },
    { re: /(video|tutorial|watch)/i, a: () => `Press <b>🎬 Watch how</b> at the top of any page, or open the <a href="#/help">Help Centre</a> to see all the video tutorials.` },
    { re: /(help|how.*use|tolong|what can you do|apa)/i, a: () => `I can: <br>• explain each mark (tap a button below)<br>• check your sentence and add the marks ✍️<br>• read sentences aloud 🔊<br>• tell you a joke 😄<br>Press <b>🎬 Watch how</b> at the top of any page for a video tutorial.` }
  ];
  const CHIPS = ["Full stop", "Comma", "Question mark", "Exclamation mark", "✍️ Check my sentence", "Tell me a joke", "How do I record?"];

  const Chat = {
    mount({ names = [] } = {}) {
      this.names = names;
      const fab = document.createElement("button");
      fab.className = "chat-fab no-print"; fab.setAttribute("aria-label", "Ask Bip");
      fab.innerHTML = PA.mascot("bip", { mood: "happy", size: 58 }) + `<span class="hint">Ask Bip! 💬</span>`;
      document.body.appendChild(fab);
      setTimeout(() => { const h = fab.querySelector(".hint"); h && h.remove(); }, 6000);
      fab.addEventListener("click", () => this.toggle());
      this.fab = fab;
    },
    toggle() {
      if (this.panel) { this.panel.remove(); this.panel = null; return; }
      const p = document.createElement("div"); p.className = "chat-panel"; p.setAttribute("role", "dialog");
      p.innerHTML = `<div class="chat-head">${PA.mascot("bip", { mood: "talk", size: 40 })}<div class="grow"><b>Ask Bip</b><div class="small" style="opacity:.85">Works offline · your words stay on this device</div></div><button class="icon-btn" style="width:36px;height:36px;font-size:1rem;color:var(--ink)" data-x aria-label="Close">✕</button></div>
        <div class="chat-body"></div><div class="chat-chips">${CHIPS.map((c) => `<button class="chip">${c}</button>`).join("")}</div>
        <form class="chat-input"><input placeholder="Type a question or a sentence…" aria-label="Message"><button class="btn btn-sm btn-bip">Send</button></form>`;
      document.body.appendChild(p); this.panel = p; this.body = p.querySelector(".chat-body");
      this.bot(`Hi${PA.currentPupil ? ", " + PA.esc(PA.currentPupil.name) : ""}! I'm <b>Bip</b> 🤖. What do you want to know?`);
      p.querySelector("[data-x]").onclick = () => this.toggle();
      p.querySelector(".chat-chips").onclick = (e) => { const c = e.target.closest(".chip"); if (c) this.user(c.textContent); };
      p.querySelector("form").onsubmit = (e) => { e.preventDefault(); const i = p.querySelector("input"); if (i.value.trim()) this.user(i.value.trim()); i.value = ""; };
      p.addEventListener("click", (e) => { const b = e.target.closest("[data-say]"); if (b) PA.Voice.speak(b.dataset.say, { emotion: b.dataset.emo || null }); });
    },
    bot(html) { const m = document.createElement("div"); m.className = "msg bot"; m.innerHTML = html; this.body.appendChild(m); this.body.scrollTop = 1e6; },
    me(t) { const m = document.createElement("div"); m.className = "msg me"; m.textContent = t; this.body.appendChild(m); this.body.scrollTop = 1e6; },
    user(t) {
      this.me(t);
      setTimeout(() => this.reply(t), 350);
    },
    reply(t) {
      if (/check my sentence/i.test(t)) { this.checking = true; return this.bot(`Type a sentence <b>without</b> punctuation, for example: <i>where is my bag</i>. I'll add the marks and read it for you! ✍️`); }
      const words = t.trim().split(/\s+/).length;
      if (this.checking || (words >= 3 && !INTENTS.some((x) => x.re.test(t)))) {
        this.checking = false;
        const r = PA.Lang.suggest(t, (this.names || []).concat(PA.BANK.Name));
        if (!r) return this.bot("Hmm, I didn't get a sentence. Try again!");
        const meta = PA.MARKS[r.mark];
        return this.bot(`Here it is with marks:<div class="read" style="margin:8px 0;font-size:1.25rem">${PA.ReadAlong.html(r.fixed, { cues: true, emotion: r.mark === "!" ? "excited" : null })}</div>
          ${PA.markMascot(r.mark, { size: 34, mood: "happy" })} ${r.why}${r.tips.length ? "<br>💡 " + r.tips.join("<br>💡 ") : ""}
          <div class="say"><button class="btn btn-sm btn-bip" data-say="${PA.esc(r.fixed)}" ${r.mark === "!" ? 'data-emo="excited"' : ""}>🔊 Hear it</button></div>
          <div class="small muted" style="margin-top:6px">${meta.bm}</div>`);
      }
      const hit = INTENTS.find((x) => x.re.test(t));
      if (hit) return this.bot(hit.a());
      this.bot(`Hmm, I'm still learning 🤖. Try one of the buttons below, or type a sentence and I'll add the punctuation!`);
    }
  };
  PA.Chat = Chat;
})();
