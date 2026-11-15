// Integrity check of the shipped curriculum pack. Runs in CI on every build; needs no source PDFs.
import { readFileSync } from 'node:fs';
const dir = new URL('../public/curriculum/kssr2017/', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
const errors = [];
const fail = (m) => errors.push(m);
const index = read('index.json');
let lessons = 0;
for (const [year, y] of Object.entries(index.years)) {
  const stdFiles = { SK: y.standards, SJK: y.standardsSjk ?? y.standards };
  for (const [school, info] of Object.entries(y.schools)) {
    const std = read(stdFiles[school]);
    const cs = new Set(std.cs.map((c) => c.code)), ls = new Set(std.ls.map((l) => l.code));
    if (cs.size !== 15) fail(`Y${year} ${school}: expected 15 content standards, found ${cs.size}`);
    for (const l of std.ls) if (!cs.has(l.cs)) fail(`Y${year}: LS ${l.code} points to missing CS ${l.cs}`);
    for (const skill of ['Listening', 'Speaking', 'Reading', 'Writing']) {
      const lv = (std.performance[skill] ?? []).map((p) => p.level).join('');
      if (lv !== '123456') fail(`Y${year} ${school} ${skill}: performance levels are "${lv}"`);
      for (const p of std.performance[skill] ?? []) if (!p.descriptors.length) fail(`Y${year} ${school} ${skill} TP${p.level}: no descriptors`);
    }
    const sow = read(info.file);
    if (sow.lessons.length !== info.lessons) fail(`${info.file}: index says ${info.lessons} lessons, file has ${sow.lessons.length}`);
    sow.lessons.forEach((l, i) => {
      const id = `${info.file} lesson ${l.no}`;
      if (l.no !== i + 1) fail(`${id}: out of sequence at position ${i + 1}`);
      for (const role of ['main', 'comp']) {
        for (const c of l.std[role].ls) if (!ls.has(c)) fail(`${id}: unknown LS ${c}`);
        for (const c of l.std[role].cs) if (!cs.has(c)) fail(`${id}: unknown CS ${c}`);
        const want = [...new Set(l.std[role].ls.map((c) => c.split('.').slice(0, 2).join('.')))].sort().join();
        if (want !== [...l.std[role].cs].sort().join()) fail(`${id}: ${role} CS ${l.std[role].cs} does not match LS ${l.std[role].ls}`);
      }
      if (!l.std.main.ls.length && !l.std.note) fail(`${id}: no main LS and no note`);
      const o = l.outline;
      if (!o.pre.length && !o.delivery.length && !o.post.length && !o.note) fail(`${id}: empty outline`);
      if (!l.mainSkill) fail(`${id}: no main skill`);
      if (!(l.docPage > 0)) fail(`${id}: no source page`);
    });
    if (sow.support.pre.length !== 12 || sow.support.post.length !== 12 || sow.support.strategies.length !== 7)
      fail(`${info.file}: task bank is ${sow.support.pre.length}/${sow.support.post.length}/${sow.support.strategies.length}, expected 12/12/7`);
    lessons += sow.lessons.length;
  }
  if (y.phonics) {
    const ph = read(y.phonics.file);
    if (ph.lessons.length !== y.phonics.lessons) fail(`${y.phonics.file}: lesson count mismatch`);
  }
}
const expected = { 1: [160, 81], 2: [160, 80], 3: [160, 80], 4: [160, 96], 5: [160, 96], 6: [160, 96] };
for (const [year, [sk, sjk]] of Object.entries(expected)) {
  const s = index.years[year].schools;
  if (s.SK.lessons !== sk || s.SJK.lessons !== sjk) fail(`Y${year}: expected ${sk} SK / ${sjk} SJK lessons, found ${s.SK.lessons} / ${s.SJK.lessons}`);
}
if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} curriculum error(s)`); process.exit(1); }
console.log(`Curriculum pack ${index.pack} v${index.version}: ${lessons} lessons, all references valid.`);
