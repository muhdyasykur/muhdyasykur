import { tr } from '../i18n/index.svelte';
import { parseMarkdown, textOf, type Block, type Inline, type Item } from './markdown';
import { parsePlan, strip, type StageKey } from './parse';
import { LEVEL, textLength, type Values } from './tools';

/**
 * Quality checks on a Studio result: does it have what the teacher asked for, in a form that works in class? Each
 * check is passed ('ok'), a problem with a one-tap fix ('fix': an instruction the page sends back to the AI), or a
 * note for the teacher ('note'). The checks read the Markdown the prompts ask for (and cope with answers pasted from
 * another chat); they never change the result themselves. Texts are shown through tr(); fixes stay in English
 * because they are sent to the AI with the English prompt.
 */
export type CheckState = 'ok' | 'fix' | 'note';
export interface Check { id: string; state: CheckState; text: string; fix?: string }
export interface CheckOptions {
  /** Learning standard codes of the Scheme of Work lesson the result is based on. */
  sowCodes?: string[];
  /** Every learning standard code for the year (to catch codes an AI made up). */
  yearCodes?: string[];
}
/** Longest sentence, in words, that suits each year (matches LEVEL in tools.ts). */
export const MAX_WORDS: Record<number, number> = { 1: 6, 2: 7, 3: 9, 4: 10, 5: 12, 6: 14 };

const ok = (id: string, text: string): Check => ({ id, state: 'ok', text });
const fix = (id: string, text: string, instruction: string): Check => ({ id, state: 'fix', text, fix: instruction });
const note = (id: string, text: string): Check => ({ id, state: 'note', text });

// ---- reading the result
interface Section { raw: string; name: string; body: Block[] }
const unnumber = (s: string) => s.replace(/^\d{1,2}\s*[.):]\s*/, '');
function sectionsOf(blocks: Block[]): Section[] {
  const out: Section[] = [{ raw: '', name: '', body: [] }];
  for (const b of blocks) {
    if (b.t === 'h') { const raw = strip(textOf(b.c)); out.push({ raw, name: unnumber(raw), body: [] }); }
    else out[out.length - 1].body.push(b);
  }
  return out;
}
const itemLines = (items: Item[]): string[] => items.flatMap((i) => [textOf(i.c), ...(i.sub ? itemLines(i.sub.items) : [])]);
/** The text lines of some blocks (paragraphs, quotes and list items; not tables). */
function linesOf(body: Block[]): string[] {
  return body.flatMap((b) => (b.t === 'p' || b.t === 'quote' ? [textOf(b.c)] : b.t === 'ul' || b.t === 'ol' ? itemLines(b.items) : []))
    .flatMap((s) => s.split('\n')).map(strip).filter(Boolean);
}
const find = (ss: Section[], rx: RegExp) => ss.find((s) => rx.test(s.name));
const linesIn = (ss: Section[], rx: RegExp) => ss.filter((s) => rx.test(s.name)).flatMap((s) => linesOf(s.body));
/** The sections before the first one whose heading matches. */
const before = (ss: Section[], rx: RegExp) => { const i = ss.findIndex((s) => rx.test(s.name)); return i < 0 ? ss : ss.slice(0, i); };
const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu;
const wordsIn = (s: string) => s.match(WORD)?.length ?? 0;
const wordsOf = (lines: string[]) => lines.reduce((n, l) => n + wordsIn(l), 0);
const list = (s = '') => s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
const hasBold = (xs: Inline[]): boolean => xs.some((x) => x.t === 'b' || (x.t === 'i' && hasBold(x.c)));
const bodyHasBold = (body: Block[]) => body.some((b) => (b.t === 'p' || b.t === 'quote' ? hasBold(b.c) : b.t === 'ul' || b.t === 'ol' ? b.items.some((i) => hasBold(i.c)) : false));
const tables = (blocks: Block[]) => blocks.filter((b): b is Extract<Block, { t: 'table' }> => b.t === 'table');
const cell = (c: Inline[] | undefined) => strip(textOf(c ?? []));

/** The raw Markdown of the sections before the first heading that matches (or all of it). */
function rawBefore(md: string, rx: RegExp): string {
  const out: string[] = [];
  for (const line of md.replace(/\r/g, '').split('\n')) {
    const h = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line);
    if (h && rx.test(unnumber(strip(h[1])))) break;
    out.push(line);
  }
  return out.join('\n');
}
/** The raw Markdown of the first section whose heading matches, without its heading. */
function rawSection(md: string, rx: RegExp): string {
  const out: string[] = [];
  let inside = false;
  for (const line of md.replace(/\r/g, '').split('\n')) {
    const h = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line);
    if (h) { if (inside) break; inside = rx.test(unnumber(strip(h[1]))); continue; }
    if (inside) out.push(line);
  }
  return out.join('\n');
}

