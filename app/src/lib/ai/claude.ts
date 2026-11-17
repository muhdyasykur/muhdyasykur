/**
 * Claude (Anthropic), the recommended AI assistant, with the teacher's own API key. Requests go straight from the
 * device to Anthropic with the official SDK: Consilia has no server. The SDK is loaded only when Claude is used.
 * See common.ts for what is sent (lesson content only, never pupils' names).
 */
import { tr } from '../i18n/index.svelte';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { AiError } from './common';

import { DEFAULT_MODEL, CLAUDE_MODELS } from './claude-models';
export { DEFAULT_MODEL, CLAUDE_MODELS, KEY_PAGE } from './claude-models';
const SYSTEM = 'You help trainee English teachers in Malaysian primary schools (KSSR, CEFR-aligned) prepare lessons. Write simple, correct British English at the pupils\' level, with Malaysian names and settings that respect all cultures and religions, and nothing unsuitable for children. Never ask for or include personal data about pupils.';

async function client(key: string): Promise<Anthropic> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // The key is the teacher's own and is kept on their device; the browser talks to Anthropic directly.
  return new Anthropic({ apiKey: key, authToken: null, dangerouslyAllowBrowser: true, maxRetries: 2, timeout: 90_000 });
}

/** Turn an SDK error into a plain message with a next step. */
async function explain(e: unknown): Promise<AiError> {
  const { default: A } = await import('@anthropic-ai/sdk');
  if (e instanceof AiError) return e;
  if (e instanceof A.AuthenticationError) return new AiError('key', tr('Anthropic did not accept the key. Copy it again from the Claude Console and paste it in Me → AI assistant.'));
  if (e instanceof A.PermissionDeniedError) return new AiError('key', tr('This key is not allowed to use Claude. Check the key and your Console workspace.'));
  if (e instanceof A.NotFoundError) return new AiError('bad', tr('That Claude model is not available to your key. Choose another model in Me → AI assistant.'));
  if (e instanceof A.RateLimitError) return new AiError('quota', tr('Too many requests for now. Wait a minute and try again.'));
  if (e instanceof A.BadRequestError) return /credit|billing|balance/i.test(e.message)
    ? new AiError('quota', tr('Your Anthropic account has no credit left. Add credit in the Claude Console (Billing), then try again.'))
    : new AiError('bad', tr('Claude could not take this request. Try again; the built-in slides are unchanged.'));
  if (e instanceof A.APIConnectionError) return new AiError('offline', tr('Claude cannot be reached: check the internet connection. The built-in slides still work offline.'));
  if (e instanceof A.APIError) return new AiError('server', tr('Claude is busy. Try again in a minute.'));
  return new AiError('bad', tr('The AI request did not work. Try again.'));
}

/** Checks the key; returns the Claude models it can use. */
export async function testKey(key: string): Promise<{ models: string[]; best: string }> {
  try {
    const c = await client(key);
    const models: string[] = [];
    for await (const m of c.models.list()) models.push(m.id);
    const ours = CLAUDE_MODELS.map((m) => m.id).filter((id) => models.includes(id));
    return { models: ours.length ? ours : [DEFAULT_MODEL], best: ours.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : (ours[0] ?? DEFAULT_MODEL) };
  } catch (e) { throw await explain(e); }
}

/** Shared request options: light thinking for quick answers, and Anthropic's own fallback model if Claude declines. */
const common = (model: string) => ({
  model, max_tokens: 16000,
  system: SYSTEM,
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default' as const
});
function refused(stop: string | null) {
  if (stop === 'refusal') throw new AiError('blocked', tr('Claude declined this request. Change the topic or words and try again.'));
  if (stop === 'max_tokens') throw new AiError('bad', tr('The answer was too long and was cut off. Ask for less and try again.'));
}

/** A text answer to any prompt (the AI prompt builder, Improve with AI). */
export async function askText(s: { key: string; model: string }, prompt: string): Promise<string> {
  try {
    const c = await client(s.key);
    const r = await c.beta.messages.create({ ...common(s.model || DEFAULT_MODEL), output_config: { effort: 'low' }, messages: [{ role: 'user', content: prompt }] });
    refused(r.stop_reason);
    const text = r.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
    if (!text) throw new AiError('bad', tr('Claude sent an empty answer. Try again.'));
    return text;
  } catch (e) { throw await explain(e); }
}

/** The shape asked for slide content; checked again by parseSlideContent before it reaches the deck. */
export const SlideContent = z.object({
  vocabulary: z.array(z.object({ word: z.string(), meaning: z.string() })),
  examples: z.array(z.string()),
  text: z.object({ title: z.string(), body: z.string() }),
  dialogue: z.array(z.string()),
  questions: z.array(z.object({ q: z.string(), a: z.string() }))
});

/** Slide content as JSON (structured output), returned as a string for parseSlideContent. */
export async function askSlides(s: { key: string; model: string }, prompt: string): Promise<string> {
  try {
    const { betaZodOutputFormat } = await import('@anthropic-ai/sdk/helpers/beta/zod');
    const c = await client(s.key);
    const r = await c.beta.messages.parse({ ...common(s.model || DEFAULT_MODEL), output_config: { effort: 'low', format: betaZodOutputFormat(SlideContent) }, messages: [{ role: 'user', content: prompt }] });
    refused(r.stop_reason);
    if (!r.parsed_output) throw new AiError('bad', tr('Claude\'s answer could not be read. Try again.'));
    return JSON.stringify(r.parsed_output);
  } catch (e) { throw await explain(e); }
}
