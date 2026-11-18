/**
 * A small, safe Markdown reader for AI answers in the Studio. It turns text into plain data (blocks and inline runs),
 * which the app draws as text nodes: nothing an AI writes is ever inserted as HTML. It also makes plain text for
 * copying and escaped HTML for the clipboard, so a copied result keeps its headings and tables in Word or Google Docs.
 * Line breaks inside a paragraph are kept (songs, poems and dialogues need them).
 */
export type Inline = { t: 'text'; v: string } | { t: 'b' | 'i'; c: Inline[] } | { t: 'code'; v: string };
export interface Item { c: Inline[]; sub?: List }
export interface List { t: 'ul' | 'ol'; start: number; items: Item[] }
export type Block =
  | { t: 'h'; level: 1 | 2 | 3 | 4; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  | List
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'quote'; c: Inline[] }
  | { t: 'hr' };

const LIST = /^(\s*)([-*+•]|\d{1,3}[.)])\s+(.*)$/;
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
const ROW = /^\s*\|.*\|?\s*$/;
const SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

/** Inline runs: **bold**, __bold__, *italic*, _italic_, `code`. Links show as "text (address)", not as links. */
export function inline(src: string): Inline[] {
  const s = src.replace(/<br\s*\/?>/gi, '\n').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1 ($2)');
  const out: Inline[] = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = ''; } };
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);
    const m = /^(\*\*|__)(?=\S)([\s\S]*?\S)\1/.exec(rest);
    if (m) { flush(); out.push({ t: 'b', c: inline(m[2]) }); i += m[0].length; continue; }
    // *italic*, or _italic_ only at a word start (so snake_case words stay as they are)
    const it = /^\*(?=[^\s*])([^*\n]*?[^\s*]|[^\s*])\*/.exec(rest) ?? (!buf || /\W$/.test(buf) ? /^_(?=\S)([^_\n]*?\S)_(?!\w)/.exec(rest) : null);
    if (it) { flush(); out.push({ t: 'i', c: inline(it[1]) }); i += it[0].length; continue; }
    const code = /^`([^`\n]+)`/.exec(rest);
    if (code) { flush(); out.push({ t: 'code', v: code[1] }); i += code[0].length; continue; }
    buf += s[i]; i++;
  }
  flush();
  return out;
}

const cells = (line: string) => {
  let l = line.trim();
  if (l.startsWith('|')) l = l.slice(1);
  if (l.endsWith('|') && !l.endsWith('\\|')) l = l.slice(0, -1);
  return l.split(/(?<!\\)\|/).map((c) => inline(c.trim().replace(/\\\|/g, '|')));
};

export function parseMarkdown(text: string): Block[] {
  let src = (text ?? '').replace(/\r\n?/g, '\n');
  // an answer wrapped in a code fence, as some chats do when asked for Markdown
  const fence = /^\s*```(?:markdown|md)?\s*\n([\s\S]*?)\n\s*```\s*$/i.exec(src);
  if (fence) src = fence[1];
  const lines = src.split('\n');
  const out: Block[] = [];
  let para: string[] = [];
  let quote: string[] = [];
  const endPara = () => { if (para.length) { out.push({ t: 'p', c: inline(para.join('\n')) }); para = []; } };
  const endQuote = () => { if (quote.length) { out.push({ t: 'quote', c: inline(quote.join('\n')) }); quote = []; } };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { endPara(); endQuote(); i++; continue; }
    if (/^\s*```/.test(line)) { i++; continue; } // stray fences
    const h = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) { endPara(); endQuote(); out.push({ t: 'h', level: Math.min(4, h[1].length) as 1 | 2 | 3 | 4, c: inline(h[2]) }); i++; continue; }
    if (HR.test(line) && !LIST.test(line.replace(/^(\s*[-*_])\s*$/, ''))) { endPara(); endQuote(); out.push({ t: 'hr' }); i++; continue; }
    if (ROW.test(line) && i + 1 < lines.length && SEP.test(lines[i + 1])) {
      endPara(); endQuote();
      const head = cells(line); const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && ROW.test(lines[i]) && lines[i].includes('|')) { rows.push(cells(lines[i])); i++; }
      out.push({ t: 'table', head, rows });
      continue;
    }
    const q = /^\s*>\s?(.*)$/.exec(line);
    if (q) { endPara(); quote.push(q[1]); i++; continue; }
    const li = LIST.exec(line);
    if (li) {
      endPara(); endQuote();
      const base = li[1].length;
      const ordered = /\d/.test(li[2]);
      const list: List = { t: ordered ? 'ol' : 'ul', start: ordered ? parseInt(li[2], 10) : 1, items: [] };
      while (i < lines.length) {
        const m = LIST.exec(lines[i]);
        if (m && m[1].length <= base + 1) {
          if (/\d/.test(m[2]) !== ordered) break;
          list.items.push({ c: inline(m[3]) }); i++; continue;
        }
        if (m && m[1].length > base + 1 && list.items.length) {
          const last = list.items[list.items.length - 1];
          const subOrdered = /\d/.test(m[2]);
          last.sub ??= { t: subOrdered ? 'ol' : 'ul', start: subOrdered ? parseInt(m[2], 10) : 1, items: [] };
          last.sub.items.push({ c: inline(m[3]) }); i++; continue;
        }
        // a wrapped line that belongs to the item above
        if (!m && lines[i].trim() && /^\s{2,}/.test(lines[i]) && list.items.length) {
          const last = list.items[list.items.length - 1];
          last.c = [...last.c, { t: 'text', v: '\n' }, ...inline(lines[i].trim())]; i++; continue;
        }
        break;
      }
      out.push(list);
      continue;
    }
    para.push(line.replace(/\s+$/, ''));
    i++;
  }
  endPara(); endQuote();
  return out;
}

