/** The Consilia user manual (blueprint F25). Shown and searched in Me → Help; docs/manual.md is generated from it.
 *  Wording follows the labels on screen exactly, so a teacher can match the manual to what they see. */
export interface Article { id: string; title: string; body: string[]; steps?: string[]; tips?: string[]; keywords?: string; video?: string }
export interface Chapter { id: string; title: string; articles: Article[] }

export const MANUAL: Chapter[] = [
  { id: 'start', title: 'Getting started', articles: [
    { id: 'install', title: 'Install Consilia and use it offline', keywords: 'install add to home screen offline pwa phone laptop',
      body: ['Consilia is a web app. Open the link once with internet, and it saves itself on your device. After that it works with no signal, including the whole KSSR 2017 curriculum.'],
      steps: ['Open the Consilia link in Chrome (Android, laptop) or Safari (iPhone, iPad).', 'Android and laptop: tap Install in Me → Storage, or "Add to Home screen" in the browser menu.', 'iPhone and iPad: tap Share, then "Add to Home Screen".', 'Wait for the green "Ready to work offline" chip in Me.'],
      tips: ['When an update is ready, Consilia asks before switching, so a lesson in Teach mode is never interrupted.'] },
    { id: 'profile', title: 'Set up your profile', keywords: 'profile name school onboarding first time',
      body: ['The first screen asks for your language, name, practicum school, school type (SK or SJK) and programme. Your name and school appear on printed lesson plans. Change them any time in Me → Profile.'] },
    { id: 'tour', title: 'Take the guided tour', keywords: 'tour help guide walkthrough',
      body: ['An 8-step tour shows the main screens the first time you use Consilia. Replay it from Me → Help → Replay the guided tour.'] },
    { id: 'nav', title: 'Find your way around', keywords: 'navigation tabs today plan classes library me',
      body: ['Today: this week\'s lessons, shortcuts and your to-do list. Plan: every lesson plan, My day, the weekly timetable and your yearly plan. Classes: Year 1 to Year 6 classes, pupils and PBD. Library: the SoW, DSKP, Method Guide, activity bank and your textbooks. Me: settings, backup, help, privacy and feedback.', 'The gold "+ New lesson plan" button starts a lesson plan from anywhere.'] }
  ] },
  { id: 'plan', title: 'Planning a lesson', articles: [
    { id: 'new-rph', title: 'Plan your first lesson', video: 'first-rph', keywords: 'new rph lesson plan create start sow',
      body: ['Plan → New lesson plan. Three short questions set up the plan, then the builder walks you through seven steps. Everything saves as you type.'],
      steps: ['1 · Class and time: choose your class (or type one), the date, start time and length.', '2 · How do you want to start? Pick one of four ways (see below).', '3 · Choose the SoW lesson, then press Create lesson plan.'],
      tips: ['The score ring at the top shows how well the plan is aligned. Tap it to see what to fix.'] },
    { id: 'modes', title: 'Four ways to start', keywords: 'follow the sow my activities scratch mode recommend',
      body: ['Consilia recommends: tell Consilia about your class and it plans the whole lesson for you (see "Let Consilia plan a lesson").', 'Follow the SoW: everything from the SoW lesson is filled in (standards, outline steps and materials). Improve and expand it.', 'SoW standards, my activities: the Content Standard, Learning Standards, skills and theme come from the SoW, and you design the activities.', 'From scratch: choose your own standards from the DSKP and plan everything yourself.'] },
    { id: 'setup-step', title: 'Step 1 · Setup', keywords: 'setup class level cce moral values pupils prior knowledge',
      body: ['Check the class name, level, number of pupils, time, theme and topic. Cross-curricular element (CCE) and moral values have suggestions from the SoW. "What pupils already know" can be filled from your last reflection for the class.'] },
    { id: 'standards-step', title: 'Step 2 · Standards', keywords: 'content standard learning standard main complementary skill dskp',
      body: ['The main and complementary skills with their Content and Learning Standards. In the SoW modes they are locked to the SoW; press "Change them" if you really need different ones.'] },
    { id: 'objectives', title: 'Step 3 · Objectives with ABCD and SMART', video: 'objectives', keywords: 'objective abcd smart audience behaviour condition degree success criteria measurable',
      body: ['Every objective is built from four boxes: Audience (who), Behaviour (an action you can see), Condition (with what, or how) and Degree (how well, as a number).', 'The S, M, A, R and T squares turn green when the objective is Specific, Measurable, Achievable, Relevant and Time-bound. Each red square says what to change, for example "Add a number to the Degree, e.g. at least 4 out of 5".', 'Success criteria are written for pupils ("I can…") and update from your objective.'],
      tips: ['"Understand", "know" and "learn" cannot be observed, so Consilia suggests verbs such as identify, match, say or write.', '"With minimal support" is not a measurable Degree. Use a number: "at least 3 of 5 sentences".'] },
    { id: 'flow', title: 'Step 4 · Lesson flow and frameworks (PPP, PWP and more)', keywords: 'framework ppp pwp process writing tblt language arts stages timing activities',
      body: ['Consilia suggests a framework from the main skill and explains why: PWP for listening and reading, PPP for a language point or speaking phrase, Process Writing for writing in Years 3–6, Language Arts for songs, rhymes and stories, and Task-based for fluency in Years 4–6. You can choose another one.', 'Each stage has activities with what the teacher does, what pupils do, the interaction and teaching aids. Low, moderate and high tiers show how each activity is differentiated.', 'The timing bar adds up your minutes. "Reset to suggested times" shares the lesson length across the stages.'] },
    { id: 'materials-step', title: 'Step 5 · Materials, Canva AI and links', keywords: 'materials canva ai prompt wordwall worksheet links vocabulary appendices textbook pages',
      body: ['List the teaching aids, key vocabulary and appendices. Add textbook pages so they open in Teach mode.', 'Design with Canva AI: Consilia writes a prompt from your lesson. Press Copy prompt, then Open Canva AI and paste it.', 'Find ready-made materials opens searches on Wordwall, Liveworksheets, Quizizz, Kahoot and YouTube. Add any link you use to the lesson; it gets a QR code on the printed lesson plans.', 'The Materials studio makes printables from your lesson: flashcards, gap-fill and matching worksheets, sentence strips, exit tickets, tiered worksheets and an assessment rubric. Tick "In lesson plan appendix" to print them with the plan.'] },
    { id: 'planb', title: 'Step 6 · Plan B', keywords: 'plan b backup no projector no electricity early finishers absent',
      body: ['Plan for what often goes wrong: pupils finish early, the lesson runs late, no projector or electricity, a noisy class, many pupils absent. "Suggest for empty cards" fills ideas you can edit.'] },
    { id: 'review', title: 'Step 7 · Review, print and Word', video: 'export', keywords: 'review score alignment print pdf word docx school template blueprint',
      body: ['The alignment score checks that objectives, activities, assessment and timing all match. Each item says what is wrong and jumps to the fix. If something is fine for your context, press Mark as fine and add a note.', 'Choose a layout: School template (the standard lesson plan format) or Consilia Lesson Blueprint (a one-page visual plan).', 'Print or save as PDF, or Download Word (.docx) to edit in Word, Google Docs or WPS.'] },
    { id: 'week', title: 'Weekly planner and timetable', keywords: 'timetable week planner no class cancelled holiday',
      body: ['Plan → This week. Set up your English timetable once (day, time, class, minutes). Each slot shows whether the lesson is planned, and "Plan this lesson" starts the lesson plan with the class and time filled in.', 'For sports day or a holiday, choose "No class this day…" and Mark no class. Undo brings it back.'] },
    { id: 'my-day', title: 'My day: arrange your day', video: 'attendance-day', keywords: 'my day daily plan arrange order today schedule relief',
      body: ['Plan → My day (or My day on Today) shows one day: your English periods from the timetable, lesson plans dated that day, and anything you add yourself, such as a relief class, a meeting or marking.', 'Drag items, or use ↑ ↓, to put them in the order you want, and tick them off as you go. Each period has Plan this lesson, Teach and Attendance. Notes for the day are kept with it.'],
      tips: ['If you have a yearly plan, My day shows what it says for this week.'] },
    { id: 'yearly-plan', title: 'Yearly, monthly and weekly plans', video: 'yearly-plan', keywords: 'yearly plan rpt rancangan pengajaran tahunan monthly weekly upload scheme of work term calendar',
      body: ['Plan → Yearly plan. Upload your school\'s yearly plan (Rancangan Pengajaran Tahunan) as a Word (.docx), Excel (.xlsx), CSV or PDF file made from Word. Consilia reads the table on this device: weeks, dates, themes and topics, Learning Standards, SoW lesson numbers and holiday or exam weeks, in Malay or English.', 'Check the result, correct anything, choose the classes that follow it and save. No file? Choose "Build it from the Scheme of Work": Consilia lays out the SoW lessons week by week, skipping the holiday weeks you list.', 'Yearly shows every week with this week highlighted. Monthly shows the weeks as a calendar. Weekly shows the week\'s topic, standards and SoW lessons, and matches them to your timetable periods: "Plan lesson 12" opens New lesson plan with the lesson, class and time already chosen.'],
      tips: ['Old .doc or .xls files: open them and "Save as" .docx or .xlsx first.', 'A scanned PDF has no text to read: upload the Word or Excel version instead.'] },
    { id: 'manage', title: 'Copy, duplicate, share and delete lessons', keywords: 'duplicate copy share consilia file import delete',
      body: ['In Plan, each lesson has Duplicate (for another class), Copy, Share and Delete.', 'Share makes a .consilia file you can send on WhatsApp or Drive. It never includes your class or pupil names. A friend opens it with "Import a shared lesson (.consilia)".'] }
  ] },
  { id: 'recommend', title: 'Consilia Recommends and Tools', articles: [
    { id: 'recommend', title: 'Let Consilia plan a lesson', video: 'recommend', keywords: 'recommend ai plan generate activities agentic automatic ideas',
      body: ['Plan → New lesson plan → Consilia recommends (or "Let Consilia plan it" on Today). Choose the class, date and SoW lesson, then answer a few questions about your class: ability, what the pupils are like, what your classroom has (projector, speakers, internet, devices), your key words and target sentence, what matters today, and how much time you have to prepare.',
        'Consilia then plans the whole lesson on your device and shows how it decided: the framework and why, one or two activities for every stage with a step-by-step script, Low / Moderate / High versions, teaching aids (BBM) with pictures and making steps, a digital option that suits your classroom, SMART objectives, assessment and Plan B.',
        'Nothing is sent anywhere: Consilia\'s planning engine uses the KSSR data, the framework rules and more than 80 activities written for primary English.'],
      steps: ['Answer the questions; Consilia remembers them for that class.', 'Read the plan. Press ↻ Another idea on any stage you want to change; the other stages stay as they are.', 'Tick the teaching aids you already have in the preparation checklist.', 'Press Use this plan. It opens in the builder, where you can change anything.'],
      tips: ['Choose "Observation lesson" as a goal for activities with a memorable moment.', 'Without internet, Consilia only suggests activities and digital options that work offline.', 'The plan is a starting point: adapt it to your pupils and check it with your mentor.'] },
    { id: 'tools', title: 'The Tools page', video: 'tools', keywords: 'tools hub magic lesson bar context add to my lesson',
      steps: ['Tell the tools your lesson once: in the bar at the top press "Use my latest lesson plan", choose one of your lesson plans, or type the topic and key words. Every tool fills itself in from it.', 'Use a tool. Results already use your year, topic, words and sentence.', 'Press "＋ Add to my lesson" (activity ideas, chants) or "Use as main objective" to put the result straight into your lesson plan.'],
      tips: ['In the lesson plan builder, "Tools for this step" opens the right tools already filled with that lesson.', 'Search the Tools page by what you need, in English or Malay: "warm-up", "kad imbas", "noisy class", "lagu".', 'New to a tool? Press "Try an example" to see it working before you type anything.'],
      body: ['Tools collects everything besides the lesson plan builder: Consilia recommends, Activity ideas (filter more than 80 activities), Objective writer, Differentiation helper, BBM guide, Worksheet maker, Chant maker, AI prompt builder, Classroom games, Digital tools and Classroom management. All of them work offline except the outside sites you open.'] },
    { id: 'games', title: 'Classroom games on the projector', keywords: 'games wheel spin unjumble mystery quiz projector',
      body: ['Tools → Classroom games, or the Games tool in Teach mode (filled with the lesson\'s key words). Spin wheel picks a word or question; Unjumble mixes your sentences; Mystery word reveals a word letter by letter; Quiz show keeps team scores. Press Full screen for the projector. The words come from the lesson bar. With a keyboard or a presentation clicker: Space spins the wheel, shows the answer or the next letter; → goes to the next item.'] },
    { id: 'bbm', title: 'Teaching aids (BBM) step by step', keywords: 'bbm teaching aids make flashcards puppets dice spinner bahan bantu mengajar',
      body: ['Tools → BBM guide shows 25 cheap teaching aids with a picture, what you need, how to make them step by step, how to use them in class, a time and cost estimate, and safety notes. Filter by use (vocabulary, phonics, stories, assessment…) or "Ready in 10 minutes".'] },
    { id: 'slides', title: 'Lesson slides, PowerPoint, Canva and Google Slides', video: 'slides', keywords: 'slides slaid powerpoint pptx canva google slides presentation projector deck present',
      body: ['Open a lesson plan\'s Materials step and tap Make lesson slides (also Slides in the Plan list, Lesson slides on the Review step, or Tools → Lesson slides). Choose a look. Consilia makes a full deck from the plan on your device: the topic, "I can" goals, warm-up, key words, the target sentence with examples, one slide per activity with pupil steps, the pattern (pairs, groups) and minutes, quick-check questions with answers, a thumbs check and an exit ticket. Your teacher notes are on every slide. Steps written only for the teacher (for example "Follow the Teacher\'s Book") stay in the notes.',
        'Edit any slide (title, lines, answer, notes), move it, duplicate it, delete it or add a new one. Changes are saved with the lesson plan and in backups. "Make again from the plan" starts over after you change the plan.',
        'Present: Present, or the Slides tool in Teach mode, which opens at the current stage. → or Space or a presentation clicker goes on (a question shows its answer first), ← goes back, F is full screen, N shows your notes, Esc stops.',
        'Download PowerPoint (.pptx) works offline. Open it in PowerPoint, or import it into Canva (Create a design → Import file) or Google Slides (upload to Drive, or File → Import slides) to add pictures and animations. On a phone you can send the file straight to the Canva or Google Slides app.'] },
    { id: 'ai', title: 'Improve with AI', keywords: 'ai chatgpt gemini copilot canva prompt',
      body: ['Consilia writes careful prompts for your pupils\' level (Year and CEFR) that you paste into Claude, ChatGPT, Gemini, Copilot or Canva AI: reading or listening texts, comprehension questions, dialogues, worksheets in three levels, songs, flashcard pictures, stories, rubrics, or feedback on your whole plan.', 'Without the AI assistant, Consilia never sends anything itself, and prompts never contain pupils\' names. AI answers can be wrong: check them before using them with pupils, and follow your institute\'s rules on AI.',
        'For slides, copy the slide prompt, paste it into any AI chat (such as the free Claude.ai), then paste the answer into "Paste the AI\'s answer here": a reading text, dialogue, word meanings, examples and questions are added as slides marked AI.'] },
    { id: 'ai-assistant', title: 'AI assistant: Claude (or Gemini) with your own key', keywords: 'claude anthropic ai assistant gemini google api key console credit generate inside app cloud',
      body: ['Consilia works fully without AI. If you want answers inside the app, go to Me → AI assistant. Claude (by Anthropic) is recommended: in the Claude Console add a little credit under Billing (you can set a spend limit), create an API key and paste it. A slide request costs a few sen. Gemini (by Google) is the free alternative, with a key from Google AI Studio. Tap Test the key (for Claude you can choose Opus 5.5, Sonnet 5.5 or Haiku 5.5), read and tick the three agreements, then turn it on.',
        'Then "Add with Claude" on Lesson slides writes a reading or listening text, a dialogue, questions, word meanings or more examples, and places them in the deck (marked AI; "Remove AI slides" takes them out). In the AI prompt builder and Improve with AI, "ask Claude here" shows the answer in Consilia.',
        'What is sent: the lesson\'s year, topic, theme, skill, key words, target sentence and objectives, or the prompt you can see. Never pupils\' names, class names, marks, attendance or your details. Keys stay in this browser only (not in backups or shared lessons); each AI keeps its own key. It needs the internet. Turn it off or remove the keys in Me → AI assistant. No key? Every AI button also copies the prompt for the free Claude.ai chat.'] },
    { id: 'terms', title: 'Terms of use', keywords: 'terms conditions agree responsible',
      body: ['Before first use, every teacher agrees that Consilia is a planning tool: you stay responsible for your lessons, check suggestions and websites before using them, and protect pupils\' privacy. Read them again in Me → Terms of use.'] }
  ] },
  { id: 'teach', title: 'Teaching with Consilia', articles: [
    { id: 'teach-mode', title: 'Teach mode', video: 'teach', keywords: 'teach mode projector clock stages pacing attendance full screen',
      body: ['Press Teach on any lesson. Teach mode is full screen and large enough to project.'],
      steps: ['Take attendance: tap the pupils who are absent.', 'Start the lesson. "Today we will…" shows the success criteria for the class.', 'Use Next and Back to move through the stages. The clock shows time left in each stage and warns gently when you are running over.', 'At the end, choose Record PBD for this lesson or Write my reflection.'],
      tips: ['If the page reloads or the phone locks, Teach mode resumes where you were.', 'Press and hold Exit to leave, so a pupil cannot close it by accident.', 'Background music always pauses in Teach mode.'] },
    { id: 'toolkit', title: 'Classroom toolkit', keywords: 'name picker groups noise meter points attention timer textbook',
      body: ['Name picker: picks a present pupil at random and does not repeat until "Start a new round".', 'Groups: mixed ability or by level, and it respects "Keep apart" and "Keep together" pairs from pupil profiles.', 'Noise: uses the microphone to show a green, amber or red light. Nothing is recorded. If the microphone is not allowed, tap the colours yourself.', 'Points: +1 or − for groups. Attention: a 3-2-1 signal. Timer: quick countdowns. Textbook: opens the pages linked to the lesson. Games: the projector games, filled with the lesson\'s key words.'] },
    { id: 'viewer', title: 'Projecting a textbook page', keywords: 'textbook viewer zoom pen highlighter spotlight answer cover',
      body: ['In the textbook viewer, use zoom, Pen, Highlighter, Spotlight (focus on one part of the page) and Answer cover (drag to reveal answers). Clear ink removes your marks.'] },
    { id: 'reflect', title: 'Reflect after the lesson', keywords: 'reflection what happened next lesson',
      body: ['Write my reflection asks what happened, what worked and what to change, with prompts from your lesson data (time spent per stage, PBD results). Your next lesson for the class can start from it.'] }
  ] },
  { id: 'classes', title: 'Classes, pupils and PBD', articles: [
    { id: 'classes', title: 'Add classes and pupils', video: 'classes-pbd', keywords: 'class pupils names paste excel whatsapp year sk sjk',
      body: ['Classes → choose Year 1 to Year 6 → Add class. Give it a name ("4 Zhong"), school type (SK or SJK) and an optional level.', 'Open the class and paste names, one per line, from Excel, Google Sheets or WhatsApp. Numbers and bullets are removed for you, and duplicate names get a letter (Ali A., Ali B.).'] },
    { id: 'attendance', title: 'Take attendance', video: 'attendance-day', keywords: 'attendance kehadiran register absent late mc present',
      body: ['Classes → your class → Take attendance (or Attendance in My day). Tap P (present), L (late), A (absent) or E (excused, such as MC or school duty) for each pupil, add a reason if you like, then "Everyone else present" marks the rest in one tap. It saves as you go, for any date.', 'Month shows every day recorded with each pupil\'s attendance rate (below 80% is highlighted) and exports to Excel. Copy summary gives a short text for the class teacher. Absences you mark in Teach mode are added too, without changing marks you set.'] },
    { id: 'pbd', title: 'Record PBD (TP1–TP6)', video: 'classes-pbd', keywords: 'pbd tp performance level pentaksiran bilik darjah record',
      body: ['Record TP levels from a class, or from the end of Teach mode. Choose the Learning Standard, then tap TP1 to TP6 for each pupil. "Set everyone to" fills a level for all, then you change the few who differ.', '"What each TP means" shows the official descriptor for that skill and year.'] },
    { id: 'progress', title: 'PBD progress and Excel export', video: 'classes-pbd', keywords: 'pbd progress heatmap suggested level excel export groups',
      body: ['PBD progress shows a heatmap of every pupil and Learning Standard, a suggested overall TP, and suggested groups for differentiation.', 'Export to Excel makes a spreadsheet for your school records.'] },
    { id: 'profile-pupil', title: 'Pupil profiles', keywords: 'pupil profile note keep apart keep together history',
      body: ['Tap a pupil to see their TP history, write a private note (protected by your PIN if set), and set Keep apart or Keep together pairs for grouping.'] }
  ] },
  { id: 'library', title: 'Library and textbooks', articles: [
    { id: 'library', title: 'SoW, DSKP and standards', keywords: 'library sow scheme of work dskp learning standards search',
      body: ['Library holds the full KSSR 2017 Scheme of Work (SK and SJK, Years 1–6), the Learning Standards and TP descriptors. Search everything finds SoW lessons, Learning Standards, SoW tasks, differentiation strategies, activities and Method Guide pages for the year at once.', 'KSSR 2027 is labelled "stay tuned" until the ministry publishes it.'] },
    { id: 'guide', title: 'Method Guide and activity bank', keywords: 'method guide ppp pwp activity bank differentiation strategies',
      body: ['The Method Guide explains when to use PPP, PWP, Process Writing, Task-based learning and Language Arts, with examples.', 'The activity bank has about 70 activities by skill. Insert one into a lesson as a copy; editing it never changes the bank.'] },
    { id: 'textbooks', title: 'Add your textbooks', keywords: 'textbook pdf add shelf page number teacher book students book',
      body: ['Library → Textbooks → Add PDF. Choose your own copy of a student\'s book or teacher\'s book. It stays on this device only.', 'Consilia asks one quick question ("One quick check for this PDF") so printed page numbers match the PDF pages. Then you can open any page by number, unit or topic.'] },
    { id: 'ocr', title: 'Make a scanned textbook searchable', keywords: 'ocr text recognition scanned search textbook',
      body: ['Many textbook PDFs are scans, so their words cannot be searched with "Search the books". On the Textbook Shelf, press Make searchable. Consilia reads each page on your device (nothing is uploaded) and you can keep using the app while it works. It takes a few minutes per book and only happens once.', 'The first time, about 7 MB of text recognition files are downloaded (with internet) and kept for offline use. Press Pause at any time; Continue picks up from the same page, even after closing the app.'] }
  ] },
  { id: 'data', title: 'Your data, backup and privacy', articles: [
    { id: 'backup', title: 'Back up and restore', video: 'backup', keywords: 'backup restore new phone save file merge replace',
      body: ['Me → Backup → Back up now makes one file with your lessons, classes, pupils, PBD, reflections, settings and photos. Keep it in Google Drive, WhatsApp to yourself, or your laptop. Today reminds you each week.', 'To restore, press Restore from a file and choose it. "Add to what is here" adds the backup to what is already on this device; "Replace everything here" makes this device match the backup exactly.', 'Textbook PDFs are not in the backup because they are large. Add them again on a new device.'] },
    { id: 'pin', title: 'PIN lock for pupil data', keywords: 'pin lock encrypt pupil names security',
      body: ['Me → PIN lock for pupil data → Set a PIN. Pupil names and notes are encrypted on the device and in backups. The app locks after 5 minutes away, or press Lock now.', 'A forgotten PIN cannot be recovered by anyone. Remove PIN needs the current PIN.'] },
    { id: 'privacy-art', title: 'Privacy', keywords: 'privacy data pdpa server account',
      body: ['Consilia has no server and no account. Everything stays on your device. Only feedback you choose to send leaves it. Read the full page in Me → Privacy, in English or Bahasa Melayu.'] },
    { id: 'storage', title: 'Storage space', keywords: 'storage full space persisted',
      body: ['Me → Storage shows how much space Consilia uses. Textbooks use the most. If the device is nearly full, remove a textbook you are not using, then make a backup.'] }
  ] },
  { id: 'more', title: 'Settings and more', articles: [
    { id: 'settings', title: 'Language, theme and music', keywords: 'language bahasa melayu dark mode theme music volume',
      body: ['Me → choose English or Bahasa Melayu, and Light, Dark or System theme.', 'Background music has three original R&B instrumentals. It is off until you press play, and pauses when Consilia is in the background or in Teach mode.'] },
    { id: 'mentor', title: 'Mentor and lecturer feedback', keywords: 'mentor lecturer observation feedback patterns',
      body: ['Me → Mentor and lecturer feedback. Log comments after an observation and tag them. Patterns shows what keeps coming up, with links to the Method Guide.'] },
    { id: 'feedback', title: 'Send feedback in the Feedback Garden', keywords: 'feedback garden flower bug idea developer',
      body: ['Me → About and Feedback Garden. Choose a mood, the type (Idea, Bug, Praise or Question), write your message and vote for up to 3 ideas. Each message plants a flower. If you are offline, it is sent when you are back online.'] },
    { id: 'trouble', title: 'Troubleshooting', keywords: 'problem error not working update slow missing',
      body: ['A screen looks old after an update: close Consilia fully and open it again, then accept the update prompt.', 'A textbook will not open: the PDF may have been removed by the browser to free space. Add it again on the Textbook Shelf.', 'Pupil names show "Locked": unlock with your PIN in Me.', 'Something else: tell the developer in the Feedback Garden and choose Bug.'] }
  ] }
];

