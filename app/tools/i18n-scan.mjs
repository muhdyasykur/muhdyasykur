// Lists English text written inside code (script blocks and {expressions}) that the wrapper did not reach.
import { parse } from 'svelte/compiler';
import fs from 'node:fs';
import path from 'node:path';
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.svelte')) files.push(p); } };
walk('src');
const SKIP_FILES = [/features\/plan\/print\//, /SlideView\.svelte$/];
const looksUi = (v) => /\p{L}{2,}/u.test(v) && (/\s/.test(v) || /^[A-Z][a-z]+[.…!?]?$/.test(v)) && !/^[a-z-]+(\s[a-z-]+)*$/.test(v) && !/^(https?:|#\/|\.|[a-z]+\.[a-z]+$|M\d|[\w-]+=)/.test(v) && !/[{}<>]|=>|\$\{/.test(v.slice(0, 3));
let total = 0; const out = [];
for (const f of files) {
  if (SKIP_FILES.some((r) => r.test(f))) continue;
  const src = fs.readFileSync(f, 'utf8');
  const ast = parse(src, { modern: true });
  const hits = [];
  const seen = new Set();
  const visit = (n, parent, inTr) => {
    if (!n || typeof n !== 'object' || seen.has(n)) return; seen.add(n);
    if (Array.isArray(n)) { n.forEach((x) => visit(x, parent, inTr)); return; }
    if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && ['tr', 't'].includes(n.callee.name)) inTr = true;
    if (n.type === 'ImportDeclaration') return;
    if (n.type === 'Literal' && typeof n.value === 'string' && !inTr && looksUi(n.value)) hits.push([n.start, n.value]);
    if (n.type === 'TemplateLiteral' && !inTr) { const q = n.quasis.map((x) => x.value.cooked).join('{}'); if (looksUi(q) && /\s/.test(q)) hits.push([n.start, '`' + q + '`']); }
    for (const k of Object.keys(n)) if (!['parent', 'metadata', 'loc', 'leadingComments', 'trailingComments'].includes(k)) visit(n[k], n, inTr);
  };
  visit(ast.instance?.content, null, false);
  visit(ast.fragment, null, false);
  if (!hits.length) continue;
  total += hits.length;
  const line = (i) => src.slice(0, i).split('\n').length;
  out.push(`== ${f} (${hits.length})\n` + hits.map(([i, v]) => `  ${line(i)}: ${v.slice(0, 110)}`).join('\n'));
}
fs.writeFileSync('tools/i18n-scan.txt', out.join('\n'));
console.log(total, 'candidates in', out.length, 'files');
