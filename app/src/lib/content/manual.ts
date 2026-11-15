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
      body: ['The first screen asks for your language, name, practicum school, school type (SK or SJK) and programme. Your name and school appear on printed RPH. Change them any time in Me → Profile.'] },
    { id: 'tour', title: 'Take the guided tour', keywords: 'tour help guide walkthrough',
      body: ['An 8-step tour shows the main screens the first time you use Consilia. Replay it from Me → Help → Replay the guided tour.'] },
    { id: 'nav', title: 'Find your way around', keywords: 'navigation tabs today plan classes library me',
      body: ['Today: this week\'s lessons and your to-do list. Plan: every lesson plan and the weekly planner. Classes: Year 1 to Year 6 classes, pupils and PBD. Library: the SoW, DSKP, Method Guide, activity bank and your textbooks. Me: settings, backup, help, privacy and feedback.', 'The gold "+ New RPH" button starts a lesson plan from anywhere.'] }
  ] },
  { id: 'plan', title: 'Planning a lesson (RPH)', articles: [
    { id: 'new-rph', title: 'Plan your first RPH', video: 'first-rph', keywords: 'new rph lesson plan create start sow',
      body: ['Plan → New RPH. Three short questions set up the plan, then the builder walks you through seven steps. Everything saves as you type.'],
      steps: ['1 · Class and time: choose your class (or type one), the date, start time and length.', '2 · How do you want to start? Pick one of three ways (see below).', '3 · Choose the SoW lesson, then press Create RPH.'],
      tips: ['The score ring at the top shows how well the plan is aligned. Tap it to see what to fix.'] },
    { id: 'modes', title: 'Three ways to start', keywords: 'follow the sow my activities scratch mode',
      body: ['Follow the SoW: everything from the SoW lesson is filled in (standards, outline steps and materials). Improve and expand it.', 'SoW standards, my activities: the Content Standard, Learning Standards, skills and theme come from the SoW, and you design the activities.', 'From scratch: choose your own standards from the DSKP and plan everything yourself.'] },
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
      body: ['List the teaching aids, key vocabulary and appendices. Add textbook pages so they open in Teach mode.', 'Design with Canva AI: Consilia writes a prompt from your lesson. Press Copy prompt, then Open Canva AI and paste it.', 'Find ready-made materials opens searches on Wordwall, Liveworksheets, Quizizz, Kahoot and YouTube. Add any link you use to the lesson; it gets a QR code on the printed RPH.', 'The Materials studio makes printables from your lesson: flashcards, gap-fill and matching worksheets, sentence strips, exit tickets, tiered worksheets and an assessment rubric. Tick "In RPH appendix" to print them with the plan.'] },
    { id: 'planb', title: 'Step 6 · Plan B', keywords: 'plan b backup no projector no electricity early finishers absent',
      body: ['Plan for what often goes wrong: pupils finish early, the lesson runs late, no projector or electricity, a noisy class, many pupils absent. "Suggest for empty cards" fills ideas you can edit.'] },
    { id: 'review', title: 'Step 7 · Review, print and Word', video: 'export', keywords: 'review score alignment print pdf word docx school template blueprint',
      body: ['The alignment score checks that objectives, activities, assessment and timing all match. Each item says what is wrong and jumps to the fix. If something is fine for your context, press Mark as fine and add a note.', 'Choose a layout: School template (the standard RPH format) or Consilia Lesson Blueprint (a one-page visual plan).', 'Print or save as PDF, or Download Word (.docx) to edit in Word, Google Docs or WPS.'] },
    { id: 'week', title: 'Weekly planner and timetable', keywords: 'timetable week planner no class cancelled holiday',
      body: ['Plan → This week. Set up your English timetable once (day, time, class, minutes). Each slot shows whether the lesson is planned, and "Plan this lesson" starts the RPH with the class and time filled in.', 'For sports day or a holiday, choose "No class this day…" and Mark no class. Undo brings it back.'] },
    { id: 'manage', title: 'Copy, duplicate, share and delete lessons', keywords: 'duplicate copy share consilia file import delete',
      body: ['In Plan, each lesson has Duplicate (for another class), Copy, Share and Delete.', 'Share makes a .consilia file you can send on WhatsApp or Drive. It never includes your class or pupil names. A friend opens it with "Import a shared lesson (.consilia)".'] }
  ] },
  { id: 'teach', title: 'Teaching with Consilia', articles: [
    { id: 'teach-mode', title: 'Teach mode', video: 'teach', keywords: 'teach mode projector clock stages pacing attendance full screen',
      body: ['Press ▶ Teach on any lesson. Teach mode is full screen and large enough to project.'],
      steps: ['Take attendance: tap the pupils who are absent.', 'Start the lesson. "Today we will…" shows the success criteria for the class.', 'Use Next and Back to move through the stages. The clock shows time left in each stage and warns gently when you are running over.', 'At the end, choose Record PBD for this lesson or Write my reflection.'],
      tips: ['If the page reloads or the phone locks, Teach mode resumes where you were.', 'Press and hold Exit to leave, so a pupil cannot close it by accident.', 'Background music always pauses in Teach mode.'] },
    { id: 'toolkit', title: 'Classroom toolkit', keywords: 'name picker groups noise meter points attention timer textbook',
      body: ['Name picker: picks a present pupil at random and does not repeat until "Start a new round".', 'Groups: mixed ability or by level, and it respects "Keep apart" and "Keep together" pairs from pupil profiles.', 'Noise: uses the microphone to show a green, amber or red light. Nothing is recorded. If the microphone is not allowed, tap the colours yourself.', 'Points: +1 or − for groups. Attention: a 3-2-1 signal. Timer: quick countdowns. Textbook: opens the pages linked to the lesson.'] },
    { id: 'viewer', title: 'Projecting a textbook page', keywords: 'textbook viewer zoom pen highlighter spotlight answer cover',
      body: ['In the textbook viewer, use zoom, Pen, Highlighter, Spotlight (focus on one part of the page) and Answer cover (drag to reveal answers). Clear ink removes your marks.'] },
    { id: 'reflect', title: 'Reflect after the lesson', keywords: 'reflection what happened next lesson',
      body: ['Write my reflection asks what happened, what worked and what to change, with prompts from your lesson data (time spent per stage, PBD results). Your next lesson for the class can start from it.'] }
  ] },
  { id: 'classes', title: 'Classes, pupils and PBD', articles: [
    { id: 'classes', title: 'Add classes and pupils', video: 'classes-pbd', keywords: 'class pupils names paste excel whatsapp year sk sjk',
      body: ['Classes → choose Year 1 to Year 6 → Add class. Give it a name ("4 Zhong"), school type (SK or SJK) and an optional level.', 'Open the class and paste names, one per line, from Excel, Google Sheets or WhatsApp. Numbers and bullets are removed for you, and duplicate names get a letter (Ali A., Ali B.).'] },
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
export function searchManual(q: string): Hit[] {
  const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  const hits: Hit[] = [];
  for (const chapter of MANUAL) for (const article of chapter.articles) {
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
