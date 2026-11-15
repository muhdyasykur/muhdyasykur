import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { ConsiliaDB } from './schema';

describe('ConsiliaDB v1', () => {
  it('opens with every store from the blueprint', async () => {
    const db = new ConsiliaDB('test-open');
    await db.open();
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ['attendance', 'bankCustom', 'classes', 'feedbackQueue', 'lessons', 'media', 'mentorNotes', 'meta', 'pbd', 'profile', 'pupils', 'reflections', 'sessions', 'settings'].sort()
    );
    db.close();
  });
  it('keeps pupils in class order and finds PBD history per pupil and LS', async () => {
    const db = new ConsiliaDB('test-query');
    await db.classes.add({ id: 'c1', year: 4, name: '4 Zhong', schoolType: 'SJK', curriculumPack: 'kssr2017', createdAt: 1 });
    await db.pupils.bulkAdd([
      { id: 'p2', classId: 'c1', name: 'Bala', order: 2 },
      { id: 'p1', classId: 'c1', name: 'Aina', order: 1 }
    ]);
    const roster = await db.pupils.where('[classId+order]').between(['c1', Dexie.minKey], ['c1', Dexie.maxKey]).toArray();
    expect(roster.map((p) => p.name)).toEqual(['Aina', 'Bala']);
    await db.pbd.bulkAdd([
      { id: 'r1', pupilId: 'p1', classId: 'c1', lessonId: null, ls: '4.2.3', tp: 3, date: '2026-01-05' },
      { id: 'r2', pupilId: 'p1', classId: 'c1', lessonId: null, ls: '4.2.3', tp: 4, date: '2026-01-12' },
      { id: 'r3', pupilId: 'p1', classId: 'c1', lessonId: null, ls: '2.1.5', tp: 2, date: '2026-01-12' }
    ]);
    const hist = await db.pbd.where('[pupilId+ls]').equals(['p1', '4.2.3']).sortBy('date');
    expect(hist.map((r) => r.tp)).toEqual([3, 4]);
    db.close();
  });
});
