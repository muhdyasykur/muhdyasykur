import type { Lesson, Objective } from './lesson/model';
import { criteria } from './lesson/derive';
import { compose } from './lesson/objectives';
import { shuffle, seeded } from './classroom/random';

/** Printable materials made on the device from the lesson's own words (blueprint F14). */
export type PrintType = 'flashcards' | 'gapfill' | 'matching' | 'strips' | 'exit' | 'tiered' | 'rubric';
export interface Printable {
  id: string; type: PrintType; title: string;
  words: string[]; sentences: string[]; frame: string;
  perPage: 2 | 4 | 8; images: Record<string, string>;
  inAppendix: boolean; seed: number;
}
export const TYPE_INFO: Record<PrintType, { name: string; needs: string }> = {
  flashcards: { name: 'Flashcards / word cards', needs: 'Key words (and a picture for each if you like)' },
  gapfill: { name: 'Gap-fill worksheet', needs: 'Sentences that use the key words' },
  matching: { name: 'Matching worksheet', needs: 'Key words; pupils draw or stick the pictures' },
  strips: { name: 'Sentence strips (cut and order)', needs: 'Sentences in the right order' },
  exit: { name: 'Exit tickets', needs: 'Uses your success criteria' },
  tiered: { name: 'Tiered worksheet (🌱 🌿 🌳)', needs: 'Key words and a sentence frame, e.g. "I should ___ because ___."' },
  rubric: { name: 'Assessment rubric', needs: 'Uses your objectives' }
};

export const splitList = (s: string) => s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
export const splitSentences = (s: string) => s.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 3);

/** Blank one key word per sentence (the first key word found, otherwise the longest word). */
export function gapFill(sentences: string[], words: string[]): { text: string; answer: string }[] {
  const keys = words.map((w) => w.toLowerCase());
  return sentences.map((s) => {
    const tokens = s.split(/(\s+)/);
    let idx = tokens.findIndex((t) => keys.includes(t.toLowerCase().replace(/[^a-z'’-]/g, '')));
    if (idx < 0) {
      const cand = tokens.map((t, i) => [t.replace(/[^A-Za-z'’-]/g, ''), i] as const).filter(([t]) => t.length > 3);
      idx = cand.length ? cand.reduce((a, b) => (b[0].length > a[0].length ? b : a))[1] : -1;
    }
    if (idx < 0) return { text: s, answer: '' };
    const m = /^([^A-Za-z'’-]*)([A-Za-z'’-]+)(.*)$/.exec(tokens[idx])!;
    tokens[idx] = `${m[1]}__________${m[3]}`;
    return { text: tokens.join(''), answer: m[2] };
  });
}
export function matching(words: string[], seed: number): { left: string[]; right: string[] } {
  return { left: words, right: shuffle(words, seeded(seed)) };
}
export function strips(sentences: string[], seed: number): string[] {
  let s = shuffle(sentences, seeded(seed));
  if (s.length > 1 && s.every((x, i) => x === sentences[i])) s = [...s.slice(1), s[0]];
  return s;
}
export function exitTickets(l: Lesson): string[] { return criteria(l).map((c) => c.text).filter(Boolean); }
/** Three versions of one worksheet: Low (word bank, fewer items, frame), Moderate (frame), High (open). */
export function tiered(words: string[], frame: string) {
  const f = frame.trim() || '___________________.';
  return {
    low: { items: words.slice(0, Math.max(3, Math.min(4, words.length))), bank: true, frame: f },
    mod: { items: words.slice(0, Math.min(6, words.length)), bank: false, frame: f },
    high: { items: words.slice(0, Math.min(6, words.length)), bank: false, frame: '' }
  };
}
export function rubricRows(objs: Objective[]): { label: string; objective: string }[] {
  let m = 0, c = 0;
  return objs.filter((o) => compose(o)).map((o) => ({ label: o.role === 'main' ? `M${++m}` : `C${++c}`, objective: compose(o).replace(/^By the end of the lesson, Year \d pupils will be able to /i, '') }));
}

/** Search pages on the tools trainees already use (blueprint F15). Links open a new tab; nothing is sent automatically. */
export function toolLinks(l: Lesson): { name: string; url: string }[] {
  const topic = (l.topic || splitList(l.vocabulary).slice(0, 3).join(' ') || l.mainSkill).replace(/[?!]/g, '');
  const q = encodeURIComponent(`${topic} year ${l.curriculum.year} english`);
  const site = (d: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:${d} ${topic} english`)}`;
  return [
    { name: 'Canva templates', url: `https://www.canva.com/search/templates?q=${encodeURIComponent(`${topic} worksheet`)}` },
    { name: 'Wordwall', url: `https://wordwall.net/community?query=${encodeURIComponent(topic)}` },
    { name: 'Liveworksheets', url: site('liveworksheets.com') },
    { name: 'Quizizz / Wayground', url: site('quizizz.com') },
    { name: 'Kahoot', url: site('kahoot.it') },
    { name: 'YouTube', url: `https://www.youtube.com/results?search_query=${q}` }
  ];
}
export const CANVA_AI = 'https://www.canva.com/ai';
/** A ready prompt for Canva AI built from the lesson. The teacher pastes it into Canva. */
export function canvaPrompt(l: Lesson, kind: 'worksheet' | 'flashcards' | 'slides' | 'poster', tier: 'low' | 'mod' | 'high' | 'all'): string {
  const words = splitList(l.vocabulary);
  const level = { low: 'for pupils who need support: large pictures, a word bank, only 3–4 items, simple instructions', mod: 'for average pupils: 5–6 items with a short example', high: 'for able pupils: open questions and one extension task', all: 'with three sections from easy to challenging' }[tier];
  const what = { worksheet: 'an A4 worksheet', flashcards: 'a set of A4 flashcards, 4 per page, one word and one clear picture each', slides: 'a 6-slide presentation for a primary classroom projector', poster: 'an A4 classroom poster' }[kind];
  return [
    `Create ${what} for Year ${l.curriculum.year} pupils (age ${l.curriculum.year + 6}) learning English in a Malaysian primary school.`,
    `Topic: ${l.topic || 'the lesson topic'}.${l.focus ? ` Language focus: ${l.focus}.` : ''}`,
    words.length ? `Use these words: ${words.join(', ')}.` : '',
    `Make it ${level}.`,
    `Style: friendly, colourful but uncluttered, a clear child-friendly font, Malaysian names and settings. No copyrighted characters.`
  ].filter(Boolean).join(' ');
}
