// Wraps listed string literals (exact text) in tr() inside the given files. For reviewed leftovers of the other passes.
// Usage: node tools/i18n-wrap-list.mjs spec.json   spec: { "file": ["text", …] }
import fs from 'node:fs';
import path from 'node:path';
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let n = 0;
for (const [file, list] of Object.entries(spec)) {
  let s = fs.readFileSync(file, 'utf8');
  for (const text of list) {
    const esc = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const token = `'${esc}'`;
    const re = new RegExp(`(?<!tr\\()(?<![\\w$.])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\s*(===|!==|:\\s*\\[|\\]\\s*:))`, 'g');
    const before = s;
    s = s.replace(re, () => { n++; return `tr(${token})`; });
    if (s === before) console.error(`not found: ${file}: ${text}`);
  }
  if (!/import \{[^}]*\btr\b[^}]*\} from '[^']*i18n\/index\.svelte'/.test(s)) {
    const rel = path.relative(path.dirname(file), 'src/lib/i18n/index.svelte').replace(/\\/g, '/');
    s = s.replace(/<script lang="ts">\n/, `<script lang="ts">\n  import { tr } from '${rel.startsWith('.') ? rel : './' + rel}';\n`);
  }
  fs.writeFileSync(file, s);
}
console.log(n, 'wrapped');
