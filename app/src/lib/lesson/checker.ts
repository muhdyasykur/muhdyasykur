import type { Lesson, Activity, Stage } from './model';
import { compose, skillOfLs } from './objectives';
import { smartFor } from './derive';
import { FRAMEWORKS, recommend, checkTiming } from './frameworks';

/**
 * The alignment and quality checker (blueprint F12): 29 rules in six groups.
 * Rules never block saving or printing. A teacher can mark a rule as fine with a reason.
 * Bump RULES_VERSION whenever a rule changes meaning, so old scores can be told apart.
 */
export const RULES_VERSION = 1;
export type Group = 'Standards' | 'Objectives' | 'Alignment' | 'Framework' | 'Timing' | 'Inclusion';
export type Step = 'setup' | 'standards' | 'objectives' | 'flow' | 'materials' | 'planb';
export type Status = 'pass' | 'fail' | 'skip' | 'accepted';
export interface Rule { id: string; group: Group; title: string; weight: number; step: Step; check: (l: Lesson) => { status: 'pass' | 'fail' | 'skip'; message: string } }
export interface Result { rule: Rule; status: Status; message: string; note?: string }

const filled = (a: Activity) => !!(a.teacher.trim() || a.pupils.trim());
const delivery = (l: Lesson) => l.stages.slice(1, -1);
const deliveryActs = (l: Lesson) => delivery(l).flatMap((s) => s.activities.filter(filled));
const textOf = (s: Stage | undefined) => (s ? s.activities.map((a) => [a.teacher, a.pupils, a.tiers.mod].join(' ')).join(' ') : '');
const stage = (l: Lesson, key: string) => l.stages.find((s) => s.key === key);
const pass = (message: string) => ({ status: 'pass' as const, message });
const fail = (message: string) => ({ status: 'fail' as const, message });
const skip = (message: string) => ({ status: 'skip' as const, message });
const list = (xs: string[]) => xs.join(', ');

function smartRule(letter: 'S' | 'M' | 'A' | 'R' | 'T', title: string): Rule {
  return { id: `smart-${letter}`, group: 'Objectives', title, weight: 2, step: 'objectives', check: (l) => {
    const objs = l.objectives.filter((o) => compose(o));
    if (!objs.length) return fail('Write at least one objective.');
    const bad = objs.map((o) => ({ o, r: smartFor(l, o).find((x) => x.letter === letter)! })).filter((x) => !x.r.ok);
    return bad.length ? fail(bad.map((b) => `${b.o.role === 'main' ? 'M' : 'C'}: ${b.r.message}`).join(' ')) : pass(`Every objective passes ${letter}.`);
  } };
}

const TEXT = /\b(text|story|song|poem|passage|chant|rhyme|listen|read|audio|track|video|dialogue|letter|email|article|book|page)\b/i;
const CONTROLLED = /\b(drill|repeat|gap[- ]?fill|fill in|copy|match|choral|chorally|tick|circle|underline)\b/i;
const FREE = /\b(own|create|plan|write (a|their|about)|tell|talk|role[- ]?play|present|discuss|share|interview|survey|design|personal|about (themselves|yourself|their)|paragraph|story|advice|opinion|describe)\b/i;
const PUPIL_REVIEW = /\b(pupils?|they|each other|partner|group|class)\b.*\b(say|share|tell|answer|write|show|recall|review|self[- ]?assess|check|vote|list|explain|summari[sz]e|reflect)/i;

