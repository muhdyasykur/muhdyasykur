import { describe, it, expect } from 'vitest';
import { MANUAL, searchManual } from './manual';
import { PRIVACY } from './privacy';
import { VIDEOS } from './videos';

describe('manual', () => {
  it('has unique article ids and every video link points to a real video', () => {
    const ids = MANUAL.flatMap((c) => c.articles.map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
    const vids = new Set(VIDEOS.map((v) => v.id));
    for (const c of MANUAL) for (const a of c.articles) if (a.video) expect(vids.has(a.video)).toBe(true);
    for (const v of VIDEOS) expect(MANUAL.some((c) => c.articles.some((a) => a.video === v.id))).toBe(true);
  });
  it('finds articles by keyword and ranks title matches first', () => {
    expect(searchManual('PBD')[0].article.title).toMatch(/PBD/);
    expect(searchManual('canva').map((h) => h.article.id)).toContain('materials-step');
    expect(searchManual('backup restore')[0].article.id).toBe('backup');
    expect(searchManual('PIN')[0].article.id).toBe('pin');
  });
  it('needs every word to match and ignores empty searches', () => {
    expect(searchManual('')).toEqual([]);
    expect(searchManual('canva zzzzqq')).toEqual([]);
  });
});

describe('privacy page', () => {
  it('says the same things in English and Bahasa Melayu', () => {
    const { en, ms } = PRIVACY;
    expect(ms.sections.length).toBe(en.sections.length);
    en.sections.forEach((s, i) => expect(ms.sections[i].p.length).toBe(s.p.length));
  });
});
