// Wraps user-facing messages in logic modules (.ts) in tr(), at call time (not module load), with {name} placeholders.
// Each file names what to wrap: arguments of some calls, values of some object keys, assignments to some targets.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const CONFIG = {
  'src/lib/lesson/checker.ts': { calls: ['pass', 'fail', 'skip'], keys: [] },
  'src/lib/lesson/objectives.ts': { calls: [], keys: ['message'] },
  'src/lib/lesson/derive.ts': { calls: [], keys: [], vars: ['problem'] },
  'src/lib/errors.svelte.ts': { calls: [], keys: ['message', 'next'] },
  'src/lib/backup.ts': { calls: [], keys: ['error'] },
  'src/lib/share.ts': { calls: [], keys: ['error'] },
  'src/lib/textbook/ocr.svelte.ts': { calls: [], keys: ['message'], assign: ['ocr.message'] },
  'src/lib/yearplan-file.ts': { calls: [], keys: [], news: ['Error'] },
  'src/lib/ai/claude.ts': { calls: [], keys: [], news: ['AiError'] },
  'src/lib/ai/gemini.ts': { calls: [], keys: [], news: ['AiError'] },
  'src/lib/ai/ask.ts': { calls: [], keys: [], news: ['AiError'] },
  'src/lib/ai/common.ts': { calls: [], keys: [], news: ['AiError'] },
  'src/lib/recommend/engine.ts': { calls: ['log.push', 'why.push'], keys: [] },
  'src/lib/teach/coach.ts': { calls: [], keys: ['message', 'text'] }
};
const looksUi = (v) => /\p{L}{2,}/u.test(v) && /\s/.test(v.trim()) && !/^(https?:|#\/)/.test(v);
const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
for (const [file, cfg] of Object.entries(CONFIG)) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  const edits = [];
  const nameOf = (e) => {
    let n = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : ts.isCallExpression(e) && ts.isIdentifier(e.expression) ? e.expression.text : 'x';
    return /^[A-Za-z_]\w*$/.test(n) ? n : 'x';
  };
  const wrapNode = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { if (looksUi(n.text)) edits.push([n.getStart(sf), n.getEnd(), `tr(${q(n.text)})`]); return; }
    if (ts.isTemplateExpression(n)) {
      const local = new Set(); let tpl = n.head.text.replace(/\{/g, '{{').replace(/\}/g, '}}'); const vars = [];
      for (const span of n.templateSpans) {
        let k = nameOf(span.expression), j = 2; const b = k; while (local.has(k)) k = `${b}${j++}`; local.add(k);
        vars.push([k, span.expression.getText(sf)]); tpl += `{${k}}` + span.literal.text.replace(/\{/g, '{{').replace(/\}/g, '}}');
      }
      if (!looksUi(tpl.replace(/\{\w+\}/g, ''))) return;
      edits.push([n.getStart(sf), n.getEnd(), `tr(${q(tpl)}, { ${vars.map(([k, e]) => (k === e ? k : `${k}: ${e}`)).join(', ')} })`]);
      return;
    }
    if (ts.isConditionalExpression(n)) { wrapNode(n.whenTrue); wrapNode(n.whenFalse); return; }
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(n.operatorToken.kind)) { wrapNode(n.left); wrapNode(n.right); return; }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) { wrapNode(n.left); wrapNode(n.right); return; }
    if (ts.isParenthesizedExpression(n)) wrapNode(n.expression);
  };
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const callee = n.expression.getText(sf);
      if (callee === 'tr' || callee === 't') return; // already a message
      if (cfg.calls.includes(callee)) n.arguments.forEach(wrapNode);
    }
    if (ts.isNewExpression(n) && cfg.news?.includes(n.expression.getText(sf))) (n.arguments ?? []).slice(n.expression.getText(sf) === 'AiError' ? 1 : 0).forEach(wrapNode);
    if (ts.isPropertyAssignment(n) && cfg.keys.includes(n.name.getText(sf))) wrapNode(n.initializer);
    if (ts.isVariableDeclaration(n) && cfg.vars?.includes(n.name.getText(sf)) && n.initializer) wrapNode(n.initializer);
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken && cfg.assign?.includes(n.left.getText(sf))) wrapNode(n.right);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!edits.length) { console.log(`  0 ${file}`); continue; }
  edits.sort((a, b) => b[0] - a[0]);
  // drop edits nested inside an earlier (outer) edit
  const kept = []; for (const e of edits) if (!kept.some((k) => e[0] >= k[0] && e[1] <= k[1])) kept.push(e);
  let out = src; for (const [s, e, r] of kept) out = out.slice(0, s) + r + out.slice(e);
  if (!/import \{[^}]*\btr\b[^}]*\} from '[^']*i18n\/index\.svelte'/.test(out)) {
    let rel = path.relative(path.dirname(file), 'src/lib/i18n/index.svelte').replace(/\\/g, '/'); if (!rel.startsWith('.')) rel = './' + rel;
    const m = out.match(/^(\/\*[\s\S]*?\*\/\n)?/); const at = m ? m[0].length : 0;
    out = out.slice(0, at) + `import { tr } from '${rel}';\n` + out.slice(at);
  }
  fs.writeFileSync(file, out);
  console.log(`${String(kept.length).padStart(3)} ${file}`);
}
