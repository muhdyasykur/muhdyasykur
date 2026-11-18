/**
 * Google Gemini, one of the two AI assistants a teacher can connect with their own key (free tier). Requests go straight
 * from the device to Google: Consilia has no server. See common.ts for what is sent.
 */
import { tr } from '../i18n/index.svelte';
import { AiError, SYSTEM_PROMPT } from './common';
export { AiError, slidePrompt, lessonBrief, parseSlideContent, SLIDE_SCHEMA, type SlidePart } from './common';

export const API = 'https://generativelanguage.googleapis.com/v1beta';
export const KEY_PAGE = 'https://aistudio.google.com/app/apikey';
export const FALLBACK_MODEL = 'gemini-flash-latest';

/** Turn a Google error into a plain message with a next step. */
export function explain(status: number, body = ''): AiError {
  if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(body)) return new AiError('key', tr('Google did not accept the key. Copy it again from Google AI Studio and paste it in Me → AI assistant.'));
  if (status === 401 || status === 403) return new AiError('key', tr('Google refused the key. Check it in Me → AI assistant, or make a new key in Google AI Studio.'));
  if (status === 429) return new AiError('quota', tr('The free limit for now is used up. Wait a minute and try again, or try again tomorrow.'));
  if (status === 404) return new AiError('bad', tr('That AI model is not available to your key. In Me → AI assistant, tap "Test the key" to choose another.'));
  if (status >= 500) return new AiError('server', tr('Google\'s AI is busy. Try again in a minute.'));
  return new AiError('bad', tr('The AI request did not work. Try again; the built-in slides are unchanged.'));
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
  } catch { throw new AiError('offline', tr('No internet connection, so the cloud AI cannot be reached. The built-in slides still work offline.')); }
  if (!r.ok) throw explain(r.status, await r.text().catch(() => ''));
  return r.json();
}

/** Checks the key and returns the models it can use for text. */
export async function testKey(key: string, f: typeof fetch = fetch): Promise<{ models: string[]; best: string }> {
  const j = (await call('models?pageSize=200', key, {}, f)) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const models = (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes('generateContent')).map((m) => m.name.replace(/^models\//, '')).filter((m) => m.startsWith('gemini'));
  return { models, best: pickModel(models) };
}

/** One request with the teacher's Gemini key. With a schema the answer is JSON in that shape. */
export async function generate(s: { key: string; model: string }, prompt: string, schema?: object, f: typeof fetch = fetch): Promise<string> {
  if (!s.key) throw new AiError('key', tr('No Gemini key yet. Add one in Me → AI assistant.'));
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096, ...(schema ? { responseMimeType: 'application/json', responseSchema: schema } : {}) }
  };
  const j = (await call(`models/${encodeURIComponent(s.model || FALLBACK_MODEL)}:generateContent`, s.key, { method: 'POST', body: JSON.stringify(body) }, f)) as
    { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string } };
  if (j.promptFeedback?.blockReason) throw new AiError('blocked', tr('Google\'s safety filter stopped this request. Change the topic or words and try again.'));
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new AiError('bad', tr('The AI sent an empty answer. Try again.'));
  return text;
}

