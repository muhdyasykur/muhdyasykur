"""Extract Content Standards, Learning Standards (with their Focus) and Performance Standards from each DSKP."""
import json, os, pickle, re
import words as W
from sources import SRC, DSKP
from sow import clean, column_borders, cluster

SKILL = {'1': 'Listening', '2': 'Speaking', '3': 'Reading', '4': 'Writing', '5': 'Language Arts'}
CS_CODE = re.compile(r'^(\d\.\d{1,2})(?!\.\d)\b\.?\s*(.*)$')
LS_CODE = re.compile(r'^(\d\.\d{1,2}\.\d{1,2})\b\.?\s*(.*)$')

_cache = {}
def doc(f):
    if f not in _cache:
        with open(os.path.join(SRC, f, 'edges.pkl'), 'rb') as fh: e = pickle.load(fh)
        _cache[f] = (W.load(os.path.join(SRC, f)), e)
    return _cache[f]

def line_of(ws, w, tol=9):
    return [x for x in ws if abs(x[1] - w[1]) <= tol]

def std_header(pg):
    ws = pg['words']
    for f in [w for w in ws if w[4] == 'FOCUS']:
        row = line_of(ws, f)
        t = {w[4] for w in row}
        if {'CONTENT', 'LEARNING', 'STANDARD'} <= t:
            return max(w[3] for w in row), f
    return None

def perf_header(pg):
    ws = pg['words']
    for d in [w for w in ws if w[4] in ('DESCRIPTORS', 'DESCRIPTOR')]:
        row = [x for x in ws if abs(x[1] - d[1]) <= 14]
        t = {w[4] for w in row}
        if 'PERFORMANCE' in t and 'LEVEL' in t:
            sk = ' '.join(w[4] for w in sorted([x for x in ws if abs(x[1] - d[1]) <= 3 and x[0] > d[0]], key=lambda w: w[0]))
            m = re.search(r'FOR\s+(LISTENING|SPEAKING|READING|WRITING|LANGUAGE ARTS)', sk)
            return max(w[3] for w in row), (m.group(1).title() if m else None)
    return None

def col(ws, a, b):
    return [w for w in ws if a - 2 <= w[0] < b - 2]

def text_lines(ws):
    return [clean(' '.join(w[4] for w in ln)) for ln in W.lines(ws, 2.5)]

def row_bands(edges, a, b, y0, y1):
    """Horizontal rules that cross the x-range [a, b], as sorted y positions between y0 and y1."""
    ys = [y for y, x0, x1 in edges['h'] if x0 <= a + 8 and x1 >= b - 8 and y0 - 3 <= y <= y1 + 3]
    if not ys:  # rules drawn cell by cell: accept any rule that covers most of the range
        ys = [y for y, x0, x1 in edges['h'] if min(x1, b) - max(x0, a) >= 0.6 * (b - a) and y0 - 3 <= y <= y1 + 3]
    ys = cluster(ys, 3)
    return ys

def join(lines):
    out = ''
    for l in lines:
        if not l: continue
        if re.match(r'^(\(?[ivx]{1,4}\)|[a-z]\)|•|\uf0b7)', l) and out: out += '\n' + l
        else: out = (out + ' ' + l).strip()
    return clean_keep_nl(out)

def clean_keep_nl(s):
    return '\n'.join(clean(x) for x in s.split('\n') if clean(x))

