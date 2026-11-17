import { parse } from 'svelte/compiler';
import fs from 'node:fs';
import path from 'node:path';
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.svelte')) files.push(p); } };
walk('src');
let texts = 0, attrs = 0, chars = 0; const per = [];
const ATTR = new Set(['placeholder', 'aria-label', 'title', 'alt', 'label']);
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const ast = parse(src, { modern: true });
  let n = 0;
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.type === 'Text' && /[A-Za-z]{2,}/.test(node.data) && node.data.trim()) { n++; texts++; chars += node.data.trim().length; }
    if (node.type === 'Attribute' && ATTR.has(node.name) && Array.isArray(node.value)) for (const v of node.value) if (v.type === 'Text' && /[A-Za-z]{2,}/.test(v.data)) { n++; attrs++; chars += v.data.length; }
    for (const k of Object.keys(node)) if (!['parent', 'metadata'].includes(k) && k !== 'instance' && k !== 'module' && k !== 'css') visit(node[k]);
  };
  visit(ast.fragment);
  per.push([n, f]);
}
// script string literals that look like sentences
let sl = 0, slc = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8'); const m = s.match(/<script[^>]*>([\s\S]*?)<\/script>/); if (!m) continue;
  for (const x of m[1].matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`]*)`/g)) { const v = x[1] ?? x[2]; if (/^[A-Z][a-z]+(\s|,)/.test(v) && v.split(' ').length >= 2) { sl++; slc += v.length; } }
}
console.log({ files: files.length, templateTexts: texts, attrs, templateChars: chars, scriptSentences: sl, scriptChars: slc });
console.log(per.sort((a, b) => b[0] - a[0]).slice(0, 15).map(([n, f]) => `${n} ${f}`).join('\n'));
