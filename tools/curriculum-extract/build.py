"""Cross-check the raw extraction against the DSKP and write the curriculum pack used by the app.

Reads   out/raw/*.json  (from sow.py, dskp.py, tasks.py, phonics.py)
Writes  ../../app/public/curriculum/kssr2017/*.json   and   ../../docs/curriculum-validation.{md,json}
"""
import difflib, json, os, random, re, sys
from sources import SOW, PHONICS, DSKP

PACK = 'kssr2017'
VERSION = '1.0.0'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'app', 'public', 'curriculum', PACK)
DOCS = os.path.join(os.path.dirname(__file__), '..', '..', 'docs')
TEXTBOOK = {1: 'Super Minds 1', 2: 'Super Minds 1', 3: 'Get Smart Plus 3', 4: 'Get Smart Plus 4', 5: 'English Plus 1', 6: 'Academy Stars Year 6'}
SKILL_OF = {'1': 'Listening', '2': 'Speaking', '3': 'Reading', '4': 'Writing', '5': 'Language Arts'}
# Typos in the official documents, corrected here and listed in the validation report.
LESSON_NO_FIX = {(1, 'SJK', 172): 72}

def raw(name):
    with open(f'out/raw/{name}.json') as f: return json.load(f)

def norm(s): return re.sub(r'[^a-z0-9]+', ' ', (s or '').lower()).strip()
def sim(a, b): return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()

def first_page(table, year, school):
    for f, a, b, y, s in table:
        if y == year and s == school: return a
    raise KeyError((year, school))

def build_standards(year, school):
    d = raw(f'dskp-y{year}-{school.lower()}')
    first = first_page(DSKP, year, school)
    cs = [{'code': c['code'], 'skill': c['skill'], 'text': c['text']} for c in d['cs']]
    ls = [{'code': l['code'], 'cs': l['cs'], 'skill': l['skill'], 'text': l['full'], 'focus': l['focus'], 'docPage': l['page'] - first + 1} for l in d['ls']]
    perf = {sk: [{'level': r['level'], 'descriptors': r['descriptors'], 'note': r['note']} for r in rows] for sk, rows in d['performance'].items()}
    return {'pack': PACK, 'year': year, 'cs': cs, 'ls': ls, 'performance': perf}

def infer_skill(label):
    for s in ('Language Arts', 'Language Awareness', 'Listening', 'Speaking', 'Reading', 'Writing'):
        if re.search(s, label or '', re.I): return s
    return ''

