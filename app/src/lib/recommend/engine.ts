/**
 * Consilia Recommends: builds a complete, teachable lesson from what the teacher says about the class and the lesson.
 * It is a planning engine, not a chatbot: every choice comes from the KSSR data, the framework rules, the activity
 * library and the BBM guide, and every choice is explained in the planning log. Runs on the device, offline.
 */
import { FRAMEWORKS, defaultMinutes, recommend } from '../lesson/frameworks';
import { newActivity, newObjective, uid, type Activity, type FrameworkId, type Lesson, type Objective, type Pattern } from '../lesson/model';
import { fillPlanB } from '../lesson/planb';
import { VERBS, skillOfLs } from '../lesson/objectives';
import { RECIPES, type Output, type Recipe } from './activities';
import { bbmById, type Bbm } from './bbm';
import { digitalById, fits, type Digital } from './digital';

export type Level = 'low' | 'mixed' | 'high';
export type Trait = 'shy' | 'energetic' | 'weak-readers' | 'large-class' | 'sen' | 'mixed-languages';
export type Goal = 'speaking' | 'fun' | 'calm' | 'creative' | 'assessment' | 'observation' | 'tech';
export type Devices = 'none' | 'teacher' | 'shared' | 'one-each';
export interface ClassProfile { level: Level; traits: Trait[]; projector: boolean; speakers: boolean; internet: boolean; devices: Devices }
export interface Brief {
  year: number; topic: string; mainSkill: string; compSkill: string; focus: string; durationMin: number;
  words: string[]; sentence: string; textRef: string; goals: Goal[]; prepMinutes: number; pupils: number | null;
}
export interface Pick {
  recipe: Recipe; minutes: number; why: string[]; steps: string[]; teacher: string; pupils: string;
  tiers: { low: string; mod: string; high: string }; bbm: Bbm[]; digital: Digital[]; role: 'main' | 'comp';
}
export interface StagePlan { key: string; title: string; purpose: string; minutes: number; picks: Pick[] }
export interface PrepItem { label: string; minutes: number; bbm?: string; digital?: string }
export interface Plan {
  framework: FrameworkId; frameworkName: string; frameworkReason: string; stages: StagePlan[];
  objectives: { main: ObjParts; comp: ObjParts | null };
  evidence: string; method: string; skills21: string; values: string; pedagogy: string;
  prep: { items: PrepItem[]; total: number; limit: number }; log: string[];
}
export interface ObjParts { verb: string; content: string; condition: string; degree: string }
export interface Options {
  seed?: number;
  /** stage key → activities the teacher has already seen there ("Another idea") */ avoid?: Record<string, string[]>;
  /** stage key → activities to keep exactly as they are */ lock?: Record<string, string[]>;
}

// ---------------------------------------------------------------- helpers
const LABEL: Record<Goal | Trait, string> = {
  speaking: 'more speaking time', fun: 'a fun, lively lesson', calm: 'a calm class', creative: 'creativity', assessment: 'clear assessment', observation: 'an observation lesson', tech: 'using technology',
  shy: 'shy speakers', energetic: 'an energetic class', 'weak-readers': 'weak readers', 'large-class': 'a large class', sen: 'pupils with special needs', 'mixed-languages': 'many home languages'
};
function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }
const has = (p: ClassProfile) => ({ projector: p.projector, internet: p.internet, speakers: p.speakers, devices: p.devices === 'shared' || p.devices === 'one-each' || p.devices === 'teacher' });
const needsOk = (r: Recipe, p: ClassProfile) => r.needs.every((n) => has(p)[n]);
const TURN_TAKING = new Set(['S4', 'S9', 'P9']);
const SPEAK_OUT: Output[] = ['dialogue', 'questions', 'report', 'sentences', 'performance'];
const CREATIVE_OUT: Output[] = ['story', 'poster', 'performance', 'drawing'];
export function counts(year: number, level: Level) { const base = year <= 2 ? 4 : year <= 4 ? 5 : 6; return level === 'low' ? base - 1 : level === 'high' ? base + 1 : base; }
const defaultSentence = (skill: string) => ({ Speaking: 'I like … because …', Writing: 'I should … because …', Reading: 'The text says …', Listening: 'I hear …', 'Language Arts': 'Once upon a time …' } as Record<string, string>)[skill] ?? 'I can …';

