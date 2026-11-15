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
