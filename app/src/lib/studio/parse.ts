import type { Block, Inline } from './markdown';
import { textOf, parseMarkdown } from './markdown';

/**
 * Turning a Studio result into something else Consilia can use: quiz questions for the Quiz show, words for the spin
 * wheel, and the parts of a lesson plan for the builder. All of it reads the Markdown the prompts asked for, and
 * copes with small differences when the answer came from another chat.
 */
const strip = (s: string) => s.replace(/\*\*|__|`/g, '').replace(/(^|\s)[*_](\S[^*_]*?)[*_](?=\s|$|[.,;:!?])/g, '$1$2').replace(/\s+/g, ' ').trim();

export interface QuizItem { q: string; a: string }
/** Numbered questions, their A) B) C) options and "Answer:" lines. */
export function quizItems(md: string): QuizItem[] {
  const out: QuizItem[] = [];
  let cur: { q: string; opts: { l: string; t: string }[]; a: string } | null = null;
  const done = () => {
    if (cur && cur.q && cur.a) {
      let a = cur.a;
      const letter = /^\(?([A-F])\)?(?:[.)]|$)\s*(.*)$/.exec(a);
      if (cur.opts.length && letter) { const o = cur.opts.find((x) => x.l === letter[1]); a = o ? `${o.l}) ${o.t}` : a; }
      const q = cur.opts.length ? `${cur.q}  ${cur.opts.map((o) => `${o.l}) ${o.t}`).join('   ')}` : cur.q;
      out.push({ q: q.replace(/\|/g, '/'), a: a.replace(/\|/g, '/') });
    }
    cur = null;
  };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const line = strip(raw.replace(/^\s*#{1,6}\s*/, ''));
    if (!line) continue;
    const ans = /^[-•]?\s*(?:answer|answers|possible answer|jawapan|ans)\s*[:：-]\s*(.+)$/i.exec(line);
    if (ans && cur) { cur.a = ans[1].trim(); done(); continue; }
    const opt = /^[-•]?\s*\(?([A-Fa-f])[).]\s+(.+)$/.exec(line);
    if (opt && cur && !cur.a) { cur.opts.push({ l: opt[1].toUpperCase(), t: opt[2].trim() }); continue; }
    const q = /^(?:q(?:uestion)?\s*)?(\d{1,2})\s*[.):]\s*(.+)$/i.exec(line);
    if (q) { done(); cur = { q: q[2].trim(), opts: [], a: '' }; continue; }
    // a question split over two lines
    if (cur && !cur.opts.length && !cur.a && !/^\W*$/.test(line)) cur.q = `${cur.q} ${line}`;
  }
  done();
  return out.slice(0, 30);
}

/** Words for the spin wheel: the first column of the first table, else short list items. */
export function wordsFrom(blocks: Block[]): string[] {
  const clean = (x: Inline[]) => strip(textOf(x)).replace(/[.:;]$/, '');
  const table = blocks.find((b) => b.t === 'table') as { rows: Inline[][][] } | undefined;
  let words = table ? table.rows.map((r) => clean(r[0] ?? [])) : [];
  if (!words.length) words = blocks.flatMap((b) => (b.t === 'ul' || b.t === 'ol' ? b.items.map((i) => clean(i.c)) : []));
  return [...new Set(words.filter((w) => w && w.split(/\s+/).length <= 4 && w.length <= 40))].slice(0, 16);
}

// ---- lesson plan (the Lesson plan writer's fixed headings)
export type StageKey = 'pre' | 'presentation' | 'practice' | 'production' | 'post';
export interface PlanStage { minutes: number | null; teacher: string[]; pupils: string[]; aids: string[] }
export interface PlanParts {
  title: string; codes: string[]; objectives: string[]; criteria: string[]; words: string[]; sentence: string; aids: string[];
  stages: Partial<Record<StageKey, PlanStage>>; tiers: { low: string; mod: string; high: string }; assessment: string; cce: string; skills21: string;
}
const STAGE_OF: [RegExp, StageKey][] = [[/^pre[- ]?lesson|^set induction|^induction/i, 'pre'], [/^presentation/i, 'presentation'], [/^practice/i, 'practice'], [/^production/i, 'production'], [/^post[- ]?lesson|^closure|^plenary/i, 'post']];

function sectionLines(blocks: Block[]): string[] {
  return blocks.flatMap((b) => {
    if (b.t === 'p' || b.t === 'quote') return textOf(b.c).split('\n');
    if (b.t === 'ul' || b.t === 'ol') return b.items.flatMap((i) => [textOf(i.c), ...(i.sub ? i.sub.items.map((s) => textOf(s.c)) : [])]);
    if (b.t === 'table') return b.rows.map((r) => r.map(textOf).join(' – '));
    return [];
  }).map(strip).filter(Boolean);
}
export function parsePlan(md: string): PlanParts {
  const blocks = parseMarkdown(md);
  const parts: PlanParts = { title: '', codes: [], objectives: [], criteria: [], words: [], sentence: '', aids: [], stages: {}, tiers: { low: '', mod: '', high: '' }, assessment: '', cce: '', skills21: '' };
  // split into sections by heading
  const sections: { head: string; body: Block[] }[] = [];
  for (const b of blocks) {
    if (b.t === 'h') sections.push({ head: strip(textOf(b.c)), body: [] });
    else if (sections.length) sections[sections.length - 1].body.push(b);
    else sections.push({ head: '', body: [b] });
  }
  for (const s of sections) {
    const h = s.head.toLowerCase();
    const lines = sectionLines(s.body);
    const stage = STAGE_OF.find(([rx]) => rx.test(s.head))?.[1];
    if (stage) {
      const st: PlanStage = { minutes: Number(/(\d{1,3})\s*min/i.exec(s.head)?.[1] ?? '') || null, teacher: [], pupils: [], aids: [] };
      for (const l of lines) {
        const m = /^(teacher|pupils?|students?|teaching aids|aids|materials)\s*:\s*(.+)$/i.exec(l);
        if (!m) { st.teacher.push(l); continue; }
        const k = m[1].toLowerCase();
        (k.startsWith('teacher') ? st.teacher : k.startsWith('pupil') || k.startsWith('student') ? st.pupils : st.aids).push(m[2]);
      }
      parts.stages[stage] = st;
    } else if (/overview/.test(h)) parts.title = (lines[0] ?? '').replace(/^(title|lesson title)\s*:\s*/i, '').slice(0, 120);
    else if (/standard/.test(h)) parts.codes = [...new Set(lines.join(' ').match(/\b\d\.\d{1,2}\.\d{1,2}\b/g) ?? [])];
    else if (/objective/.test(h)) parts.objectives = lines;
    else if (/success/.test(h)) parts.criteria = lines;
    else if (/vocabulary|target language/.test(h)) {
      for (const l of lines) {
        const t = /^(target sentence|target language|structure|sentence)\s*:\s*(.+)$/i.exec(l);
        if (t) parts.sentence = t[2];
        else parts.words.push(...l.replace(/^(key )?(words|vocabulary)\s*:\s*/i, '').split(/\s*[,;]\s*/));
      }
      parts.words = parts.words.map((w) => w.trim()).filter((w) => w && w.length <= 40);
    } else if (/teaching aids|materials/.test(h)) parts.aids = lines;
    else if (/differentiation/.test(h)) {
      for (const l of lines) {
        const m = /^(low|moderate|medium|high)\s*[:–-]\s*(.+)$/i.exec(l);
        if (m) parts.tiers[/^low/i.test(m[1]) ? 'low' : /^high/i.test(m[1]) ? 'high' : 'mod'] = m[2];
      }
    } else if (/assessment/.test(h)) parts.assessment = lines.join(' ');
    else if (/cross-curricular|21st|elements/.test(h)) {
      for (const l of lines) {
        if (/21st/i.test(l)) parts.skills21 = l.replace(/^21st[- ]century skills?\s*:\s*/i, '');
        else if (!parts.cce) parts.cce = l.replace(/^(cross-curricular elements?|cce)\s*:\s*/i, '');
      }
    }
  }
  return parts;
}