// ---- questions with options and answers (quizzes, riddles, comprehension)
interface Q { opts: { l: string; t: string }[]; a: string }
function questionsIn(md: string): Q[] {
  const out: Q[] = [];
  let cur: Q | null = null;
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const line = strip(raw.replace(/^\s*#{1,6}\s*/, '').replace(/^\s*>\s*/, ''));
    if (!line) continue;
    const ans = /^[-•*]?\s*(?:answers?|possible answers?|jawapan|ans)\s*[:：-]\s*(.*)$/i.exec(line);
    if (ans) { if (cur && !cur.a) cur.a = ans[1].trim() || '…'; continue; }
    if (cur && !cur.a) {
      const opts = [...line.matchAll(/(?:^|\s)\(?([A-Fa-f])[).]\s+(.+?)(?=\s+\(?[A-Fa-f][).]\s|$)/g)];
      if (opts.length && /^[-•*]?\s*\(?[A-Fa-f][).]\s/.test(line)) { for (const o of opts) cur.opts.push({ l: o[1].toUpperCase(), t: o[2].trim() }); continue; }
    }
    if (/^(?:[-•*]\s*)?(?:q(?:uestion)?\s*)?\d{1,2}\s*[.):]\s*\S/i.test(line)) { cur = { opts: [], a: '' }; out.push(cur); }
  }
  return out;
}
const answerMatches = (q: Q) => {
  const letter = /^\(?([A-F])\)?(?=[\s.):]|$)/i.exec(q.a)?.[1]?.toUpperCase();
  const a = q.a.toLowerCase().replace(/[.\s]+$/, '');
  return (!!letter && q.opts.some((o) => o.l === letter)) || q.opts.some((o) => o.t.toLowerCase().replace(/[.\s]+$/, '') === a);
};
function questionChecks(q: Q[], want: number, riddles = false): Check[] {
  const n = q.length;
  const unanswered = q.filter((x) => !x.a).length;
  return [
    n === want ? ok('count', riddles ? tr('{n} riddles, as asked', { n }) : tr('{n} questions, as asked', { n }))
      : fix('count', riddles ? tr('Riddles: {n} instead of {want}', { n, want }) : tr('Questions: {n} instead of {want}', { n, want }),
        `Make it exactly ${want} numbered ${riddles ? 'riddles' : 'questions'}, each followed by a line starting "Answer:".`),
    unanswered ? fix('answers', riddles ? tr('Riddles without an "Answer:" line: {n}', { n: unanswered }) : tr('Questions without an "Answer:" line: {n}', { n: unanswered }), `After every ${riddles ? 'riddle' : 'question'}, add a line starting "Answer:" with the correct answer.`)
      : ok('answers', tr('Every one has an answer'))
  ];
}