def build_lessons(rawname, year, school, std, first, issues, kind_default=None):
    cs_ok = {c['code'] for c in std['cs']}
    ls_by = {l['code']: l for l in std['ls']}
    out = []
    def issue(level, no, code, msg, **extra):
        issues.append(dict(level=level, year=year, school=school, doc=rawname.split('-')[0], lesson=no, code=code, message=msg, **extra))
    for l in raw(rawname):
        no = LESSON_NO_FIX.get((year, school, l.get('no')), l.get('no'))
        if no != l.get('no'): issue('corrected', no, 'lesson-number', f"The document prints LESSON: {l['no']}; it is lesson {no} in sequence.")
        main_skill = l.get('mainSkill', '').strip(' :')
        if not main_skill:
            main_skill = infer_skill(l.get('label'))
            issue('corrected', no, 'main-skill', f'Main skill focus is blank in the document; taken from the lesson label ("{l.get("label")}").')
        label = l.get('label') or ''
        std_out, wording = {}, {}
        for role in ('main', 'comp'):
            ls_codes, cs_codes = [], []
            for e in l['ls'][role]:
                c = e['code']
                if c is None:
                    # a mistyped code: identify the standard by its wording instead
                    wording = re.sub(r'^\W*(Listening|Speaking|Reading|Writing|Language Arts)?\W*[\d.]*\s*', '', e['text'])
                    best = max(std['ls'], key=lambda x: sim(wording, x['text']))
                    if sim(wording, best['text']) >= 0.85:
                        c = best['code']; issue('corrected', no, 'ls-typo', f'{role} learning standard code is mistyped ("{e["text"][:28]}…"); matched by its wording to {c}.')
                    else: issue('warning', no, 'ls-unreadable', f'{role} learning standard has no code: "{e["text"][:80]}"'); continue
                if c not in ls_by: issue('error', no, 'ls-unknown', f'{role} learning standard {c} is not in the Year {year} DSKP.'); continue
                ls_codes.append(c)
                r = sim(e['text'], ls_by[c]['text'])
                if e['text'] and r < 0.8:
                    part = norm(re.sub(r'^\(?[ivx]+\)\s*', '', e['text']))
                    other = max(std['ls'], key=lambda x: sim(e['text'], x['text']))
                    if len(part) > 12 and part in norm(ls_by[c]['text']):
                        wording[c] = e['text']        # the lesson targets one part of the standard
                        issue('info', no, 'ls-part', f'{c}: the SoW names one part of this standard; kept alongside the DSKP wording.')
                    elif other['code'] != c and sim(e['text'], other['text']) >= 0.9:
                        wording[c] = e['text']
                        issue('warning', no, 'ls-code-vs-wording', f'{role}: the SoW prints code {c} but its wording is that of {other["code"]}. Code kept; please check the document.', sow=e['text'], dskp=ls_by[c]['text'])
                    else:
                        if len(e['text']) < 320: wording[c] = e['text']
                        issue('info', no, 'ls-wording', f'{c}: SoW wording differs from the Year {year} DSKP (similarity {r:.2f}). Both are kept.', sow=e['text'], dskp=ls_by[c]['text'])
            for e in l['cs'][role]:
                c = e['code']
                if c is None:
                    m = re.search(r'\b(\d\.\d{1,2})\.\d', e['text'])
                    if m and m.group(1) in cs_ok:
                        c = m.group(1); issue('corrected', no, 'cs-typo', f'{role} content standard is printed with a learning-standard code; read as {c}.')
                    else: issue('warning', no, 'cs-unreadable', f'{role} content standard has no code: "{e["text"][:80]}"'); continue
                if c not in cs_ok: issue('error', no, 'cs-unknown', f'{role} content standard {c} is not in the Year {year} DSKP.'); continue
                cs_codes.append(c)
            derived = []
            for c in ls_codes:
                p = '.'.join(c.split('.')[:2])
                if p not in derived: derived.append(p)
            if ls_codes and sorted(set(cs_codes)) != sorted(derived):
                if cs_codes: issue('warning', no, 'cs-ls-mismatch', f'{role}: content standard(s) {cs_codes} do not match learning standard(s) {ls_codes}; using {derived}. Please check the document.')
                else: issue('info', no, 'cs-derived', f'{role}: no content standard is printed; taken from the learning standard code ({derived}).')
                cs_codes = derived
            std_out[role] = {'cs': list(dict.fromkeys(cs_codes)), 'ls': list(dict.fromkeys(ls_codes))}
        note = l['ls'].get('note') or l['cs'].get('note')
        if note: std_out['note'] = note
        if wording: std_out['sowWording'] = wording
        if not std_out['main']['ls'] and not note: issue('error', no, 'no-main-ls', 'No main learning standard found.')
        if not std_out['comp']['ls'] and not note: issue('info', no, 'no-comp-ls', 'No complementary learning standard is given in the document.')
        o = l['outline']
        if not (o['pre'] or o['delivery'] or o['post'] or o.get('note')): issue('error', no, 'no-outline', 'Learning outline is empty.')
        elif not o.get('note') and not (o['pre'] and o['delivery'] and o['post']):
            missing = [k for k in ('pre', 'delivery', 'post') if not o[k]]
            issue('info', no, 'outline-partial', f"The document gives no text under: {', '.join(missing)}.")
        kind = l.get('kind') or kind_default
        if kind is None:
            tb = TEXTBOOK[year].split(' Year')[0].replace(' ', r'\s*')
            kind = 'textbook' if re.search(tb, l.get('materials', '') + ' ' + ' '.join(o['pre'] + o['delivery']), re.I) or 'Teacher’s Book' in ' '.join(o['pre'] + o['delivery']) else 'non-textbook'
        rec = {'no': no, 'label': label, 'kind': kind, 'unit': l.get('unit') or '', 'mainSkill': main_skill,
               'theme': l.get('theme', ''), 'topic': l.get('topic') or '', 'focus': l.get('focus', ''), 'cce': l.get('cce', ''),
               'std': std_out, 'outline': o, 'materials': l.get('materials', ''), 'differentiation': l.get('differentiation', ''),
               'docPage': l['page'] - first + 1}
        if l.get('extraPages'): rec['worksheetPages'] = [p - first + 1 for p in l['extraPages']]
        for k in ('theme', 'topic'):
            if not rec[k]: issue('info', no, f'no-{k}', f'{k.title()} is blank in the document.')
        out.append(rec)
    out.sort(key=lambda r: r['no'])
    nos = [r['no'] for r in out]
    if nos != list(range(1, len(nos) + 1)): issues.append(dict(level='error', year=year, school=school, doc=rawname.split('-')[0], lesson=None, code='sequence', message=f'Lesson numbers are not 1..{len(nos)}: {nos[:5]}…'))
    return out

