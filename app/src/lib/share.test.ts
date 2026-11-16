import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { exportLesson, importLesson, shareName } from './share';
import { buildLesson } from './lesson/create';
import type { SowFile, Standards } from './curriculum/types';

const dir = new URL('../../public/curriculum/kssr2017/', import.meta.url);
const std: Standards = JSON.parse(readFileSync(new URL('standards-y4.json', dir), 'utf8'));
const sow: SowFile = JSON.parse(readFileSync(new URL('sow-y4-sk.json', dir), 'utf8'));
const l = buildLesson({ mode: 'follow-sow', sow: sow.lessons[0], year: 4, school: 'SK', date: '2026-01-05', start: '08:00', durationMin: 60, classId: 'class-1', className: '4 Zhong', pupils: 44 }, std);

describe('lesson sharing', () => {
  it('round-trips a lesson without class data, as a new draft', () => {
    const text = exportLesson(l, '0.4.0');
    expect(text).not.toContain('class-1');
    expect(text).not.toContain('4 Zhong');
    const r = importLesson(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lesson.id).not.toBe(l.id);
      expect(r.lesson.classId).toBeNull();
      expect(r.lesson.header.pupils).toBeNull();
      expect(r.lesson.topic).toBe(l.topic);
      expect(r.lesson.stages.flatMap((s) => s.activities).length).toBe(l.stages.flatMap((s) => s.activities).length);
    }
  });
  it('rejects other files and damaged lessons with a clear message', () => {
    expect(importLesson('not json')).toEqual({ ok: false, error: expect.stringContaining('not a Consilia lesson') });
    expect(importLesson('{"format":"x"}')).toEqual({ ok: false, error: 'This file is not a Consilia lesson.' });
    const env = JSON.parse(exportLesson(l, '0.4.0'));
    expect((importLesson(JSON.stringify({ ...env, version: 2 })) as { error: string }).error).toContain('newer Consilia');
    env.lesson.framework = 'magic';
    expect((importLesson(JSON.stringify(env)) as { error: string }).error).toContain('framework');
  });
  it('drops links that are not web addresses', () => {
    const env = JSON.parse(exportLesson(l, '0.4.0'));
    env.lesson.links = [{ label: 'ok', url: 'https://wordwall.net/x' }, { label: 'bad', url: 'javascript:alert(1)' }];
    const r = importLesson(JSON.stringify(env));
    expect(r.ok && r.lesson.links.map((x) => x.label)).toEqual(['ok']);
  });
  it('names the file after the topic', () => expect(shareName(l)).toBe('Where-are-you-from-Y4.consilia'));
  it('keeps the slides but takes the class name off them', async () => {
    const { buildDeck } = await import('./slides/deck');
    const withSlides = { ...l, slides: buildDeck(l) };
    expect(JSON.stringify(withSlides.slides)).toContain('4 Zhong');
    const text = exportLesson(withSlides, '1.0.0');
    expect(text).not.toContain('4 Zhong');
    const r = importLesson(text);
    expect(r.ok && r.lesson.slides?.slides[0].lines[0]).toBe('Year 4');
  });
});