// ---- checks for every tool
type Need = [string, RegExp];
function sectionCheck(ss: Section[], need: Need[]): Check | null {
  if (!need.length) return null;
  const miss = need.filter(([, rx]) => !find(ss, rx)).map(([n]) => n);
  return miss.length
    ? fix('sections', tr('Missing sections: {x}', { x: miss.join(', ') }), `Add the missing sections, with these headings: ${miss.map((m) => `## ${m}`).join(', ')}. Keep everything else as it is.`)
    : ok('sections', tr('All {n} sections are there', { n: need.length }));
}
/** Parts written for the teacher inside a pupils' tool, which do not need to be at the pupils' level. */
const TEACHER_PART = /game|how to use|teaching it|make it longer|what changed|using them|fast finisher|talk about|^actions?\b|role cards?|word help|word bank|^answers?$|mistakes|evidence|^check/i;
function levelCheck(ss: Section[], year: number): Check | null {
  const lens: number[] = [];
  for (const s of ss) {
    if (TEACHER_PART.test(s.name)) continue;
    for (const l of linesOf(s.body)) {
      // labels for the teacher, and answer options (short by nature)
      if (/^(?:answers?|possible answers?|check|you need|steps?|time|grouping|teacher|pupils|teaching aids|picture idea)\s*:/i.test(l) || /^\(?[A-Fa-f][).]\s/.test(l)) continue;
      const body = l.replace(/^[A-Z][\p{L}'’. ]{0,20}:\s+/u, '');
      for (const part of body.split(/(?<=[.!?…])\s+/)) { const n = wordsIn(part); if (n) lens.push(n); }
    }
  }
  if (lens.length < 4) return null;
  const max = MAX_WORDS[year];
  const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
  const n = Math.round(avg * 10) / 10;
  if (avg > max * 1.25 || lens.filter((x) => x > max + 5).length / lens.length > 0.25)
    return fix('level', tr('Sentences are long for Year {y}: {n} words on average (aim for {max} or fewer)', { y: year, n, max }),
      `Make the language easier for Year ${year} pupils: sentences of no more than ${max} words, and common everyday words. ${LEVEL[year]}`);
  return ok('level', tr('Sentences suit Year {y}: {n} words on average', { y: year, n }));
}
/** Common American spellings and words, and the British English that Malaysian schools use. */
const UK: Record<string, string> = {
  color: 'colour', colors: 'colours', colorful: 'colourful', colored: 'coloured', coloring: 'colouring', favorite: 'favourite', favorites: 'favourites',
  flavor: 'flavour', flavors: 'flavours', neighbor: 'neighbour', neighbors: 'neighbours', neighborhood: 'neighbourhood', behavior: 'behaviour',
  honor: 'honour', humor: 'humour', center: 'centre', centers: 'centres', theater: 'theatre', liter: 'litre', liters: 'litres', kilometer: 'kilometre',
  kilometers: 'kilometres', centimeter: 'centimetre', centimeters: 'centimetres', gray: 'grey', mom: 'mum', moms: 'mums', math: 'maths',
  organize: 'organise', organized: 'organised', organizing: 'organising', organization: 'organisation', realize: 'realise', realized: 'realised',
  recognize: 'recognise', recognized: 'recognised', memorize: 'memorise', summarize: 'summarise', apologize: 'apologise', analyze: 'analyse',
  categorize: 'categorise', practicing: 'practising', practiced: 'practised', traveling: 'travelling', traveled: 'travelled', traveler: 'traveller',
  canceled: 'cancelled', jewelry: 'jewellery', catalog: 'catalogue', cozy: 'cosy', pajamas: 'pyjamas', airplane: 'aeroplane', vacation: 'holiday',
  soccer: 'football', candy: 'sweets', trash: 'rubbish', garbage: 'rubbish', sidewalk: 'pavement', elevator: 'lift'
};
function spellingCheck(md: string): Check {
  const found = new Map<string, string>();
  for (const w of md.match(/\p{L}+/gu) ?? []) { const k = w.toLowerCase(); if (UK[k] && !found.has(k)) found.set(k, UK[k]); }
  const pairs = [...found].slice(0, 8);
  return pairs.length
    ? fix('spelling', tr('American spelling: {x}', { x: pairs.map(([us, uk]) => `${us} → ${uk}`).join(', ') }), `Use British English spelling and words: ${pairs.map(([us, uk]) => `"${uk}" instead of "${us}"`).join(', ')}.`)
    : ok('spelling', tr('British English spelling'));
}
function placeholderCheck(md: string): Check | null {
  const holders = [...new Set(md.match(/\[[^\]\n]*\p{L}{2,}[^\]\n]*\](?!\()/gu) ?? [])].slice(0, 6);
  return holders.length ? note('blanks', tr('Fill in before you use it: {x}', { x: holders.join(', ') })) : null;
}

// ---- section lists for each tool
const STAGES: [StageKey, string][] = [['pre', 'Pre-lesson'], ['presentation', 'Presentation'], ['practice', 'Practice'], ['production', 'Production'], ['post', 'Post-lesson']];
const REFLECT: Record<string, Need[]> = {
  'What? So what? Now what?': [['What?', /^(?:what|apa)\b/i], ['So what?', /so what|jadi apa|maka apa/i], ['Now what?', /now what|sekarang apa|kini apa|apa seterusnya/i]],
  'Gibbs\' reflective cycle': [['Description', /descri|penerangan|huraian|gambaran/i], ['Feelings', /feeling|perasaan/i], ['Evaluation', /evaluat|penilaian/i], ['Analysis', /analy|analisis/i], ['Conclusion', /conclu|kesimpulan|rumusan/i]],
  'Kolb\'s learning cycle': [['Concrete experience', /concrete|konkrit/i], ['Reflective observation', /observation|pemerhatian/i], ['Abstract conceptualisation', /abstract|abstrak/i], ['Active experimentation', /active|aktif/i]]
};
const SECTIONS: Record<string, (v: Values) => Need[]> = {
  'lesson-plan': () => [['Lesson overview', /overview/i], ['Learning standards', /standard/i], ['Learning objectives', /objective/i], ['Success criteria', /success/i],
    ['Key vocabulary and target language', /vocabulary|target language/i], ['Teaching aids', /teaching aids|materials|resources/i],
    ['Pre-lesson', /^pre[- ]?lesson|set induction/i], ['Presentation', /^presentation/i], ['Practice', /^practi[cs]e/i], ['Production', /^production/i],
    ['Post-lesson', /^post[- ]?lesson|closure/i], ['Differentiation', /differentiation/i], ['Assessment', /assessment/i],
    ['Cross-curricular elements and 21st-century skills', /cross[- ]?curricular|21st/i], ['Reflection prompts', /reflection/i]],
  connections: () => [['Why it matters', /why it matters/i], ['Connections', /^connections/i], ['Questions to ask pupils', /questions/i], ['A mini task', /task/i]],
  text: () => [['Word help', /word help/i], ['Questions', /questions/i]],
  level: () => [['Levelled text', /levell?ed|text/i], ['What changed', /what changed|changes/i], ['Word help', /word help/i]],
  vocab: () => [['Word list', /word list/i], ['Word families', /word famil/i], ['Three quick games', /games?/i]],
  dialogue: () => [['Role cards', /role cards?/i], ['Make it longer', /make it longer|extend/i]],
  phonics: () => [['Words with this sound', /words with/i], ['Odd one out', /odd one out/i], ['Tongue twister', /tongue twister/i], ['Decodable sentences', /decodable/i], ['A quick game', /game/i]],
  grammar: () => [['Explain it simply', /explain/i], ['Examples', /^examples?/i], ['Common mistakes', /mistakes/i], ['Practice', /^practi[cs]e/i], ['Answers', /^answers?/i]],
  questions: () => [['Remember', /^remember/i], ['Understand', /^understand/i], ['Apply', /^apply/i], ['Analyse (KBAT)', /^analy[sz]e/i], ['Evaluate (KBAT)', /^evaluate/i], ['Create (KBAT)', /^create/i], ['Using them in class', /using them|in class/i]],
  rubric: () => [['Rubric', /rubric/i], ['Pupil checklist', /checklist/i], ['Evidence to keep', /evidence/i]],
  exit: () => [['1. 3-2-1', /3[\s,-]*2[\s,-]*1/], ['2. Traffic lights', /traffic/i], ['3. One sentence', /one sentence/i], ['4. Quick quiz', /quiz/i]],
  feedback: () => [['Two stars', /stars?/i], ['A wish', /wish/i], ['Corrected version', /corrected/i], ['Mistakes to teach', /mistakes/i], ['Next step for the pupil', /next step/i]],
  scaffold: () => [['Word bank', /word bank/i], ['Sentence frames', /sentence frames?/i], ['Model answer', /model/i], ['For fast finishers', /finisher/i]],
  'pupil-help': () => [['Before the lesson', /before/i], ['During the lesson', /during/i], ['Materials that help', /materials/i], ['Check how it went', /check|how it went/i], ['Kind words to say', /kind words|encourag/i]],
  song: () => [['Actions', /actions?/i], ['Teaching it in three steps', /teaching|steps/i]],
  story: () => [['Part 1', /part\s*1|beginning/i], ['What should happen next?', /happen next|what should/i], ['Path A', /path\s*a\b/i], ['Path B', /path\s*b\b/i], ['Talk about it', /talk about/i]],
  riddles: () => [['How to use them', /how to use/i]],
  reflection: (v) => [...(v.lang === 'Bahasa Melayu' ? [] : REFLECT[v.model] ?? []), ['Action plan', /action plan|pelan tindakan/i]],
  parents: (v) => (v.lang === 'Bahasa Melayu and English' ? [['Bahasa Melayu', /melayu/i], ['English', /^english/i]] : [])
};
/** Tools whose results pupils read or hear, so the sentences must suit their year. */
const FOR_PUPILS = new Set(['text', 'level', 'dialogue', 'phonics', 'grammar', 'quiz', 'questions', 'exit', 'scaffold', 'song', 'story', 'riddles']);

// ---- checks for each tool
interface Ctx { md: string; blocks: Block[]; ss: Section[]; v: Values; year: number; o: CheckOptions }
const VAGUE = /\b(?:able to|will|can)\s+(?:\w+ly\s+)?(understand|know|learn|appreciate|be aware of|become aware of|enjoy|be familiar with|explore|be exposed to|get to know|be introduced to)\b/i;
const VAGUE_START = /^(?:\d+[.)]\s*)?(understand|know|learn|appreciate|enjoy|explore)\b/i;
const MEASURE = /\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|all)\b|correctly|accurately|at least|without help|with (?:little|minimal) (?:help|guidance)|independently/i;
function partsMissing(parts: Section[], labels: Need[]): string[] {
  const miss = new Set<string>();
  for (const p of parts) { const ls = linesOf(p.body); for (const [n, rx] of labels) if (!ls.some((l) => rx.test(l))) miss.add(n); }
  return [...miss];
}
function wordsUsed(lines: string[], words: string[], id = 'words'): Check | null {
  if (!words.length) return null;
  const all = lines.join(' ').toLowerCase();
  const miss = words.filter((w) => !all.includes(w.toLowerCase()));
  return miss.length ? fix(id, tr('Key words not used: {x}', { x: miss.join(', ') }), `Use these key words: ${miss.join(', ')}.`) : ok(id, tr('All the key words are used'));
}

