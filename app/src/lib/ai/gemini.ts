/**
 * Optional cloud AI (Google Gemini) with the teacher's own free API key. Off until the teacher turns it on and agrees
 * to the notice. Only lesson content is sent (year, topic, skill, key words, target sentence, objectives); never pupils'
 * names, class names, school names or the teacher's details. The key stays in this browser only (not in backups or
 * shared lessons). Requests go straight from the device to Google: Consilia has no server.
 */
import type { Lesson } from '../lesson/model';
import type { AiContent } from '../slides/deck';
import { cefr } from '../recommend/prompts';
import { compose } from '../lesson/objectives';

export const API = 'https://generativelanguage.googleapis.com/v1beta';
export const KEY_PAGE = 'https://aistudio.google.com/app/apikey';
export const FALLBACK_MODEL = 'gemini-flash-latest';
export const AI_NOTICE_VERSION = 1;

export interface AiSettings { on: boolean; key: string; model: string; agreed: number }
export const NO_AI: AiSettings = { on: false, key: '', model: '', agreed: 0 };

export class AiError extends Error { constructor(public kind: 'key' | 'quota' | 'offline' | 'blocked' | 'bad' | 'server', msg: string) { super(msg); } }

/** Turn a Google error into a plain message with a next step. */
export function explain(status: number, body = ''): AiError {
  if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(body)) return new AiError('key', 'Google did not accept the key. Copy it again from Google AI Studio and paste it in Me → Cloud AI.');
  if (status === 401 || status === 403) return new AiError('key', 'Google refused the key. Check it in Me → Cloud AI, or make a new key in Google AI Studio.');
  if (status === 429) return new AiError('quota', 'The free limit for now is used up. Wait a minute and try again, or try again tomorrow.');
  if (status === 404) return new AiError('bad', 'That AI model is not available to your key. In Me → Cloud AI, tap "Test the key" to choose another.');
  if (status >= 500) return new AiError('server', 'Google\'s AI is busy. Try again in a minute.');
  return new AiError('bad', 'The AI request did not work. Try again; the built-in slides are unchanged.');
}

/** The newest stable Flash model the key can use (names change over time, so it is discovered, not fixed). */
export function pickModel(names: string[]): string {
  const n = names.map((x) => x.replace(/^models\//, ''));
  const ver = (x: string) => (x.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? '0').split('.').map(Number);
  const newer = (a: string, b: string) => { const [x, y] = [ver(a), ver(b)]; return (y[0] - x[0]) || ((y[1] ?? 0) - (x[1] ?? 0)); };
  const stable = n.filter((x) => /^gemini-\d+(\.\d+)?-flash$/.test(x)).sort(newer);
  if (stable[0]) return stable[0];
  if (n.includes(FALLBACK_MODEL)) return FALLBACK_MODEL;
  const any = n.filter((x) => /flash/.test(x) && !/lite|image|tts|live|audio|thinking|embed/.test(x)).sort(newer);
  return any[0] ?? FALLBACK_MODEL;
}

async function call(path: string, key: string, init: RequestInit = {}, f: typeof fetch = fetch): Promise<unknown> {
  let r: Response;
  try {
    r = await f(`${API}/${path}`, { ...init, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, ...(init.headers ?? {}) }, referrerPolicy: 'no-referrer', credentials: 'omit' });
  } catch { throw new AiError('offline', 'No internet connection, so the cloud AI cannot be reached. The built-in slides still work offline.'); }
  if (!r.ok) throw explain(r.status, await r.text().catch(() => ''));
  return r.json();
}

/** Checks the key and returns the models it can use for text. */
export async function testKey(key: string, f: typeof fetch = fetch): Promise<{ models: string[]; best: string }> {
  const j = (await call('models?pageSize=200', key, {}, f)) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const models = (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes('generateContent')).map((m) => m.name.replace(/^models\//, '')).filter((m) => m.startsWith('gemini'));
  return { models, best: pickModel(models) };
}

/** One request. With a schema the answer is JSON in that shape. */
export async function generate(s: AiSettings, prompt: string, schema?: object, f: typeof fetch = fetch): Promise<string> {
  if (!s.on || !s.key) throw new AiError('key', 'Cloud AI is off. Turn it on in Me → Cloud AI.');
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096, ...(schema ? { responseMimeType: 'application/json', responseSchema: schema } : {}) }
  };
  const j = (await call(`models/${encodeURIComponent(s.model || FALLBACK_MODEL)}:generateContent`, s.key, { method: 'POST', body: JSON.stringify(body) }, f)) as
    { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  if (j.promptFeedback?.blockReason) throw new AiError('blocked', 'Google\'s safety filter stopped this request. Change the topic or words and try again.');
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new AiError('bad', 'The AI sent an empty answer. Try again.');
  return text;
}

// ---------- lesson slides

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
  try { j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '')); } catch { throw new AiError('bad', 'The AI answer could not be read. Try again.'); }
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
