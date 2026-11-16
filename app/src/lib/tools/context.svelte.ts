import type { Lesson } from '../lesson/model';
import { skillOfLs } from '../lesson/objectives';
import { compose } from '../lesson/objectives';

/**
 * The lesson the tools are working for. Typed once (or taken from an RPH) and shared by every tool, so the teacher
 * never retypes the year, topic, key words or sentence. Remembered on this device.
 */
export interface ToolContext { year: number; skill: string; topic: string; words: string; sentence: string; lessonId: string; lessonLabel: string; objectives: string }
const EMPTY: ToolContext = { year: 4, skill: 'Speaking', topic: '', words: '', sentence: '', lessonId: '', lessonLabel: '', objectives: '' };
function load(): ToolContext { try { return { ...EMPTY, ...JSON.parse(localStorage.getItem('consilia.toolctx') || '{}') }; } catch { return { ...EMPTY }; } }
export const ctx = $state<ToolContext>(load());
export function saveCtx() { try { localStorage.setItem('consilia.toolctx', JSON.stringify($state.snapshot(ctx))); } catch { /* fine */ } }
export const ctxWords = () => ctx.words.split(/[,;\n]+/).map((w) => w.trim()).filter(Boolean);
export const hasCtx = () => !!(ctx.topic.trim() || ctx.words.trim());

/** Fill the context from an RPH. */
export function fromLesson(l: Lesson) {
  Object.assign(ctx, {
    year: l.curriculum.year, skill: skillOfLs(l.standards.main.ls) || l.mainSkill.replace(/[;.,\s]+$/, '') || ctx.skill,
    topic: l.topic, words: l.vocabulary, sentence: l.sentence ?? '', lessonId: l.id,
    lessonLabel: [l.header.className, l.topic || 'Untitled lesson', l.header.date].filter(Boolean).join(' · '),
    objectives: l.objectives.map(compose).filter(Boolean).join(' ')
  });
  saveCtx();
}
export function example() {
  Object.assign(ctx, { year: 4, skill: 'Speaking', topic: 'Where are you from?', words: 'Malaysia, Japan, China, India, Thailand', sentence: 'He is from …', lessonId: '', lessonLabel: '', objectives: '' });
  saveCtx();
}
export function clearCtx() { Object.assign(ctx, { ...EMPTY, year: ctx.year, skill: ctx.skill }); saveCtx(); }
