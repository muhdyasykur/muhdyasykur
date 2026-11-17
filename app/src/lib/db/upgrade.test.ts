import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { ConsiliaDB, watchUpgrades } from './schema';

/** The database exactly as earlier versions of Consilia created it. */
const V1 = {
  profile: 'id', settings: 'key', classes: 'id, year, archived', pupils: 'id, classId, [classId+order]',
  lessons: 'id, classId, date, status, updatedAt', sessions: 'id, lessonId, startedAt', attendance: 'id, sessionId, pupilId',
  pbd: 'id, pupilId, classId, lessonId, ls, date, [pupilId+ls]', reflections: 'id, lessonId', mentorNotes: 'id, lessonId, date',
  bankCustom: 'id, skill, stage', media: 'id, lessonId', feedbackQueue: 'id, createdAt, sentAt', meta: 'key'
};
async function oldDb(name: string, version: 1 | 2) {
  const d = new Dexie(name);
  d.version(1).stores(V1);
  if (version === 2) d.version(2).stores({ books: 'id, slot', bookBlobs: 'id' });
  await d.open();
  await d.table('profile').put({ id: 'me', name: 'Aina', createdAt: 1 });
  await d.table('classes').put({ id: 'c1', name: '4 Bestari', year: 4, archived: 0 });
  await d.table('pupils').bulkPut([{ id: 'p1', classId: 'c1', order: 0, name: 'Bala' }, { id: 'p2', classId: 'c1', order: 1, name: 'Dhia' }]);
  await d.table('lessons').put({ id: 'l1', classId: 'c1', date: '2026-07-01', status: 'taught', updatedAt: 5, topic: 'Where are you from?' });
  await d.table('pbd').put({ id: 'b1', pupilId: 'p1', classId: 'c1', lessonId: 'l1', ls: '2.1.5', date: '2026-07-01', tp: 3 });
  if (version === 2) await d.table('books').put({ id: 'bk1', slot: 'y4-sb', name: 'Student\'s Book' });
  d.close();
}

describe('database upgrades', () => {
  for (const v of [1, 2] as const) {
    it(`opens data saved by database version ${v} without losing anything`, async () => {
      const name = `upgrade-from-v${v}`;
      await oldDb(name, v);
      const db = new ConsiliaDB(name);
      await db.open();
      expect(db.verno).toBe(3);
      expect((await db.profile.get('me'))?.name).toBe('Aina');
      expect(await db.pupils.where('classId').equals('c1').count()).toBe(2);
      expect((await db.lessons.get('l1') as unknown as { topic: string }).topic).toBe('Where are you from?');
      expect(await db.pbd.where('[pupilId+ls]').equals(['p1', '2.1.5']).count()).toBe(1);
      if (v === 2) expect(await db.books.count()).toBe(1);
      // the stores added later work straight away
      await db.register.put({ id: 'r1', classId: 'c1', date: '2026-07-02', marks: {} } as never);
      expect(await db.register.where('[classId+date]').equals(['c1', '2026-07-02']).count()).toBe(1);
      db.close();
    });
  }
  it('a tab still open on the old version lets the update through and asks to reload', async () => {
    const name = 'two-tabs';
    const oldTab = new ConsiliaDB(name);
    await oldTab.open();
    let stale = false;
    watchUpgrades(oldTab, { stale: () => (stale = true), blocked: () => {} });
    // a newer Consilia opens the same database in another tab with a version 4
    class Next extends ConsiliaDB { constructor() { super(name); this.version(4).stores({ extra: 'id' }); } }
    const newTab = new Next();
    await newTab.open();
    expect(newTab.verno).toBe(4);
    expect(stale).toBe(true);
    expect(oldTab.isOpen()).toBe(false);
    newTab.close();
  });
});
