// Writes docs/manual.md and docs/privacy.md from the in-app content, so the repository docs never drift from the app.
// Run: npm run docs   (Node 22.18+ reads the .ts content files directly)
import { writeFileSync } from 'node:fs';
import { MANUAL } from '../src/lib/content/manual.ts';
import { PRIVACY } from '../src/lib/content/privacy.ts';

const docs = new URL('../../docs/', import.meta.url);
let m = '# Consilia user manual\n\nThe same manual is in the app (Me → Help) with search and the six video tutorials.\n\n## Contents\n\n';
for (const ch of MANUAL) m += `- [${ch.title}](#${ch.id})\n`;
for (const ch of MANUAL) {
  m += `\n<a id="${ch.id}"></a>\n## ${ch.title}\n`;
  for (const a of ch.articles) {
    m += `\n### ${a.title}\n\n${a.body.join('\n\n')}\n`;
    if (a.steps) m += '\n' + a.steps.map((s, i) => `${i + 1}. ${s.replace(/^\d+ · /, '')}`).join('\n') + '\n';
    if (a.tips) m += '\n' + a.tips.map((s) => `> Tip: ${s}`).join('\n>\n') + '\n';
    if (a.video) m += `\nVideo: Me → Help → Video tutorials.\n`;
  }
}
writeFileSync(new URL('manual.md', docs), m);

let p = '';
for (const lang of ['en', 'ms']) {
  const t = PRIVACY[lang];
  p += `# ${t.title}${lang === 'ms' ? ' (Bahasa Melayu)' : ''}\n\n${t.lead}\n`;
  for (const s of t.sections) p += `\n## ${s.h}\n\n${s.p.join('\n\n')}\n`;
  p += `\n_${t.updated}_\n\n${lang === 'en' ? '---\n\n' : ''}`;
}
writeFileSync(new URL('privacy.md', docs), p);
console.log('Wrote docs/manual.md and docs/privacy.md');