function fill(s: string, b: Brief) {
  const topic = b.topic.trim() || 'the topic';
  const words = b.words.length ? b.words.slice(0, 8).join(', ') : `${topic} words`;
  return s.replaceAll('{topic}', topic).replaceAll('{words}', words).replaceAll('{first}', b.words[0] ?? 'the first word')
    .replaceAll('{sentence}', b.sentence.trim() || defaultSentence(b.mainSkill)).replaceAll('{text}', b.textRef.trim() || 'text for this lesson');
}
function patternWord(p: string) { return ({ pairs: 'in pairs', groups: 'in groups', individual: 'on their own', 'whole-class': 'as a whole class' } as Record<string, string>)[p] ?? ''; }
const asPattern = (p: string): Pattern | '' => (['T-P', 'P-P', 'pairs', 'groups', 'individual', 'whole-class'].includes(p) ? (p as Pattern) : '');

/** Step-by-step teacher script for one activity. */
export function stepsFor(r: Recipe, b: Brief, minutes: number, bbm: Bbm[], dig: Digital[]): string[] {
  const out: string[] = [];
  if (r.steps) out.push(...r.steps.map((s) => fill(s, b)));
  else {
    const ready = [...bbm.map((x) => x.name.toLowerCase()), ...(dig[0] && dig[0].kind === 'built-in' ? [dig[0].name] : [])];
    out.push(`Get ready: ${ready.length ? ready.join(', ') : 'the board and markers'}${b.words.length ? ` for the words ${b.words.slice(0, 6).join(', ')}` : ''}.`);
    out.push(fill(r.teacher, b));
    const short = minutes <= 6;
    out.push(short ? 'Do the first one together, quickly.' : ({ pairs: 'Model it first with a confident pupil in front of the class.', groups: 'Put pupils into groups of 4 with roles: leader, writer, timekeeper, reporter. Model the first step with one group.', individual: 'Show one finished example on the board.', 'whole-class': 'Do the first one together with the whole class.' } as Record<string, string>)[r.pattern] ?? 'Model the task once.');
    if (!short) out.push(`Check the instructions: "What do you do? Who do you work with? How many minutes?" (${minutes} min, ${patternWord(r.pattern)}).`);
    out.push(`Pupils: ${fill(r.pupils, b)}`);
  }
  out.push(`Support and stretch while you go round: Low — ${fill(r.tiers.low, b)} High — ${fill(r.tiers.high, b)}`);
  if (!r.steps) out.push(r.stages.includes('post-lesson') ? 'Finish: two or three pupils share; link back to the "I can" statements.' : 'Finish: check answers together and praise one specific thing you saw.');
  return out;
}

