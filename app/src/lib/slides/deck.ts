/**
 * Lesson slides (milestone 10): a full, pupil-facing deck built from the lesson plan on the device. Every slide has
 * teacher notes taken from the plan. Optional AI content (see ai.ts) can be merged in. No pupil data is ever used.
 */
import type { Lesson } from '../lesson/model';
import { criteria, longDate } from '../lesson/derive';
import { frameWith } from '../recommend/chant';
import { uid } from '../lesson/model';

export type SlideKind = 'title' | 'goals' | 'warmup' | 'words' | 'pattern' | 'text' | 'dialogue' | 'activity' | 'question' | 'criteria' | 'exit' | 'end';
export interface Slide { id: string; kind: SlideKind; title: string; lines: string[]; notes: string; stage?: string; minutes?: number; pattern?: string; answer?: string; ai?: boolean }
export type Theme = 'consilia' | 'bright' | 'calm';
export interface Deck { theme: Theme; slides: Slide[]; updatedAt: number; aiAt?: number }

export const THEMES: Record<Theme, { name: string; bg: string; ink: string; accent: string; card: string; title: string }> = {
  consilia: { name: 'Consilia navy', bg: '#13294B', ink: '#FFFFFF', accent: '#E2BC4F', card: '#1E3A66', title: '#FFFFFF' },
  bright: { name: 'Bright classroom', bg: '#FFF7E6', ink: '#1E2B40', accent: '#E2574C', card: '#FFFFFF', title: '#2B4E86' },
  calm: { name: 'Calm green', bg: '#EEF6F0', ink: '#1E2B40', accent: '#3E9B6A', card: '#FFFFFF', title: '#245C3E' }
};
export const PATTERN_LABEL: Record<string, string> = { pairs: '👫 In pairs', groups: '👥 In groups', individual: '🧑 On your own', 'whole-class': '🏫 Whole class', 'T-P': '🏫 Whole class', 'P-P': '👫 In pairs' };

const words = (l: Lesson) => l.vocabulary.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean).slice(0, 12);
/** Teacher wording ("Pupils walk around…", "They ask…") → short instructions for pupils. */
export function pupilSteps(text: string): string[] {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+|;\s+|,\s+then\s+/i)
    .map((s) => s.trim().replace(/^(pupils|they|the class|learners|students)\s+/i, '').replace(/^\w/, (c) => c.toUpperCase()).replace(/[.;]+$/, ''))
    .map((s) => s.replace(/\btheir\b/gi, 'your').replace(/\bthemselves\b/gi, 'yourselves').replace(/\bthey\b/gi, 'you'))
    .filter((s) => s.length > 2).slice(0, 5);
}
/** What pupils see when the plan only has the teacher's steps (for example a lesson copied from the SoW). */
export const STAGE_PROMPT: Record<string, string[]> = {
  'pre-lesson': ['Let\'s get ready!'], 'post-lesson': ['What did you learn today?'],
  pre: ['What do you think it is about?', 'Look at the pictures.'], while: ['Listen or read carefully.', 'Find the answers.'], post: ['Your turn!'],
  presentation: ['Look and listen.'], practice: ['Let\'s practise!'], production: ['Your turn: use the new language.'],
  model: ['Read the example.', 'What do you notice?'], planning: ['Plan your ideas.'], drafting: ['Write your first draft.'], revising: ['Check, improve and share.'],
  focus: ['Look at the language.', 'Let\'s practise it.'], 'pre-task': ['Here is your task.'], 'task-cycle': ['Do the task, plan, then report.']
};
const s = (kind: SlideKind, title: string, lines: string[], notes = '', extra: Partial<Slide> = {}): Slide => ({ id: uid(), kind, title, lines, notes, ...extra });

