import { describe, it, expect, vi, afterEach } from 'vitest';
import { askText, askSlides, testKey, DEFAULT_MODEL } from './claude';
import { parseSlideContent } from './common';

const KEY = 'sk-ant-test-0123456789abcdefghij';
type Call = { url: string; headers: Headers; body: Record<string, unknown> | null };
function fake(reply: (c: Call) => { status?: number; json: unknown }) {
  const calls: Call[] = [];
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const c: Call = { url, headers: new Headers(init?.headers), body: init?.body ? JSON.parse(String(init.body)) : null };
    calls.push(c);
    const r = reply(c);
    return new Response(JSON.stringify(r.json), { status: r.status ?? 200, headers: { 'content-type': 'application/json', 'request-id': 'req_test' } });
  });
  return calls;
}
const message = (text: string, stop = 'end_turn') => ({
  id: 'msg_test', type: 'message', role: 'assistant', model: DEFAULT_MODEL, stop_reason: stop, stop_sequence: null,
  content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 10 }
});
afterEach(() => vi.unstubAllGlobals());

describe('AI assistant: Claude', () => {
  it('asks Claude Opus 5.5 by default, from the browser, with the key in a header and a fallback on refusal', async () => {
    const calls = fake(() => ({ json: message('Good morning, animal explorers!') }));
    expect(await askText({ key: KEY, model: '' }, 'Say hello')).toBe('Good morning, animal explorers!');
    const c = calls[0];
    expect(c.url).toMatch(/^https:\/\/api\.anthropic\.com\/v1\/messages/);
    expect(c.headers.get('authorization')).toBe(`Bearer ${KEY}`); // the teacher's key, and no other credential
    expect(c.url).not.toContain(KEY);
    expect(c.headers.get('anthropic-dangerous-direct-browser-access')).toBe('true');
    expect(c.headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
    expect(c.body).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default', output_config: { effort: 'low' } });
    expect(String(c.body!.system)).toMatch(/Malaysian primary schools/);
  });
  it('uses the model the teacher chose', async () => {
    const calls = fake(() => ({ json: message('ok') }));
    await askText({ key: KEY, model: 'claude-haiku-5-5' }, 'x');
    expect(calls[0].body!.model).toBe('claude-haiku-5-5');
  });
  it('asks for slide content as JSON in a fixed shape, and the answer passes the checks', async () => {
    const json = { vocabulary: [{ word: 'cat', meaning: 'a small pet' }], examples: ['I have a cat.'], text: { title: 'Pets', body: 'Siti has a cat.' }, dialogue: ['A: Do you have a pet?', 'B: Yes, I have a cat.'], questions: [{ q: 'What does Siti have?', a: 'A cat.' }] };
    const calls = fake(() => ({ json: message(JSON.stringify(json)) }));
    const raw = await askSlides({ key: KEY, model: DEFAULT_MODEL }, 'slides please');
    expect(parseSlideContent(raw)).toEqual(json);
    const fmt = (calls[0].body!.output_config as { format: { type: string; schema: { required: string[] } } }).format;
    expect(fmt.type).toBe('json_schema');
    expect(fmt.schema.required.sort()).toEqual(['dialogue', 'examples', 'questions', 'text', 'vocabulary']);
  });
  it('explains a wrong key, no credit, a refusal and no internet in plain words', async () => {
    fake(() => ({ status: 401, json: { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } } }));
    await expect(askText({ key: KEY, model: '' }, 'x')).rejects.toMatchObject({ kind: 'key' });
    fake(() => ({ status: 400, json: { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } } }));
    await expect(askText({ key: KEY, model: '' }, 'x')).rejects.toThrow(/no credit left/);
    fake(() => ({ json: message('', 'refusal') }));
    await expect(askText({ key: KEY, model: '' }, 'x')).rejects.toMatchObject({ kind: 'blocked' });
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    await expect(askText({ key: KEY, model: '' }, 'x')).rejects.toMatchObject({ kind: 'offline' });
  }, 20000);
  it('tests a key by listing the Claude models it can use', async () => {
    fake(() => ({ json: { data: [{ id: 'claude-opus-5-5', type: 'model', display_name: 'Claude Opus 5.5', created_at: '2026-10-01T00:00:00Z' }, { id: 'claude-haiku-5-5', type: 'model', display_name: 'Claude Haiku 5.5', created_at: '2026-10-01T00:00:00Z' }, { id: 'claude-opus-4-8', type: 'model', display_name: 'Claude Opus 4.8', created_at: '2026-01-01T00:00:00Z' }], has_more: false, first_id: 'a', last_id: 'b' } }));
    expect(await testKey(KEY)).toEqual({ models: ['claude-opus-5-5', 'claude-haiku-5-5'], best: 'claude-opus-5-5' });
  });
});
