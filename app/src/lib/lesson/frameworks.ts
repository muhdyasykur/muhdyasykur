import type { FrameworkId } from './model';

/**
 * Lesson frameworks and when to use them. Sources: the PWP/PPP research summary in the blueprint
 * (Ellis 2009; Klapper 2003; Al Bloushi 2024; Qasserras 2025; process-writing studies in Malaysian ESL).
 * Every lesson keeps the SoW shell: Pre-lesson → framework stages (Lesson delivery) → Post-lesson.
 */
export interface StageDef { key: string; title: string; purpose: string; share60: number; share30: number }
export interface Framework { id: FrameworkId; name: string; short: string; summary: string; stages: StageDef[] }

const pre: StageDef = { key: 'pre-lesson', title: 'Pre-lesson', purpose: 'Activate or review prior knowledge in a short, active task.', share60: 5, share30: 3 };
const post: StageDef = { key: 'post-lesson', title: 'Post-lesson', purpose: 'Pupils review and consolidate what they learnt (pupil-led, not a teacher summary).', share60: 5, share30: 3 };

export const FRAMEWORKS: Record<FrameworkId, Framework> = {
  pwp: { id: 'pwp', name: 'PWP (Pre-, While-, Post-)', short: 'PWP', summary: 'For listening and reading: prepare pupils for a text, give tasks while they listen or read, then respond to the same text.', stages: [
    pre,
    { key: 'pre', title: 'Pre-listening / reading', purpose: 'Build interest and set a reason to listen or read. Pre-teach only the words that would block understanding.', share60: 10, share30: 5 },
    { key: 'while', title: 'While-listening / reading', purpose: 'Give the task before the text. Gist first, then detail. Allow more than one exposure.', share60: 22, share30: 11 },
    { key: 'post', title: 'Post-listening / reading', purpose: 'Respond to, personalise or extend the same text, often through the complementary skill.', share60: 15, share30: 8 },
    { ...post, share60: 8, share30: 3 }
  ] },
  ppp: { id: 'ppp', name: 'PPP (Presentation, Practice, Production)', short: 'PPP', summary: 'For a language point (grammar, vocabulary, a speaking phrase): present it in context, practise it with control, then use it freely.', stages: [
    pre,
    { key: 'presentation', title: 'Presentation', purpose: 'Show meaning, form and pronunciation in context. Check with concept-check questions, not "Do you understand?".', share60: 15, share30: 7 },
    { key: 'practice', title: 'Practice', purpose: 'Controlled to guided practice (drills, matching, gap-fill). Focus on accuracy.', share60: 15, share30: 8 },
    { key: 'production', title: 'Production', purpose: 'Freer, meaningful use where pupils choose their own language. Must not repeat the practice task.', share60: 20, share30: 9 },
    post
  ] },
  process: { id: 'process', name: 'Process Writing', short: 'Process', summary: 'For writing: model text, plan, draft, get feedback and improve. Long pieces can span two lessons.', stages: [
    pre,
    { key: 'model', title: 'Pre-writing: model text', purpose: 'Read a model text and notice its features and useful language.', share60: 12, share30: 6 },
    { key: 'planning', title: 'Planning', purpose: 'Pupils plan ideas with a frame, mind map or picture.', share60: 10, share30: 5 },
    { key: 'drafting', title: 'Drafting', purpose: 'Pupils write their first draft with support for their level.', share60: 18, share30: 9 },
    { key: 'revising', title: 'Revising and sharing', purpose: 'Peer or teacher feedback against the success criteria, then improve and share.', share60: 10, share30: 4 },
    post
  ] },
  hybrid: { id: 'hybrid', name: 'PWP with a language focus', short: 'PWP + LF', summary: 'For a textbook text that carries a grammar point: understand the text first, then a short PPP-style focus on language from the text.', stages: [
    pre,
    { key: 'pre', title: 'Pre-listening / reading', purpose: 'Build interest and set a reason to listen or read.', share60: 8, share30: 4 },
    { key: 'while', title: 'While-listening / reading', purpose: 'Tasks for gist then detail.', share60: 17, share30: 8 },
    { key: 'focus', title: 'Language focus', purpose: 'Notice and practise one structure taken from the text.', share60: 12, share30: 6 },
    { key: 'post', title: 'Post-listening / reading', purpose: 'Use the language in a task linked to the text.', share60: 12, share30: 6 },
    { ...post, share60: 6, share30: 3 }
  ] },
  tblt: { id: 'tblt', name: 'Task-based (TBLT)', short: 'TBLT', summary: 'For speaking fluency in Years 4–6: a real task first, then a report and a focus on language that came up.', stages: [
    pre,
    { key: 'pre-task', title: 'Pre-task', purpose: 'Introduce the topic and the task. Give useful words and a model.', share60: 8, share30: 4 },
    { key: 'task-cycle', title: 'Task cycle (task, plan, report)', purpose: 'Pupils do the task in groups, prepare and report to the class.', share60: 25, share30: 12 },
    { key: 'focus', title: 'Language focus', purpose: 'Look at language from the task, then practise it.', share60: 15, share30: 7 },
    { ...post, share60: 7, share30: 4 }
  ] },
  la: { id: 'la', name: 'Language Arts (PWP shape)', short: 'Language Arts', summary: 'For songs, rhymes, poems, stories and drama: enjoy the text, then perform or create.', stages: [
    pre,
    { key: 'pre', title: 'Before the text', purpose: 'Set the scene and key words. Raise interest in the song, poem or story.', share60: 10, share30: 5 },
    { key: 'while', title: 'Enjoying the text', purpose: 'Listen, read, join in, act out.', share60: 20, share30: 10 },
    { key: 'post', title: 'Perform or create', purpose: 'Pupils perform, illustrate or create their own version. The outcome should be creative and enjoyable.', share60: 18, share30: 9 },
    { ...post, share60: 7, share30: 3 }
  ] }
};

