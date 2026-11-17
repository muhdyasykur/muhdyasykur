// Wraps the English interface text of Svelte components in tr('…') so it can be shown in Bahasa Melayu.
// Uses Svelte's own parser. Text meant for pupils or for the English lesson itself stays as it is: anything inside
// lang="en" or class="pupil-font", and the printed lesson plan, slides and worksheets (SKIP_FILES).
// Usage: node tools/i18n-wrap.mjs [--dry] [files…]   Prints the messages it wrapped.
import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';
import fs from 'node:fs';
import path from 'node:path';

const SKIP_FILES = [/features\/plan\/print\//, /features\/slides\/SlideView\.svelte$/, /lib\/ui\/(Logo|Icon|BbmPic|Qr)\.svelte$/];
const ATTRS = new Set(['placeholder', 'aria-label', 'title', 'alt', 'label', 'why', 'aria-roledescription']);
const dry = process.argv.includes('--dry');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.svelte')) files.push(p); } };
if (args.length) files.push(...args); else walk('src');
const hasWords = (s) => /\p{L}{2,}/u.test(s);
const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
const all = new Map();

function staticAttr(node, name) {
  const a = node.attributes?.find((x) => x.type === 'Attribute' && x.name === name);
  if (!a || !Array.isArray(a.value)) return null;
  return a.value.map((v) => (v.type === 'Text' ? v.data : '\u0000')).join('');
}
function skipEl(node) {
  if (node.type === 'RegularElement' || node.type === 'SvelteElement') {
    if (['style', 'script', 'code', 'pre', 'textarea'].includes(node.name)) return true;
    if (staticAttr(node, 'lang') === 'en') return true;
    const cls = staticAttr(node, 'class');
    if (cls && /\bpupil-font\b/.test(cls)) return true;
    if (node.attributes?.some((x) => x.type === 'Attribute' && x.name === 'data-i18n-skip')) return true;
  }
  return false;
}
function exprName(src, e, used) {
  let n = e.type === 'Identifier' ? e.name : e.type === 'MemberExpression' && !e.computed && e.property.type === 'Identifier' ? e.property.name : 'x';
  if (!/^[A-Za-z_]\w*$/.test(n)) n = 'x';
  let k = n, i = 2;
  while (used.has(k)) k = `${n}${i++}`;
  used.add(k);
  return k;
}
/** One message from a run of text and {expressions}: returns [template, vars] */
function message(src, run) {
  const used = new Set(); const vars = [];
  let tpl = '';
  for (const n of run) {
    if (n.type === 'Text') tpl += n.data.replace(/\{/g, '{{').replace(/\}/g, '}}');
    else { const k = exprName(src, n.expression, used); vars.push([k, src.slice(n.expression.start, n.expression.end)]); tpl += `{${k}}`; }
  }
  return [tpl, vars];
}
function call(tpl, vars) {
  const v = vars.length ? `, { ${vars.map(([k, e]) => (k === e ? k : `${k}: ${e}`)).join(', ')} }` : '';
  return `tr(${q(tpl)}${v})`;
}

for (const file of files) {
  if (SKIP_FILES.some((r) => r.test(file))) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (/\btr\(\s*'/.test(src) && !args.length) { /* already wrapped: only new text is wrapped below */ }
  const ast = parse(src, { modern: true });
  const ms = new MagicString(src);
  const found = [];
  const fragment = (nodes, skip) => {
    // runs of Text + ExpressionTag
    let run = [];
    const flush = () => {
      if (run.some((n) => n.type === 'Text' && hasWords(n.data)) && !skip) {
        const first = run[0], last = run[run.length - 1];
        // keep outer whitespace outside the message
        const lead = first.type === 'Text' ? first.data.match(/^\s*/)[0] : '';
        const trail = last.type === 'Text' ? last.data.match(/\s*$/)[0] : '';
        const copy = run.map((n) => ({ ...n }));
        if (copy[0].type === 'Text') copy[0] = { ...copy[0], data: copy[0].data.slice(lead.length) };
        const L = copy.length - 1;
        if (copy[L].type === 'Text') copy[L] = { ...copy[L], data: copy[L].data.slice(0, copy[L].data.length - trail.length) };
        const [tpl, vars] = message(src, copy);
        const t = tpl.replace(/\s+/g, ' ');
        if (hasWords(t) && !/^\s*$/.test(t)) {
          // whitespace-only text that Svelte would collapse is kept as it was
          ms.overwrite(first.start, last.end, `${lead}{${call(t, vars)}}${trail}`);
          found.push(t);
        }
      }
      run = [];
    };
    for (const n of nodes) {
      if (n.type === 'Text' || n.type === 'ExpressionTag') { run.push(n); continue; }
      flush();
      visit(n, skip);
    }
    flush();
  };
  const attrs = (node, skip) => {
    if (skip) return;
    for (const a of node.attributes ?? []) {
      if (a.type !== 'Attribute' || !ATTRS.has(a.name) || !Array.isArray(a.value)) continue;
      if (!a.value.some((v) => v.type === 'Text' && hasWords(v.data))) continue;
      const [tpl, vars] = message(src, a.value);
      const t = tpl.replace(/\s+/g, ' ').trim();
      ms.overwrite(a.value[0].start - (src[a.value[0].start - 1] === '"' || src[a.value[0].start - 1] === "'" ? 1 : 0), a.value[a.value.length - 1].end + (src[a.value[a.value.length - 1].end] === '"' || src[a.value[a.value.length - 1].end] === "'" ? 1 : 0), `{${call(t, vars)}}`);
      found.push(t);
    }
  };
  const visit = (node, skip) => {
    if (!node || typeof node !== 'object') return;
    const s = skip || skipEl(node);
    if (node.attributes) attrs(node, s);
    for (const k of ['fragment', 'body', 'consequent', 'alternate', 'fallback', 'pending', 'then', 'catch', 'failed']) {
      const f = node[k];
      if (f && f.type === 'Fragment') fragment(f.nodes, s);
    }
    if (node.type === 'SnippetBlock' && node.body) fragment(node.body.nodes ?? [], s);
  };
  fragment(ast.fragment.nodes, false);
  if (!found.length) continue;
  for (const f of found) { if (!all.has(f)) all.set(f, []); all.get(f).push(file); }
  // import tr
  const rel = path.relative(path.dirname(file), 'src/lib/i18n/index.svelte').replace(/\\/g, '/');
  const imp = `import { tr } from '${rel.startsWith('.') ? rel : './' + rel}';`;
  if (!/import \{[^}]*\btr\b[^}]*\} from '[^']*i18n\/index\.svelte'/.test(src)) {
    if (ast.instance) ms.appendLeft(ast.instance.content.start, `\n  ${imp}`);
    else ms.prepend(`<script lang="ts">\n  ${imp}\n</script>\n\n`);
  }
  if (!dry) fs.writeFileSync(file, ms.toString());
  console.error(`${found.length.toString().padStart(4)} ${file}`);
}
fs.writeFileSync('tools/i18n-wrapped.json', JSON.stringify([...all.keys()], null, 1));
console.error(`${all.size} distinct messages`);
