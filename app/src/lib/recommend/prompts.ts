/**
 * "Improve with AI": Consilia writes the prompt, the teacher chooses to paste it into ChatGPT, Gemini, Copilot or
 * Canva AI. Nothing is sent by Consilia itself, and prompts never contain pupils' names.
 */
import type { Plan, Brief } from './engine';
import { compose } from '../lesson/objectives';
import type { Objective } from '../lesson/model';

export const AI_SITES = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app' },
  { id: 'copilot', name: 'Copilot', url: 'https://copilot.microsoft.com/' },
  { id: 'canva', name: 'Canva AI', url: 'https://www.canva.com/ai' }
] as const;

/** KSSR primary English is aligned to CEFR: roughly Pre-A1 (Years 1–2), A1 (Years 3–4), A1–A2 (Years 5–6). */
export const cefr = (year: number) => (year <= 2 ? 'Pre-A1' : year <= 4 ? 'A1' : 'A1 to A2');
const ages = (year: number) => `${year + 6}–${year + 7}`;
const RULES = (year: number) => [
  `Pupils are Year ${year} (aged ${ages(year)}) in a Malaysian primary school learning English as a second language, CEFR ${cefr(year)}.`,
  'Use simple, natural British English at that level, short sentences and familiar Malaysian contexts (names, food, places, festivals) that respect all cultures and religions.',
  'Do not include real pupils\' names or personal data. Keep everything age-appropriate.'
];

export type PromptKind = 'improve' | 'text' | 'questions' | 'dialogue' | 'worksheet' | 'song' | 'images' | 'story' | 'rubric' | 'differentiate';
export const PROMPT_KINDS: { id: PromptKind; title: string; about: string }[] = [
  { id: 'improve', title: 'Improve my lesson plan', about: 'Get feedback and more creative ideas for every stage.' },
  { id: 'text', title: 'Reading or listening text', about: 'A short text at the right level, using your key words.' },
  { id: 'questions', title: 'Comprehension questions', about: 'Literal and inferential questions with answers, in three levels.' },
  { id: 'dialogue', title: 'Dialogue or role-play', about: 'A model dialogue and role cards for pairs.' },
  { id: 'worksheet', title: 'Worksheet (three levels)', about: 'Low, moderate and high versions with an answer key.' },
  { id: 'song', title: 'Song or chant', about: 'A catchy chant to a well-known tune, with actions.' },
  { id: 'images', title: 'Flashcard pictures', about: 'Image prompts for Canva AI or an image generator.' },
  { id: 'story', title: 'Short story', about: 'A story with a clear problem and ending for Language Arts.' },
  { id: 'rubric', title: 'Rubric and checklist', about: 'A pupil-friendly checklist and a teacher rubric for PBD.' },
  { id: 'differentiate', title: 'Differentiate an activity', about: 'Easier and harder versions of one activity.' }
];

export interface PromptInput { year: number; topic: string; skill: string; words: string[]; sentence: string; minutes?: number; extra?: string }

export function buildPrompt(kind: PromptKind, i: PromptInput): string {
  const words = i.words.length ? i.words.join(', ') : '(choose 6–8 words that suit the topic)';
  const ctx = [...RULES(i.year), `Topic: ${i.topic || 'not set'}. Skill focus: ${i.skill || 'not set'}. Key words: ${words}.${i.sentence ? ` Target structure: "${i.sentence}".` : ''}`];
  const ask: Record<PromptKind, string> = {
    improve: `Act as an experienced TESL mentor. Review the lesson plan below. For each stage, keep what works, then suggest one more creative but realistic idea a trainee can run with little preparation. Point out any objective that is not measurable. Answer in a short table.${i.extra ? `\n\nLESSON PLAN\n${i.extra}` : ''}`,
    text: `Write a ${i.year <= 2 ? '60–80' : i.year <= 4 ? '100–130' : '150–180'}-word ${i.skill === 'Listening' ? 'listening script (a short dialogue or announcement)' : 'reading text'} about the topic, using all the key words at least once. Give it a title. Then list the key words with a child-friendly meaning.`,
    questions: 'Write 6 comprehension questions for the text I will paste below: 2 easy (find the answer in the text), 2 moderate, 2 challenging (why/how, opinion). Give a Low version as multiple choice, a Moderate version as short answer, and the answer key.\n\nTEXT:\n(paste the text here)',
    dialogue: 'Write a model dialogue of 6–8 turns between two children using the target structure, then two role cards (A and B) with prompts only, so pupils make their own dialogue.',
    worksheet: 'Make one worksheet in three versions. Low: picture-supported matching or gap-fill with a word bank. Moderate: gap-fill without a word bank and 2 sentences to write. High: 4 sentences or a short paragraph with a reason. Include clear instructions and an answer key. Format it so I can copy it into Canva or Word.',
    song: 'Write a short chant or song (2 verses and a chorus) to the tune of a well-known children\'s song, using the key words and the target structure. Add a simple action for each line.',
    images: 'Write one image-generation prompt for each key word, for flashcards: a single clear object or action, bright flat illustration style, white background, no text, child-friendly, Malaysian context where it fits. Number them.',
    story: 'Write a short story (150–200 words) with a child character, a problem and a happy ending, using the key words. Then give 4 story-map questions (characters, setting, problem, ending) and an idea for a creative follow-up task.',
    rubric: `Write a pupil-friendly checklist of 3–4 "I can" statements and a teacher rubric with performance levels TP1 to TP6 for the skill focus, in the style of the KSSR DSKP.${i.extra ? ` The objectives are: ${i.extra}` : ''}`,
    differentiate: `Make three versions of this activity: Low (with support such as pictures, a word bank or a sentence frame), Moderate, and High (more challenge, a reason or an extension). Keep the same learning goal.${i.extra ? `\n\nACTIVITY: ${i.extra}` : '\n\nACTIVITY: (describe the activity here)'}`
  };
  return [...ctx, '', ask[kind]].join('\n');
}

/** The whole recommended lesson as text, for "Improve my lesson plan". */
export function planAsText(plan: Plan, b: Brief, objectives: Objective[]): string {
  const lines = [`Year ${b.year} English, ${b.durationMin} minutes, framework ${plan.frameworkName}.`, 'Objectives:', ...objectives.map((o) => `- ${compose(o)}`), 'Stages:'];
  for (const s of plan.stages) for (const x of s.picks) lines.push(`- ${s.title} (${x.minutes} min): ${x.recipe.title}. Teacher: ${x.teacher} Pupils: ${x.pupils}`);
  lines.push(`Assessment: ${plan.evidence}; ${plan.method}.`);
  return lines.join('\n');
}
