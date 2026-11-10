/* PunctuAction — narrated "Watch how" tutorials for every pupil page (the user manual inside the app) */
(function () {
  const PA = window.PA; const S = PA.S;
  S.tutorials = {
    home: { title: "Welcome", steps: () => [
      { title: "Hello! I'm Bip 🤖", text: "This is your home page. I read like a robot. Help me find my voice by learning the four punctuation marks!", sel: "#hero" },
      { title: "My voice chips", text: "Each chip is one skill: stop, pause, ask and feel. A chip lights up when you reach eighty percent.", sel: "#chipRow" },
      { title: "Your journey", text: "Follow the steps: Learn, then Practice, then the Reading Studio. Then see your badges.", sel: "#journey", tap: true },
      { title: "The chant", text: "Press Sing it to learn the chant. Stop at the dot. Breathe at the comma. Ask with a question. Feel the exclamation!", sel: "#chant", tap: true },
      { title: "Ask Bip", text: "Stuck? Tap me in the corner. You can ask questions or type a sentence and I will add the marks.", sel: ".chat-fab", tap: true }
    ] },
    learn: { title: "Learn", steps: () => [
      { title: "Meet the Mark Crew", text: "Tap a friend to start a lesson. Dotty is the full stop, Koma is the comma, Quizzy is the question mark and Zing is the exclamation mark.", sel: "#crew", tap: true },
      { title: "Voice rules", text: "This poster shows what each mark tells your voice to do. Look at it whenever you forget.", sel: "#poster" }
    ] },
    lesson: { title: "Lesson", steps: () => [
      { title: "Five small steps", text: "Every lesson has five steps: meet, trace, hear, spot and say.", sel: ".lesson-steps" },
      { title: "Try each step", text: "Do the activity on the page. Listen with the blue buttons. Record with the red button.", sel: "#lbody" },
      { title: "Next", text: "Press Next to go on. At the end you get three stars!", sel: "#lnext", tap: true }
    ] },
    practice: { title: "Practice", steps: () => [
      { title: "Choose your level", text: "Easy, Medium or Hard. Choose the one that feels right. You can change it any time.", sel: "#lvlRow", tap: true },
      { title: "Bip's tip", text: "I look at your skills and suggest a game for you.", sel: "#suggest" },
      { title: "Six games", text: "Tap a game to play. The sentences are new every time, so think about the rule, not the answer!", sel: "#games", tap: true }
    ] },
    play: { title: "Playing", steps: () => [
      { title: "Your progress dots", text: "Each dot is one question. Green means correct.", sel: "#gdots" },
      { title: "Read and think", text: "Read the sentence and the story. Use the clue if you need help.", sel: "#gbody" },
      { title: "Listen to the answer", text: "After each answer, listen to how the sentence should sound. Then press Next.", sel: "#gbody" }
    ] },
    studio: { title: "Reading Studio", steps: () => [
      { title: "Reading Check", text: "Your teacher may ask you to do the Reading Check. It shows how much you grow.", sel: "#checkCard" },
      { title: "Choose a dialogue", text: "Pick a dialogue at your level. A green badge means your teacher recorded the voices.", sel: "#dlgs", tap: true }
    ] },
    dialogue: { title: "Recording", steps: () => [
      { title: "Choose your part", text: "Tap the character you want to be. Your lines get a yellow border.", sel: "#cast", tap: true },
      { title: "Tools", text: "Choose the model voice, turn the voice signs on or off, or choose a disguise voice if you feel shy.", sel: "#tools" },
      { title: "Listen, then record", text: "Press Listen to hear the model. Press Record, read your line, then press Stop.", sel: ".line.mine .line-tools, .line .line-tools", tap: true },
      { title: "Your voice melody", text: "After recording, you see your voice melody line, the robot meter and tips. Then send it to your teacher.", sel: "#lines" },
      { title: "Role-play mode", text: "Press Role-play mode to act the whole scene. The app reads the other characters, and you read yours!", sel: "#rp", tap: true }
    ] },
    me: { title: "My progress", steps: () => [
      { title: "Your skills", text: "These bars show your four skills. Keep practising to fill them.", sel: "#meHero" },
      { title: "Teacher messages", text: "When your teacher checks your recording, the stars and comments appear here.", sel: "#mail" },
      { title: "Badges", text: "Collect all twelve badges!", sel: "#badges" }
    ] },
    feedback: { title: "Feedback", steps: () => [
      { title: "Your opinion matters", text: "Choose a face to show how much you enjoyed the app today.", sel: "#smile", tap: true },
      { title: "Send", text: "Answer the questions, then press Send. Your feedback floats up to the class sky!", sel: "#fbSend", tap: true }
    ] }
  };
  // pick the tutorial that matches the current page
  const btn = document.getElementById("watchBtn");
  if (btn) btn.onclick = () => {
    const parts = (location.hash.replace(/^#\/?/, "").split("?")[0] || "home").split("/");
    const key = parts[0] === "studio" && parts[1] ? "dialogue" : parts[0] === "learn" && parts[1] ? "lesson" : parts[0];
    const t = S.tutorials[key] || S.tutorials.home;
    PA.Tour.play(t.steps(), { title: t.title });
  };
})();
