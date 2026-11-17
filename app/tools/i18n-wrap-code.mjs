// Second pass of tools/i18n-wrap.mjs: English text written inside code.
// Wraps only unambiguous cases: string values that are displayed directly in the template ({cond ? 'A' : 'B'},
// {x || 'None'}, `...` text), interface attributes given as expressions, message variables (msg = '…'), and
// label-like object fields (title:, label:, about:, …) in component scripts. Everything else is left for review.
import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';
import fs from 'node:fs';
import path from 'node:path';
const SKIP_FILES = [/features\/plan\/print\//, /SlideView\.svelte$/, /lib\/ui\/(Logo|Icon|BbmPic|Qr)\.svelte$/];
const ATTRS = new Set(['placeholder', 'aria-label', 'title', 'alt', 'label', 'why', 'aria-roledescription']);
const MSG_VARS = /^(msg|status|err|error|note|saved|fileMsg|copied|copiedAns|importMsg|wordState|message|info|warn|warning|hint|state|feedback|toast|answerMsg|shareMsg|done|pdfMsg|ocrMsg|progress|reason|why|problem|tip|caption|label|title)$/;
const KEYS = new Set(['title', 'label', 'about', 'body', 'text', 'desc', 'description', 'hint', 'note', 'help', 'why', 'msg', 'message', 'next', 'placeholder', 'sub', 'caption', 'heading', 'name', 'tip', 'short', 'blurb', 'q', 'empty', 'what', 'how', 'when', 'lead', 'sr', 'aria']);
const looksUi = (v) => /\p{L}{2,}/u.test(v) && !/^(https?:|mailto:|#\/|\.\/|\/|data:)/.test(v) && !/^[a-z0-9_.:-]+$/.test(v) && !/^[A-Z0-9_]+$/.test(v) && !/^[a-z]+(\.[A-Za-z0-9]+)+$/.test(v) && !/\.(xlsx|docx|pptx|pdf|json|csv|png|svg|mp4|vtt)\b/.test(v) && !/^(rgba?|hsla?)\(|^#[0-9a-f]{3,8}$|^\(prefers|^[\w-]+:\s/.test(v);
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.svelte')) files.push(p); } };
walk('src');
const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
let count = 0; const msgs = new Set();
for (const file of files) {
  if (SKIP_FILES.some((r) => r.test(file))) continue;
  const src = fs.readFileSync(file, 'utf8');
  const ast = parse(src, { modern: true });
  const ms = new MagicString(src);
  const done = new Set();
  const used = new Set();
  const name = (e) => {
    let n = e.type === 'Identifier' ? e.name : e.type === 'MemberExpression' && !e.computed && e.property.type === 'Identifier' ? e.property.name : e.type === 'CallExpression' && e.callee.type === 'Identifier' ? e.callee.name : 'x';
    if (!/^[A-Za-z_]\w*$/.test(n)) n = 'x';
    return n;
  };
  const wrap = (n) => {
    if (done.has(n.start)) return; done.add(n.start);
    if (n.type === 'Literal') { if (!looksUi(n.value)) return; ms.overwrite(n.start, n.end, `tr(${q(n.value)})`); msgs.add(n.value); count++; return; }
    if (n.type === 'TemplateLiteral') {
      const text = n.quasis.map((x) => x.value.cooked).join('');
      if (!looksUi(text) || !/\s/.test(text)) return;
      const local = new Set(); let tpl = ''; const vars = [];
      n.quasis.forEach((x, i) => {
        tpl += x.value.cooked.replace(/\{/g, '{{').replace(/\}/g, '}}');
        if (i < n.expressions.length) { const e = n.expressions[i]; let k = name(e), j = 2; const b = k; while (local.has(k)) k = `${b}${j++}`; local.add(k); vars.push([k, src.slice(e.start, e.end)]); tpl += `{${k}}`; }
      });
      ms.overwrite(n.start, n.end, `tr(${q(tpl)}${vars.length ? `, { ${vars.map(([k, e]) => (k === e ? k : `${k}: ${e}`)).join(', ')} }` : ''})`);
      msgs.add(tpl); count++;
    }
  };
  /** value positions of an expression that is displayed */
  const shown = (e) => {
    if (!e) return;
    if (e.type === 'Literal' && typeof e.value === 'string') return wrap(e);
    if (e.type === 'TemplateLiteral') return wrap(e);
    if (e.type === 'ConditionalExpression') { shown(e.consequent); shown(e.alternate); return; }
    if (e.type === 'LogicalExpression') { if (e.operator !== '&&') shown(e.left); shown(e.right); return; }
  };
  const inTr = (n) => n.type === 'CallExpression' && n.callee?.type === 'Identifier' && ['tr', 't'].includes(n.callee.name);
  const seen = new Set();
  const visit = (n, skip) => {
    if (!n || typeof n !== 'object' || seen.has(n)) return; seen.add(n);
    if (Array.isArray(n)) { n.forEach((x) => visit(x, skip)); return; }
    if (inTr(n)) {
      // the values filled into a message are displayed too: wrap their text
      const v = n.arguments?.[1];
      if (!skip && v?.type === 'ObjectExpression') for (const p of v.properties) if (p.type === 'Property') { shown(p.value); visit(p.value, skip); }
      return;
    }
    if (n.type === 'ImportDeclaration' || n.type === 'StyleSheet') return;
    if (n.type === 'RegularElement') {
      const lang = n.attributes?.find((a) => a.type === 'Attribute' && a.name === 'lang');
      const cls = n.attributes?.find((a) => a.type === 'Attribute' && a.name === 'class');
      const st = (a) => (a && Array.isArray(a.value) ? a.value.map((v) => v.data ?? '').join('') : '');
      if (st(lang) === 'en' || /\bpupil-font\b/.test(st(cls))) skip = true;
    }
    if (!skip) {
      if (n.type === 'ExpressionTag') shown(n.expression);
      if (n.type === 'Attribute' && ATTRS.has(n.name) && n.value && !Array.isArray(n.value) && n.value.type === 'ExpressionTag') shown(n.value.expression);
      if (n.type === 'Attribute' && ATTRS.has(n.name) && Array.isArray(n.value)) n.value.forEach((v) => v.type === 'ExpressionTag' && shown(v.expression));
      if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && MSG_VARS.test(n.left.name)) shown(n.right);
      if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && MSG_VARS.test(n.id.name) && n.init) {
        if (n.init.type === 'CallExpression' && n.init.callee.type === 'Identifier' && n.init.callee.name === '$state' && n.init.arguments[0]) shown(n.init.arguments[0]);
        else if (n.init.type !== 'CallExpression') shown(n.init);
      }
      if (n.type === 'Property' && !n.computed && ((n.key.type === 'Identifier' && KEYS.has(n.key.name)) || (n.key.type === 'Literal' && KEYS.has(n.key.value)))) shown(n.value);
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && ['showError', 'say', 'announce'].includes(n.callee.name)) n.arguments.forEach(shown);
    }
    for (const k of Object.keys(n)) if (!['parent', 'metadata', 'loc'].includes(k)) visit(n[k], skip);
  };
  visit(ast.instance?.content, false);
  visit(ast.fragment, false);
  if (!done.size) continue;
  let out = ms.toString();
  if (!/import \{[^}]*\btr\b[^}]*\} from '[^']*i18n\/index\.svelte'/.test(out)) {
    const rel = path.relative(path.dirname(file), 'src/lib/i18n/index.svelte').replace(/\\/g, '/');
    out = out.replace(/<script lang="ts">\n/, `<script lang="ts">\n  import { tr } from '${rel.startsWith('.') ? rel : './' + rel}';\n`);
  }
  fs.writeFileSync(file, out);
}
console.log(count, 'wrapped,', msgs.size, 'distinct');
