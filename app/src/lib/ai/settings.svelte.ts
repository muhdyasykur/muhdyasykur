import { NO_AI, type AiSettings } from './gemini';
/** Cloud AI settings live in this browser only: never in the database, backups or shared lessons. */
const KEY = 'consilia.ai';
function load(): AiSettings { try { return { ...NO_AI, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...NO_AI }; } }
export const ai = $state<AiSettings>(load());
export function saveAi() { try { localStorage.setItem(KEY, JSON.stringify($state.snapshot(ai))); } catch { /* private mode */ } }
export function forgetAi() { Object.assign(ai, NO_AI); try { localStorage.removeItem(KEY); } catch { /* fine */ } }
export const aiReady = () => ai.on && !!ai.key && ai.agreed > 0;