def extract(f, first, last, year, school):
    pages, edges = doc(f)
    cs, ls, perf, problems = {}, {}, {}, []
    last_ls = None
    for pn in range(first, last + 1):
        pg, ed = pages[pn - 1], edges[pn - 1]
        ws = pg['words']
        h = std_header(pg)
        if h:
            y0 = h[0]
            b = column_borders(ed, y0)
            if len(b) < 4:
                problems.append({'page': pn, 'issue': f'standards table: {len(b)} column rules'}); continue
            b = b[:4] if len(b) == 4 else [b[0], b[1], b[2], b[-1]]
            y1 = max((bt for _, _, bt in ed['v']), default=pg['h'] - 60)
            body = [w for w in ws if y0 - 1 <= (w[1] + w[3]) / 2 <= y1 + 2]
            # content standards: a code at the start of a line opens a new one
            cur = None
            for l in text_lines(col(body, b[0], b[1])):
                m = CS_CODE.match(l)
                if m: cur = m.group(1); cs.setdefault(cur, {'code': cur, 'lines': [], 'page': pn}); l = m.group(2)
                if cur and l and pn == cs[cur]['page']: cs[cur]['lines'].append(l)
            # learning standards: a code at the start of a line opens a new one
            on_page = []
            for ln in W.lines(col(body, b[2], b[3]), 2.5):
                l = clean(' '.join(w[4] for w in ln)); y = (ln[0][1] + ln[0][3]) / 2
                m = LS_CODE.match(l)
                if m:
                    last_ls = m.group(1)
                    ls[last_ls] = {'code': last_ls, 'lines': [m.group(2)], 'focus': [], 'page': pn}
                    on_page.append((y, last_ls))
                elif last_ls and l: ls[last_ls]['lines'].append(l)
            # focus cells (which may span several learning standards) come from the rules of the Focus column
            fb = row_bands(ed, b[1], b[2], y0, y1)
            if len(fb) < 2 or fb[0] > y0 + 30: fb = [y0] + fb
            if fb[-1] < y1 - 8: fb.append(y1 + 3)
            for ya, yb in zip(fb, fb[1:]):
                seg = [w for w in body if ya - 1 <= (w[1] + w[3]) / 2 < yb - 1]
                fl = [l for l in text_lines(col(seg, b[1], b[2])) if l]
                if not fl: continue
                targets = [c for y, c in on_page if ya - 2 <= y < yb]
                if not targets and on_page: targets = [min(on_page, key=lambda t: abs(t[0] - (ya + yb) / 2))[1]]
                for c in targets: ls[c]['focus'] += fl
            continue
        p = perf_header(pg)
        if p and p[1]:
            y0, skill = p
            b = column_borders(ed, y0)
            if len(b) < 3:
                problems.append({'page': pn, 'issue': f'performance table: {len(b)} column rules'}); continue
            b = [b[0], b[1], b[2], b[-1]] if len(b) >= 4 else [b[0], b[1], b[2], b[2]]   # Years 4-6 have no Notes column
            y1 = max((bt for _, _, bt in ed['v']), default=pg['h'] - 60)
            body = [w for w in ws if y0 - 1 <= (w[1] + w[3]) / 2 <= y1 + 2]
            bands = row_bands(ed, b[1], b[2], y0, y1)
            tab = perf.setdefault(skill, {})
            for ya, yb in zip(bands, bands[1:]):
                seg = [w for w in body if ya - 1 <= (w[1] + w[3]) / 2 < yb - 1]
                lv = [w[4] for w in col(seg, b[0], b[1]) if re.fullmatch(r'[1-6]', w[4])]
                dl = text_lines(col(seg, b[1], b[2])); nl = text_lines(col(seg, b[2], b[3]))
                if not lv:
                    if dl: problems.append({'page': pn, 'issue': 'performance row without a level', 'text': ' '.join(dl)[:80]})
                    continue
                level = int(lv[0])
                bullets = []
                for l in dl:
                    m = re.match(r'^[•\uf0b7\uf0a7]\s*(.*)$', l)
                    if m: bullets.append(m.group(1))
                    elif bullets: bullets[-1] += ' ' + l
                    else: bullets.append(l)
                row = tab.setdefault(level, {'level': level, 'descriptors': [], 'note': '', 'page': pn})
                row['descriptors'] += [clean(x) for x in bullets if clean(x)]
                row['note'] = clean((row['note'] + ' ' + ' '.join(nl)).strip())
    out_cs = [{'code': c['code'], 'skill': SKILL.get(c['code'][0]), 'text': clean(' '.join(c['lines'])), 'page': c['page']} for c in cs.values()]
    out_ls = [{'code': l['code'], 'cs': '.'.join(l['code'].split('.')[:2]), 'skill': SKILL.get(l['code'][0]),
               'text': join(l['lines']), 'focus': clean(' '.join(l['focus'])), 'page': l['page']} for l in ls.values()]
    for l in out_ls:   # some standards are printed as a stem in the Focus column plus a list: join them for display
        m = re.match(r'^\(?i\)\s*(\S)', l['text'])
        stem = bool(m) and (m.group(1).islower() or l['focus'].rstrip().endswith(':'))
        l['full'] = (l['focus'].rstrip(' :') + ':\n' + l['text']) if stem else l['text']
    key = lambda c: [int(x) for x in c['code'].split('.')]
    out_perf = {s: [t[k] for k in sorted(t)] for s, t in perf.items()}
    return {'year': year, 'school': school, 'cs': sorted(out_cs, key=key), 'ls': sorted(out_ls, key=key), 'performance': out_perf}, problems

if __name__ == '__main__':
    os.makedirs('out/raw', exist_ok=True)
    for f, a, b, y, s in DSKP:
        d, pr = extract(f, a, b, y, s)
        with open(f'out/raw/dskp-y{y}-{s.lower()}.json', 'w') as fh: json.dump(d, fh, ensure_ascii=False, indent=1)
        per = {k: [r['level'] for r in v] for k, v in d['performance'].items()}
        print(f"Y{y} {s}: CS {len(d['cs'])}, LS {len(d['ls'])}, perf {per}, problems {len(pr)} {pr[:3]}")
