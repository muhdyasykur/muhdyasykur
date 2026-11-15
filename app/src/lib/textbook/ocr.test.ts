import { describe, it, expect } from 'vitest';
import { cleanText } from './ocr.svelte';

describe('cleanText', () => {
  it('keeps sentences and drops picture noise', () => {
    const raw = "» are you Si y\nHe's from Korea.\n£ P y fe\n| ~ ^ |\nWhat is he doing? 1 E A 4\n=. Listen and read.";
    const out = cleanText(raw);
    expect(out).toContain("He's from Korea.");
    expect(out).toContain('What is he doing?');
    expect(out).toContain('Listen and read.');
    expect(out).not.toContain('£');
    expect(out).not.toMatch(/\bSi y\b/);
  });
  it('returns an empty string for a page of pictures', () => { expect(cleanText('~~ | ^^ \n ## 3 ]] |')).toBe(''); });
});
