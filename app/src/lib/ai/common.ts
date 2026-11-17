/**
 * Shared by every AI provider (Claude, Gemini): what is sent for lesson slides, and the checks on what comes back.
 * Only lesson content is ever sent: year, topic, theme, skill, key words, target sentence and objectives. Never pupils'
 * names, class names, school names, marks, attendance or the teacher's details.
 */
import { tr } from '../i18n/index.svelte';
import type { Lesson } from '../lesson/model';
import type { AiContent } from '../slides/deck';
import { cefr } from '../recommend/prompts';
import { compose } from '../lesson/objectives';

export type Provider = 'claude' | 'gemini';
export class AiError extends Error { constructor(public kind: 'key' | 'quota' | 'offline' | 'blocked' | 'bad' | 'server', msg: string) { super(msg); } }


/** What is sent for the slides: lesson content only. Pupils, class and school are never included. */
export function lessonBrief(l: Lesson) {
  return {
    year: l.curriculum.year, level: cefr(l.curriculum.year), theme: l.theme, topic: l.topic, mainSkill: l.mainSkill.replace(/[;.,\s]+$/, ''),
    words: l.vocabulary.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean).slice(0, 12), sentence: (l.sentence ?? '').trim(),
    objectives: l.objectives.map(compose).filter(Boolean).slice(0, 3)
  };
}
export const SLIDE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    vocabulary: { type: 'ARRAY', items: { type: 'OBJECT', properties: { word: { type: 'STRING' }, meaning: { type: 'STRING' } }, required: ['word', 'meaning'] } },
    examples: { type: 'ARRAY', items: { type: 'STRING' } },
    text: { type: 'OBJECT', properties: { title: { type: 'STRING' }, body: { type: 'STRING' } }, required: ['title', 'body'] },
    dialogue: { type: 'ARRAY', items: { type: 'STRING' } },
    questions: { type: 'ARRAY', items: { type: 'OBJECT', properties: { q: { type: 'STRING' }, a: { type: 'STRING' } }, required: ['q', 'a'] } }
  },
  required: ['vocabulary', 'examples', 'text', 'dialogue', 'questions']
};
export type SlidePart = 'vocabulary' | 'examples' | 'text' | 'dialogue' | 'questions';
export function slidePrompt(l: Lesson, parts: SlidePart[] = ['vocabulary', 'examples', 'text', 'dialogue', 'questions']): string {
  const b = lessonBrief(l);
  const ask: Record<SlidePart, string> = {
    vocabulary: `vocabulary: each key word with a very simple meaning a Year ${b.year} pupil understands (max 8 words).`,
    examples: `examples: 4 short example sentences using the target sentence${b.sentence ? ` "${b.sentence}"` : ''} and the key words.`,
    text: 'text: a title and a short text (60–120 words, 4–8 short lines separated by new lines) on the topic that uses the key words, for reading or listening.',
    dialogue: 'dialogue: 6–8 lines between A and B, each line starting "A:" or "B:", using the target sentence.',
    questions: 'questions: 4 comprehension or language questions about the text with short answers.'
  };
  return [
    `You write projector slide content for an English lesson in a Malaysian primary school (KSSR, CEFR ${b.level}).`,
    `Year ${b.year}. Theme: ${b.theme || '—'}. Topic: ${b.topic || '—'}. Main skill: ${b.mainSkill || '—'}.`,
    b.words.length ? `Key words: ${b.words.join(', ')}.` : '', b.sentence ? `Target sentence: ${b.sentence}` : '',
    b.objectives.length ? `Objectives: ${b.objectives.join(' ')}` : '',
    'Use simple, correct British English at the pupils\' level, Malaysian names and settings, and nothing unsuitable for children. Return JSON only with:',
    ...parts.map((p) => '- ' + ask[p]),
    'Return an empty array or empty strings for anything not asked for.'
  ].filter(Boolean).join('\n');
}
const str = (x: unknown, max = 300) => (typeof x === 'string' ? x.replace(/\s+\n/g, '\n').trim().slice(0, max) : '');
const arr = (x: unknown) => (Array.isArray(x) ? x : []);
/** Check and trim the AI's answer before it touches the deck. */
export function parseSlideContent(raw: string): AiContent {
  let j: Record<string, unknown>;
  try { j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { throw new AiError('bad', tr('The AI answer could not be read. Try again.')); }
  const out: AiContent = {};
  const vocab = arr(j.vocabulary).map((v) => ({ word: str((v as { word?: unknown })?.word, 40), meaning: str((v as { meaning?: unknown })?.meaning, 120) })).filter((v) => v.word && v.meaning).slice(0, 8);
  if (vocab.length) out.vocabulary = vocab;
  const ex = arr(j.examples).map((x) => str(x, 140)).filter(Boolean).slice(0, 5); if (ex.length) out.examples = ex;
  const t = j.text as { title?: unknown; body?: unknown } | undefined;
  if (t && str(t.body)) out.text = { title: str(t.title, 60) || 'Read', body: str(t.body, 900) };
  const d = arr(j.dialogue).map((x) => str(x, 140)).filter(Boolean).slice(0, 10); if (d.length) out.dialogue = d;
  const q = arr(j.questions).map((x) => ({ q: str((x as { q?: unknown })?.q, 160), a: str((x as { a?: unknown })?.a, 120) })).filter((x) => x.q && x.a).slice(0, 6);
  if (q.length) out.questions = q;
  return out;
}