// ---------------------------------------------------------------- scoring
interface Ctx { b: Brief; p: ClassProfile; skill: string; stageKey: string; stageMin: number; prev?: Recipe; used: Set<string>; rand: () => number }
function score(r: Recipe, c: Ctx): { s: number; why: string[] } {
  const why: string[] = []; let s = 0;
  const g = new Set(c.b.goals), t = new Set(c.p.traits);
  if (r.skill === c.skill) { s += 3; why.push(`practises ${c.skill.toLowerCase()}`); }
  else if (r.skill === c.b.mainSkill || r.skill === c.b.compSkill) s += 1;
  const over = r.minutes - c.stageMin;
  if (over > 3) s -= (over - 3) * 0.6; else why.push(`fits the ${c.stageMin} minutes`);
  if (g.has('fun') && r.energy === 'active') { s += 1.5; why.push('lively and fun'); }
  if (g.has('calm')) { if (r.energy === 'calm') { s += 1.5; why.push('keeps the class calm'); } else s -= 1; }
  if (g.has('speaking') && SPEAK_OUT.includes(r.output) && r.pattern !== 'individual') { s += 1.5; why.push('gets every pupil talking'); }
  if (g.has('observation') && r.wow) { s += 2; why.push('a memorable moment for your observer'); }
  if (g.has('creative') && (r.wow || CREATIVE_OUT.includes(r.output))) { s += 1.5; why.push('lets pupils create'); }
  if (g.has('assessment') && (r.bbm.some((x) => x === 'mini-whiteboards' || x === 'traffic-cards') || r.output === 'answers')) { s += 1; why.push('shows you who has learnt it'); }
  if (g.has('tech') && r.digital.some((d) => { const x = digitalById(d); return x && fits(x, has(c.p)); })) { s += 1.5; why.push('uses a digital tool your class can run'); }
  if (t.has('shy') && r.pattern === 'pairs') { s += 1; why.push('pairs first, so shy pupils speak safely'); }
  if (t.has('shy') && (r.output === 'performance' || TURN_TAKING.has(r.id))) s -= 0.5;
  if (t.has('energetic') && r.energy === 'active') { s += 1; why.push('channels energy into movement'); }
  if ((t.has('weak-readers') || t.has('sen') || t.has('mixed-languages') || c.p.level === 'low') && r.bbm.some((x) => ['flashcards', 'realia', 'scene-poster', 'puppets'].includes(x))) { s += 1; why.push('picture support for weaker pupils'); }
  if (t.has('large-class') && TURN_TAKING.has(r.id)) s -= 1.5;
  if (t.has('large-class') && (r.pattern === 'pairs' || r.pattern === 'groups')) s += 0.5;
  if (c.p.level === 'high' && r.wow) s += 0.5;
  const prep = r.bbm.reduce((a, id) => a + (bbmById(id)?.minutes ?? 0), 0);
  if (c.b.prepMinutes <= 10) s -= 0.15 * Math.max(0, prep - 5);
  else if (c.b.prepMinutes <= 30) s -= 0.05 * Math.max(0, prep - 15);
  if (prep <= 5) why.push('almost no preparation');
  if (c.prev && c.prev.pattern === r.pattern) s -= 1;
  if (c.prev && c.prev.energy === r.energy && r.energy === 'active' && g.has('calm')) s -= 0.5;
  if (r.signature) s += 0.4;
  s += c.rand() * 0.4;
  return { s, why: [...new Set(why)].slice(0, 4) };
}

const EQUIV: Record<string, string[]> = { presentation: ['pre', 'while', 'model'], practice: ['while', 'practice'], production: ['post', 'production'], focus: ['practice'], 'pre-task': ['pre'], 'task-cycle': ['production', 'post'],
  model: ['pre', 'presentation'], planning: ['pre'], drafting: ['production'], revising: ['post'], pre: ['pre-task'], while: ['practice'], post: ['production'] };
function candidates(c: Ctx): { r: Recipe; s: number; why: string[] }[] {
  const ok = (r: Recipe) => !c.used.has(r.id) && c.b.year >= r.years[0] && c.b.year <= r.years[1] && needsOk(r, c.p);
  let pool = RECIPES.filter((r) => r.stages.includes(c.stageKey) && ok(r));
  if (c.skill && !['Pre-lesson', 'Post-lesson'].includes(c.skill) && !pool.some((r) => r.skill === c.skill))
    pool = [...pool, ...RECIPES.filter((r) => ok(r) && r.skill === c.skill && !pool.includes(r) && r.stages.some((x) => (EQUIV[c.stageKey] ?? []).includes(x)))];
  if (pool.length < 2) pool = [...pool, ...RECIPES.filter((r) => ok(r) && !pool.includes(r) && r.skill === c.skill && !r.stages.includes('pre-lesson') && !r.stages.includes('post-lesson'))];
  return pool.map((r) => ({ r, ...score(r, c) })).sort((a, b) => b.s - a.s);
}

function pickDigital(r: Recipe, p: ClassProfile, b: Brief): Digital[] {
  const h = has(p);
  const list = r.digital.map(digitalById).filter((d): d is Digital => !!d && fits(d, h));
  if (!list.length && h.projector) {
    const builtin = r.skill === 'Speaking' || r.skill === 'Pre-lesson' ? 'consilia-wheel' : (r.skill === 'Writing' || r.skill === 'Reading') && r.output === 'sentences' ? 'consilia-unjumble' : r.output === 'answers' ? 'consilia-quiz' : '';
    const d = builtin ? digitalById(builtin) : undefined;
    if (d && (b.words.length || b.sentence)) list.push(d);
  }
  return list.slice(0, 2);
}

