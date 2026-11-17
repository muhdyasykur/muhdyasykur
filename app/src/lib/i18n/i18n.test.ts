/**
 * Bahasa Melayu coverage: every interface string has a translation with the same placeholders.
 * The strings are every tr('…') in the source plus the reference data shown through tr(field).
 * I18N_DUMP=1 npx vitest run src/lib/i18n writes the missing ones to tools/i18n-todo.json.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ms from './ms-ui.json';
import { FRAMEWORKS, recommend } from '../lesson/frameworks';
import { RULES, GROUPS } from '../lesson/checker';
import { BBM } from '../recommend/bbm';
import { DIGITAL } from '../recommend/digital';
import { routinesFor, type Need } from '../recommend/manage';
import { PROMPT_KINDS } from '../recommend/prompts';
import { makeChants } from '../recommend/chant';
import { TYPE_INFO } from '../materials';
import { TRACKS } from '../audio/tracks';
import { THEMES } from '../slides/deck';
import { MOODS, KINDS, IDEAS } from '../feedback';
import { VIDEOS } from '../content/videos';
import { CLAUDE_MODELS } from '../ai/claude-models';
import { MANUAL } from '../content/manual';
import { MANUAL_MS } from '../content/manual.ms';

const UI = ms as Record<string, string>;
function sourceStrings(): Set<string> {
  const out = new Set<string>();
  const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(svelte|ts)$/.test(p) && !p.endsWith('.test.ts')) {
    const s = fs.readFileSync(p, 'utf8');
    for (const m of s.matchAll(/\btr\('((?:[^'\\]|\\.)*)'/g)) out.add(m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\'));
  } } };
  walk('src');
  return out;
}
function dataStrings(): Set<string> {
  const out = new Set<string>();
  const add = (...xs: (string | undefined)[]) => xs.forEach((x) => x && /\p{L}{2,}/u.test(x) && out.add(x));
  for (const f of Object.values(FRAMEWORKS)) { add(f.summary); f.stages.forEach((s) => add(s.purpose)); }
  for (const skill of ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts', 'Grammar']) for (const year of [1, 4]) { const r = recommend(skill, year); add(r.reason); r.alternatives.forEach((a) => add(a.when)); }
  RULES.forEach((r) => add(r.title)); GROUPS.forEach((g) => add(g));
  for (const b of BBM) { add(b.what, b.tip, b.safety, b.cost); b.materials.forEach((x) => add(x)); b.steps.forEach((x) => add(x)); b.use.forEach((x) => add(x)); }
  for (const d of DIGITAL) { add(d.name, d.what, d.pupils, d.free); d.setup.forEach((x) => add(x)); d.needs.forEach((x) => add(x)); }
  for (const sec of routinesFor(['noisy', 'energetic', 'shy', 'large', 'mixed', 'sen', 'slow-start', 'transitions'] as Need[])) { add(sec.title); sec.items.forEach(([a, b]) => add(a, b)); }
  PROMPT_KINDS.forEach((k) => add(k.title, k.about));
  makeChants(['cat', 'dog', 'fish', 'bird'], 'I like …').forEach((c) => add(c.how));
  Object.values(TYPE_INFO).forEach((x) => add(x.name, x.needs));
  TRACKS.forEach((t) => add(t.mood));
  Object.values(THEMES).forEach((x) => add(x.name));
  MOODS.forEach((m) => add(m.label)); KINDS.forEach((k) => add(k)); IDEAS.forEach((i) => add(typeof i === 'string' ? i : (i as { label: string }).label));
  VIDEOS.forEach((v) => add(v.about));
  CLAUDE_MODELS.forEach((m) => add(m.about));
  return out;
}
const vars = (s: string) => [...s.replace(/\{\{|\}\}/g, '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Bahasa Melayu', () => {
  const all = new Set([...sourceStrings(), ...dataStrings()]);
  const missing = [...all].filter((s) => !(s in UI));
  if (process.env.I18N_DUMP) fs.writeFileSync('tools/i18n-todo.json', JSON.stringify(missing, null, 1));
  it('translates every interface string', () => {
    expect(missing.slice(0, 20), `${missing.length} of ${all.size} strings have no Malay translation`).toEqual([]);
  });
  it('keeps the placeholders of each message (a translation may drop {plural} endings, never add names)', () => {
    const bad = Object.entries(UI).filter(([en, m]) => vars(m).some((v) => !vars(en).includes(v))).map(([en]) => en);
    expect(bad).toEqual([]);
  });
  it('has no leftover translations for text that no longer exists', () => {
    const stale = Object.keys(UI).filter((k) => !all.has(k));
    expect(stale.slice(0, 20), `${stale.length} unused`).toEqual([]);
  });
  it('translates every chapter and article of the manual', () => {
    const noCh = MANUAL.filter((c) => !MANUAL_MS.chapters[c.id]).map((c) => c.id);
    const noArt = MANUAL.flatMap((c) => c.articles).filter((a) => { const x = MANUAL_MS.articles[a.id]; return !x?.title || !x.body || x.body.length !== a.body.length || (a.steps && x.steps?.length !== a.steps.length) || (a.tips && x.tips?.length !== a.tips.length); }).map((a) => a.id);
    expect([...noCh, ...noArt]).toEqual([]);
  });
});
