"""Extract every Scheme of Work lesson into structured records.

Columns are located from the table's ruling lines, so text is read column by column instead of
line by line across the page. Output: out/raw/sow-y{year}-{school}.json plus a problems list.
"""
import json, os, pickle, re, sys
import words as W
from sources import SRC, SOW

_cache = {}
def doc(f):
    if f not in _cache:
        with open(os.path.join(SRC, f, 'edges.pkl'), 'rb') as fh:
            edges = pickle.load(fh)
        _cache[f] = (W.load(os.path.join(SRC, f)), edges)
    return _cache[f]

LESSON = re.compile(r'LESSON\s*:\s*(?:Lesson\s*)?(\d+)\s*(\([^)]*\)|\(?[A-Za-z][A-Za-z ]*?\s*\(?\d+\)?\)?)?(?=\s|$)')
def label(s):
    return clean(re.sub(r'[()]', ' ', s or ''))
COLS = ['cs', 'ls', 'outline', 'materials', 'cce', 'diff', 'notes']

def clean(s):
    s = s.replace(' ', ' ').replace('', '•').replace('•', '•')
    return re.sub(r'[ \t]+', ' ', s).strip()

def cluster(xs, tol=4):
    out = []
    for x in sorted(xs):
        if out and x - out[-1][-1] <= tol: out[-1].append(x)
        else: out.append([x])
    return [sum(c) / len(c) for c in out]

def header_row(page):
    """Find the table's column-title row. Returns (top, bottom, {label: x_centre}) or None."""
    ws = page['words']
    for o in [w for w in ws if w[4] == 'OUTLINE']:
        near = [w for w in ws if -14 <= w[1] - o[1] <= 14]
        std = sorted([w for w in near if w[4] == 'STANDARD'], key=lambda w: w[0])
        if len(std) < 2 or not any(w[4] == 'LEARNING' for w in near): continue
        lab = {'cs': (std[0][0] + std[0][2]) / 2, 'ls': (std[1][0] + std[1][2]) / 2, 'outline': o[0] - 25}
        for w in near:
            xc = (w[0] + w[2]) / 2
            if w[4] == 'MATERIALS': lab['materials'] = xc + 15
            elif w[4] == 'DIFFERENTIATION': lab['diff'] = xc
            elif w[4] in ('CURRICULAR', 'CROSS-CURRICULAR'): lab['cce'] = xc
            elif w[4].startswith('TEACHER'): lab['notes'] = xc + 25
        caps = [w for w in near if w[4].isupper() or w[4] in ('/', '-')]
        return min(w[1] for w in caps), max(w[3] for w in caps if w[4] in ('STANDARD', 'STRATEGIES', 'REFERENCES', 'ELEMENT', 'REMARKS', 'OUTLINE')), lab
    return None

def column_borders(edges, y_from):
    """x positions of the long vertical rules below y_from."""
    tall = {}
    for x, top, bot in edges['v']:
        if bot <= y_from + 5: continue
        tall.setdefault(round(x), 0)
        tall[round(x)] += bot - max(top, y_from)
    xs = [x for x, h in tall.items() if h >= 40]
    return cluster(xs, 5)

def table_span(edges, x, y_start):
    """Top and bottom of the unbroken vertical rule at x that starts at or below y_start.

    A worksheet printed lower on the same page has its own rules after a gap, so it is left out.
    """
    segs = sorted((t, b) for vx, t, b in edges['v'] if abs(vx - x) < 3.5 and b > y_start + 2)
    if not segs: return None
    top, bot = segs[0]
    for t, b in segs[1:]:
        if t <= bot + 14: bot = max(bot, b)   # small breaks occur between the title row and the body
        else: break
    return top, bot

def assign_columns(borders, labels):
    """Map each label to the (left, right) interval that contains its centre."""
    out = {}
    for name, xc in labels.items():
        for a, b in zip(borders, borders[1:]):
            if a - 2 <= xc <= b + 2:
                out[name] = (a, b); break
    return out

def col_lines(ws, a, b, tol=2.5):
    inside = [w for w in ws if a - 1.5 <= (w[0] + min(w[2], w[0] + 6)) / 2 and w[0] < b - 1.5]
    return W.lines(inside, tol), a

FOOTER = re.compile(r'^(Year \d English( Scheme of Work.*)?|Primary Year \d.*Scheme of Work.*|\d{1,3})$')
def col_text(ws, a, b):
    ls, _ = col_lines(ws, a, b)
    out = [(ln[0][0] - a, clean(' '.join(w[4] for w in ln))) for ln in ls]
    while out and FOOTER.match(out[-1][1]): out.pop()
    return out