// ---------------------------------------------------------------- objectives
function cleanTopic(topic: string) { const t = (topic.trim() || 'the topic').replace(/\s+and\s+/gi, ' & '); return /[?!]$/.test(t) ? `"${t}"` : t.replace(/[.]+$/, ''); }
export function objectiveFor(skill: string, out: Output, b: Brief, level: Level, role: 'main' | 'comp'): ObjParts {
  const n = Math.max(3, counts(b.year, level) - (role === 'comp' ? 1 : 0));
  const topic = cleanTopic(b.topic);
  const sent = b.sentence.trim() ? ` using "${b.sentence.trim().replace(/[.]$/, '')}"` : '';
  const support = level === 'low' ? 'with the help of picture cards' : 'based on pictures';
  const pick = (verb: string, content: string, condition: string, degree: string): ObjParts => ({ verb: (VERBS[skill] ?? VERBS.Speaking).includes(verb) ? verb : (VERBS[skill] ?? VERBS.Speaking)[0], content, condition, degree });
  switch (skill) {
    case 'Listening': return out === 'drawing' ? pick('draw', `a picture of ${topic} with ${n} details`, 'from a description they hear', `with at least ${n - 1} details correct`)
      : pick('identify', `${n} details about ${topic} in a short listening text`, 'after listening to it twice', `with at least ${n - 1} correct answers`);
    case 'Reading': return out === 'story' ? pick('sequence', `${n} events of a story about ${topic}`, 'after reading the story', `with at least ${n - 1} in the correct order`)
      : pick('answer', `${n} questions about a text on ${topic}`, 'after reading the text', `with at least ${n - 1} correct answers`);
    case 'Writing': return out === 'text' || out === 'story' ? pick('write', `a short paragraph of ${n} sentences about ${topic}${sent}`, level === 'low' ? 'using a sentence frame' : 'based on a mind map', `with at least ${n - 1} correct sentences`)
      : pick('write', `${n} sentences about ${topic}${sent}`, level === 'low' ? 'using a word bank' : 'based on pictures', `with at least ${n - 1} correct sentences`);
    case 'Language Arts': return out === 'poster' || out === 'drawing' ? pick('create', `a poster about ${topic} with ${n} labelled pictures`, 'in pairs', `with at least ${n - 1} labels spelt correctly`)
      : out === 'story' ? pick('retell', `a story about ${topic} in ${n} sentences`, 'with puppets or pictures', `with at least ${n - 1} events in the right order`)
      : pick('perform', `a song, chant or short scene about ${topic}`, 'in groups', `with at least ${n - 1} of the ${n} lines correct`);
    default: return out === 'dialogue' ? pick('role-play', `a short dialogue about ${topic} with ${n} turns`, 'with a partner', `with at least ${n - 1} turns said correctly`)
      : out === 'questions' ? pick('ask', `${n} questions about ${topic}`, 'to a partner', `with at least ${n - 1} correct questions`)
      : out === 'report' ? pick('present', `a short report about ${topic} in ${n} sentences`, 'with a partner', `with at least ${n - 1} correct sentences`)
      : pick('say', `${n} sentences about ${topic}${sent}`, support, `with at least ${n - 1} correct sentences`);
  }
}
/** What pupils hand in or show for an objective of this skill. */
export function evidenceFor(skill: string, out: Output): string {
  switch (skill) {
    case 'Listening': return out === 'drawing' ? 'drawing from a description' : 'answers to listening questions';
    case 'Reading': return out === 'story' ? 'story events in order' : 'answers to reading questions';
    case 'Writing': return out === 'text' || out === 'story' ? 'written paragraph' : 'written sentences';
    case 'Language Arts': return out === 'poster' || out === 'drawing' ? 'labelled poster' : out === 'story' ? 'story retelling' : 'group performance';
    default: return out === 'dialogue' ? 'dialogue performed in pairs' : out === 'questions' ? 'questions asked and answered' : out === 'report' ? 'spoken report' : 'spoken sentences';
  }
}