const TOOL: Record<string, (c: Ctx) => (Check | null)[]> = {
  'lesson-plan': ({ md, ss, v, year, o }) => {
    const p = parsePlan(md);
    const m = parseInt(v.minutes) || 60;
    const out: (Check | null)[] = [];
    if (STAGES.every(([k]) => p.stages[k])) {
      const mins = STAGES.map(([k]) => p.stages[k]!.minutes);
      const sum = mins.reduce<number>((a, b) => a + (b ?? 0), 0);
      out.push(mins.some((x) => !x)
        ? fix('minutes', tr('Some stages have no minutes in their heading'), `Put the minutes in every stage heading, for example "## Practice (15 minutes)", adding up to exactly ${m} minutes.`)
        : sum !== m ? fix('minutes', tr('The stages add up to {s} minutes, not {m}', { s: sum, m }), `Change the minutes of the five stages (in their headings) so they add up to exactly ${m} minutes, and fit the activities to the new times.`)
          : ok('minutes', tr('The five stages add up to {m} minutes', { m })));
      const noPupils = STAGES.filter(([k]) => !p.stages[k]!.pupils.length).map(([, n]) => n);
      out.push(noPupils.length
        ? fix('roles', tr('What pupils do is missing in: {x}', { x: noPupils.join(', ') }), 'In every stage, write bullet points starting "Teacher:" (what the teacher does) and "Pupils:" (what pupils do).')
        : ok('roles', tr('Every stage says what the teacher and the pupils do')));
    }
    if (find(ss, /objective/i)) {
      const objs = p.objectives.filter((l) => wordsIn(l) >= 4 && !/able to\s*:?\s*$/i.test(l));
      const vague = [...new Set(objs.map((l) => (VAGUE.exec(l) ?? VAGUE_START.exec(l))?.[1]?.toLowerCase()).filter((x): x is string => !!x))];
      out.push(!objs.length ? fix('objectives', tr('No learning objectives were found'), 'Add one or two measurable learning objectives, each starting "By the end of the lesson, pupils will be able to".')
        : vague.length ? fix('objectives', tr('Objectives use verbs you cannot see or measure: {x}', { x: vague.join(', ') }), 'Rewrite the learning objectives with verbs pupils can be seen doing (for example name, say, ask, answer, read, write, match) instead of understand, know or learn, and say how many or how well (for example "ask and answer at least four questions correctly").')
          : !objs.every((l) => MEASURE.test(l)) ? fix('objectives', tr('Objectives do not say how many or how well'), 'Make each learning objective measurable: say how many or how well (for example "write at least three sentences correctly" or "name five animals").')
            : ok('objectives', tr('Measurable objectives ({n})', { n: objs.length })));
    }
    if (find(ss, /success/i)) {
      const sc = p.criteria.filter((l) => wordsIn(l) >= 2 && !/:\s*$/.test(l));
      const ican = sc.filter((l) => /^(?:\d+[.)]\s*)?["“']?(?:I can|Saya boleh)\b/i.test(l));
      out.push(sc.length >= 2 && ican.length === sc.length ? ok('criteria', tr('{n} "I can" success criteria', { n: sc.length }))
        : fix('criteria', sc.length < 2 ? tr('Fewer than two success criteria') : tr('Not all success criteria are "I can" statements'), 'Write the success criteria as two or three short "I can …" statements in simple English that pupils understand, one for each objective.'));
    }
    if (find(ss, /differentiation/i)) {
      const miss = [[tr('Low'), p.tiers.low], [tr('Moderate'), p.tiers.mod], [tr('High'), p.tiers.high]].filter(([, x]) => !x).map(([n]) => n);
      out.push(miss.length ? fix('tiers', tr('Differentiation is missing: {x}', { x: miss.join(', ') }), 'Give differentiation for three levels, as bullet points starting "Low:", "Moderate:" and "High:".')
        : ok('tiers', tr('Differentiation for low, moderate and high')));
    }
    if (find(ss, /standard/i)) {
      const codes = p.codes;
      if (o.sowCodes?.length) {
        const miss = o.sowCodes.filter((c) => !codes.includes(c));
        out.push(miss.length ? fix('standards', tr('The learning standards do not match the Scheme of Work lesson (missing {x})', { x: miss.join(', ') }), `In the Learning standards section, give exactly these KSSR learning standards from the Scheme of Work lesson, with their codes: ${o.sowCodes.join(', ')}.`)
          : ok('standards', tr('The learning standards match the Scheme of Work: {x}', { x: o.sowCodes.join(', ') })));
      } else if (!codes.length) out.push(note('standards', tr('No learning standard codes yet: choose them in the lesson plan builder, or base the plan on a KSSR lesson.')));
      else if (o.yearCodes?.length) {
        const bad = codes.filter((c) => !o.yearCodes!.includes(c));
        out.push(bad.length ? fix('standards', tr('Not Year {y} learning standards: {x}', { y: year, x: bad.join(', ') }), `These codes are not KSSR Year ${year} learning standards: ${bad.join(', ')}. Replace them with real Year ${year} learning standards and their exact codes, or write "To be confirmed".`)
          : ok('standards', tr('Real Year {y} learning standards: {x}', { y: year, x: codes.join(', ') })));
      } else out.push(note('standards', tr('Check the learning standards ({x}) in the lesson plan builder.', { x: codes.join(', ') })));
    }
    return out;
  },
  hook: ({ ss }) => {
    const ideas = ss.filter((s) => /^\d{1,2}\s*[.):]/.test(s.raw));
    const miss = partsMissing(ideas, [['You need', /^you need/i], ['Steps', /^steps?\b/i], ['Pupils say or do', /^pupils/i], ['Leads into the lesson by', /^leads/i]]);
    return [
      ideas.length === 5 ? ok('ideas', tr('Five ideas, as asked')) : fix('ideas', tr('Ideas: {n} instead of five', { n: ideas.length }), 'Give exactly five ideas, with the headings "## 1." to "## 5.".'),
      ideas.length ? (miss.length ? fix('parts', tr('Some ideas are missing: {x}', { x: miss.join(', ') }), 'For every idea, include the bullet points "You need:", "Steps:", "Pupils say or do:" and "Leads into the lesson by:".') : ok('parts', tr('Every idea has all its parts'))) : null
    ];
  },
  activities: ({ ss }) => {
    const acts = ss.filter((s) => /^\d{1,2}\s*[.):]/.test(s.raw));
    const miss = partsMissing(acts, [['Time', /^time\b/i], ['Grouping', /^grouping/i], ['You need', /^you need/i], ['Steps', /^steps?\b/i], ['Language pupils use', /^language/i], ['Easier version', /^easier/i], ['Harder version', /^harder/i]]);
    return [
      acts.length === 3 ? ok('ideas', tr('Three activities, as asked')) : fix('ideas', tr('Activities: {n} instead of three', { n: acts.length }), 'Give exactly three activities, with the headings "## 1." to "## 3.".'),
      acts.length ? (miss.length ? fix('parts', tr('Some activities are missing: {x}', { x: miss.join(', ') }), 'For every activity, include the bullet points "Time:", "Grouping:", "You need:", "Steps:", "Language pupils use:", "Easier version:" and "Harder version:".') : ok('parts', tr('Every activity has all its parts'))) : null
    ];
  },
  text: ({ md, ss, v, year }) => {
    const n = wordsOf(before(ss, /word help|questions/i).flatMap((s) => linesOf(s.body)));
    const t = textLength(year, v.length);
    return [
      n >= t * 0.7 && n <= t * 1.35 ? ok('length', tr('The text is {n} words (about {t} asked)', { n, t }))
        : fix('length', tr('The text is {n} words; about {t} were asked', { n, t }), `Make the text itself about ${t} words long (it is ${n} now), keeping the same sections.`),
      ...questionChecks(questionsIn(rawSection(md, /questions/i)), 5),
      wordsUsed(before(ss, /word help|questions/i).flatMap((s) => linesOf(s.body)), list(v.words))
    ];
  },
  level: ({ ss, v }) => {
    const text = linesIn(ss, /levell?ed/i);
    return [wordsUsed(text.length ? text : ss.flatMap((s) => linesOf(s.body)), list(v.keep), 'keep')];
  },
  vocab: ({ blocks, v }) => {
    const t = tables(blocks)[0];
    if (!t) return [fix('table', tr('There is no word list table'), 'Put the word list in a table, with one row per word.')];
    const first = t.rows.map((r) => cell(r[0]).toLowerCase());
    const miss = list(v.words).filter((w) => !first.some((f) => f.includes(w.toLowerCase())));
    const head = t.head.map((h) => cell(h)).join(' ');
    return [
      miss.length ? fix('rows', tr('Words missing from the list: {x}', { x: miss.join(', ') }), `Add a row to the word list for each of these words: ${miss.join(', ')}.`) : ok('rows', tr('Every word has a row')),
      v.malay === 'English only' ? null : /melayu|malay|\bbm\b/i.test(head) ? ok('malay', tr('Malay meanings are included'))
        : fix('malay', tr('The Malay meanings are missing'), 'Add a "Bahasa Melayu" column to the word list table, with the Malay meaning of each word.')
    ];
  },
  dialogue: ({ ss, v }) => {
    const lines = before(ss, /role cards?|make it longer/i).flatMap((s) => linesOf(s.body));
    const turns = lines.map((l) => /^([A-Z][\p{L}'’.]*(?: [A-Z][\p{L}'’.]*){0,2})\s*:\s*\S/u.exec(l)?.[1]).filter((x): x is string => !!x);
    const speakers = new Set(turns).size;
    const want = Number(v.speakers) || 2;
    const chunks = (v.sentence ?? '').split(/…|\.\.\.|\?|!|\.|\//).map((c) => c.trim().toLowerCase().replace(/^(?:he|she|they|i|you|we|it)\s+/, '')).filter((c) => wordsIn(c) >= 2);
    const said = lines.join(' ').toLowerCase();
    const hits = chunks.length ? Math.max(...chunks.map((c) => said.split(c).length - 1)) : 0;
    return [
      turns.length >= 8 && turns.length <= 14 ? ok('lines', tr('{n} lines of dialogue', { n: turns.length }))
        : fix('lines', tr('Lines of dialogue: {n} (8 to 14 were asked)', { n: turns.length }), `Make the dialogue 8 to 14 lines long (it has ${turns.length}), each line starting with the speaker's name in bold.`),
      speakers === want ? ok('speakers', tr('{n} speakers, as asked', { n: want })) : fix('speakers', tr('Speakers: {n} instead of {want}', { n: speakers, want }), `Use exactly ${want} speakers, with Malaysian names.`),
      !chunks.length ? null : hits >= 2 ? ok('target', tr('The target language is used {n} times', { n: hits }))
        : fix('target', tr('Times the target language is used: {n} (aim for three)', { n: hits }), `Use the target language "${v.sentence}" at least three times in the dialogue.`)
    ];
  },
  phonics: ({ blocks, v }) => {
    const t = tables(blocks)[0];
    const words = t ? t.rows.map((r) => cell(r[0]).split(/[\s(]/)[0]).filter(Boolean) : [];
    const out: (Check | null)[] = [words.length >= 12 && words.length <= 16 ? ok('count', tr('{n} words with the sound', { n: words.length }))
      : fix('count', tr('Words in the table: {n} (12 to 16 were asked)', { n: words.length }), 'Give 12 to 16 words with the sound, simplest first, in a table with the columns Word | Picture idea.')];
    // a plain spelling pattern ("sh", "a_e", "ch, sh") can be checked in every word; a description ("the short a") cannot
    const PAT = '(?:[a-z]{1,4}|[a-z]_[a-z])';
    const sound = v.sound ?? '';
    const pats = new RegExp(`^\\s*${PAT}(?:\\s*(?:,|/|&|\\band\\b|\\bor\\b)\\s*${PAT})*\\s*(?:$|as in\\b|\\(|·|–)`, 'i').test(sound)
      ? sound.split(/as in|\(|·|–/i)[0].split(/\s*(?:,|\/|&|\band\b|\bor\b)\s*/i).map((x) => x.trim().toLowerCase()).filter(Boolean) : [];
    if (pats.length && words.length) {
      const p = pats.join(', ');
      const rxs = pats.map((x) => new RegExp(x.replace('_', '[a-z]'), 'i'));
      const bad = words.filter((w) => !rxs.some((rx) => rx.test(w)));
      out.push(bad.length ? fix('pattern', tr('Without "{p}": {x}', { p, x: bad.slice(0, 6).join(', ') }), `Replace these words, which do not have the spelling pattern "${p}": ${bad.slice(0, 6).join(', ')}.`)
        : ok('pattern', tr('Every word has "{p}"', { p })));
    }
    return out;
  },
  grammar: ({ ss }) => {
    const items = (rx: RegExp) => find(ss, rx)?.body.reduce((n, b) => n + (b.t === 'ol' || b.t === 'ul' ? b.items.length : b.t === 'table' ? b.rows.length : 0), 0) ?? 0;
    const ex = find(ss, /^examples?/i);
    const practice = items(/^practi[cs]e/i), answers = items(/^answers?/i);
    return [
      practice === 6 && answers >= 6 ? ok('practice', tr('Six practice items with answers'))
        : fix('practice', tr('Practice items: {n}, answers: {a} (six of each were asked)', { n: practice, a: answers }), 'Give six numbered practice items, and their six answers in the same order under "## Answers".'),
      ex && !bodyHasBold(ex.body) ? fix('bold', tr('The grammar point is not in bold in the examples'), 'In the five example sentences, put the grammar point in bold.') : null
    ];
  },
  quiz: ({ md, v }) => {
    const q = questionsIn(md);
    const out: (Check | null)[] = questionChecks(q, Number(v.count) || 8);
    if (v.qtype === 'Multiple choice' && q.length) {
      const bad = q.filter((x) => x.a && (x.opts.length < 3 || !answerMatches(x))).length; // a missing answer is counted above
      out.push(bad ? fix('options', tr('Questions that need three or four options and a matching answer: {n}', { n: bad }), 'Give every question three or four options on their own lines, A) to D), with only one correct answer, and an "Answer:" line with the letter and the option.')
        : ok('options', tr('Every question has options and a matching answer')));
    } else if (v.qtype === 'True or false' && q.length) {
      const bad = q.filter((x) => x.a && !/^(?:true|false|t|f|betul|salah)\b/i.test(x.a)).length;
      out.push(bad ? fix('options', tr('Answers that are not True or False: {n}', { n: bad }), 'Make every item a statement that is either true or false, and every answer "True" or "False".') : ok('options', tr('Every answer is True or False')));
    }
    return out;
  },
  questions: ({ md }) => questionChecks(questionsIn(rawBefore(md, /using them|in class/i)), 12),
  exit: ({ md, ss }) => {
    const checks = ss.flatMap((s) => linesOf(s.body)).filter((l) => /^check\s*:/i.test(l)).length;
    return [
      checks >= 4 ? ok('check', tr('Every exit ticket says what a good answer shows')) : fix('check', tr('Exit tickets that say what a good answer shows: {n} of 4', { n: checks }), 'For each exit ticket, add a line starting "Check:" with what a good answer shows.'),
      ...questionChecks(questionsIn(rawSection(md, /quiz/i)), 3)
    ];
  },
  rubric: ({ blocks, ss, v }) => {
    const all = tables(blocks);
    const t = all.find((x) => x.head.some((h) => /tp\s*\d/i.test(cell(h)))) ?? all[0];
    if (!t) return [fix('table', tr('There is no rubric table'), 'Make the rubric a table with the columns Criteria | TP1 | TP2 | TP3 | TP4 | TP5 | TP6.')];
    const head = t.head.map((h) => cell(h)).join(' ');
    const tps = [1, 2, 3, 4, 5, 6].filter((n) => new RegExp(`tp\\s*${n}(?!\\d)`, 'i').test(head)).length;
    const want = Number(v.count) || 3;
    const empty = t.rows.reduce((n, r) => n + r.slice(1, t.head.length).filter((c) => !cell(c)).length + Math.max(0, t.head.length - r.length), 0);
    const cl = linesIn(ss, /checklist/i);
    const ican = cl.filter((l) => /^["“']?(?:I can|Saya boleh)\b/i.test(l)).length;
    return [
      tps === 6 ? ok('tp', tr('Columns TP1 to TP6')) : fix('tp', tr('TP columns: {n} of 6', { n: tps }), 'Make the rubric a table with the columns Criteria | TP1 | TP2 | TP3 | TP4 | TP5 | TP6, using the six KSSR performance levels.'),
      t.rows.length === want ? ok('rows', tr('{n} criteria, as asked', { n: want })) : fix('rows', tr('Criteria: {n} instead of {want}', { n: t.rows.length, want }), `Use exactly ${want} criteria (rows) in the rubric table.`),
      empty ? fix('cells', tr('Empty cells in the rubric: {n}', { n: empty }), 'Fill in every cell of the rubric with a short descriptor the teacher can observe.') : null,
      !cl.length ? null : ican >= 3 ? ok('ican', tr('{n} "I can" statements for pupils', { n: ican }))
        : fix('ican', tr('The pupil checklist needs three or four "I can" statements'), 'Write the pupil checklist as three or four short "I can …" statements in simple English.')
    ];
  },
  feedback: ({ ss, v }) => {
    const cv = find(ss, /corrected/i);
    const next = linesIn(ss, /next step/i).join(' ');
    return [
      cv && !bodyHasBold(cv.body) ? fix('bold', tr('The corrections are not in bold'), 'In the corrected version, put every corrected word in bold.') : null,
      v.lang === 'In English and Malay' && next && !/\b(?:anda|kamu|dengan|untuk|yang|cuba|boleh|ayat|tulis|perkataan|dan)\b/i.test(next)
        ? fix('malay', tr('The next step is not in Bahasa Melayu as well'), 'After the next step in English, give the same sentence in Bahasa Melayu.') : null
    ];
  },
  scaffold: ({ ss }) => {
    const tiers = [/^low/i, /^moderate/i, /^high/i].every((rx) => find(ss, rx));
    const bank = find(ss, /word bank/i);
    return [
      tiers ? ok('tiers', tr('Sentence frames for low, moderate and high')) : fix('tiers', tr('The sentence frames are not grouped as low, moderate and high'), 'Group the sentence frames under the headings "### Low", "### Moderate" and "### High", with four frames each.'),
      bank && !bank.body.some((b) => b.t === 'table') ? fix('bank', tr('The word bank is not a table'), 'Make the word bank a table with a column for each type of word (for example nouns, verbs, adjectives, linking words).') : null
    ];
  },
  song: ({ ss, v }) => [wordsUsed(before(ss, /actions?|teaching/i).flatMap((s) => linesOf(s.body)), list(v.words))],
  story: ({ ss, v }) => {
    const len = (rx: RegExp) => { const s = find(ss, rx); return s ? wordsOf(linesOf(s.body)) : null; };
    const parts: [string, number | null, number, number][] = [['Part 1', len(/part\s*1|beginning/i), 80, 120], ['Path A', len(/path\s*a\b/i), 60, 100], ['Path B', len(/path\s*b\b/i), 60, 100]];
    const off = parts.filter(([, n, lo, hi]) => n !== null && (n < lo * 0.8 || n > hi * 1.25));
    return [
      parts.every(([, n]) => n === null) ? null : off.length
        ? fix('lengths', tr('Too long or too short: {x}', { x: off.map(([p, n]) => `${p} (${n})`).join(', ') }), 'Keep Part 1 to 80 to 120 words, and Path A and Path B to 60 to 100 words each.')
        : ok('lengths', tr('Each part is the right length')),
      wordsUsed(before(ss, /talk about/i).flatMap((s) => linesOf(s.body)), list(v.words))
    ];
  },
  riddles: ({ md, v }) => questionChecks(questionsIn(rawBefore(md, /how to use/i)), Number(v.count) || 8, true),
  parents: ({ md, blocks, ss, v }) => {
    const out: (Check | null)[] = [];
    if (v.format === 'WhatsApp message') {
      const both = v.lang === 'Bahasa Melayu and English';
      const parts = both ? [find(ss, /melayu/i), find(ss, /^english/i)].filter((s): s is Section => !!s).map((s) => wordsOf(linesOf(s.body))) : [wordsIn(md)];
      const most = parts.length ? Math.max(...parts) : wordsIn(md);
      out.push(most <= 130 ? ok('length', tr('Short enough for WhatsApp ({n} words)', { n: most }))
        : fix('length', tr('{n} words: long for WhatsApp', { n: most }), `Shorten it to under 120 words${both ? ' for each language' : ''}, with short lines.`));
      if (blocks.some((b) => b.t === 'table')) out.push(fix('table', tr('WhatsApp cannot show tables'), 'Remove the table: WhatsApp cannot show tables. Use short lines instead.'));
    }
    out.push(/english teacher|guru bahasa inggeris/i.test(md) ? ok('sign', tr('Signed as the English teacher'))
      : fix('sign', tr('It is not signed as the English teacher'), 'End the message with "[Your name], English teacher" (in Bahasa Melayu: "[Nama anda], Guru Bahasa Inggeris").'));
    return out;
  },
  reflection: ({ ss, v }) => {
    const t = /300/.test(v.length ?? '') ? 300 : 150;
    const n = wordsOf(ss.flatMap((s) => linesOf(s.body)));
    const plan = linesIn(ss, /action plan|pelan tindakan/i).length;
    const all = ss.flatMap((s) => linesOf(s.body)).join(' ');
    const first = v.lang === 'Bahasa Melayu' ? /\bsaya\b/i.test(all) : /\b(?:I|my|me)\b/.test(all);
    return [
      n >= t * 0.65 && n <= t * 1.45 ? ok('length', tr('{n} words (about {t} asked)', { n, t })) : fix('length', tr('{n} words; about {t} were asked', { n, t }), `Make it about ${t} words in total (it is ${n} now).`),
      find(ss, /action plan|pelan tindakan/i) ? (plan >= 3 ? ok('plan', tr('Three steps in the action plan')) : fix('plan', tr('Steps in the action plan: {n} (three were asked)', { n: plan }), 'Give three specific, realistic steps in the Action plan.')) : null,
      first ? ok('voice', tr('Written in the first person')) : fix('voice', tr('It is not written in the first person'), 'Write it in the first person, as the trainee teacher.')
    ];
  },
  email: ({ md }) => {
    const firstLine = strip(md.trim().split('\n').find((l) => l.trim()) ?? '');
    const closing = /\b(?:regards|sincerely|yours|thank you|best wishes|terima kasih|yang benar|salam hormat|sekian)\b/i.test(md);
    const signed = /\[(?:your name|nama(?: anda)?)\]/i.test(md);
    const n = wordsIn(md);
    return [
      /^\W*(?:subject|perkara|subjek)\s*:/i.test(firstLine) ? ok('subject', tr('Starts with a subject line')) : fix('subject', tr('There is no subject line'), 'Start with a line "Subject: …".'),
      closing && signed ? ok('sign', tr('It has a closing and your name')) : fix('sign', tr('The closing or the signature is missing'), 'End with a suitable closing (for example "Thank you." and "Yours sincerely,") and sign it "[Your name]".'),
      n <= 250 ? ok('length', tr('Short and clear ({n} words)', { n })) : fix('length', tr('{n} words: long for an email', { n }), 'Make it shorter: under 200 words, keeping every point.')
    ];
  },
  ask: ({ md }) => {
    const n = wordsIn(md);
    return [n <= 420 ? ok('length', tr('{n} words, quick to read', { n })) : fix('length', tr('{n} words: longer than asked', { n }), 'Make the answer shorter, under 350 words, keeping the most useful steps.')];
  }
};

/** All the checks for one result. */
export function checkResult(tool: string, md: string, v: Values, o: CheckOptions = {}): Check[] {
  const text = md ?? '';
  const total = wordsIn(text);
  if (total < 25) return [fix('complete', tr('It looks unfinished (it is very short)'), 'Write the complete answer, with every section asked for.')];
  const blocks = parseMarkdown(text);
  const ss = sectionsOf(blocks);
  const year = Math.min(6, Math.max(1, Number(v.year) || 4));
  const out: (Check | null)[] = [
    sectionCheck(ss, SECTIONS[tool]?.(v) ?? []),
    ...(TOOL[tool]?.({ md: text, blocks, ss, v, year, o }) ?? []),
    FOR_PUPILS.has(tool) ? levelCheck(ss, year) : null,
    spellingCheck(text),
    placeholderCheck(text)
  ];
  return out.filter((c): c is Check => !!c);
}
/** One instruction that makes every fix at once. */
export function fixAll(checks: Check[]): string {
  const fixes = checks.filter((c) => c.state === 'fix' && c.fix).map((c) => c.fix!);
  return fixes.length === 1 ? fixes[0] : `Make all of these changes: ${fixes.map((f, i) => `(${i + 1}) ${f}`).join(' ')}`;
}
