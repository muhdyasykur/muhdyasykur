import type { Provider } from './common';
import { DEFAULT_MODEL } from './claude-models';
/**
 * The AI assistant settings live in this browser only: never in the database, backups or shared lessons.
 * Claude (Anthropic) is the default; Gemini (Google) is the free alternative. Each keeps its own key and model.
 */
export interface AiSettings { on: boolean; provider: Provider; agreed: number; claude: { key: string; model: string }; gemini: { key: string; model: string } }
export const NO_AI: AiSettings = { on: false, provider: 'claude', agreed: 0, claude: { key: '', model: DEFAULT_MODEL }, gemini: { key: '', model: '' } };
const KEY = 'consilia.ai';
function load(): AiSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (typeof v.key === 'string') return { ...structuredClone(NO_AI), on: !!v.on, provider: 'gemini', agreed: v.agreed ?? 0, gemini: { key: v.key, model: v.model ?? '' } }; // beta.5 (Gemini only)
    return { ...structuredClone(NO_AI), ...v, claude: { ...NO_AI.claude, ...v.claude }, gemini: { ...NO_AI.gemini, ...v.gemini } };
  } catch { return structuredClone(NO_AI); }
}
export const ai = $state<AiSettings>(load());
export function saveAi() { try { localStorage.setItem(KEY, JSON.stringify($state.snapshot(ai))); } catch { /* private mode */ } }
export function forgetAi() { Object.assign(ai, structuredClone(NO_AI)); try { localStorage.removeItem(KEY); } catch { /* fine */ } }
export const current = () => ai[ai.provider];
export const aiReady = () => ai.on && !!current().key && ai.agreed > 0;
export const aiName = () => (ai.provider === 'claude' ? 'Claude' : 'Gemini');
