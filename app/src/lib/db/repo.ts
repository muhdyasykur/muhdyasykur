import { db, type Profile, type SchoolClass, type Pupil } from './schema';
import type { Lesson } from '../lesson/model';
import { uid } from '../lesson/model';

// ---- profile ----
export const getProfile = () => db.profile.get('me');
export const saveProfile = (p: Omit<Profile, 'id' | 'createdAt'> & { createdAt?: number }) => db.profile.put({ id: 'me', createdAt: Date.now(), ...p });

// ---- classes and pupils ----
export const listClasses = () => db.classes.filter((c) => !c.archived).sortBy('name');
export const getClass = (id: string) => db.classes.get(id);
export async function saveClass(c: Partial<SchoolClass> & Pick<SchoolClass, 'year' | 'name' | 'schoolType'>): Promise<string> {
  const id = c.id ?? uid();
  await db.classes.put({ curriculumPack: 'kssr2017', createdAt: Date.now(), ...c, id } as SchoolClass);
  return id;
}
export async function deleteClass(id: string) {
  await db.transaction('rw', db.classes, db.pupils, async () => { await db.pupils.where('classId').equals(id).delete(); await db.classes.delete(id); });
}
export const listPupils = (classId: string) => db.pupils.where('classId').equals(classId).sortBy('order');
export const countPupils = (classId: string) => db.pupils.where('classId').equals(classId).count();

/** Clean a pasted list: one name per line, numbering and bullets removed, blanks dropped. */
export function parseNames(text: string): string[] {
  return text.split(/\r?\n|;/).map((l) => l.replace(/^\s*(\d+[.)]|[-•*·])\s*/, '').replace(/\s+/g, ' ').trim()).filter((l) => l && !/^\d+$/.test(l));
}
/** Give duplicate names a suffix (Ali A., Ali B.) so pupils can be told apart. */
export function disambiguate(names: string[]): string[] {
  const count = new Map<string, number>();
  names.forEach((n) => count.set(n.toLowerCase(), (count.get(n.toLowerCase()) ?? 0) + 1));
  const seen = new Map<string, number>();
  return names.map((n) => {
    const k = n.toLowerCase();
    if ((count.get(k) ?? 0) < 2) return n;
    const i = seen.get(k) ?? 0; seen.set(k, i + 1);
    return `${n} ${String.fromCharCode(65 + i)}.`;
  });
}
export async function addPupils(classId: string, names: string[]) {
  const existing = await listPupils(classId);
  const all = disambiguate([...existing.map((p) => p.name), ...names]);
  const start = existing.length;
  await db.transaction('rw', db.pupils, async () => {
    for (let i = 0; i < existing.length; i++) if (existing[i].name !== all[i]) await db.pupils.update(existing[i].id, { name: all[i] });
    await db.pupils.bulkAdd(all.slice(start).map((name, i): Pupil => ({ id: uid(), classId, name, order: start + i + 1 })));
  });
}
export const renamePupil = (id: string, name: string) => db.pupils.update(id, { name });
export const removePupil = (id: string) => db.pupils.delete(id);

// ---- lessons ----
type Stored = Lesson & { date: string };
export async function saveLesson(l: Lesson) {
  const row: Stored = { ...l, date: l.header.date, updatedAt: Date.now() };
  await db.lessons.put(row as never);
}
export const getLesson = async (id: string) => (await db.lessons.get(id)) as unknown as Lesson | undefined;
export const listLessons = async () => ((await db.lessons.orderBy('updatedAt').reverse().toArray()) as unknown as Lesson[]);
export const deleteLesson = (id: string) => db.lessons.delete(id);
export async function duplicateLesson(id: string): Promise<string | null> {
  const l = await getLesson(id);
  if (!l) return null;
  const copy: Lesson = { ...structuredClone(l), id: uid(), status: 'draft', createdAt: Date.now(), updatedAt: Date.now() };
  await saveLesson(copy);
  return copy.id;
}