SEC = [('pre', re.compile(r'^pre\s*[-–]?\s*lesson\b', re.I)), ('delivery', re.compile(r'^lesson\s*[-–]?\s*(delivery|development)\b', re.I)), ('post', re.compile(r'^post\s*[-–]?\s*lesson\b', re.I))]
ITEM = re.compile(r'^(\d{1,2})(?:\.{1,2}|\))\s*(.*)$')
BULLET = re.compile(r'^[•\-–·o]\s+(.*)$')

TAIL = re.compile(r'^(.*\S)\s+((?:Pre|Post)\s*[-–]?\s*lesson|Lesson\s+delivery)\s*$', re.I)

def parse_outline(lines):
    """Split the Learning Outline into pre / delivery / post, each a list of step strings.

    A numbered step is only accepted when its number follows on from the previous step, so text
    such as "Activity\n1). Stick the pictures" is not mistaken for a new step.
    """
    out = {'pre': [], 'delivery': [], 'post': []}
    cur, intro, last_n, fresh = None, [], 0, False
    flat = []
    for indent, t in lines:           # a section heading printed at the end of a text line
        m = TAIL.match(t)
        if m and len(m.group(2)) < 16: flat += [(indent, m.group(1)), (0, m.group(2))]
        else: flat.append((indent, t))
    for indent, t in flat:
        if not t: continue
        hit = None
        for key, rx in SEC:
            m = rx.match(t)
            if m and len(t) < 40:
                hit = key; rest = t[m.end():].strip(' :'); break
        if hit:
            cur, fresh = hit, True
            if rest: out[cur].append(rest); fresh = False
            continue
        if cur is None:
            intro.append(t); continue
        m = ITEM.match(t)
        b = BULLET.match(t)
        if m:
            n = int(m.group(1)); strict = bool(re.match(r'^\d{1,2}\.(\s|$)', t))
            ok = n == last_n + 1 or (fresh and n == 1) or (strict and last_n < n <= last_n + 3)
        else: ok = False
        if ok:
            out[cur].append(m.group(2)); last_n = n
        elif b and out[cur]:
            out[cur][-1] += '\n• ' + b.group(1)
        elif out[cur]:
            out[cur][-1] = (out[cur][-1] + ' ' + t).strip()
        else:
            out[cur].append(t)
        fresh = False
    out = {k: [clean(s) for s in v if clean(s)] for k, v in out.items()}
    if intro: out['note'] = clean(' '.join(intro))
    return out

SKILLS = ['Listening', 'Speaking', 'Reading', 'Writing', 'Language Arts', 'Language Awareness', 'Phonics']
CODE = re.compile(r'(?<![\d.])(\d)\.{1,2}(\d{1,2})(?:\.(\d{1,2}))?(?!\d)')

def parse_standards(lines, level):
    """Parse a Content/Learning Standard column into {'main': [...], 'comp': [...]} entries."""
    text = '\n'.join(t for _, t in lines)
    want3 = level == 'ls'
    if not any((m.group(3) is not None) == want3 and int(m.group(1)) <= 5 for m in CODE.finditer(text)):
        # no standard codes at all: the SoW leaves the choice to the teacher, so keep its wording as a note
        note = clean(text.replace('\n', ' '))
        return {'main': [], 'comp': [], 'note': note} if note else {'main': [], 'comp': []}
    HEAD = r'(?:skill\(?s?\)?|content\s+standard|learning\s+standard)'
    parts = re.split(r'(?i)\b(main\s+' + HEAD + r'|complementary\s+' + HEAD + r')(?!\w)', text)
    res = {'main': [], 'comp': []}
    role = 'main'
    for p in parts:
        if re.fullmatch(r'(?i)main\s+' + HEAD, p.strip()): role = 'main'; continue
        if re.fullmatch(r'(?i)complementary\s+' + HEAD, p.strip()): role = 'comp'; continue
        body = clean(p.replace('\n', ' '))
        if not body: continue
        # split on standard codes of the right depth
        want3 = level == 'ls'
        pos = [m for m in CODE.finditer(body) if (m.group(3) is not None) == want3 and int(m.group(1)) <= 5]
        if not pos:
            if re.search(r'(?i)\b(none|n/a|not applicable)\b', body) or len(body) < 3: continue
            res[role].append({'code': None, 'skill': None, 'text': body}); continue
        skill = None
        head = body[:pos[0].start()]
        for s in SKILLS:
            if re.search(s, head, re.I): skill = s
        for i, m in enumerate(pos):
            end = pos[i + 1].start() if i + 1 < len(pos) else len(body)
            txt = body[m.end():end].strip(' :-')
            nxt_skill = None
            for s in SKILLS:  # a skill name directly before the next code belongs to that next entry
                mm = re.search(r'\b' + s + r'\s*$', txt)
                if mm: nxt_skill = s; txt = txt[:mm.start()].strip()
            res[role].append({'code': '.'.join(g for g in m.groups() if g), 'skill': skill, 'text': clean(txt)})
            if nxt_skill: skill = nxt_skill
    for role in res:   # a code printed twice (once alone, once with its wording) is one standard
        seen = {e['code'] for e in res[role] if e['text']}
        res[role] = [e for e in res[role] if e['text'] or e['code'] not in seen]
    return res

