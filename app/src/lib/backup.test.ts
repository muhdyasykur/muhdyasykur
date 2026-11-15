import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { db } from './db/schema';
import { makeBackup, readBackup, restore, lastBackup } from './backup';

describe('backup and restore', () => {
  it('round-trips every table, including image blobs, and records the backup time', async () => {
    await db.profile.put({ id: 'me', name: 'Yasykur', school: 'SK(C) Anglo Chinese', schoolType: 'SJK', createdAt: 1 });
    await db.classes.put({ id: 'c1', year: 4, name: '4 Zhong', schoolType: 'SJK', curriculumPack: 'kssr2017', createdAt: 1 });
    await db.pupils.put({ id: 'p1', classId: 'c1', name: 'enc:v1:abc:def', order: 1 });
    await db.media.put({ id: 'm1', lessonId: null, name: 'pic.png', type: 'image/png', blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) });
    await db.books.put({ id: 'b', slot: 'b', name: 'book.pdf', pages: 1, bytes: 1, offset: 0, recognised: true, storage: 'idb', addedAt: 1 });
    const text = await makeBackup('0.6.0');
    expect(text).not.toContain('book.pdf'); // textbooks are never in backups
    expect(await lastBackup()).toBeGreaterThan(0);
    const r = readBackup(text);
    expect(r.ok).toBe(true);
    await db.classes.clear(); await db.pupils.clear(); await db.media.clear();
    await db.classes.put({ id: 'c2', year: 5, name: '5 Bestari', schoolType: 'SK', curriculumPack: 'kssr2017', createdAt: 2 });
    if (r.ok) await restore(r.file, 'merge');
    expect((await db.classes.toArray()).map((c) => c.name).sort()).toEqual(['4 Zhong', '5 Bestari']);
    expect((await db.pupils.get('p1'))!.name).toBe('enc:v1:abc:def');
    const m = await db.media.get('m1');
    expect(Array.from(new Uint8Array(await m!.blob.arrayBuffer()))).toEqual([1, 2, 3]);
    if (r.ok) await restore(r.file, 'replace');
    expect((await db.classes.toArray()).map((c) => c.name)).toEqual(['4 Zhong']);
  });
  it('rejects files that are not backups', () => {
    expect(readBackup('hello')).toEqual({ ok: false, error: 'This is not a Consilia backup file.' });
    expect(readBackup(JSON.stringify({ format: 'consilia-backup', version: 3, tables: {} }))).toEqual({ ok: false, error: expect.stringContaining('newer Consilia') });
    expect(readBackup(JSON.stringify({ format: 'consilia-backup', version: 1, tables: { secrets: [] } }))).toEqual({ ok: false, error: expect.stringContaining('unknown section') });
  });
});
