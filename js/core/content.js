/* PunctuAction — content bank.
   Sentences are GENERATED from templates + Malaysian word banks, so every round is new:
   pupils must apply the rule, they cannot memorise answers. */
(function () {
  const PA = (window.PA = window.PA || {});
  const { pick, shuffle } = PA;

  const BANK = {
    Name: ["Ali", "Siti", "Mei Ling", "Ravi", "Aiman", "Priya", "Farah", "Kumar", "Daniel", "Nurul", "Jia Hui", "Arjun", "Aisyah", "Hafiz", "Wei Jie", "Kavitha", "Amir", "Sarah"],
    food: ["nasi lemak", "roti canai", "durian", "rambutans", "mangoes", "satay", "cendol", "curry puffs", "ice cream", "noodles", "bananas", "apples", "fried rice", "kuih", "watermelon"],
    place: ["canteen", "library", "field", "park", "market", "beach", "zoo", "museum", "playground", "night market", "farm", "hall"],
    animal: ["cat", "dog", "rabbit", "goat", "chicken", "monkey", "kitten", "puppy", "duck", "cow", "parrot", "turtle"],
    item: ["pencil", "ruler", "water bottle", "school bag", "umbrella", "storybook", "eraser", "hat", "kite", "ball", "lunch box", "shoes"],
    colour: ["red", "blue", "green", "yellow", "purple", "orange", "pink", "black"],
    transport: ["bus", "car", "bicycle", "motorcycle", "van", "train", "boat"],
    family: ["mum", "dad", "grandma", "grandpa", "uncle", "aunt", "brother", "sister"],
    festival: ["Hari Raya", "Chinese New Year", "Deepavali", "Christmas", "Gawai", "Sports Day", "Teachers' Day"],
    adj: ["happy", "hungry", "tired", "sleepy", "ready", "sick", "late", "angry", "busy", "excited"]
  };
  PA.BANK = BANK;

  /** fill("{Name} likes {food} and {food2}.") — numbered slots stay distinct */
  function fill(tpl) {
    const used = {};
    return tpl.replace(/\{(Name|name|food|place|animal|item|colour|transport|family|Family|festival|adj)(\d?)\}/g, (_, k, n) => {
      const base = k === "Family" ? "family" : k === "name" ? "Name" : k;
      const key = base + (n || "1");
      if (!used[key]) {
        const taken = Object.keys(used).filter((x) => x.startsWith(base)).map((x) => used[x]);
        const opts = BANK[base].filter((v) => !taken.includes(v));
        used[key] = pick(opts.length ? opts : BANK[base]);
      }
      const v = used[key];
      return k === "Family" ? v.charAt(0).toUpperCase() + v.slice(1) : v;
    });
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------------- Sentence templates by type & level ---------------- */
  const T = {
    stmt: {
      easy: ["I like {food}.", "{Name} has a {colour} {item}.", "The {animal} is sleeping.", "We go to school by {transport}.", "My {family} is in the kitchen.", "This is my {item}.", "The {animal} is under the table.", "I can see a {colour} kite.", "{Name} is my best friend.", "It is a sunny day."],
      medium: ["{Name} goes to the {place} every Saturday.", "My {family} is cooking {food} for dinner.", "The {animal} ran into the {place}.", "We are going to the {place} after school.", "{Name} left the {item} in the {place}.", "Yes, I finished my homework.", "Oh, I forgot my {item} at home.", "Well, I think it will rain today.", "Thank you, {Name}.", "{Name}, please close the door."],
      hard: ["After school, {Name} went to the {place}.", "Yesterday, my {family} bought {food}, {food2} and {food3}.", "{Name}, {Name2} and I are in the same class.", "In the morning, the {animal} was very hungry.", "During the holidays, we visited the {place}, the {place2} and the {place3}.", "Before dinner, {Name} washed the plates, cups and spoons.", "No, {Name}, the {item} is not mine.", "Luckily, the {animal} was safe."]
    },
    yn: {
      easy: ["Do you like {food}?", "Is this your {item}?", "Can you swim?", "Is the {animal} hungry?", "Are you happy?", "Can I have some {food}?", "Is it raining?", "Do you have a {animal}?"],
      medium: ["Can {Name} come to the {place} with us?", "Did you see my {colour} {item}?", "Are we going to the {place} today?", "Does your {family} like {food}?", "Is the {animal} sleeping in the {place}?", "Have you finished your homework?", "Will you come to my house for {festival}?", "Do you want to play at the {place}?"],
      hard: ["{Name}, can you help me carry these books?", "Excuse me, is this the way to the {place}?", "Did you bring {food}, {food2} and {food3}?", "Mum, can I go to the {place} with {Name}?", "Tell me, did the {animal} eat all the {food}?", "Well, should we take the {transport} or walk?"]
    },
    wh: {
      easy: ["What is your name?", "Where is my {item}?", "Who is your teacher?", "What colour is your {item}?", "Where is the {animal}?", "What is this?", "Who is {Name}?", "How old are you?"],
      medium: ["Where are you going, {Name}?", "Why is the {animal} crying?", "When is {festival}?", "How do you go to school?", "What do you want for breakfast?", "Who ate my {food}?", "Which {item} is yours?", "Why are you so {adj}?"],
      hard: ["{Name}, why are you late today?", "Which {item} do you want, the {colour} one or the {colour2} one?", "How many {food} did you buy at the {place}?", "Excuse me, where is the {place}?", "Mum, what are we having for dinner tonight?", "When the bell rings, where should we line up?"]
    },
    declq: ["You like {food}?", "{Name} is coming with us?", "The {animal} ate my homework?", "You finished already?", "It's your birthday today?", "You lost your {item} again?", "We are going to the {place}?"]
  };

  /* ---------------- Exclamations in context (emotion + acceptable alternatives) ---------------- */
  const EXCL = [
    // easy
    { l: "easy", ctx: "You see a huge birthday cake on the table.", scene: "🎂", text: "Wow, what a big cake!", emo: "excited", ok: ["happy", "surprised"] },
    { l: "easy", ctx: "Your team scores the winning goal.", scene: "⚽", text: "Hooray, we won!", emo: "excited", ok: ["happy", "proud"] },
    { l: "easy", ctx: "A snake slides out from under a bush.", scene: "🐍", text: "Help, a snake!", emo: "scared", ok: ["urgent"] },
    { l: "easy", ctx: "Your little brother broke your new toy on purpose.", scene: "🧸", text: "You broke my toy!", emo: "angry", ok: [] },
    { l: "easy", ctx: "Your teacher gives you a gold star.", scene: "⭐", text: "Thank you, teacher!", emo: "happy", ok: ["proud", "excited"] },
    { l: "easy", ctx: "A car is coming fast and your friend is on the road.", scene: "🚗", text: "Watch out!", emo: "urgent", ok: ["scared"] },
    { l: "easy", ctx: "Your new ball rolls into the drain.", scene: "🏐", text: "Oh no, my ball!", emo: "sad", ok: ["worried"] },
    { l: "easy", ctx: "You open your present and find a bicycle.", scene: "🚲", text: "A new bicycle!", emo: "excited", ok: ["happy", "surprised"] },
    // medium
    { l: "medium", ctx: "Your cat is stuck on the roof and it is getting dark.", scene: "🐈", text: "Oh no, Comel is stuck on the roof!", emo: "worried", ok: ["scared"] },
    { l: "medium", ctx: "The lights go off during a thunderstorm.", scene: "⛈️", text: "Ahh, it's so dark in here!", emo: "scared", ok: ["worried"] },
    { l: "medium", ctx: "You get full marks in your spelling test.", scene: "💯", text: "I got full marks!", emo: "proud", ok: ["excited", "happy"] },
    { l: "medium", ctx: "Someone takes your seat on the bus after you stood up for a second.", scene: "🚌", text: "Hey, that is my seat!", emo: "angry", ok: [] },
    { l: "medium", ctx: "Your grandma visits from the kampung without telling you.", scene: "👵", text: "Grandma, you're here!", emo: "surprised", ok: ["happy", "excited"] },
    { l: "medium", ctx: "Heavy rain falls on your class picnic food.", scene: "🧺", text: "Oh no, the food is all wet!", emo: "sad", ok: ["worried", "angry"] },
    { l: "medium", ctx: "Your team is losing. You cheer to give them energy.", scene: "📣", text: "Come on, we can do it!", emo: "excited", ok: ["urgent"] },
    { l: "medium", ctx: "You find the kitten that was lost for two days.", scene: "🐾", text: "There you are, little one!", emo: "happy", ok: ["excited", "surprised"] },
    // hard
    { l: "hard", ctx: "The river is rising quickly after the storm.", scene: "🌊", text: "Run to the hill, everyone!", emo: "urgent", ok: ["scared"] },
    { l: "hard", ctx: "Your best friend tells you she is moving to another state.", scene: "📦", text: "No, you can't leave!", emo: "sad", ok: ["worried"] },
    { l: "hard", ctx: "Your friend scored the winning goal in the last second of the final.", scene: "🏆", text: "Goal! We are the champions!", emo: "excited", ok: ["proud", "happy"] },
    { l: "hard", ctx: "Your neighbour's goat ate the flowers you planted for a month.", scene: "🐐", text: "My flowers, you naughty goat!", emo: "angry", ok: [] },
    { l: "hard", ctx: "You open the storeroom door and something jumps out.", scene: "🔦", text: "Ahh, what was that!", emo: "scared", ok: ["surprised"] },
    { l: "hard", ctx: "Your volcano experiment explodes all over the teacher.", scene: "🌋", text: "Oh dear, it's everywhere!", emo: "surprised", ok: ["worried", "scared"] }
  ];
  /* Same words, different situation -> different feeling (Hard: reading the context, not the words) */
  const TWINS = [
    { text: "It's raining!", a: { ctx: "The padi fields in the kampung have been dry for weeks.", scene: "🌾", emo: "happy", ok: ["excited"] }, b: { ctx: "Your class is about to start a picnic at the park.", scene: "🧺", emo: "sad", ok: ["angry", "worried"] } },
    { text: "It's a cat!", a: { ctx: "You love cats and a fluffy kitten walks up to you.", scene: "😻", emo: "happy", ok: ["excited"] }, b: { ctx: "You are afraid of cats and one suddenly jumps at you.", scene: "🙀", emo: "scared", ok: ["surprised"] } },
    { text: "Look at the sky!", a: { ctx: "Fireworks fill the sky on New Year's Eve.", scene: "🎆", emo: "excited", ok: ["happy", "surprised"] }, b: { ctx: "Big black storm clouds are coming towards your house.", scene: "🌩️", emo: "worried", ok: ["scared"] } },
    { text: "He's here!", a: { ctx: "Your favourite footballer has arrived to visit your school.", scene: "🌟", emo: "excited", ok: ["happy"] }, b: { ctx: "The big dog that always chases you is at the gate.", scene: "🐕", emo: "scared", ok: ["worried"] } },
    { text: "Not again!", a: { ctx: "The cat knocked over your milk for the third time.", scene: "🥛", emo: "angry", ok: [] }, b: { ctx: "You fell into the same muddy puddle again in your clean uniform.", scene: "💦", emo: "sad", ok: ["angry"] } },
    { text: "The teacher is coming!", a: { ctx: "Your class is noisy and the room is messy.", scene: "🫣", emo: "worried", ok: ["scared", "urgent"] }, b: { ctx: "You have a Teachers' Day gift ready to give her.", scene: "🎁", emo: "excited", ok: ["happy"] } }
  ];

  /* ---------------- Passages for Pause Patrol / Fix the Robot ---------------- */
  const PASSAGES = {
    easy: ["I have a {animal}. It is very cute.", "{Name} likes {food}, {food2} and {food3}.", "This is my {item}. It is {colour}.", "Look, a {animal}!", "Where is my {item}?", "Do you like {food}?", "I am hungry. Can I eat now?", "Yes, I can swim."],
    medium: ["On Saturday, we went to the {place}. We saw a {animal}, a {animal2} and a {animal3}. It was fun!", "{Name}, where is your {item}? Did you leave it in the {place}?", "Oh no, I forgot my {item}! Can I borrow yours, {Name}?", "My {family} cooked {food} for dinner. It was delicious!", "Wow, look at that {animal}! Is it hungry?", "Hello, {Name}. Are you coming to the {place} with us?"],
    hard: ["{Name}, are you ready? The bus is here! Bring your bag, your bottle and your hat. Hurry, we are late!", "After school, {Name} and I walked to the {place}. Suddenly, it started to rain. Where could we hide? Luckily, we found a bus stop!", "Mum, have you seen my {item}? I put it on the table, near the door and next to my bag. Oh, here it is!", "Excuse me, sir, is this the way to the {place}? I'm lost, and my phone is dead. Thank you, you are very kind!", "Listen, everyone! The {festival} party starts at seven. Please bring {food}, {food2} or {food3}. Don't be late!"]
  };

  /* ---------------- Declarative bases for "Ears On!" (words don't give the answer away) ---------------- */
  const EAR_BASES = ["You like {food}", "{Name} is coming to the {place}", "The {animal} is sleeping", "It is raining again", "We are going home now", "You have a new {item}", "Dad is cooking {food}", "The {transport} is here", "You finished your homework", "School is closed tomorrow", "Your {family} is outside", "The {animal} ate all the {food}"];

  const Content = {
    fill, cap, EXCL, TWINS, T,
    /** one sentence item {text,type,skills,level,cue,emo?,ctx?,scene?} */
    sentence(type, level = "easy") {
      if (type === "excl") { const e = pick(EXCL.filter((x) => x.l === level)); return { text: e.text, type: "excl", emo: e.emo, ok: e.ok, ctx: e.ctx, scene: e.scene, skills: ["feel"], level }; }
      if (type === "declq") return { text: fill(pick(T.declq)), type: "declq", skills: ["ask"], level };
      const tpl = pick(T[type][level] || T[type].easy);
      const text = fill(tpl);
      const cls = PA.Lang.classify(text);
      const skills = [type === "stmt" ? "stop" : "ask"]; if (text.includes(",")) skills.push("pause");
      return { text, type: cls.type === "declq" && type === "stmt" ? "stmt" : type, skills, level, cue: cls.cueWord };
    },
    /** weighted random type, leaning to pupil's weakest skills */
    randomSentence(level, weights) {
      const pool = [];
      const w = Object.assign({ stop: 1, pause: 1, ask: 1, feel: 1 }, weights || {});
      const add = (t, n) => { for (let i = 0; i < Math.round(n * 4); i++) pool.push(t); };
      add("stmt", w.stop + (level !== "easy" ? w.pause * 0.6 : 0)); add("yn", w.ask * 0.55); add("wh", w.ask * 0.55); add("excl", w.feel);
      if (level === "hard") add("declq", w.ask * 0.3);
      return this.sentence(pick(pool), level);
    },
    passage(level = "easy") { return fill(pick(PASSAGES[level])); },
    earBase() { return fill(pick(EAR_BASES)); },
    excl(level) { return pick(EXCL.filter((x) => x.l === level)); },
    twin() { return pick(TWINS); },
    /** Build a question from a statement for "Build-a-Question" (Hard) */
    buildable() {
      const opts = [
        () => { const n = pick(BANK.Name), a = pick(BANK.adj); return { from: `${n} is ${a}.`, words: ["Is", n, a], mark: "?", type: "yn" }; },
        () => { const an = pick(BANK.animal); return { from: `The ${an} can swim.`, words: ["Can", "the", an, "swim"], mark: "?", type: "yn" }; },
        () => { const p = pick(BANK.place); return { from: `They are at the ${p}.`, words: ["Are", "they", "at", "the", p], mark: "?", type: "yn" }; },
        () => { const f = pick(BANK.food); return { from: `You like ${f}.`, words: ["Do", "you", "like", f], mark: "?", type: "yn" }; },
        () => { const i = pick(BANK.item); return { from: `(Ask where the ${i} is.)`, words: ["Where", "is", "my", i], mark: "?", type: "wh" }; },
        () => { const n = pick(BANK.Name); return { from: `(Ask why ${n} is crying.)`, words: ["Why", "is", n, "crying"], mark: "?", type: "wh" }; },
        () => { const f = pick(BANK.food); return { from: `(Ask what they ate.)`, words: ["What", "did", "you", "eat", "for", "lunch"], mark: "?", type: "wh" }; },
        () => { const t = pick(BANK.transport); return { from: `(Ask how they go to school.)`, words: ["How", "do", "you", "go", "to", "school"], mark: "?", type: "wh" }; }
      ];
      return pick(opts)();
    }
  };
  PA.Content = Content;

  /* ======================= Role-play dialogues (Reading Studio) ======================= */
  PA.DIALOGUES = [
    { id: "d-canteen", title: "At the Canteen", level: "easy", years: "Year 1–2", scene: "🍛", setting: "Ali buys breakfast at the school canteen.",
      cast: [{ name: "Ali", av: "🧒", pitch: 1.25 }, { name: "Aunty Mah", av: "👩‍🍳", pitch: 1.0 }],
      lines: [
        { c: 0, text: "Good morning, Aunty!", emo: "happy" },
        { c: 1, text: "Good morning, Ali. What do you want today?" },
        { c: 0, text: "Can I have nasi lemak, please?" },
        { c: 1, text: "Sure. Do you want an egg?" },
        { c: 0, text: "Yes, please!", emo: "happy" },
        { c: 1, text: "Here you are. That is two ringgit." },
        { c: 0, text: "Thank you, Aunty. It smells so good!", emo: "happy" }
      ] },
    { id: "d-comel", title: "Where Is Comel?", level: "easy", years: "Year 1–2", scene: "🐱", setting: "Siti cannot find her cat, Comel.",
      cast: [{ name: "Siti", av: "👧", pitch: 1.3 }, { name: "Mum", av: "👩", pitch: 1.05 }],
      lines: [
        { c: 0, text: "Mum, where is Comel?", emo: "worried" },
        { c: 1, text: "I don't know. Is she in your room?" },
        { c: 0, text: "No, she is not there.", emo: "sad" },
        { c: 1, text: "Look! What is that under the table?", emo: "surprised" },
        { c: 0, text: "It's Comel! She is sleeping.", emo: "excited" },
        { c: 1, text: "Shh, don't wake her up.", emo: "calm" }
      ] },
    { id: "d-birthday", title: "Happy Birthday, Ravi!", level: "easy", years: "Year 1–3", scene: "🎂", setting: "Ravi's friends have a surprise for him.",
      cast: [{ name: "Mei Ling", av: "👧", pitch: 1.3 }, { name: "Ravi", av: "👦", pitch: 1.15 }, { name: "Daniel", av: "🧒", pitch: 1.2 }],
      lines: [
        { c: 0, text: "Surprise! Happy birthday, Ravi!", emo: "excited" },
        { c: 1, text: "Wow, is this cake for me?", emo: "surprised" },
        { c: 2, text: "Yes, it is. Make a wish!", emo: "happy" },
        { c: 1, text: "Thank you, my friends. You are the best!", emo: "happy" },
        { c: 0, text: "Can we eat the cake now?", emo: "excited" },
        { c: 1, text: "Of course. Let's eat!", emo: "happy" }
      ] },
    { id: "d-durian", title: "The Missing Durian", level: "medium", years: "Year 3–4", scene: "🍈", setting: "Grandpa's durian has disappeared from the table.",
      cast: [{ name: "Grandpa", av: "👴", pitch: 0.85 }, { name: "Aiman", av: "👦", pitch: 1.2 }, { name: "Farah", av: "👧", pitch: 1.3 }],
      lines: [
        { c: 0, text: "Aiman, did you see my durian? I put it on the table." },
        { c: 1, text: "No, Grandpa. I was at the field with Farah." },
        { c: 2, text: "Look, there are seeds on the floor!", emo: "surprised" },
        { c: 0, text: "Seeds? Who ate my durian?", emo: "angry" },
        { c: 1, text: "Shh, listen. What is that noise?", emo: "worried" },
        { c: 2, text: "It's a monkey! It has the durian!", emo: "surprised" },
        { c: 0, text: "Oh, you naughty monkey. Come back here!", emo: "angry" }
      ] },
    { id: "d-sports", title: "Sports Day", level: "medium", years: "Year 3–4", scene: "🏃", setting: "Priya runs the 100-metre race.",
      cast: [{ name: "Coach Kumar", av: "👨‍🏫", pitch: 0.9 }, { name: "Priya", av: "👧", pitch: 1.3 }, { name: "Hafiz", av: "👦", pitch: 1.2 }],
      lines: [
        { c: 0, text: "Runners, are you ready?" },
        { c: 1, text: "Yes, Coach. We are ready!", emo: "excited" },
        { c: 0, text: "On your marks, get set, go!", emo: "urgent" },
        { c: 2, text: "Run, Priya, run! You can do it!", emo: "excited" },
        { c: 1, text: "I did it! I won the race!", emo: "proud" },
        { c: 0, text: "Well done, Priya. How do you feel?", emo: "happy" },
        { c: 1, text: "I feel tired, but I am very happy.", emo: "happy" }
      ] },
    { id: "d-picnic", title: "Rainy Day Picnic", level: "medium", years: "Year 3–4", scene: "🌧️", setting: "Mei Ling and Arjun plan a picnic.",
      cast: [{ name: "Mei Ling", av: "👧", pitch: 1.3 }, { name: "Arjun", av: "👦", pitch: 1.15 }, { name: "Dad", av: "👨", pitch: 0.85 }],
      lines: [
        { c: 0, text: "The sky is so blue today. Let's have a picnic!", emo: "happy" },
        { c: 1, text: "Good idea! I will bring sandwiches, bananas and juice.", emo: "excited" },
        { c: 2, text: "Wait, did you check the weather?" },
        { c: 0, text: "Oh no, it's raining!", emo: "sad" },
        { c: 1, text: "What should we do now?", emo: "worried" },
        { c: 2, text: "Why don't we have the picnic in the living room?" },
        { c: 0, text: "What a great idea, Dad!", emo: "happy" }
      ] },
    { id: "d-pasar", title: "At the Pasar Malam", level: "medium", years: "Year 3–5", scene: "🏮", setting: "Amir and Jia Hui buy food at the night market.",
      cast: [{ name: "Amir", av: "👦", pitch: 1.15 }, { name: "Jia Hui", av: "👧", pitch: 1.3 }, { name: "Uncle Lim", av: "👨‍🍳", pitch: 0.85 }],
      lines: [
        { c: 0, text: "Jia Hui, look at all the food here!", emo: "excited" },
        { c: 1, text: "Wow, I want satay, apam balik and cendol.", emo: "excited" },
        { c: 2, text: "Hello, kids. How many sticks of satay do you want?" },
        { c: 0, text: "Ten sticks, please. How much are they?" },
        { c: 2, text: "They are six ringgit." },
        { c: 1, text: "Oh no, I forgot my purse!", emo: "worried" },
        { c: 0, text: "Don't worry, I can pay today.", emo: "calm" },
        { c: 1, text: "Thank you, Amir. You are a true friend!", emo: "happy" }
      ] },
    { id: "d-storeroom", title: "The Haunted Storeroom", level: "hard", years: "Year 5–6", scene: "🔦", setting: "Strange noises come from the school storeroom.",
      cast: [{ name: "Daniel", av: "👦", pitch: 1.1 }, { name: "Aisyah", av: "👧", pitch: 1.25 }, { name: "Pak Mat", av: "👨‍🌾", pitch: 0.8 }],
      lines: [
        { c: 0, text: "Aisyah, did you hear that? Something is moving in the storeroom.", emo: "scared" },
        { c: 1, text: "Don't be silly, Daniel. It's only the wind.", emo: "calm" },
        { c: 0, text: "Listen! It's scratching the door!", emo: "scared" },
        { c: 1, text: "Okay, okay. Let's open it slowly. One, two, three!", emo: "scared" },
        { c: 2, text: "Hello, children! Why are you so scared?", emo: "happy" },
        { c: 0, text: "Pak Mat? Was that you?", emo: "surprised" },
        { c: 2, text: "Yes, I was looking for my rake, my gloves and my hat." },
        { c: 1, text: "Phew, what a relief! We thought you were a ghost!", emo: "happy" }
      ] },
    { id: "d-volcano", title: "The Science Fair Disaster", level: "hard", years: "Year 5–6", scene: "🌋", setting: "Kavitha and Wei Jie show their volcano experiment.",
      cast: [{ name: "Kavitha", av: "👧", pitch: 1.25 }, { name: "Wei Jie", av: "👦", pitch: 1.1 }, { name: "Puan Rosnah", av: "👩‍🏫", pitch: 1.0 }],
      lines: [
        { c: 0, text: "Wei Jie, is our volcano ready for the science fair?" },
        { c: 1, text: "Almost. I just need to add vinegar, baking soda and red colouring." },
        { c: 2, text: "Group Four, you are next. Are you ready?" },
        { c: 0, text: "Yes, teacher. Here it goes!", emo: "excited" },
        { c: 1, text: "Oh no, it's too much! It's everywhere!", emo: "surprised" },
        { c: 2, text: "Goodness me, my shoes are red now!", emo: "surprised" },
        { c: 0, text: "We're so sorry, teacher. Are you angry with us?", emo: "worried" },
        { c: 2, text: "Angry? No, that was the best volcano ever!", emo: "happy" }
      ] },
    { id: "d-final", title: "The Big Football Final", level: "hard", years: "Year 4–6", scene: "⚽", setting: "One minute left in the school football final.",
      cast: [{ name: "Nurul", av: "👧", pitch: 1.25 }, { name: "Coach", av: "🧑‍🏫", pitch: 0.9 }, { name: "Hafiz", av: "👦", pitch: 1.15 }],
      lines: [
        { c: 0, text: "Hafiz, there is only one minute left. What should we do?", emo: "worried" },
        { c: 1, text: "Stay calm, everyone. Pass the ball, look for space and shoot!", emo: "urgent" },
        { c: 2, text: "Nurul, pass it to me! I'm free!", emo: "urgent" },
        { c: 0, text: "Here you go, Hafiz. Shoot now!", emo: "excited" },
        { c: 2, text: "Goal! Did you see that?", emo: "excited" },
        { c: 1, text: "Yes, we saw it! We are the champions!", emo: "excited" },
        { c: 0, text: "I can't believe it. This is the best day of my life!", emo: "happy" }
      ] },
    { id: "d-raya", title: "A Hari Raya Surprise", level: "hard", years: "Year 4–6", scene: "🌙", setting: "Aiman decorates his house and a friend visits.",
      cast: [{ name: "Mak", av: "👩", pitch: 1.0 }, { name: "Aiman", av: "👦", pitch: 1.15 }, { name: "Arjun", av: "🧒", pitch: 1.2 }],
      lines: [
        { c: 0, text: "Aiman, can you help me hang the pelita outside?" },
        { c: 1, text: "Of course, Mak. Where should I put them?" },
        { c: 0, text: "Put them along the fence, near the door and by the window." },
        { c: 2, text: "Selamat Hari Raya, Aiman! I brought you some kuih.", emo: "happy" },
        { c: 1, text: "Arjun, you came! Come in, come in!", emo: "excited" },
        { c: 2, text: "Wow, your house looks beautiful. Did you do all this?", emo: "surprised" },
        { c: 1, text: "Mak and I did it together. Do you want some rendang?", emo: "proud" },
        { c: 2, text: "Yes, please! I love your mother's rendang!", emo: "happy" }
      ] },
    { id: "d-tourist", title: "The Lost Tourist", level: "hard", years: "Year 5–6", scene: "🗺️", setting: "A tourist asks two pupils for directions.",
      cast: [{ name: "Emma", av: "👱‍♀️", pitch: 1.05 }, { name: "Priya", av: "👧", pitch: 1.3 }, { name: "Ravi", av: "👦", pitch: 1.15 }],
      lines: [
        { c: 0, text: "Excuse me, can you help me? I think I'm lost.", emo: "worried" },
        { c: 1, text: "Of course. Where do you want to go?" },
        { c: 0, text: "I'm looking for the museum, but my map is wet.", emo: "sad" },
        { c: 2, text: "Oh, the museum is near here. Walk straight, turn left at the bank and cross the bridge." },
        { c: 0, text: "Straight, left at the bank, then the bridge? Is that right?" },
        { c: 1, text: "Yes, that's right. Be careful, the bridge is slippery!", emo: "urgent" },
        { c: 0, text: "Thank you so much, both of you. You are very kind!", emo: "happy" }
      ] }
  ];

  /* Fixed passage for the Pre-test / Post-test "Reading Check" (same text both times so results compare fairly) */
  PA.READING_CHECK = { id: "check", title: "Reading Check: The Kite", level: "medium", years: "All", scene: "🪁", setting: "Read all four lines. Your teacher uses this to see how you grow.",
    cast: [{ name: "Ali", av: "👦", pitch: 1.2 }, { name: "Siti", av: "👧", pitch: 1.3 }],
    lines: [
      { c: 0, text: "Siti, look at my new kite!", emo: "excited" },
      { c: 1, text: "Wow, it is so big. Can I fly it?", emo: "happy" },
      { c: 0, text: "Yes, you can. Hold the string, run fast and let it go." },
      { c: 1, text: "Where is it going? Oh no, it's stuck in the tree!", emo: "surprised" }
    ] };
})();