def header_fields_a(ws):
    """Years 1-2: the lesson heading sits on its own page, one field per line."""
    ls = [clean(' '.join(w[4] for w in ln)) for ln in W.lines([w for w in ws if w[1] < 520], 4)]
    ls = [l for l in ls if l and not re.fullmatch(r'[_\s]*(WEEK:)?[_\s]*', l) and not re.match(r'Primary Year \d', l)]
    f = {}
    key = None
    for l in ls:
        l = re.sub(r'^(WEEK:\s*_*|_+)\s*', '', l).strip()
        if not l: continue
        m = LESSON.search(l)
        if m and 'no' not in f: f['no'] = int(m.group(1)); f['label'] = label(m.group(2)); key = None; continue
        for k, rx in (('mainSkill', r'MAIN SKILL\(?S?\)? FOCUS\s*:?'), ('theme', r'THEME\s*:?'), ('topic', r'TOPIC\s*:?'), ('focus', r'LANGUAGE\s*/\s*GRAMMAR FOCUS\s*:?')):
            m = re.match(rx, l)
            if m: key = k; f[k] = l[m.end():].strip(' :'); break
        else:
            if key: f[key] = (f[key] + ' ' + l).strip()
    return f

def header_fields_b(ws, table_top):
    """Years 3-6: heading cells above the table: LESSON/TOPIC | MAIN SKILL/CCE | THEME/FOCUS."""
    hs = [w for w in ws if w[1] < table_top - 2 and not re.fullmatch(r'_+|WEEK:', w[4])]
    def find(tok):
        c = [w for w in hs if w[4] == tok or (tok == 'LESSON:' and w[4].startswith('LESSON:'))]
        return min(c, key=lambda w: w[1]) if c else None
    les, main, theme = find('LESSON:'), find('MAIN'), find('THEME:')
    if not les: return {}
    y0 = les[1] - 4
    hs = [w for w in hs if w[1] >= y0]
    x1 = main[0] - 2 if main else 1e9
    x2 = theme[0] - 2 if theme else 1e9
    cells = [[w for w in hs if w[0] < x1], [w for w in hs if x1 <= w[0] < x2], [w for w in hs if w[0] >= x2]]
    t = [clean(' '.join(' '.join(w[4] for w in ln) for ln in W.lines(c, 4))) for c in cells]
    f = {}
    m = LESSON.search(t[0])
    if m: f['no'] = int(m.group(1)); f['label'] = label(m.group(2))
    m = re.search(r'TOPIC\s*:\s*(.*)$', t[0]);  f['topic'] = clean(m.group(1)) if m else ''
    m = re.search(r'MAIN SKILL\(?S?\)? FOCUS\s*:?\s*(.*?)(?=CROSS|$)', t[1]); f['mainSkill'] = clean(m.group(1)) if m else ''
    m = re.search(r'CROSS-CURRICULAR ELEMENT(?:\s*\(CCE\))?\s*:?\s*(.*)$', t[1]); f['cce'] = clean(m.group(1)) if m else ''
    m = re.search(r'THEME\s*:\s*(.*?)(?=LANGUAGE\s*/\s*GRAMMAR|$)', t[2]); f['theme'] = clean(m.group(1)) if m else ''
    m = re.search(r'LANGUAGE\s*/\s*GRAMMAR FOCUS\s*:?\s*(.*)$', t[2]); f['focus'] = clean(m.group(1)) if m else ''
    return f

def kind_line(ws, y_max):
    for ln in W.lines([w for w in ws if w[1] < y_max], 3):
        s = ' '.join(w[4] for w in ln)
        m = re.search(r'SCHEME OF WORK:\s*(NON[- ]TEXTBOOK[- ]BASED|TEXTBOOK[- ]BASED)\s+LESSONS?\s*(?:\((.*?)\))?', s)
        if m: return ('non-textbook' if m.group(1).startswith('NON') else 'textbook'), clean(m.group(2) or '')
    return None, ''

