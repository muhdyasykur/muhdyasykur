import type { School } from '../curriculum/types';

/** How the teacher started this RPH (blueprint F04). */
export type Mode = 'follow-sow' | 'sow-standards' | 'scratch';
export type Role = 'main' | 'comp';
export type Tier = 'low' | 'mod' | 'high';
export type FrameworkId = 'pwp' | 'ppp' | 'process' | 'hybrid' | 'tblt' | 'la';
export type Pattern = 'T-P' | 'P-P' | 'pairs' | 'groups' | 'individual' | 'whole-class';

export interface StdRef { code: string; text: string }
export interface StdRole { cs: StdRef[]; ls: StdRef[] }

export interface Objective {
  id: string;
  role: Role;
  /** ABCD parts. `content` is what follows the verb; `condition` and `degree` make it measurable. */
  audience: string; verb: string; content: string; condition: string; degree: string;
  /** When set, the teacher typed the whole objective; the ABCD fields are ignored. */
  free?: string;
}
export interface SuccessCriterion { objectiveId: string; text: string; edited: boolean }

export interface Activity {
  id: string;
  teacher: string;           // what the teacher does
  pupils: string;            // what pupils do
  pattern: Pattern | '';
  objectiveIds: string[];
  aids: string;              // teaching aids for this activity
  values: string;            // moral values / CCE note
  tiers: Record<Tier, string>;
  /** Where the text came from, e.g. "SoW step 3". */
  source?: string;
}
export interface Stage { id: string; key: string; title: string; minutes: number; activities: Activity[] }

export interface PlanB { early: string; late: string; offline: string; noisy: string; absent: string }

export interface Lesson {
  id: string;
  status: 'draft' | 'ready' | 'taught';
  createdAt: number; updatedAt: number;
  mode: Mode;
  classId: string | null;
  header: {
    subject: string; date: string; start: string; durationMin: number;
    className: string; levelLabel: string; pupils: number | null;
  };
  curriculum: { pack: string; year: number; school: School; sowLesson: number | null; phonics: boolean };
  theme: string; topic: string; mainSkill: string; compSkill: string;
  focus: string; cce: string; skills21: string; values: string; pedagogy: string;
  priorKnowledge: string;
  standards: { main: StdRole; comp: StdRole };
  framework: FrameworkId; frameworkReason: string;
  objectives: Objective[];
  successCriteria: SuccessCriterion[];
  stages: Stage[];
  aids: string;
  vocabulary: string;
  assessment: { evidence: string; method: string };
  links: { label: string; url: string }[];
  appendices: string;
  planB: PlanB;
  /** SoW guidance kept for reference while planning (differentiation note, materials, lesson note). */
  sowNotes: { differentiation: string; materials: string; note: string };
}

export const uid = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

export const emptyTiers = (): Record<Tier, string> => ({ low: '', mod: '', high: '' });
export function newActivity(partial: Partial<Activity> = {}): Activity {
  return { id: uid(), teacher: '', pupils: '', pattern: '', objectiveIds: [], aids: '', values: '', tiers: emptyTiers(), ...partial };
}
export function audienceFor(year: number) { return `By the end of the lesson, Year ${year} pupils will be able to`; }
export function newObjective(role: Role, year: number): Objective {
  return { id: uid(), role, audience: audienceFor(year), verb: '', content: '', condition: '', degree: '' };
}

/** "09:10" + 60 → "10:10" */
export function endTime(start: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(start);
  if (!m) return '';
  const t = (Number(m[1]) * 60 + Number(m[2]) + minutes) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
