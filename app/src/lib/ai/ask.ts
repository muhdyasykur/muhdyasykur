/** One entry point for the app: asks whichever AI assistant the teacher connected. */
import { ai, current } from './settings.svelte';
import { AiError, SLIDE_SCHEMA } from './common';

export async function askText(prompt: string): Promise<string> {
  if (!ai.on) throw new AiError('key', 'The AI assistant is off. Turn it on in Me → AI assistant.');
  if (ai.provider === 'claude') return (await import('./claude')).askText(current(), prompt);
  return (await import('./gemini')).generate(current(), prompt);
}
export async function askSlides(prompt: string): Promise<string> {
  if (!ai.on) throw new AiError('key', 'The AI assistant is off. Turn it on in Me → AI assistant.');
  if (ai.provider === 'claude') return (await import('./claude')).askSlides(current(), prompt);
  return (await import('./gemini')).generate(current(), prompt, SLIDE_SCHEMA);
}
export async function testKey(provider: 'claude' | 'gemini', key: string) {
  return provider === 'claude' ? (await import('./claude')).testKey(key) : (await import('./gemini')).testKey(key);
}
