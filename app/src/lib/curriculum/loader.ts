import type { PackIndex, PhonicsFile, School, SowFile, SowLesson, Standards } from './types';

export const PACK = 'kssr2017';
// Relative to the page, so the same build works under any base path. Served from the offline cache once installed.
const base = `${import.meta.env.BASE_URL}curriculum/${PACK}/`;
const cache = new Map<string, Promise<unknown>>();

function get<T>(file: string): Promise<T> {
  let p = cache.get(file) as Promise<T> | undefined;
  if (!p) {
    p = fetch(base + file).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${file} (${r.status})`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(file)); // let a failed load be retried
    cache.set(file, p);
  }
  return p;
}

export const loadIndex = () => get<PackIndex>('index.json');

export async function loadStandards(year: number, school: School): Promise<Standards> {
  const y = (await loadIndex()).years[String(year)];
  return get<Standards>(school === 'SJK' && y.standardsSjk ? y.standardsSjk : y.standards);
}
export async function loadSow(year: number, school: School): Promise<SowFile> {
  return get<SowFile>((await loadIndex()).years[String(year)].schools[school].file);
}
export async function loadPhonics(year: number): Promise<PhonicsFile | null> {
  const p = (await loadIndex()).years[String(year)].phonics;
  return p ? get<PhonicsFile>(p.file) : null;
}

/** Case-insensitive match on topic, label, skill, theme, language focus and LS codes. */
export function searchLessons(lessons: SowLesson[], q: string): SowLesson[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return lessons;
  return lessons.filter((l) => {
    const hay = [l.no, l.label, l.topic, l.mainSkill, l.theme, l.focus, l.unit, ...l.std.main.ls, ...l.std.comp.ls].join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
