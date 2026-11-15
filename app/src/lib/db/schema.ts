import Dexie, { type EntityTable } from 'dexie';

/**
 * Everything the teacher creates lives in IndexedDB on this device. Nothing is uploaded.
 * Curriculum packs are NOT stored here: they are read-only JSON served from the app cache.
 * Each schema change gets a new numbered version() with an upgrade function and a test.
 */
export type SchoolType = 'SK' | 'SJK';

export interface Profile { id: 'me'; name: string; school: string; schoolType: SchoolType; campus?: string; programme?: string; /** School badge as a data URL, printed on the RPH header. */ logo?: string; createdAt: number }
export interface Setting { key: string; value: unknown }
export interface SchoolClass { id: string; year: 1 | 2 | 3 | 4 | 5 | 6; name: string; schoolType: SchoolType; curriculumPack: string; levelLabel?: string; notes?: string; archived?: boolean; createdAt: number }
export interface Pupil { id: string; classId: string; name: string; order: number; tierOverride?: 'low' | 'mod' | 'high'; note?: string; keepApart?: string[]; keepTogether?: string[] }
export type LessonStatus = 'draft' | 'ready' | 'taught';
/** The full lesson shape is defined with the builder in milestone 2; indexed fields are fixed now. */
export interface Lesson { id: string; classId: string | null; date: string; status: LessonStatus; updatedAt: number; [field: string]: unknown }
/** A taught lesson. `clock` is the live Teach-mode clock, saved on every change so a reload resumes it. */
export interface TeachSession { id: string; lessonId: string; classId: string | null; startedAt: number; endedAt?: number; clock: unknown; absent: string[]; picker?: { picked: string[] }; points?: number[]; groups?: string[][] }
export interface Attendance { id: string; sessionId: string; pupilId: string; present: boolean }
export interface ClockLog { key: string; title: string; plannedMin: number; actualSec: number }
export interface PbdRecord { id: string; pupilId: string; classId: string; lessonId: string | null; ls: string; tp: 1 | 2 | 3 | 4 | 5 | 6; date: string; note?: string }
export interface Reflection { id: string; lessonId: string; worked: string; didnt: string; next: string; createdAt: number }
export interface MentorNote { id: string; lessonId: string | null; who: string; date: string; text: string; tags: string[] }
export interface BankItem { id: string; title: string; skill: string; stage: string; body: unknown; createdAt: number }
export interface Media { id: string; lessonId: string | null; name: string; type: string; blob: Blob }
export interface FeedbackItem { id: string; mood: string; kind: string; text: string; createdAt: number; sentAt?: number }
export interface Meta { key: string; value: unknown }

export class ConsiliaDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>;
  settings!: EntityTable<Setting, 'key'>;
  classes!: EntityTable<SchoolClass, 'id'>;
  pupils!: EntityTable<Pupil, 'id'>;
  lessons!: EntityTable<Lesson, 'id'>;
  sessions!: EntityTable<TeachSession, 'id'>;
  attendance!: EntityTable<Attendance, 'id'>;
  pbd!: EntityTable<PbdRecord, 'id'>;
  reflections!: EntityTable<Reflection, 'id'>;
  mentorNotes!: EntityTable<MentorNote, 'id'>;
  bankCustom!: EntityTable<BankItem, 'id'>;
  media!: EntityTable<Media, 'id'>;
  feedbackQueue!: EntityTable<FeedbackItem, 'id'>;
  meta!: EntityTable<Meta, 'key'>;

  constructor(name = 'consilia') {
    super(name);
    this.version(1).stores({
      profile: 'id',
      settings: 'key',
      classes: 'id, year, archived',
      pupils: 'id, classId, [classId+order]',
      lessons: 'id, classId, date, status, updatedAt',
      sessions: 'id, lessonId, startedAt',
      attendance: 'id, sessionId, pupilId',
      pbd: 'id, pupilId, classId, lessonId, ls, date, [pupilId+ls]',
      reflections: 'id, lessonId',
      mentorNotes: 'id, lessonId, date',
      bankCustom: 'id, skill, stage',
      media: 'id, lessonId',
      feedbackQueue: 'id, createdAt, sentAt',
      meta: 'key'
    });
  }
}

export const db = new ConsiliaDB();

/** Ask the browser not to clear our data under storage pressure. Safe to call repeatedly. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch { return false; }
}
