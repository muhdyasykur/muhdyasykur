/**
 * Pupils' names never go to an AI. Before a Studio request is sent, the text is checked against the names of the
 * teacher's own pupils (read on this device; locked names are skipped). Single names and each part of a full name
 * count, apart from short words and name connectors such as bin, binti, a/l and a/p.
 */
const CONNECTORS = new Set(['bin', 'binti', 'bt', 'bte', 'bnt', 'a/l', 'a/p', 'al', 'ap', 'anak', 'ak', 'van', 'de', 'el']);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The names to look for, from the pupils' full names: the full name and each part of three or more letters. */
export function nameParts(names: string[]): string[] {
  const out = new Set<string>();
  for (const n of names) {
    const full = n.trim().replace(/\s+/g, ' ');
    if (!full || full === 'Locked') continue;
    if (full.length >= 3) out.add(full);
    for (const p of full.split(/[\s,]+/)) if (p.length >= 3 && !CONNECTORS.has(p.toLowerCase()) && /\p{L}/u.test(p)) out.add(p);
  }
  return [...out].sort((a, b) => b.length - a.length);
}
const rx = (name: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escape(name)}(?![\\p{L}\\p{N}])`, 'u');
/** Which of the names appear in the text, as whole words (written as in the class list, or in capitals). */
export function namesIn(texts: string[], names: string[]): string[] {
  const text = texts.join('\n');
  const found: { n: string; at: number }[] = [];
  for (const n of nameParts(names)) {
    if (found.some((f) => f.n.includes(n))) continue;
    const m = rx(n).exec(text) ?? rx(n.toUpperCase()).exec(text);
    if (m) found.push({ n, at: m.index });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.n);
}
/** Replace each name with "the pupil", so the request can be sent. */
export function withoutNames(text: string, names: string[]): string {
  let t = text;
  for (const n of nameParts(names)) for (const form of [n, n.toUpperCase()]) t = t.replace(new RegExp(rx(form).source, 'gu'), 'the pupil');
  return t.replace(/\bthe pupil(\s+the pupil)+/g, 'the pupil').replace(/(^|[.!?]\s+|\n)the pupil/g, '$1The pupil');
}