def dump(name, data):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, 'w') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    return os.path.getsize(path)

def main():
    issues, index, sizes = [], {'pack': PACK, 'title': 'KSSR (Semakan 2017) English', 'version': VERSION, 'years': {}}, {}
    all_std = {}
    for year in range(1, 7):
        sk, sjk = build_standards(year, 'SK'), build_standards(year, 'SJK')
        strip = lambda s: json.dumps({k: ([{a: b for a, b in x.items() if a != 'docPage'} for x in v] if k == 'ls' else v) for k, v in s.items()}, sort_keys=True)
        same = strip(sk) == strip(sjk)
        if not same: issues.append(dict(level='warning', year=year, school='SJK', doc='dskp', lesson=None, code='dskp-differs', message='The SK and SJK DSKP standards differ; both are stored.'))
        sizes[f'standards-y{year}.json'] = dump(f'standards-y{year}.json', sk)
        if not same: sizes[f'standards-y{year}-sjk.json'] = dump(f'standards-y{year}-sjk.json', sjk)
        all_std[(year, 'SK')], all_std[(year, 'SJK')] = sk, sjk
        for s in (sk,):
            for skill in ('Listening', 'Speaking', 'Reading', 'Writing'):
                lv = [r['level'] for r in s['performance'].get(skill, [])]
                if lv != [1, 2, 3, 4, 5, 6]: issues.append(dict(level='error', year=year, school='SK', doc='dskp', lesson=None, code='tp-levels', message=f'{skill}: performance levels found {lv}'))
        index['years'][str(year)] = {'textbook': TEXTBOOK[year], 'standards': f'standards-y{year}.json', 'standardsSjk': None if same else f'standards-y{year}-sjk.json', 'schools': {}}
    coverage = {}
    for f, a, b, year, school in SOW:
        std = all_std[(year, school)]
        lessons = build_lessons(f'sow-y{year}-{school.lower()}', year, school, std, a, issues)
        sup = raw(f'support-y{year}-{school.lower()}')
        support = {'pre': [{k: v for k, v in t.items() if k != 'page'} for t in sup['pre']],
                   'post': [{k: v for k, v in t.items() if k != 'page'} for t in sup['post']],
                   'strategies': [{k: v for k, v in t.items() if k != 'page'} for t in sup['strategies']]}
        name = f'sow-y{year}-{school.lower()}.json'
        sizes[name] = dump(name, {'pack': PACK, 'year': year, 'school': school, 'textbook': TEXTBOOK[year], 'lessons': lessons, 'support': support})
        used = {c for l in lessons for r in ('main', 'comp') for c in l['std'][r]['ls']}
        coverage[(year, school)] = sorted({l['code'] for l in std['ls']} - used, key=lambda c: [int(x) for x in c.split('.')])
        index['years'][str(year)]['schools'][school] = {'file': name, 'lessons': len(lessons)}
    for f, a, b, year in PHONICS:
        lessons = build_lessons(f'phonics-y{year}', year, 'SK', all_std[(year, 'SK')], a, issues, kind_default='non-textbook')
        name = f'phonics-y{year}.json'
        sizes[name] = dump(name, {'pack': PACK, 'year': year, 'lessons': lessons})
        index['years'][str(year)]['phonics'] = {'file': name, 'lessons': len(lessons)}
    sizes['index.json'] = dump('index.json', index)

    # ---- report ----
    os.makedirs(DOCS, exist_ok=True)
    by = {}
    for i in issues: by.setdefault(i['level'], []).append(i)
    with open(os.path.join(DOCS, 'curriculum-validation.json'), 'w') as fh:
        json.dump({'version': VERSION, 'counts': {k: len(v) for k, v in by.items()}, 'issues': issues,
                   'uncoveredLearningStandards': {f'Y{y} {s}': v for (y, s), v in coverage.items()}}, fh, ensure_ascii=False, indent=1)
    rnd = random.Random(2017)
    L = ['# Curriculum data pack: validation report', '',
         f'Pack `{PACK}` version {VERSION}. Generated by `tools/curriculum-extract/build.py` from the official KPM documents.', '',
         '## What was extracted', '', '| Year | Textbook | SK lessons | SJK lessons | Phonics lessons | CS | LS | TP levels |', '|---|---|---|---|---|---|---|---|']
    for y in range(1, 7):
        yy = index['years'][str(y)]; st = all_std[(y, 'SK')]
        L.append(f"| {y} | {yy['textbook']} | {yy['schools']['SK']['lessons']} | {yy['schools']['SJK']['lessons']} | {yy.get('phonics', {}).get('lessons', '–')} | {len(st['cs'])} | {len(st['ls'])} | {', '.join(st['performance'])} |")
    total = sum(v['lessons'] for y in index['years'].values() for v in y['schools'].values())
    L += ['', f'Total: **{total} Scheme of Work lessons** and {sum(y.get("phonics", {}).get("lessons", 0) for y in index["years"].values())} Phonics lessons. Pack size: {sum(sizes.values()) / 1048576:.2f} MB in {len(sizes)} files.', '',
          '## Automatic checks', '',
          '- Every lesson number runs 1..N with no gaps or duplicates.',
          '- Every Learning Standard and Content Standard code used in a lesson exists in that year\'s DSKP.',
          '- Each Content Standard matches the first two parts of its Learning Standard code.',
          '- SoW wording of each Learning Standard is compared with the DSKP wording.',
          '- Performance levels 1–6 exist for Listening, Speaking, Reading and Writing in every year.', '',
          '| Result | Count | Meaning |', '|---|---|---|',
          f"| error | {len(by.get('error', []))} | Broken reference. Must be zero before release. |",
          f"| warning | {len(by.get('warning', []))} | Something in the source could not be read with certainty. |",
          f"| corrected | {len(by.get('corrected', []))} | A typo in the official document, fixed and listed below. |",
          f"| info | {len(by.get('info', []))} | A property of the source worth knowing (not a fault). |", '']
    for level, title in (('error', 'Errors'), ('warning', 'Warnings'), ('corrected', 'Corrections made to source typos')):
        L += [f'## {title}', '']
        if not by.get(level): L += ['None.', '']; continue
        L += ['| Year | School | Doc | Lesson | Issue |', '|---|---|---|---|---|']
        L += [f"| {i['year']} | {i['school']} | {i['doc']} | {i['lesson'] or ''} | {i['message']} |" for i in by[level]] + ['']
    info = {}
    for i in by.get('info', []): info.setdefault(i['code'], []).append(i)
    L += ['## Information', '', '| Code | Count | Example |', '|---|---|---|']
    L += [f"| {c} | {len(v)} | Y{v[0]['year']} {v[0]['school']} L{v[0]['lesson']}: {v[0]['message'][:140]} |" for c, v in sorted(info.items())]
    L += ['', '## Learning Standards never used in a Scheme of Work', '',
          'The SoW states that every Learning Standard appears at least once. These do not (many are marked "No learning standard" in the DSKP for that year):', '']
    L += [f'- Year {y} {s}: {", ".join(v) if v else "all covered"}' for (y, s), v in coverage.items()]
    L += ['', '## Sample for manual checking (10% of lessons, fixed random seed)', '',
          'Open the official SoW PDF for the year and school, go to the PDF page shown, and compare with the lesson in Consilia (Library → Scheme of Work).', '',
          '| Year | School | Lesson | SoW PDF page | Topic | Main LS | Complementary LS |', '|---|---|---|---|---|---|---|']
    for f, a, b, year, school in SOW:
        with open(os.path.join(OUT, f'sow-y{year}-{school.lower()}.json')) as fh: ls = json.load(fh)['lessons']
        for l in sorted(rnd.sample(ls, max(1, round(len(ls) * 0.1))), key=lambda r: r['no']):
            L.append(f"| {year} | {school} | {l['no']} | {l['docPage']} | {l['topic'][:40]} | {', '.join(l['std']['main']['ls']) or '(teacher choice)'} | {', '.join(l['std']['comp']['ls']) or '–'} |")
    with open(os.path.join(DOCS, 'curriculum-validation.md'), 'w') as fh: fh.write('\n'.join(L) + '\n')
    print({k: len(v) for k, v in by.items()}, f'pack {sum(sizes.values()) / 1048576:.2f} MB', {k: f'{v // 1024}K' for k, v in sizes.items() if v > 300000})
    for i in by.get('error', [])[:25]: print('ERROR', i['year'], i['school'], i['doc'], i['lesson'], i['message'])
    for i in by.get('warning', [])[:25]: print('WARN', i['year'], i['school'], i['doc'], i['lesson'], i['message'][:150])
    return 1 if by.get('error') else 0

if __name__ == '__main__':
    sys.exit(main())