// ---------------------------------------------------------------- the planner
export function planLesson(p: ClassProfile, b: Brief, o: Options = {}): Plan {
  const rand = rng(o.seed ?? 7);
  const rec = recommend(b.mainSkill || 'Speaking', b.year, b.focus);
  const fw = FRAMEWORKS[rec.id];
  const mins = defaultMinutes(rec.id, b.durationMin);
  const log: string[] = [];
  const g = b.goals.map((x) => LABEL[x]), t = p.traits.map((x) => LABEL[x]);
  log.push(`Read the lesson: Year ${b.year}, ${b.mainSkill || 'skill not set'}${b.compSkill ? ` with ${b.compSkill.toLowerCase()} as the complementary skill` : ''}, "${b.topic || 'no topic yet'}", ${b.durationMin} minutes.`);
  log.push(`Chose ${fw.short}: ${rec.reason}`);
  log.push(`Class: ${b.pupils ? `${b.pupils} pupils, ` : ''}${p.level === 'mixed' ? 'mixed ability' : `mostly ${p.level === 'low' ? 'lower' : 'higher'} ability`}${t.length ? `; planning for ${t.join(', ')}` : ''}${g.length ? `; you want ${g.join(', ')}` : ''}.`);
  const res = [p.projector ? 'a projector' : 'no projector', p.internet ? 'internet' : 'no internet', p.devices === 'none' ? 'no pupil devices' : p.devices === 'one-each' ? 'a device each' : p.devices === 'shared' ? 'shared devices' : 'only your phone'];
  log.push(`Resources: ${res.join(', ')}. ${p.internet ? 'Online tools are allowed.' : 'Only activities that work offline are used.'}`);

  const used = new Set<string>();
  const stages: StagePlan[] = [];
  const lists: { r: Recipe; s: number; why: string[] }[][] = [];
  const lastDelivery = fw.stages.length - 2;
  const compStage = !b.compSkill ? -1 : ['Listening', 'Reading'].includes(b.compSkill) && !['Listening', 'Reading'].includes(b.mainSkill) ? 1 : lastDelivery;
  let prev: Recipe | undefined;
  fw.stages.forEach((st, i) => {
    const role: 'main' | 'comp' = i === compStage ? 'comp' : 'main';
    const skill = i === 0 ? 'Pre-lesson' : i === fw.stages.length - 1 ? 'Post-lesson' : role === 'comp' ? b.compSkill : b.mainSkill;
    const c: Ctx = { b, p, skill, stageKey: st.key, stageMin: mins[i], prev, used, rand };
    const seenHere = new Set(o.avoid?.[st.key] ?? []);
    const all = candidates(c);
    const list = all.filter((x) => !seenHere.has(x.r.id)).length ? all.filter((x) => !seenHere.has(x.r.id)) : all;
    lists[i] = list;
    if (!list.length) { stages.push({ key: st.key, title: st.title, purpose: st.purpose, minutes: mins[i], picks: [] }); return; }
    const locked = (o.lock?.[st.key] ?? []).map((id) => all.find((x) => x.r.id === id) ?? (RECIPES.find((r) => r.id === id) ? { r: RECIPES.find((r) => r.id === id)!, s: 0, why: [] } : null)).filter((x): x is { r: Recipe; s: number; why: string[] } => !!x);
    const first = locked[0] ?? list[0];
    const picks: Pick[] = [];
    const make = (x: { r: Recipe; why: string[] }, minutes: number): Pick => {
      const bbm = x.r.bbm.map(bbmById).filter((y): y is Bbm => !!y);
      const dig = pickDigital(x.r, p, b);
      return { recipe: x.r, minutes, why: x.why, steps: stepsFor(x.r, b, minutes, bbm, dig), teacher: fill(x.r.teacher, b), pupils: fill(x.r.pupils, b), tiers: { low: fill(x.r.tiers.low, b), mod: fill(x.r.tiers.mod, b), high: fill(x.r.tiers.high, b) }, bbm, digital: dig, role };
    };
    used.add(first.r.id);
    const m1 = Math.min(first.r.minutes, mins[i]);
    picks.push(make(first, m1));
    const left = mins[i] - m1;
    if (left >= 8 && i > 0 && i < fw.stages.length - 1) {
      const second = locked.length ? locked[1] : list.find((x) => x.r !== first.r && !used.has(x.r.id) && x.r.minutes <= left + 2 && x.r.pattern !== first.r.pattern);
      if (second) { used.add(second.r.id); picks.push(make(second, left)); }
      else picks[0].minutes = mins[i];
    } else picks[0].minutes = mins[i];
    if (picks.length === 1) picks[0].minutes = mins[i];
    prev = picks[picks.length - 1].recipe;
    stages.push({ key: st.key, title: st.title, purpose: st.purpose, minutes: mins[i], picks });
    log.push(`${st.title} (${mins[i]} min): ${picks.map((x) => x.recipe.title).join(' + ')}${picks[0].why.length ? ` — ${picks[0].why.slice(0, 3).join(', ')}` : ''}.`);
  });

  // fit the preparation time: swap the stage with the heaviest new aids for a close, lighter alternative
  const prepOf = () => { const seen = new Set<string>(); let m = 0; for (const s of stages) for (const x of s.picks) { for (const bb of x.bbm) if (!seen.has(bb.id)) { seen.add(bb.id); m += bb.minutes; } const d = x.digital[0]; if (d && !seen.has(d.id)) { seen.add(d.id); m += d.kind === 'built-in' ? 3 : 8; } } return m; };
  for (let guard = 0; guard < 6 && prepOf() > b.prepMinutes; guard++) {
    let best: { i: number; j: number; alt: { r: Recipe; s: number; why: string[] }; gain: number } | null = null;
    stages.forEach((s, i) => s.picks.forEach((x, j) => {
      if (o.avoid?.[s.key]?.length || o.lock?.[s.key]) return; // the teacher picked or kept this one
      const cost = x.recipe.bbm.reduce((a, id) => a + (bbmById(id)?.minutes ?? 0), 0);
      const top = lists[i]?.[0]?.s ?? 0;
      const alt = lists[i]?.find((y) => !used.has(y.r.id) && y.s >= top - 2.5 && y.r.minutes <= x.minutes + 3 && y.r.bbm.reduce((a, id) => a + (bbmById(id)?.minutes ?? 0), 0) < cost - 5);
      if (alt) { const gain = cost - alt.r.bbm.reduce((a, id) => a + (bbmById(id)?.minutes ?? 0), 0); if (!best || gain > best.gain) best = { i, j, alt, gain }; }
    }));
    if (!best) break;
    const { i, j, alt } = best as { i: number; j: number; alt: { r: Recipe; s: number; why: string[] } };
    const old = stages[i].picks[j];
    used.delete(old.recipe.id); used.add(alt.r.id);
    const bbm = alt.r.bbm.map(bbmById).filter((y): y is Bbm => !!y); const dig = pickDigital(alt.r, p, b);
    stages[i].picks[j] = { recipe: alt.r, minutes: old.minutes, why: [...alt.why, 'less to prepare'], steps: stepsFor(alt.r, b, old.minutes, bbm, dig), teacher: fill(alt.r.teacher, b), pupils: fill(alt.r.pupils, b), tiers: { low: fill(alt.r.tiers.low, b), mod: fill(alt.r.tiers.mod, b), high: fill(alt.r.tiers.high, b) }, bbm, digital: dig, role: old.role };
    log.push(`To fit your ${b.prepMinutes} minutes of preparation, swapped ${old.recipe.title} for ${alt.r.title} in ${stages[i].title}.`);
  }

  // framework requirements the checker looks for
  const stage = (key: string) => stages.find((s) => s.key === key)?.picks[0];
  const TEXTW = /\b(text|story|song|poem|passage|chant|rhyme|listen|read|audio|track|video|dialogue|letter|email|article|book|page)\b/i;
  if (['pwp', 'hybrid', 'la'].includes(rec.id)) {
    const wh = stage('while');
    if (wh && !TEXTW.test(wh.teacher + wh.pupils)) wh.teacher += ` Use the ${b.textRef.trim() || 'text for this lesson'}.`;
    const pre = stage('pre');
    if (pre && !TEXTW.test(pre.teacher + pre.pupils + wh?.teacher)) pre.teacher += ' Introduce the text and its title.';
  }
  if (['pwp', 'hybrid'].includes(rec.id)) { const po = stage('post'); const topic = (b.topic + ' ' + b.words.join(' ')).toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 3); if (po && !TEXTW.test(po.teacher + po.pupils) && !topic.some((w) => (po.teacher + po.pupils).toLowerCase().includes(w))) po.pupils += ` They respond to the text about ${cleanTopic(b.topic)}.`; }
  if (rec.id === 'ppp') { const pr = stage('production'); if (pr && !/\b(own|create|plan|tell|talk|role[- ]?play|present|discuss|share|interview|survey|design|personal|paragraph|story|advice|opinion|describe)\b/i.test(pr.teacher + pr.pupils + pr.tiers.mod)) pr.pupils += ' They use their own ideas and words.'; }
  if (rec.id === 'process') { const rv = stage('revising'); if (rv && !/\b(feedback|peer|revise|improve|edit|check|correct)\b/i.test(rv.teacher + rv.pupils + rv.tiers.mod)) rv.pupils += ' They give peer feedback against the success criteria and improve their draft.'; }
  if (rec.id === 'la') { const po = stage('post'); if (po && !/\b(perform|create|act|draw|sing|recite|illustrate|chant|role[- ]?play|present)\b/i.test(po.teacher + po.pupils)) po.pupils += ' Groups perform or present their work.'; }
  if (rec.id === 'tblt') { const tc = stage('task-cycle'); if (tc && !/\b(report|present|share|tell the class|show)\b/i.test(tc.teacher + tc.pupils + tc.tiers.mod)) tc.pupils += ' Each group reports to the class.'; }

  // objectives from the activity that carries each skill
  const delivery = stages.slice(1, -1).flatMap((s) => s.picks);
  const mainAct = [...delivery].reverse().find((x) => x.role === 'main') ?? delivery[0];
  const compAct = delivery.find((x) => x.role === 'comp' && x.recipe.skill === b.compSkill) ?? delivery.find((x) => x.role === 'comp');
  const main = objectiveFor(b.mainSkill || 'Speaking', mainAct?.recipe.skill === b.mainSkill ? mainAct.recipe.output : 'sentences', b, p.level, 'main');
  const comp = b.compSkill ? objectiveFor(b.compSkill, compAct?.recipe.skill === b.compSkill ? compAct.recipe.output : 'answers', b, p.level, 'comp') : null;
  if (compStage > 0) log.push(`The complementary skill (${b.compSkill.toLowerCase()}) is practised in ${stages[compStage]?.title ?? 'the lesson'}, so it is not dropped.`);
  log.push(`Wrote ${comp ? 'two objectives' : 'one objective'} in ABCD form with a number in every Degree, so each can be measured.`);

  // assessment, 21st-century skills, values
  const all = stages.flatMap((s) => s.picks);
  const methods = [all.some((x) => x.recipe.bbm.includes('mini-whiteboards')) && 'show-me answers on mini whiteboards', all.some((x) => x.recipe.bbm.includes('traffic-cards')) && 'traffic-light self-assessment', 'checklist while monitoring', stages[stages.length - 1].picks[0]?.recipe.id === 'C1' && 'exit ticket'].filter(Boolean) as string[];
  const evidence = `${evidenceFor(b.mainSkill, mainAct?.recipe.skill === b.mainSkill ? mainAct.recipe.output : 'sentences')} (M)${comp ? `; ${evidenceFor(b.compSkill, compAct?.recipe.skill === b.compSkill ? compAct.recipe.output : 'answers')} (C)` : ''}`;
  const sk = new Set<string>();
  if (all.some((x) => x.recipe.pattern === 'pairs' || x.recipe.pattern === 'groups')) { sk.add('Communication'); sk.add('Collaboration'); }
  if (all.some((x) => x.recipe.wow || CREATIVE_OUT.includes(x.recipe.output))) sk.add('Creativity');
  if (all.some((x) => x.recipe.skill === 'Reading' || x.recipe.output === 'questions')) sk.add('Critical thinking');
  if (!sk.size) sk.add('Communication');

  // preparation checklist
  const seen = new Set<string>(); const items: PrepItem[] = [];
  for (const x of all) for (const bb of x.bbm) if (!seen.has(bb.id)) { seen.add(bb.id); items.push({ label: `Make: ${bb.name}`, minutes: bb.minutes, bbm: bb.id }); }
  for (const x of all) for (const d of x.digital.slice(0, 1)) if (!seen.has(d.id)) { seen.add(d.id); items.push({ label: d.kind === 'built-in' ? `Type your words into ${d.name}` : `Find and test: ${d.name}`, minutes: d.kind === 'built-in' ? 3 : 8, digital: d.id }); }
  const total = items.reduce((a, x) => a + x.minutes, 0);
  log.push(`Preparation: ${items.length} item${items.length === 1 ? '' : 's'}, about ${total} minutes${total > b.prepMinutes ? ` (more than your ${b.prepMinutes} minutes: press "Another idea" on a stage to swap a heavy one, or reuse aids you already have)` : ` (within your ${b.prepMinutes} minutes)`}.`);

  return {
    framework: rec.id, frameworkName: fw.name, frameworkReason: rec.reason, stages, objectives: { main, comp },
    evidence, method: methods.join('; ').replace(/^./, (c) => c.toUpperCase()), skills21: [...sk].join(', '),
    values: all.some((x) => x.recipe.pattern === 'groups' || x.recipe.pattern === 'pairs') ? 'Cooperation, respect' : 'Diligence, responsibility',
    pedagogy: all.some((x) => x.recipe.pattern === 'groups') ? 'Cooperative learning' : all.some((x) => x.recipe.energy === 'active') ? 'Active learning' : 'Contextual learning',
    prep: { items, total, limit: b.prepMinutes }, log
  };
}

