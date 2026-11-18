import { describe, it, expect } from 'vitest';
import { nameParts, namesIn, withoutNames } from './privacy';

const CLASS = ['Aina Sofea binti Ahmad', 'Bala a/l Muthu', 'Chong Wei', 'Dhia', 'Locked', 'Li'];
describe('pupils\' names stay on the device', () => {
  it('looks for full names and their parts, not connectors or very short words', () => {
    const p = nameParts(CLASS);
    expect(p).toContain('Aina Sofea binti Ahmad');
    expect(p).toEqual(expect.arrayContaining(['Aina', 'Sofea', 'Ahmad', 'Bala', 'Muthu', 'Chong', 'Wei', 'Dhia']));
    expect(p).not.toContain('binti'); expect(p).not.toContain('a/l'); expect(p).not.toContain('Locked'); expect(p).not.toContain('Li');
  });
  it('finds names as whole words only', () => {
    expect(namesIn(['Aina wrote this. CHONG helped.'], CLASS)).toEqual(['Aina', 'Chong']);
    expect(namesIn(['Ainaa and Balance are not names here; dhia is lower case'], CLASS)).toEqual([]);
  });
  it('replaces them with "the pupil"', () => {
    expect(withoutNames('Aina Sofea binti Ahmad and Bala wrote: Dhia is my friend.', CLASS)).toBe('The pupil and the pupil wrote: the pupil is my friend.');
  });
});
