import { tr } from '../i18n/index.svelte';
import type { Objective, Role, StdRef } from './model';

/**
 * ABCD objectives (Audience, Behaviour, Condition, Degree) checked against SMART.
 * Verbs are observable actions grouped by skill and ordered roughly by Bloom's level.
 */
export const VERBS: Record<string, string[]> = {
  Listening: ['listen and identify', 'identify', 'point to', 'match', 'number', 'tick', 'circle', 'sequence', 'answer', 'follow', 'respond to', 'draw', 'complete'],
  Speaking: ['say', 'repeat', 'name', 'ask', 'answer', 'give', 'describe', 'talk about', 'express', 'introduce', 'role-play', 'present', 'retell', 'narrate', 'pronounce', 'explain', 'compare'],
  Reading: ['read', 'read aloud', 'identify', 'locate', 'match', 'label', 'answer', 'sequence', 'complete', 'find', 'guess', 'categorise', 'infer'],
  Writing: ['write', 'copy', 'form', 'spell', 'label', 'complete', 'fill in', 'rearrange', 'construct', 'punctuate', 'connect', 'list', 'compose', 'edit'],
  'Language Arts': ['sing', 'recite', 'chant', 'perform', 'act out', 'retell', 'respond to', 'draw and label', 'create', 'design', 'illustrate', 'present']
};
export const VAGUE = ['understand', 'know', 'learn', 'appreciate', 'be aware of', 'be familiar with', 'enjoy', 'grasp', 'realise', 'realize', 'master', 'gain', 'internalise'];
const VAGUE_DEGREE = /\b(minimal|some|little|with (guidance|help|support)|well|properly|correctly|confidently|fluently|appropriately)\b/i;
const NUMBER = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|all|every|each|both|half)\b/i;
const NUMWORD: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };

export function compose(o: Objective): string {
  if (o.free?.trim()) return o.free.trim();
  const parts = [o.audience, o.verb, o.content, o.condition, o.degree].map((p) => p.trim()).filter(Boolean);
  let s = parts.join(' ');
  if (s && !/[.!?]$/.test(s)) s += '.';
  return s;
}

/** The part of a free-typed objective after "able to". */
function behaviourPart(text: string): string {
  const m = /able to\s+(.*)$/i.exec(text);
  return (m ? m[1] : text).trim();
}
function startsWithVerb(text: string, verbs: string[]): string | null {
  const t = text.toLowerCase();
  let best: string | null = null;
  for (const v of verbs) if ((t === v || t.startsWith(v + ' ') || t.startsWith(v + ',')) && (!best || v.length > best.length)) best = v;
  return best;
}
const ALL_VERBS = [...new Set(Object.values(VERBS).flat())];

export type Letter = 'S' | 'M' | 'A' | 'R' | 'T';
export interface SmartResult { letter: Letter; ok: boolean; message: string }

/**
 * Check one objective. `skill` is the skill of the linked Learning Standard (Listening, Writing…).
 * Every failing letter says what to fix, in plain words.
 */