/** Write the plan into an RPH (built by buildLesson with the SoW standards), replacing its flow. */
export function applyPlan(l: Lesson, plan: Plan, b: Brief): Lesson {
  const year = l.curriculum.year;
  const main: Objective = { ...newObjective('main', year), ...plan.objectives.main };
  const objectives: Objective[] = [main];
  let comp: Objective | null = null;
  if (plan.objectives.comp && l.standards.comp.ls.length) { comp = { ...newObjective('comp', year), ...plan.objectives.comp }; objectives.push(comp); }
  l.mode = 'recommend';
  l.framework = plan.framework; l.frameworkReason = '';
  l.objectives = objectives; l.successCriteria = [];
  l.stages = plan.stages.map((s, i) => ({ id: uid(), key: s.key, title: s.title, minutes: s.minutes,
    activities: s.picks.length ? s.picks.map((x): Activity => newActivity({
      teacher: x.teacher, pupils: x.pupils, pattern: asPattern(x.recipe.pattern), aids: x.bbm.map((y) => y.name).join(', '),
      tiers: x.tiers, source: `Consilia Recommends: ${x.recipe.title}`,
      objectiveIds: i === 0 || i === plan.stages.length - 1 ? [] : x.role === 'comp' && comp ? [comp.id] : [main.id]
    })) : [newActivity()] }));
  const names = [...new Set(plan.stages.flatMap((s) => s.picks.flatMap((x) => [...x.bbm.map((y) => y.name), ...x.digital.map((d) => d.name)])))];
  l.aids = [l.aids, names.join(', ')].filter((x) => x.trim()).join('; ');
  l.vocabulary = b.words.join(', ');
  l.assessment = { evidence: plan.evidence, method: plan.method };
  l.skills21 = plan.skills21; l.values = l.values || plan.values; l.pedagogy = plan.pedagogy;
  if (!l.cce.trim()) l.cce = 'Language';
  const links = plan.stages.flatMap((s) => s.picks.flatMap((x) => x.digital)).filter((d) => d.url);
  const seen = new Set(l.links.map((x) => x.url));
  for (const d of links) { const url = d.url!(b.topic || b.mainSkill, year); if (!seen.has(url)) { seen.add(url); l.links.push({ label: d.name, url }); } }
  l.planB = { early: '', late: '', offline: '', noisy: '', absent: '' };
  fillPlanB(l);
  l.updatedAt = Date.now();
  return l;
}

/** The brief for a lesson built from the SoW, plus what the teacher typed. */
export function briefFrom(l: Lesson, x: Partial<Brief> = {}): Brief {
  const textRef = /p\.\s*\d+/i.test(l.sowNotes.materials) ? `textbook text (${(l.sowNotes.materials.match(/[^.;]*p\.\s*\d+[^.;]*/i)?.[0] ?? '').trim()})` : 'text for this lesson';
  return {
    year: l.curriculum.year, topic: l.topic, mainSkill: skillOfLs(l.standards.main.ls) || l.mainSkill.replace(/[;.,\s]+$/, ''), compSkill: skillOfLs(l.standards.comp.ls) || l.compSkill, focus: l.focus, durationMin: l.header.durationMin,
    words: [], sentence: '', textRef, goals: [], prepMinutes: 30, pupils: l.header.pupils, ...x
  };
}
