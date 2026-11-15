import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { parseNames, disambiguate, saveClass, addPupils, listPupils } from './repo';

describe('pupil lists', () => {
  it('cleans a pasted list from Excel or WhatsApp', () => {
    expect(parseNames('1. Aina binti Ali\n2) Bala\n\n• Chong Wei  \n- Dhia\n12\n')).toEqual(['Aina binti Ali', 'Bala', 'Chong Wei', 'Dhia']);
  });
  it('marks duplicate names', () => {
    expect(disambiguate(['Ali', 'Siti', 'Ali'])).toEqual(['Ali A.', 'Siti', 'Ali B.']);
  });
  it('adds pupils in order and renames an existing duplicate', async () => {
    const id = await saveClass({ year: 4, name: '4 Zhong', schoolType: 'SJK' });
    await addPupils(id, ['Ali', 'Mei Ling']);
    await addPupils(id, ['Ali', 'Kumar']);
    expect((await listPupils(id)).map((p) => p.name)).toEqual(['Ali A.', 'Mei Ling', 'Ali B.', 'Kumar']);
  });
});

describe('pupil encryption', async () => {
  const { setCipher, resealAll, listPupils, addPupils, saveClass } = await import('./repo');
  const { createPin, encryptText, decryptText } = await import('../crypto/pin');
  const { db } = await import('./schema');
  it('stores names encrypted once a PIN is set and reads them back while unlocked', async () => {
    const id = await saveClass({ year: 3, name: '3 Bestari', schoolType: 'SK' });
    await addPupils(id, ['Nur Aisyah', 'Kumar']);
    const { key } = await createPin('2468', 1000);
    const c = { enc: (s: string) => encryptText(key, s), dec: (s: string) => decryptText(key, s) };
    await resealAll(null, c);
    setCipher(c);
    const raw = await db.pupils.where('classId').equals(id).toArray();
    expect(raw.every((p) => p.name.startsWith('enc:v1:'))).toBe(true);
    expect((await listPupils(id)).map((p) => p.name)).toEqual(['Nur Aisyah', 'Kumar']);
    await addPupils(id, ['Mei Ling']);
    setCipher(null);
    expect((await listPupils(id)).map((p) => p.name)).toEqual(['Locked', 'Locked', 'Locked']);
    setCipher(c);
    expect((await listPupils(id)).map((p) => p.name)).toEqual(['Nur Aisyah', 'Kumar', 'Mei Ling']);
    await resealAll(c, null); setCipher(null);
    expect((await listPupils(id)).map((p) => p.name)).toEqual(['Nur Aisyah', 'Kumar', 'Mei Ling']);
  });
});