export function checkSmart(o: Objective, skill: string, year: number): SmartResult[] {
  const text = compose(o);
  const free = !!o.free?.trim();
  const beh = free ? behaviourPart(text) : [o.verb, o.content].join(' ').trim();
  const degree = free ? text : o.degree;
  const lower = beh.toLowerCase();
  const res: SmartResult[] = [];

  // S — specific: one observable verb, no vague verbs, one behaviour only
  const vague = VAGUE.find((v) => new RegExp(`(^|\\s)${v}(\\s|$)`, 'i').test(lower));
  const verb = startsWithVerb(lower, ALL_VERBS);
  const twoVerbs = verb ? new RegExp(`^${verb}\\b[^,.]*\\band (${ALL_VERBS.filter((v) => !v.includes(' ')).join('|')})\\b`, 'i').test(lower) && !['listen and identify', 'draw and label', 'act out'].includes(verb) : false;
  if (!beh) res.push({ letter: 'S', ok: false, message: tr('Choose an observable verb, such as write, identify or describe.') });
  else if (vague) res.push({ letter: 'S', ok: false, message: tr('"{vague}" cannot be observed. Use a verb you can see or hear, such as identify, say or write.', { vague }) });
  else if (!verb) res.push({ letter: 'S', ok: false, message: tr('Start the behaviour with an observable verb from the list.') });
  else if (twoVerbs) res.push({ letter: 'S', ok: false, message: tr('This objective has two behaviours. Split it into two objectives so each can be assessed.') });
  else if (!free && o.content.trim().split(/\s+/).length < 2) res.push({ letter: 'S', ok: false, message: tr('Say what pupils will ') + verb + tr(', for example "5 sentences about daily routines".') });
  else res.push({ letter: 'S', ok: true, message: tr('Specific: one observable behaviour ("{verb}").', { verb }) });

  // M — measurable: the degree has a number or quantity
  if (!degree.trim() || !NUMBER.test(degree)) {
    const vd = VAGUE_DEGREE.exec(degree);
    res.push({ letter: 'M', ok: false, message: vd ? tr('"{x}" cannot be measured. Add a number, e.g. "at least 4 out of 5 correctly".', { x: vd[0] }) : tr('Add a degree with a number, e.g. "at least 4 out of 5 correctly".') });
  } else res.push({ letter: 'M', ok: true, message: tr('Measurable: the degree has a number.') });

  // A — achievable: numbers are possible and sensible for the year
  const outOf = /(\d+|\w+)\s+out of\s+(\d+|\w+)/i.exec(degree);
  const n = (w: string) => (/^\d+$/.test(w) ? Number(w) : NUMWORD[w.toLowerCase()] ?? NaN);
  const nums = (beh + ' ' + degree).match(/\b\d+\b/g)?.map(Number) ?? [];
  const cap = year <= 2 ? 10 : year <= 4 ? 15 : 20;
  if (outOf && n(outOf[1]) > n(outOf[2])) res.push({ letter: 'A', ok: false, message: tr('"{x}" is not possible. The first number must be smaller.', { x: outOf[0] }) });
  else if (nums.some((x) => x > cap && x < 100)) res.push({ letter: 'A', ok: false, message: tr('{x} items may be too many for Year {year} in one lesson. Consider {cap} or fewer.', { x: Math.max(...nums.filter((x) => x < 100)), year, cap }) });
  else if (/\b(all|100 ?%|every)\b/i.test(degree)) res.push({ letter: 'A', ok: false, message: tr('"All" leaves no room for error. Most mixed-ability classes need a target like "at least 4 out of 5".') });
  else res.push({ letter: 'A', ok: true, message: tr('Achievable for the year.') });

  // R — relevant: the verb belongs to the skill of the linked standard
  if (!skill) res.push({ letter: 'R', ok: false, message: tr('Link this objective to a Learning Standard.') });
  else if (verb && !(VERBS[skill] ?? []).includes(verb)) res.push({ letter: 'R', ok: false, message: tr('"{verb}" is not a {x} behaviour. Try: {x2}.', { verb, x: skill.toLowerCase(), x2: (VERBS[skill] ?? []).slice(0, 5).join(', ') }) });
  else res.push({ letter: 'R', ok: !!verb, message: verb ? tr('Relevant: a {x} behaviour.', { x: skill.toLowerCase() }) : tr('Choose a verb first.') });

  // T — time-bound
  if (/by the end of the lesson|by the end of (this|the) (lesson|session)|in this lesson/i.test(text)) res.push({ letter: 'T', ok: true, message: tr('Time-bound: by the end of the lesson.') });
  else res.push({ letter: 'T', ok: false, message: tr('Start with "By the end of the lesson".') });
  return res;
}

/** "I can …" criterion for pupils (blueprint F09). Leaves out audience and degree. */
export function successCriterion(o: Objective): string {
  let beh: string;
  if (o.free?.trim()) beh = behaviourPart(o.free.trim()).replace(/\s*(with at least|at least|with \d|\d+ out of).*$/i, '');
  else beh = [o.verb, o.content].join(' ').trim();
  beh = beh.replace(/[.\s]+$/, '').replace(/\btheir\b/g, 'my').replace(/\bthemselves\b/g, 'myself').replace(/\bthey\b/g, 'I');
  return beh ? `I can ${beh}.` : '';
}

export function skillOfLs(codes: StdRef[]): string {
  const c = codes[0]?.code ?? '';
  return ({ '1': 'Listening', '2': 'Speaking', '3': 'Reading', '4': 'Writing', '5': 'Language Arts' } as Record<string, string>)[c[0]] ?? '';
}
export function verbsFor(skill: string): string[] { return VERBS[skill] ?? ALL_VERBS; }
export type { Role };
