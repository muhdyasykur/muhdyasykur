import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { suggestPlanB, fillPlanB } from './planb';
import { buildLesson } from './create';
import type { SowFile, Standards } from '../curriculum/types';

const dir = new URL('../../../public/curriculum/kssr2017/', import.meta.url);
const std: Standards = JSON.parse(readFileSync(new URL('standards-y4.json', dir), 'utf8'));
const sow: SowFile = JSON.parse(readFileSync(new URL('sow-y4-sk.json', dir), 'utf8'));
const lesson = () => buildLesson({ mode: 'follow-sow', sow: sow.lessons[0], year: 4, school: 'SK', date: '2026-01-05', start: '08:00', durationMin: 60 }, std);

describe('Plan B suggestions', () => {
  it('names online resources and their offline twins', () => {
    const l = lesson();
    l.links.push({ label: 'Flags game', url: 'https://wordwall.net/x' });
    const p = suggestPlanB(l);
    expect(p.offline).toMatch(/wordwall/);
    expect(p.offline).toMatch(/mini whiteboards|board/);
    expect(p.offline).toMatch(/cd|track/); // "CD 1 - Track 3" in the SoW step
  });
  it('says when a lesson is already offline-ready', () => {
    const l = buildLesson({ mode: 'scratch', year: 4, school: 'SK', date: '2026-01-05', start: '08:00', durationMin: 60 }, std);
    expect(suggestPlanB(l).offline).toMatch(/offline-ready/);
  });
  it('uses the High tier for fast finishers', () => {
    const l = lesson();
    l.stages[2].activities[0].tiers.high = 'Write a postcard from another country.';
    expect(suggestPlanB(l).early).toContain('postcard');
  });
  it('never suggests cutting the Post-lesson', () => {
    expect(suggestPlanB(lesson()).late).not.toMatch(/Shorten Post-lesson/);
  });
  it('fills only empty cards', () => {
    const l = lesson();
    l.planB.early = 'My own idea';
    expect(fillPlanB(l)).toBe(4);
    expect(l.planB.early).toBe('My own idea');
    expect(Object.values(l.planB).every((v) => v.trim())).toBe(true);
  });
});