export interface Recommendation { id: FrameworkId; reason: string; alternatives: { id: FrameworkId; when: string }[] }

const grammarHint = /\b(tense|modal|should|verb|adjective|adverb|pronoun|preposition|conjunction|question|plural|article|comparative|superlative|have got|can|going to|imperative)\b/i;

/** Recommend a framework from the lesson's main skill, year and language focus (blueprint F07). */
export function recommend(mainSkill: string, year: number, focus = ''): Recommendation {
  const s = mainSkill.toLowerCase();
  if (s.includes('listening') || s.includes('reading')) {
    return { id: 'pwp', reason: `${mainSkill} is a receptive skill. PWP prepares pupils for the text, gives them a task while they listen or read, then lets them respond to it.`,
      alternatives: [{ id: 'hybrid', when: grammarHint.test(focus) ? 'Recommended if you also want to teach the language focus from the text.' : 'If the text carries a grammar point you want to teach.' }] };
  }
  if (s.includes('writing')) {
    if (year <= 2) return { id: 'ppp', reason: 'In Years 1–2, writing is guided: letters, words and short sentences are modelled, practised and then used.', alternatives: [{ id: 'process', when: 'For a longer guided piece across two lessons.' }] };
    return { id: 'process', reason: 'Writing improves through planning, drafting and feedback. The SoW and KPM promote the process approach; writing everything in one go is a common trainee mistake.',
      alternatives: [{ id: 'ppp', when: 'If the lesson is mainly about one sentence pattern (for example should / shouldn\'t).' }] };
  }
  if (s.includes('speaking')) {
    if (year >= 4) return { id: 'ppp', reason: 'Speaking with a target phrase works best when it is presented, practised with control, then used freely.', alternatives: [{ id: 'tblt', when: 'For a fluency lesson built around a real task (Years 4–6).' }] };
    return { id: 'ppp', reason: 'Young learners need the phrase modelled and practised before they use it freely.', alternatives: [] };
  }
  if (s.includes('language arts')) return { id: 'la', reason: 'Language Arts lessons centre on a song, rhyme, poem or story. Pupils enjoy the text, then perform or create.', alternatives: [{ id: 'pwp', when: 'If the lesson is mainly about understanding a story.' }] };
  return { id: 'ppp', reason: 'A language point (grammar, vocabulary or phonics) is best presented, practised and then produced.', alternatives: [{ id: 'hybrid', when: 'If the language comes from a reading or listening text.' }] };
}

/** Stage minutes for a framework and lesson length; always sums exactly to `total`. */
export function defaultMinutes(id: FrameworkId, total: number): number[] {
  const st = FRAMEWORKS[id].stages;
  if (total === 60) return st.map((s) => s.share60);
  if (total === 30) return st.map((s) => s.share30);
  return rescale(st.map((s) => s.share60), total);
}

/** Scale minutes to a new total, keep every stage ≥ 1 minute, and make the sum exact. */
export function rescale(minutes: number[], total: number): number[] {
  const sum = minutes.reduce((a, b) => a + b, 0) || 1;
  const raw = minutes.map((m) => (m / sum) * total);
  const out = raw.map((r) => Math.max(1, Math.floor(r)));
  let diff = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  for (let k = 0; diff > 0; k = (k + 1) % out.length) { out[order[k]]++; diff--; }
  for (let k = 0; diff < 0 && k < out.length * 4; k = (k + 1) % out.length) { const i = order[out.length - 1 - k]; if (out[i] > 1) { out[i]--; diff++; } }
  return out;
}

export interface TimingIssue { level: 'error' | 'warning'; message: string }
const longOk = new Set(['while', 'task-cycle', 'drafting']);
export function checkTiming(stages: { key: string; title: string; minutes: number }[], total: number): TimingIssue[] {
  const issues: TimingIssue[] = [];
  const sum = stages.reduce((a, s) => a + (s.minutes || 0), 0);
  if (sum !== total) issues.push({ level: 'error', message: `Stage times add up to ${sum} min but the lesson is ${total} min (${sum > total ? 'over' : 'under'} by ${Math.abs(sum - total)}).` });
  for (const s of stages) {
    if (!longOk.has(s.key) && s.minutes > total / 2) issues.push({ level: 'warning', message: `${s.title} takes more than half the lesson.` });
    if (s.minutes <= 0) issues.push({ level: 'error', message: `${s.title} has no time.` });
  }
  const postL = stages.find((s) => s.key === 'post-lesson');
  if (postL && postL.minutes < 3 && total >= 30) issues.push({ level: 'warning', message: 'Post-lesson is under 3 minutes. Pupils need time to review their learning.' });
  return issues;
}