// ---- plain text and HTML (for copying), and small helpers
export const textOf = (xs: Inline[]): string => xs.map((x) => (x.t === 'text' || x.t === 'code' ? x.v : textOf(x.c))).join('');

function listPlain(l: List, indent = ''): string[] {
  return l.items.flatMap((it, k) => [`${indent}${l.t === 'ol' ? `${l.start + k}.` : '•'} ${textOf(it.c)}`, ...(it.sub ? listPlain(it.sub, indent + '   ') : [])]);
}
export function toPlain(blocks: Block[]): string {
  return blocks.map((b) => {
    if (b.t === 'h' || b.t === 'p') return textOf(b.c);
    if (b.t === 'quote') return textOf(b.c);
    if (b.t === 'hr') return '—';
    if (b.t === 'table') return [b.head, ...b.rows].map((r) => r.map(textOf).join(' | ')).join('\n');
    return listPlain(b).join('\n');
  }).join('\n\n').trim();
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const htmlInline = (xs: Inline[]): string => xs.map((x) => x.t === 'text' ? esc(x.v).replace(/\n/g, '<br>') : x.t === 'code' ? `<code>${esc(x.v)}</code>` : x.t === 'b' ? `<strong>${htmlInline(x.c)}</strong>` : `<em>${htmlInline(x.c)}</em>`).join('');
const htmlList = (l: List): string => `<${l.t}${l.t === 'ol' && l.start !== 1 ? ` start="${l.start}"` : ''}>${l.items.map((it) => `<li>${htmlInline(it.c)}${it.sub ? htmlList(it.sub) : ''}</li>`).join('')}</${l.t}>`;
/** Escaped HTML for the clipboard only (never put into the page). */
export function toHtml(blocks: Block[]): string {
  return blocks.map((b) => {
    if (b.t === 'h') return `<h${b.level + 1 > 4 ? 4 : b.level + 1}>${htmlInline(b.c)}</h${b.level + 1 > 4 ? 4 : b.level + 1}>`;
    if (b.t === 'p') return `<p>${htmlInline(b.c)}</p>`;
    if (b.t === 'quote') return `<blockquote>${htmlInline(b.c)}</blockquote>`;
    if (b.t === 'hr') return '<hr>';
    if (b.t === 'table') return `<table border="1" cellpadding="6" style="border-collapse:collapse"><thead><tr>${b.head.map((c) => `<th>${htmlInline(c)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${htmlInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    return htmlList(b);
  }).join('\n');
}

// section names that are not titles (the title is then the first line under them, if short)
const GENERIC = /^(lesson overview|overview|word list|word help|levelled text|two stars|rubric|why it matters|connections|explain it simply|words with this sound|bahasa melayu|english|before the lesson|remember|1\. 3-2-1|subject.*)$/i;
/** A short title for the result: its first heading, without labels such as "Quiz:". */
export function titleOf(blocks: Block[]): string {
  const i = blocks.findIndex((b) => b.t === 'h');
  if (i < 0) return '';
  let t = textOf((blocks[i] as { c: Inline[] }).c).replace(/\s+/g, ' ').trim();
  if (GENERIC.test(t)) {
    const next = blocks[i + 1];
    const line = next && next.t === 'p' ? textOf(next.c).split('\n')[0].trim() : '';
    if (!line || line.length > 90) return '';
    t = line;
  }
  return t.replace(/^(title|quiz|dialogue|rubric|lesson title)\s*[:–-]\s*/i, '').replace(/[*_]/g, '').trim().slice(0, 90);
}
export const wordCount = (s: string) => (s.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