export const RULES: Rule[] = [
  // ---- Standards
  { id: 'main-ls', group: 'Standards', title: 'Main Learning Standard chosen', weight: 3, step: 'standards', check: (l) => l.standards.main.ls.length ? pass(`Main LS ${list(l.standards.main.ls.map((x) => x.code))}.`) : fail('Choose the main Learning Standard.') },
  { id: 'comp-ls', group: 'Standards', title: 'Complementary Learning Standard chosen', weight: 2, step: 'standards', check: (l) => l.standards.comp.ls.length ? pass(`Complementary LS ${list(l.standards.comp.ls.map((x) => x.code))}.`) : fail('The SoW pairs every lesson with a complementary skill. Choose its Learning Standard.') },
  // ---- Objectives
  { id: 'obj-per-ls', group: 'Objectives', title: 'Every standard has an objective', weight: 3, step: 'objectives', check: (l) => {
    const miss = (['main', 'comp'] as const).filter((r) => l.standards[r].ls.length && !l.objectives.some((o) => o.role === r && compose(o)));
    return miss.length ? fail(`Write an objective for the ${miss.map((m) => (m === 'main' ? 'main' : 'complementary')).join(' and ')} standard.`) : pass('Main and complementary standards each have an objective.');
  } },
  smartRule('S', 'Objectives are specific'), smartRule('M', 'Objectives are measurable'), smartRule('A', 'Objectives are achievable'),
  smartRule('R', 'Objectives fit the skill'), smartRule('T', 'Objectives are time-bound'),
  { id: 'criteria', group: 'Objectives', title: 'Success criteria for every objective', weight: 1, step: 'objectives', check: (l) => {
    const objs = l.objectives.filter((o) => compose(o));
    const sc = new Map(l.successCriteria.map((s) => [s.objectiveId, s]));
    const missing = objs.filter((o) => { const s = sc.get(o.id); return s?.edited ? !s.text.trim() : !(o.free?.trim() || o.verb.trim()); });
    return objs.length && !missing.length ? pass('Pupils can see what success looks like.') : fail('Give every objective an "I can…" success criterion.');
  } },
  // ---- Alignment
  { id: 'obj-activity', group: 'Alignment', title: 'Every objective is taught', weight: 3, step: 'flow', check: (l) => {
    const used = new Set(deliveryActs(l).flatMap((a) => a.objectiveIds));
    const orphan = l.objectives.filter((o) => compose(o) && !used.has(o.id));
    return orphan.length ? fail(`No lesson-delivery activity serves ${orphan.map((o) => (o.role === 'main' ? 'the main' : 'the complementary') + ' objective').join(' or ')}. Tick it under "Serves".`) : pass('Every objective has at least one activity.');
  } },
  { id: 'activity-obj', group: 'Alignment', title: 'Every activity serves an objective', weight: 3, step: 'flow', check: (l) => {
    if (!deliveryActs(l).length) return skip('No lesson-delivery activities yet.');
    const loose = delivery(l).flatMap((s) => s.activities.filter((a) => filled(a) && !a.objectiveIds.length).map(() => s.title));
    return loose.length ? fail(`${loose.length} activit${loose.length > 1 ? 'ies' : 'y'} in ${list([...new Set(loose)])} serve no objective. Link it or remove it.`) : pass('No activity is there without a reason.');
  } },
  { id: 'comp-practised', group: 'Alignment', title: 'Complementary skill is practised', weight: 3, step: 'flow', check: (l) => {
    if (!l.standards.comp.ls.length) return skip('No complementary standard yet.');
    const ids = new Set(l.objectives.filter((o) => o.role === 'comp').map((o) => o.id));
    return deliveryActs(l).some((a) => a.objectiveIds.some((id) => ids.has(id))) ? pass('The complementary skill has its own activity.') : fail('The SoW says the complementary skill must not be dropped. Link an activity to the C objective.');
  } },
  { id: 'assessed', group: 'Alignment', title: 'Assessment is planned', weight: 3, step: 'materials', check: (l) => l.assessment.evidence.trim() && l.assessment.method.trim() ? pass('Evidence and method are planned.') : fail('Say what pupils produce (evidence) and how you will check it (method).') },
  { id: 'stages-filled', group: 'Alignment', title: 'Every stage has an activity', weight: 2, step: 'flow', check: (l) => {
    const empty = l.stages.filter((s) => !s.activities.some(filled)).map((s) => s.title);
    return empty.length ? fail(`Nothing planned in: ${list(empty)}.`) : pass('Every stage has at least one activity.');
  } },
  { id: 'pupils-active', group: 'Alignment', title: 'Pupils are active', weight: 1, step: 'flow', check: (l) => {
    const acts = deliveryActs(l);
    const quiet = acts.filter((a) => !a.pupils.trim());
    if (!acts.length) return fail('Plan the lesson delivery first.');
    return quiet.length > acts.length / 2 ? fail(`${quiet.length} of ${acts.length} activities do not say what pupils do. Fill in "Pupils do".`) : pass('Pupils have something to do in most activities.');
  } },
  // ---- Framework
  { id: 'fw-fit', group: 'Framework', title: 'Framework suits the main skill', weight: 2, step: 'flow', check: (l) => {
    if (!l.mainSkill) return skip('Choose the main standard first.');
    const r = recommend(l.mainSkill, l.curriculum.year, l.focus);
    if (l.framework === r.id) return pass(`${FRAMEWORKS[l.framework].short} suits ${l.mainSkill || 'this lesson'}.`);
    if (r.alternatives.some((a) => a.id === l.framework)) return pass(`${FRAMEWORKS[l.framework].short} is an accepted alternative.`);
    return l.frameworkReason.trim() ? pass(`Your reason: ${l.frameworkReason.trim()}`) : fail(`${FRAMEWORKS[r.id].short} is recommended for ${l.mainSkill}. Switch, or write why you chose ${FRAMEWORKS[l.framework].short}.`);
  } },
  { id: 'pwp-text', group: 'Framework', title: 'PWP lesson has a text', weight: 1, step: 'flow', check: (l) => {
    if (!['pwp', 'hybrid', 'la'].includes(l.framework)) return skip('Only for PWP lessons.');
    return TEXT.test(textOf(stage(l, 'while')) + ' ' + textOf(stage(l, 'pre'))) ? pass('Pupils work with a text, song or recording.') : fail('PWP needs a text or recording. Name it in the while-stage (e.g. "Read the story on p. 56").');
  } },
  { id: 'pwp-post', group: 'Framework', title: 'Post-stage stays with the text', weight: 1, step: 'flow', check: (l) => {
    if (!['pwp', 'hybrid'].includes(l.framework)) return skip('Only for PWP lessons.');
    const post = textOf(stage(l, 'post')).toLowerCase();
    const topic = (l.topic + ' ' + l.vocabulary).toLowerCase().split(/[^a-z']+/).filter((w) => w.length > 3);
    return post.trim() && (TEXT.test(post) || topic.some((w) => post.includes(w))) ? pass('The post-stage responds to the same text or topic.') : fail('A post-stage should respond to the same text (retell, give an opinion, write a reply), not start a new topic.');
  } },
  { id: 'pwp-pre', group: 'Framework', title: 'Pre-stage leaves room for the text', weight: 1, step: 'flow', check: (l) => {
    if (!['pwp', 'hybrid', 'la'].includes(l.framework)) return skip('Only for PWP lessons.');
    const pre = stage(l, 'pre'), wh = stage(l, 'while');
    return pre && wh && pre.minutes > wh.minutes ? fail('The pre-stage is longer than the while-stage. Pre-teach only the words that would block understanding.') : pass('The while-stage is the longest part.');
  } },
  { id: 'ppp-production', group: 'Framework', title: 'Production is freer than practice', weight: 1, step: 'flow', check: (l) => {
    if (l.framework !== 'ppp') return skip('Only for PPP lessons.');
    const prod = textOf(stage(l, 'production')), prac = textOf(stage(l, 'practice'));
    if (!prod.trim()) return fail('Plan the production stage.');
    if (prac.trim() && prod.trim() === prac.trim()) return fail('Production repeats the practice task. Let pupils use the language in their own way.');
    return CONTROLLED.test(prod) && !FREE.test(prod) ? fail('Production looks controlled (drills, gap-fill, copying). Give pupils a task where they choose their own words.') : pass('Pupils use the language more freely in production.');
  } },
  { id: 'process-stages', group: 'Framework', title: 'Writing goes through plan, draft and feedback', weight: 1, step: 'flow', check: (l) => {
    if (l.framework !== 'process') return skip('Only for Process Writing.');
    const plan = textOf(stage(l, 'planning')).trim(), draft = textOf(stage(l, 'drafting')).trim(), rev = textOf(stage(l, 'revising'));
    if (!plan || !draft) return fail('Plan both the planning and the drafting stages.');
    return /\b(feedback|peer|revise|improve|edit|check|correct)\b/i.test(rev) ? pass('Pupils plan, draft and improve their writing.') : fail('Add feedback in the revising stage (peer check against the success criteria, then improve).');
  } },
  { id: 'la-creative', group: 'Framework', title: 'Language Arts ends in performance or creation', weight: 1, step: 'flow', check: (l) => {
    if (!/language arts/i.test(l.mainSkill) && l.framework !== 'la') return skip('Only for Language Arts lessons.');
    const t = l.stages.slice(-2).map(textOf).join(' ');
    return /\b(perform|create|act|draw|sing|recite|illustrate|chant|role[- ]?play|own (verse|version|poem|story|ending)|present)\b/i.test(t) ? pass('Pupils perform or create.') : fail('Language Arts is about enjoyment. End with pupils performing, illustrating or creating their own version.');
  } },
  { id: 'tblt-report', group: 'Framework', title: 'Task cycle ends in a report', weight: 1, step: 'flow', check: (l) => {
    if (l.framework !== 'tblt') return skip('Only for task-based lessons.');
    return /\b(report|present|share|tell the class|show)\b/i.test(textOf(stage(l, 'task-cycle'))) ? pass('Groups report back.') : fail('In the task cycle, groups should plan and report to the class.');
  } },
  // ---- Timing
  { id: 'time-total', group: 'Timing', title: 'Stage times add up to the lesson', weight: 3, step: 'flow', check: (l) => {
    const e = checkTiming(l.stages, l.header.durationMin).find((i) => i.level === 'error');
    return e ? fail(e.message) : pass(`${l.header.durationMin} minutes, fully planned.`);
  } },
  { id: 'time-balance', group: 'Timing', title: 'No stage takes over the lesson', weight: 1, step: 'flow', check: (l) => {
    const w = checkTiming(l.stages, l.header.durationMin).find((i) => i.message.includes('more than half'));
    return w ? fail(w.message) : pass('Time is spread sensibly.');
  } },
  { id: 'post-lesson', group: 'Timing', title: 'Post-lesson is pupil-led', weight: 2, step: 'flow', check: (l) => {
    const p = l.stages[l.stages.length - 1];
    if (!p || p.minutes < 3) return fail('Give the Post-lesson at least 3 minutes.');
    const t = p.activities.map((a) => a.teacher + ' ' + a.pupils).join(' ');
    const onlySummary = /\b(teacher )?summari[sz]es?\b/i.test(t) && !p.activities.some((a) => a.pupils.trim());
    return !onlySummary && (p.activities.some((a) => a.pupils.trim()) || PUPIL_REVIEW.test(t)) ? pass('Pupils review their own learning.') : fail('The SoW wants pupils to review the lesson. Say what pupils do in the Post-lesson, not only a teacher summary.');
  } },
  // ---- Inclusion
  { id: 'differentiation', group: 'Inclusion', title: 'Differentiation is planned', weight: 2, step: 'flow', check: (l) => {
    const tiered = deliveryActs(l).filter((a) => [a.tiers.low, a.tiers.mod, a.tiers.high].filter((t) => t.trim()).length >= 2);
    return tiered.length ? pass(`${tiered.length} activit${tiered.length > 1 ? 'ies have' : 'y has'} Low / Moderate / High versions.`) : fail('Add at least two tier versions (Low, Moderate, High) to one lesson-delivery activity.');
  } },
  { id: 'cce-21', group: 'Inclusion', title: 'CCE and 21st-century skills named', weight: 1, step: 'setup', check: (l) => {
    const miss = [!l.cce.trim() && 'cross-curricular element', !l.skills21.trim() && '21st-century skills'].filter(Boolean);
    return miss.length ? fail(`Name the ${miss.join(' and ')}.`) : pass(`${l.cce} · ${l.skills21}`);
  } },
  { id: 'plan-b', group: 'Inclusion', title: 'Plan B is ready', weight: 1, step: 'planb', check: (l) => {
    const n = Object.values(l.planB).filter((v) => v.trim()).length;
    return n >= 3 ? pass(`${n} of 5 backup plans written.`) : fail(`Only ${n} of 5 backup plans. At least "finished early", "running late" and "no internet" are worth having.`);
  } }
];

export interface Report { score: number; results: Result[]; failing: Result[]; version: number }

/** Run every rule. Score = weighted share of applicable rules that pass (or are marked fine), 0–100. */
export function runChecks(l: Lesson): Report {
  const notes = l.checkNotes ?? {};
  const results: Result[] = RULES.map((rule) => {
    const r = rule.check(l);
    if (r.status === 'fail' && notes[rule.id]) return { rule, status: 'accepted', message: r.message, note: notes[rule.id] };
    return { rule, status: r.status, message: r.message };
  });
  const applicable = results.filter((r) => r.status !== 'skip');
  const total = applicable.reduce((a, r) => a + r.rule.weight, 0);
  const got = applicable.filter((r) => r.status !== 'fail').reduce((a, r) => a + r.rule.weight, 0);
  const failing = results.filter((r) => r.status === 'fail').sort((a, b) => b.rule.weight - a.rule.weight);
  return { score: total ? Math.round((got / total) * 100) : 0, results, failing, version: RULES_VERSION };
}
export const GROUPS: Group[] = ['Standards', 'Objectives', 'Alignment', 'Framework', 'Timing', 'Inclusion'];
export { skillOfLs };
