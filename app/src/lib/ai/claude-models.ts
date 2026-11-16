/** Claude models and links, kept apart from claude.ts so the settings page does not load the SDK. */
export const KEY_PAGE = 'https://platform.claude.com/settings/keys';
export const DEFAULT_MODEL = 'claude-opus-5-5';
/** Models a teacher can choose; Claude Opus 5.5 is the default. */
export const CLAUDE_MODELS: { id: string; name: string; about: string }[] = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', about: 'Best quality (recommended)' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', about: 'Faster, about half the cost' },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', about: 'Fastest and cheapest' }
];
export const GEMINI_KEY_PAGE = 'https://aistudio.google.com/app/apikey';
