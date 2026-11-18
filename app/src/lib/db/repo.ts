import { db, type Profile, type SchoolClass, type Pupil, type Creation } from './schema';
import { isEncrypted } from '../crypto/pin';
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
/**
 * Pupil names and notes are encrypted when a PIN is set. The lock module installs a cipher while unlocked;
 * while locked, encrypted names read as "Locked".
 */
export interface Cipher { enc(s: string): Promise<string>; dec(s: string): Promise<string> }
let cipher: Cipher | null = null;
export const setCipher = (c: Cipher | null) => { cipher = c; };
async function readable(p: Pupil): Promise<Pupil> {
  if (!isEncrypted(p.name) && !isEncrypted(p.note)) return p;
  if (!cipher) return { ...p, name: 'Locked', note: p.note ? 'Locked' : p.note };
  return { ...p, name: await cipher.dec(p.name), note: p.note ? await cipher.dec(p.note) : p.note };
}
const sealed = async (s: string) => (cipher ? cipher.enc(s) : s);
export async function listPupils(classId: string): Promise<Pupil[]> {
  return Promise.all((await db.pupils.where('classId').equals(classId).sortBy('order')).map(readable));
}
/** Encrypt (cipher set) or decrypt (cipher null, `from` given) every pupil record. Used when a PIN is set or removed. */
export async function resealAll(from: Cipher | null, to: Cipher | null) {
  // Crypto runs first: an IndexedDB transaction closes if it awaits anything else.
  const all = await db.pupils.toArray();
  const updates: { id: string; name: string; note?: string }[] = [];
  for (const p of all) {
    const name = from && isEncrypted(p.name) ? await from.dec(p.name) : p.name;
    const note = p.note && from && isEncrypted(p.note) ? await from.dec(p.note) : p.note;
    updates.push({ id: p.id, name: to ? await to.enc(name) : name, note: note ? (to ? await to.enc(note) : note) : note });
  }
  await db.transaction('rw', db.pupils, async () => { for (const u of updates) await db.pupils.update(u.id, { name: u.name, note: u.note }); });
}
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
  const enc = await Promise.all(all.map(sealed));
  await db.transaction('rw', db.pupils, async () => {
    for (let i = 0; i < existing.length; i++) if (existing[i].name !== all[i]) await db.pupils.update(existing[i].id, { name: enc[i] });
    await db.pupils.bulkAdd(enc.slice(start).map((name, i): Pupil => ({ id: uid(), classId, name, order: start + i + 1 })));
  });
}
export const renamePupil = async (id: string, name: string) => db.pupils.update(id, { name: await sealed(name) });
/** Save a pupil's profile (tier override, note, keep-apart and keep-together pairs). */
export async function updatePupil(id: string, patch: Partial<Pick<Pupil, 'tierOverride' | 'note' | 'keepApart' | 'keepTogether'>>) {
  const p = { ...patch };
  if (p.note !== undefined) p.note = p.note ? await sealed(p.note) : '';
  await db.pupils.update(id, p);
}
/** Set a pair both ways; `on` false removes it. */
export async function setPair(kind: 'keepApart' | 'keepTogether', a: string, b: string, on: boolean) {
  for (const [x, y] of [[a, b], [b, a]]) {
    const p = await db.pupils.get(x);
    if (!p) continue;
    const cur = new Set(p[kind] ?? []);
    if (on) cur.add(y); else cur.delete(y);
    await db.pupils.update(x, (p) => { p[kind] = [...cur]; });
  }
}
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

// ---- settings (small key/value records) ----
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const r = await db.settings.get(key);
  return (r?.value as T) ?? fallback;
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value });
/** Copy a lesson to another class (and optionally another date); class-specific parts are reset. */
export async function copyLessonToClass(id: string, cls: { id: string; name: string; levelLabel?: string }, date?: string): Promise<string | null> {
  const l = await getLesson(id);
  if (!l) return null;
  const n = await countPupils(cls.id);
  const copy: Lesson = { ...structuredClone(l), id: uid(), status: 'draft', createdAt: Date.now(), updatedAt: Date.now(), classId: cls.id,
    header: { ...l.header, className: cls.name, levelLabel: cls.levelLabel ?? '', pupils: n || null, date: date ?? l.header.date } };
  await saveLesson(copy);
  return copy.id;
}

// ---- Studio (milestone 11)
/** Every pupil's name that can be read on this device (locked names are skipped), for the Studio's name check. */
export async function pupilNames(): Promise<string[]> {
  const all = await Promise.all((await db.pupils.toArray()).map(readable));
  return [...new Set(all.map((p) => p.name).filter((n) => n && n !== 'Locked'))];
}
export const saveCreation = (c: Creation) => db.creations.put(c);
export const getCreation = (id: string) => db.creations.get(id);
export const listCreations = () => db.creations.orderBy('updatedAt').reverse().toArray();
export const deleteCreation = (id: string) => db.creations.delete(id);