export interface Hit { chapter: Chapter; article: Article; score: number }
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ');
/** Search titles, keywords and text. Every word must match somewhere; title and keyword matches rank first. */
export function searchManual(q: string, chapters: Chapter[] = MANUAL): Hit[] {
  const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const hits: Hit[] = [];
  for (const chapter of chapters) for (const article of chapter.articles) {
    const title = norm(article.title), keys = norm(article.keywords ?? ''), text = norm([...article.body, ...(article.steps ?? []), ...(article.tips ?? [])].join(' '));
    let score = 0;
    for (const w of words) {
      const s = (title.includes(w) ? 5 : 0) + (keys.includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0);
      if (!s) { score = 0; break; }
      score += s;
    }
    if (score) hits.push({ chapter, article, score });
  }
  return hits.sort((a, b) => b.score - a.score);
}

/** Translations of the manual, by chapter and article id. Missing parts stay in English. */
export interface ManualTranslation { chapters: Record<string, string>; articles: Record<string, Partial<Omit<Article, 'id' | 'video'>>> }
/** The manual in a language: each article translated where a translation exists, keeping the English keywords too. */
export function localManual(tr: ManualTranslation | null): Chapter[] {
  if (!tr) return MANUAL;
  return MANUAL.map((c) => ({ ...c, title: tr.chapters[c.id] ?? c.title, articles: c.articles.map((a) => {
    const x = tr.articles[a.id];
    return x ? { ...a, ...x, keywords: [x.keywords, a.keywords].filter(Boolean).join(' ') } : a;
  }) }));
}
