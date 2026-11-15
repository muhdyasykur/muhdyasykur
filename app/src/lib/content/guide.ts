import type { FrameworkId } from '../lesson/model';

/**
 * Method Guide (blueprint F23): short, practical notes on each framework, objectives and common mistakes.
 * Based on the research summary prepared for Consilia; the skill-to-framework mapping is mainstream TESL
 * methodology, not a KPM rule (say so when you show it to a lecturer).
 */
export interface GuideSection { id: string; title: string; body: string[]; framework?: FrameworkId; pitfalls?: string[] }

export const GUIDE: GuideSection[] = [
  { id: 'shell', title: 'The SoW lesson shell', body: [
    'Every KSSR Scheme of Work lesson has three parts: Pre-lesson, Lesson delivery and Post-lesson. The SoW says the pre- and post-lesson stages should always be included.',
    'Pre-lesson activates or reviews what pupils already know. Post-lesson is for pupils to review and consolidate the learning: they do the reviewing, not only the teacher.',
    'PWP, PPP and the other frameworks sit inside Lesson delivery. Do not mix up the SoW "Pre-lesson" with the PWP "Pre-listening/reading" stage.',
    'Each lesson has one Main Skill and one Complementary Skill. The complementary skill cannot be dropped: give it its own objective and at least one activity.'
  ] },
  { id: 'choose', title: 'Choosing a framework', body: [
    'Listening and Reading (receptive skills): PWP.',
    'Grammar, vocabulary, phonics and a target speaking phrase: PPP. In Years 5–6, Test-Teach-Test can work when pupils partly know the item.',
    'Speaking for fluency in Years 4–6: task-based (pre-task, task cycle, language focus).',
    'Writing: process writing (plan, draft, feedback, improve), often after a model text. Years 1–2 use guided writing in a PPP shape.',
    'Language Arts: a PWP shape where the post-stage is a performance or something pupils create.',
    'A textbook text that carries a grammar point: PWP with a short PPP-style language focus taken from the text.'
  ] },
  { id: 'pwp', framework: 'pwp', title: 'PWP: Pre-, While-, Post-', body: [
    'Pre (about 10 of 60 min): build interest, set a reason to listen or read, and pre-teach only the words that would block understanding.',
    'While (about 20–25 min, the longest): give the task before the text. Gist first, then detail. Let pupils listen or read more than once. Tasks should help understanding, not test memory.',
    'Post (about 10–15 min): respond to the same text: personalise, give an opinion, retell, write a reply. This is often where the complementary skill fits.'
  ], pitfalls: ['A post-stage that starts a new topic or is a generic game.', 'A pre-stage so long that the while-stage has nothing left to do.', 'Playing the recording once with no task set first.'] },
  { id: 'ppp', framework: 'ppp', title: 'PPP: Presentation, Practice, Production', body: [
    'Presentation (10–15 min): show meaning, form and pronunciation in a context. Check understanding with concept-check questions ("Is it good for you? Should you do it?"), not "Do you understand?".',
    'Practice (15–20 min): controlled to guided practice: drills, matching, gap-fill. Focus on accuracy.',
    'Production (15–20 min): pupils use the language freely in a meaningful task (information gap, personal writing, role-play) and choose their own words.'
  ], pitfalls: ['Production that repeats the practice task (more drills or gap-fills).', 'Jumping from presentation straight to free production with no controlled step, especially in Years 1–3.'] },
  { id: 'process', framework: 'process', title: 'Process writing', body: [
    'Model text: read a good example and notice its features and useful language.',
    'Planning: mind map, frame or pictures. Drafting: write with support at the right level.',
    'Revising and sharing: peer or teacher feedback against the success criteria, then improve. Longer pieces can span two lessons.'
  ], pitfalls: ['Writing everything in one go with no planning or feedback (the "product only" habit common among trainees).'] },
  { id: 'tblt', framework: 'tblt', title: 'Task-based lessons', body: [
    'Pre-task: introduce the topic and task, give useful words and show a model.',
    'Task cycle: pupils do the task in groups, plan a short report and present it.',
    'Language focus: look at language that came up in the task, then practise it. Pure task-based teaching gives weaker pupils too little support, so keep the language focus.'
  ] },
  { id: 'abcd', title: 'Objectives: ABCD and SMART', body: [
    'A — Audience: "By the end of the lesson, Year 4 pupils will be able to".',
    'B — Behaviour: one observable verb and what pupils produce ("write 5 sentences using should and shouldn\'t").',
    'C — Condition: the support or material ("based on a picture worksheet").',
    'D — Degree: a number you can check ("with at least 4 correct").',
    'Avoid verbs you cannot see or hear: understand, know, learn, appreciate, be aware of. "With minimal support" cannot be measured; give a number instead.',
    'Turn each objective into an "I can…" success criterion for pupils.'
  ] },
  { id: 'differentiation', title: 'Differentiation', body: [
    'The SoW lists seven strategies: by task, by support, by outcome, by time, by learning preferences, by the questions asked and by feedback. They are in the Library task bank.',
    'Consilia uses three levels: Low (support: frames, word banks, pictures, fewer items), Moderate (the core task) and High (challenge: more items, reasons with "because", less support).',
    'Plan the Moderate version first, then adapt down and up.'
  ] },
  { id: 'mistakes', title: 'Common mistakes the checker looks for', body: [
    'No Pre-lesson or Post-lesson, or a Post-lesson that is only a teacher summary.',
    'A framework that does not fit the main skill (PPP for a reading lesson, PWP with no text).',
    'A complementary skill that is listed but never practised.',
    'Activities that serve no objective, and objectives that no activity serves.',
    'Stage times that do not add up, or one stage taking more than half the lesson.',
    'No differentiation planned.'
  ] }
];

export const SOURCES: string[] = [
  'Kementerian Pendidikan Malaysia. KSSR (Semakan 2017) English Language Scheme of Work and DSKP, Years 1–6.',
  'Ellis, R. (2009). Task-based language teaching: sorting out the misunderstandings. International Journal of Applied Linguistics.',
  'Klapper, J. (2003). Taking communication to task? A critical review of recent trends in language teaching. Language Learning Journal.',
  'Al Bloushi (2024). Stages and aims of a listening lesson.',
  'Qasserras (2025). Pre-, while- and post-listening: a systematic review.',
  'Palpanadan et al. (2019, 2023). Writing approaches among Malaysian ESL teachers and trainees.',
  'Process-based approach to writing in Malaysian English education (PASAA, 2019).',
  'British Council India. BLISS teacher development workbook (reading lesson stages).'
];
