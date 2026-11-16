import { describe, it, expect } from 'vitest';
import { pickModel, explain, testKey, generate, slidePrompt, lessonBrief, parseSlideContent, API } from './gemini';
import { buildLesson } from '../lesson/create';
import { readFileSync } from 'node:fs';
import type { SowFile, Standards } from '../curriculum/types';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
function lesson() {
  const sow = JSON.parse(readFileSync(new URL('sow-y3-sk.json', dir), 'utf8')) as SowFile;
  const std = JSON.parse(readFileSync(new URL('standards-y3.json', dir), 'utf8')) as Standards;
  const l = buildLesson({ mode: 'follow-sow', year: 3, school: 'SK', sow: sow.lessons[4], date: '2026-11-16', start: '09:10', durationMin: 60, pupils: 30 }, std);
  l.header.className = '3 Bestari'; l.vocabulary = 'cat, dog, rabbit'; l.sentence = 'I have a …';
  return l;
}
const on = { on: true, key: 'AIzaTESTKEY-0123456789abcdef', model: 'gemini-9.9-flash', agreed: 1 };
const res = (status: number, body: unknown) => async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

describe('Cloud AI (Gemini)', () => {
  it('picks the newest stable Flash model the key can use', () => {
    expect(pickModel(['models/gemini-2.5-flash', 'models/gemini-3.8-flash', 'models/gemini-3.6-flash', 'models/gemini-3.8-flash-lite', 'models/gemini-4-pro'])).toBe('gemini-3.8-flash');
    expect(pickModel(['gemini-flash-latest', 'gemini-3-flash-preview'])).toBe('gemini-flash-latest');
    expect(pickModel(['gemini-3-flash-preview', 'gemini-3-flash-image'])).toBe('gemini-3-flash-preview');
    expect(pickModel([])).toBe('gemini-flash-latest');
  });
  it('explains errors in plain words', () => {
    expect(explain(400, 'API key not valid. Please pass a valid API key.').kind).toBe('key');
    expect(explain(429).message).toMatch(/free limit/);
    expect(explain(503).kind).toBe('server');
  });
  it('tests a key with the key in a header, not the address', async () => {
    let url = '', headers: Record<string, string> = {};
    const f = (async (u: string, init: RequestInit) => { url = u; headers = init.headers as Record<string, string>; return new Response(JSON.stringify({ models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/text-embedding-9', supportedGenerationMethods: ['embedContent'] }] })); }) as unknown as typeof fetch;
    const r = await testKey(on.key, f);
    expect(r).toEqual({ models: ['gemini-3.8-flash'], best: 'gemini-3.8-flash' });
    expect(url.startsWith(API)).toBe(true);
    expect(url).not.toContain(on.key);
    expect(headers['x-goog-api-key']).toBe(on.key);
  });
  it('refuses to call when Cloud AI is off', async () => {
    await expect(generate({ ...on, on: false }, 'hi', undefined, res(200, {}) as unknown as typeof fetch)).rejects.toThrow(/off/);
  });
  it('sends a JSON schema and returns the text; reports offline and blocked requests', async () => {
    let sent: { generationConfig: { responseMimeType?: string } } | null = null;
    const f = (async (_u: string, init: RequestInit) => { sent = JSON.parse(init.body as string); return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"examples":["I have a cat."]}' }] } }] })); }) as unknown as typeof fetch;
    expect(await generate(on, 'x', { type: 'OBJECT' }, f)).toBe('{"examples":["I have a cat."]}');
    expect(sent!.generationConfig.responseMimeType).toBe('application/json');
    await expect(generate(on, 'x', undefined, (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch)).rejects.toMatchObject({ kind: 'offline' });
    await expect(generate(on, 'x', undefined, res(200, { promptFeedback: { blockReason: 'SAFETY' } }) as unknown as typeof fetch)).rejects.toMatchObject({ kind: 'blocked' });
    await expect(generate(on, 'x', undefined, res(429, 'quota') as unknown as typeof fetch)).rejects.toMatchObject({ kind: 'quota' });
  });
  it('sends only lesson content: no class, school, pupils or teacher', () => {
    const l = lesson();
    const p = slidePrompt(l);
    expect(p).toContain('Year 3'); expect(p).toContain('cat, dog, rabbit'); expect(p).toContain('I have a …');
    expect(p).not.toContain('3 Bestari');
    expect(Object.keys(lessonBrief(l)).sort()).toEqual(['level', 'mainSkill', 'objectives', 'sentence', 'theme', 'topic', 'words', 'year']);
    expect(slidePrompt(l, ['dialogue'])).not.toContain('questions:');
  });
  it('checks and trims the AI answer', () => {
    const c = parseSlideContent('```json\n{"vocabulary":[{"word":"cat","meaning":"a small pet"},{"word":"","meaning":"x"}],"examples":["I have a cat.",5],"text":{"title":"","body":"Siti has a cat."},"dialogue":[],"questions":[{"q":"What does Siti have?","a":"A cat."}],"extra":"ignored"}\n```');
    expect(c).toEqual({ vocabulary: [{ word: 'cat', meaning: 'a small pet' }], examples: ['I have a cat.'], text: { title: 'Read', body: 'Siti has a cat.' }, questions: [{ q: 'What does Siti have?', a: 'A cat.' }] });
    expect(() => parseSlideContent('not json')).toThrow(/could not be read/);
  });
});