def extract(f, first, last, year, school):
    pages, edges = doc(f)
    lessons, problems = [], []
    starts = []
    for pn in range(first, last + 1):
        ws = pages[pn - 1]['words']
        les = [w for w in ws if w[4].startswith('LESSON:')]
        if not les: continue
        w0 = min(les, key=lambda w: w[1])
        line = ' '.join(w[4] for w in sorted([w for w in ws if abs(w[1] - w0[1]) < 4 and w[0] >= w0[0]], key=lambda w: w[0]))
        if LESSON.match(line): starts.append(pn)
    for i, pn in enumerate(starts):
        end = (starts[i + 1] - 1) if i + 1 < len(starts) else last
        ws0 = pages[pn - 1]['words']
        hr0 = header_row(pages[pn - 1])
        rec = {'year': year, 'school': school, 'page': pn}
        if hr0:   # family B: heading and table share a page
            rec.update(header_fields_b(ws0, hr0[0]))
            k, unit = kind_line(ws0, hr0[0])
        else:     # family A: heading page, table follows
            rec.update(header_fields_a(ws0))
            k, unit = None, ''
        rec['kind'], rec['unit'] = k, unit
        cols = {c: [] for c in COLS}
        extra_pages, last_assign, table_pages = [], None, 0
        for q in range(pn, end + 1):
            pg = pages[q - 1]
            hr = header_row(pg)
            if hr:
                borders = column_borders(edges[q - 1], hr[1])
                assign = assign_columns(borders, hr[2])
                y0 = hr[1] + 1
            elif last_assign and q > pn:
                borders = column_borders(edges[q - 1], 0)
                # a continuation page must carry the same column rules
                want = sorted({a for a, _ in last_assign.values()} | {b for _, b in last_assign.values()})
                if len(borders) < 3 or sum(1 for x in want if any(abs(x - b) < 6 for b in borders)) < len(want) - 1:
                    if pg['words'] and len(pg['words']) > 8: extra_pages.append(q)
                    continue
                assign, y0 = last_assign, 0
            else:
                continue
            if 'outline' not in assign or 'cs' not in assign:
                problems.append({'page': q, 'issue': 'columns not resolved', 'labels': sorted(assign)}); continue
            last_assign = assign; table_pages += 1
            span = table_span(edges[q - 1], assign['outline'][0], y0 - 30 if hr else 0)
            if span is None:
                problems.append({'page': q, 'issue': 'table rule not found'}); continue
            if not hr: y0 = span[0] - 1
            y1 = span[1]
            body = [w for w in pg['words'] if y0 <= (w[1] + w[3]) / 2 <= y1 + 2]
            for c, (a, b) in assign.items():
                cols[c] += col_text(body, a, b)
        if not table_pages:
            problems.append({'page': pn, 'lesson': rec.get('no'), 'issue': 'no table found'})
        rec['cs'] = parse_standards(cols['cs'], 'cs')
        rec['ls'] = parse_standards(cols['ls'], 'ls')
        rec['outline'] = parse_outline(cols['outline'])
        rec['materials'] = clean(' '.join(t for _, t in cols['materials']))
        rec['differentiation'] = clean(' '.join(t for _, t in cols['diff']))
        if cols['cce'] and not rec.get('cce'): rec['cce'] = clean(' '.join(t for _, t in cols['cce']))
        rec.setdefault('cce', '')
        rec['pages'] = [pn, pn + 0] if False else list(range(pn, pn + 1))
        rec['extraPages'] = extra_pages
        lessons.append(rec)
    return lessons, problems

if __name__ == '__main__':
    os.makedirs('out/raw', exist_ok=True)
    allp = []
    for f, a, b, y, s in SOW:
        ls, pr = extract(f, a, b, y, s)
        nos = [l.get('no') for l in ls]
        with open(f'out/raw/sow-y{y}-{s.lower()}.json', 'w') as fh: json.dump(ls, fh, ensure_ascii=False, indent=1)
        dup = len(nos) - len(set(nos))
        miss = sorted(set(range(1, max(n for n in nos if n) + 1)) - set(nos)) if nos else []
        print(f'Y{y} {s}: {len(ls)} lessons (max no {max(nos) if nos else 0}), dup {dup}, missing {miss[:12]}, problems {len(pr)}')
        allp += [dict(p, year=y, school=s) for p in pr]
    with open('out/raw/sow-problems.json', 'w') as fh: json.dump(allp, fh, indent=1)
