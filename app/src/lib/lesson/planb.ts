import type { Lesson, PlanB } from './model';

/**
 * Suggest the five Plan B answers from the lesson itself (blueprint F13).
 * Suggestions only fill empty cards unless the teacher asks to replace a card.
 */
const ONLINE = /\b(slides?|power ?point|smart ?board|projector|video|youtube|online|wordwall|kahoot|quizizz|canva|liveworksheets|internet|laptop|tablet|ipad|website|digital|audio|cd|track)\b/gi;
const GROUPWORK = /\b(group|groups|pairs|pair work|gallery walk|role[- ]?play|game|song|music)\b/i;

const first = (s: string, n = 120) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };

export function suggestPlanB(l: Lesson): PlanB {
  const mid = l.stages.slice(1, -1);
  const acts = mid.flatMap((s) => s.activities.map((a) => ({ s, a })));
  const filled = acts.filter(({ a }) => a.teacher.trim() || a.pupils.trim());
  const topic = l.topic.trim() || 'the lesson topic';

  // Finished early: the High tier of the last tiered activity, or an extension on the topic
  const high = [...filled].reverse().find(({ a }) => a.tiers.high.trim());
  const early = high
    ? `Fast finishers do the High task from ${high.s.title}: ${first(high.a.tiers.high)} Then they help a partner check their work against the success criteria.`
    : `Fast finishers write two more sentences about ${topic}, then swap with a partner and check them against the success criteria.`;

  // Running late: shorten the longest stage that is not the core of the main objective; never cut the Post-lesson
  const main = l.objectives.find((o) => o.role === 'main')?.id;
  const core = mid.filter((s) => s.activities.some((a) => main && a.objectiveIds.includes(main)));
  const cuttable = [...mid].sort((a, b) => b.minutes - a.minutes).find((s) => s.activities.length > 1) ?? [...mid].sort((a, b) => b.minutes - a.minutes).find((s) => !core.includes(s) || core.length > 1) ?? mid[0];
  const lastAct = cuttable?.activities.filter((a) => a.teacher.trim() || a.pupils.trim()).at(-1);
  const late = cuttable
    ? `Shorten ${cuttable.title} by about 5 minutes${lastAct && cuttable.activities.length > 1 ? `: drop "${first(lastAct.teacher || lastAct.pupils, 60)}"` : ''}. Pupils finish the written work as homework. Keep the Post-lesson so pupils still review what they learnt.`
    : 'Cut the last practice task and set it as homework. Keep the Post-lesson.';

  // No internet or power: name each online or powered resource and its offline twin
  const all = [l.aids, ...acts.flatMap(({ a }) => [a.aids, a.teacher]), ...l.links.map((x) => x.label + ' ' + x.url)].join(' ');
  const found = [...new Set((all.match(ONLINE) ?? []).map((w) => w.toLowerCase()))];
  const twin = (w: string) => (/slide|power|smart|projector/.test(w) ? 'write the key examples on the board or use printed copies'
    : /video|youtube/.test(w) ? 'tell or read the story aloud with picture cards'
    : /audio|cd|track/.test(w) ? 'read the listening script aloud yourself'
    : /wordwall|kahoot|quizizz|liveworksheets|online|website|digital|internet/.test(w) ? 'run the same quiz on the board with mini whiteboards or hands up'
    : /canva/.test(w) ? 'print the design beforehand or draw it on manila card'
    : 'use a printed or board version');
  const offline = found.length
    ? `This lesson uses ${found.join(', ')}. Without internet or power: ${[...new Set(found.map(twin))].join('; ')}. Keep one printed copy of every worksheet.`
    : 'Already offline-ready: nothing in this lesson needs internet or power.';

  // Class too noisy
  const busy = filled.find(({ a }) => GROUPWORK.test(a.teacher + ' ' + a.pupils + ' ' + a.pattern));
  const noisy = `Use the attention signal you practised (clap-back "1, 2, 3, eyes on me!"), then wait for silence before speaking. ${busy ? `If ${busy.s.title} gets too loud, switch from ${/pair/i.test(busy.a.pattern + busy.a.pupils) ? 'pairs' : 'groups'} to individual work for a few minutes.` : 'Move to individual work for a few minutes.'} Give one group point to the quietest working group.`;

  // Many pupils absent
  const absent = `Regroup so every group still has a stronger reader or writer. Pair any pupil left alone with a buddy. Absent pupils catch up next lesson with the success criteria${l.vocabulary.trim() ? ` and the key words (${first(l.vocabulary, 60)})` : ''}.`;

  return { early, late, offline, noisy, absent };
}

/** Fill only the empty cards. */
export function fillPlanB(l: Lesson): number {
  const s = suggestPlanB(l);
  let n = 0;
  for (const k of Object.keys(s) as (keyof PlanB)[]) if (!l.planB[k].trim()) { l.planB[k] = s[k]; n++; }
  return n;
}
