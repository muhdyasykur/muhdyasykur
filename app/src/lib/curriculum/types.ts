export type School = 'SK' | 'SJK';
export type Role = 'main' | 'comp';

export interface PackIndex {
  pack: string; title: string; version: string;
  years: Record<string, {
    textbook: string; standards: string; standardsSjk: string | null;
    schools: Record<School, { file: string; lessons: number }>;
    phonics?: { file: string; lessons: number };
  }>;
}
export interface ContentStandard { code: string; skill: string; text: string }
export interface LearningStandard { code: string; cs: string; skill: string; text: string; focus: string; docPage: number }
export interface PerformanceLevel { level: number; descriptors: string[]; note: string }
export interface Standards { pack: string; year: number; cs: ContentStandard[]; ls: LearningStandard[]; performance: Record<string, PerformanceLevel[]> }

export interface LessonStd {
  main: { cs: string[]; ls: string[] };
  comp: { cs: string[]; ls: string[] };
  /** The SoW leaves the standards to the teacher and says so in these words. */
  note?: string;
  /** SoW wording of a standard where it differs from, or names one part of, the DSKP wording. */
  sowWording?: Record<string, string>;
}
export interface Outline { pre: string[]; delivery: string[]; post: string[]; note?: string }
export interface SowLesson {
  no: number; label: string; kind: 'textbook' | 'non-textbook'; unit: string; mainSkill: string;
  theme: string; topic: string; focus: string; cce: string;
  std: LessonStd; outline: Outline; materials: string; differentiation: string;
  /** Page of the official SoW PDF where the lesson starts. */
  docPage: number; worksheetPages?: number[];
}
export interface Task { no: number; title: string; aim: string; materials: string; steps: string[]; notes?: string[] }
export interface Strategy { no: number; title: string; body: string; points: string[] }
export interface Support { pre: Task[]; post: Task[]; strategies: Strategy[] }
export interface SowFile { pack: string; year: number; school: School; textbook: string; lessons: SowLesson[]; support: Support }
export interface PhonicsFile { pack: string; year: number; lessons: SowLesson[] }