export function buildDeck(l: Lesson, theme: Theme = 'consilia'): Deck {
  const W = words(l);
  const sentence = (l.sentence ?? '').trim();
  const crit = criteria(l).map((c) => c.text).filter(Boolean);
  const out: Slide[] = [];
  out.push(s('title', l.topic || 'English lesson', [`Year ${l.curriculum.year}${l.header.className ? ` · ${l.header.className}` : ''}`, longDate(l.header.date), l.theme].filter(Boolean), `Greet the class. Theme: ${l.theme || '—'}.`));
  if (crit.length) out.push(s('goals', 'Today we will…', crit, 'Read the "I can" statements together. Come back to them at the end of the lesson.'));
  const stages = l.stages;
  const warm = stages[0]?.activities.find((a) => a.teacher || a.pupils);
  if (warm) out.push(s('warmup', 'Warm-up', warm.pupils ? pupilSteps(warm.pupils) : STAGE_PROMPT['pre-lesson'], [warm.teacher, warm.tiers.low && `Low: ${warm.tiers.low}`].filter(Boolean).join('\n'), { stage: stages[0].title, minutes: stages[0].minutes, pattern: warm.pattern }));
  if (W.length) out.push(s('words', 'Key words', W, 'Say each word; pupils repeat. Point to a picture or the real object if you have one.'));
  const blank = /…|\.\.\.|_{2,}/.test(sentence);
  if (sentence) {
    const ex = (blank ? W.slice(0, 3) : []).map((w) => frameWith(sentence, w).replace(/^\w/, (c) => c.toUpperCase()) + '.');
    out.push(s('pattern', 'Let\'s say it', [sentence, ...ex], 'Model the sentence, then pupils say each example in chorus, rows, then individuals.'));
  }
  for (const st of stages.slice(1, -1)) {
    const acts = st.activities.filter((x) => x.teacher || x.pupils);
    if (acts.length && acts.every((a) => !a.pupils)) { // teacher steps only: one slide for the stage, the steps in the notes
      out.push(s('activity', st.title, STAGE_PROMPT[st.key] ?? ['Let\'s go!'], acts.map((a) => a.teacher).join('\n'), { stage: st.title, minutes: st.minutes, pattern: acts.find((a) => a.pattern)?.pattern }));
      continue;
    }
    for (const a of acts.filter((x) => x.pupils)) {
      const name = (a.source ?? '').replace(/^(Consilia Recommends|Tools):\s*/, '').replace(/^SoW step \d+$/, '');
      out.push(s('activity', name || st.title, pupilSteps(a.pupils), [a.teacher, a.tiers.low && `Low: ${a.tiers.low}`, a.tiers.high && `High: ${a.tiers.high}`, a.aids && `Aids: ${a.aids}`].filter(Boolean).join('\n'),
        { stage: st.title, minutes: st.minutes, pattern: a.pattern }));
    }
  }
  if (blank && W.length) {
    for (const w of W.slice(3, 6).length ? W.slice(3, 6) : W.slice(0, 2)) out.push(s('question', 'Quick check', [frameWith(sentence, '______').replace(/^\w/, (c) => c.toUpperCase()) + '.', `(${w})`], 'Pupils answer on mini whiteboards or say it to a partner, then reveal.', { answer: frameWith(sentence, w).replace(/^\w/, (c) => c.toUpperCase()) + '.' }));
  }
  if (crit.length) out.push(s('criteria', 'How did we do?', crit.map((c) => `${c}  👍 👌 👎`), 'Pupils show thumbs for each statement. Note who shows thumbs down for the next lesson.'));
  const post = stages[stages.length - 1]?.activities.find((a) => a.teacher || a.pupils);
  out.push(s('exit', post ? 'Before you go' : 'Exit ticket', post ? (post.pupils ? pupilSteps(post.pupils) : STAGE_PROMPT['post-lesson']) : [sentence ? `Write one sentence: ${sentence}` : 'Write one new word you learnt today and use it in a sentence.'], post?.teacher ?? 'Collect the tickets at the door.', { stage: stages[stages.length - 1]?.title, minutes: stages[stages.length - 1]?.minutes }));
  out.push(s('end', 'Well done!', [`Thank you, Year ${l.curriculum.year}!`], 'Praise one specific thing the class did well today.'));
  return { theme, slides: out, updatedAt: Date.now() };
}

/** Content from AI (or typed by the teacher) added to the deck in the right places. */
export interface AiContent { text?: { title: string; body: string }; examples?: string[]; questions?: { q: string; a: string }[]; dialogue?: string[]; vocabulary?: { word: string; meaning: string }[] }
export function mergeAi(d: Deck, c: AiContent): Deck {
  const slides = d.slides.filter((x) => !x.ai);
  const at = (kind: SlideKind) => { const i = slides.map((x) => x.kind).lastIndexOf(kind); return i < 0 ? -1 : i; };
  const insertAfter = (kinds: SlideKind[], add: Slide[]) => { let i = -1; for (const k of kinds) i = Math.max(i, at(k)); slides.splice(i + 1, 0, ...add); };
  if (c.vocabulary?.length) insertAfter(['words', 'warmup', 'goals', 'title'], [s('words', 'What do they mean?', c.vocabulary.slice(0, 8).map((v) => `${v.word} — ${v.meaning}`), 'Check meaning with a gesture or picture for each word.', { ai: true })]);
  if (c.examples?.length) insertAfter(['pattern', 'words'], [s('pattern', 'More examples', c.examples.slice(0, 5), 'Read each example; pupils repeat, then make their own.', { ai: true })]);
  if (c.text?.body) insertAfter(['pattern', 'words', 'warmup'], [s('text', c.text.title || 'Read', c.text.body.split(/\n+/).filter(Boolean), 'Read aloud once while pupils follow, then let pupils read in pairs.', { ai: true })]);
  if (c.dialogue?.length) insertAfter(['text', 'pattern', 'words'], [s('dialogue', 'Dialogue', c.dialogue.slice(0, 10), 'Model with a pupil, then pairs practise and swap roles.', { ai: true })]);
  if (c.questions?.length) insertAfter(['activity', 'question'], c.questions.slice(0, 6).map((q) => s('question', 'Quick check', [q.q], 'Pupils answer, then reveal.', { answer: q.a, ai: true })));
  return { ...d, slides, aiAt: Date.now(), updatedAt: Date.now() };
}
