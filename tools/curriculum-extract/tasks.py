"""Extract the suggested pre-lesson / post-lesson task bank and the differentiation strategies from each SoW."""
import json, os, re
import words as W, sow
from sources import SOW
from sow import clean

FOOT = re.compile(r'^(Primary Year \d.*Scheme of Work.*|\d{1,3}|k)$')
TASK = re.compile(r'^(PRE|POST)[- ]LESSON TASK\s*(\d+)\s*:?\s*(.*)$', re.I)
STRAT = re.compile(r'^Strategy\s*(\d)\s*:\s*(.*)$')
STEP = re.compile(r'^(\d{1,2})\.\s+(.*)$')
BUL = re.compile(r'^[•o]\s+(.*)$')
SECTION = re.compile(r'^\d{1,2}\.\s+[A-Z][A-Za-z\- ]{3,60}$')

def titlecase(s):
    s = ' '.join(w.capitalize() for w in clean(s).rstrip('*').strip().split(' '))
    return s.replace('Abcs', 'ABCs')

def front_lines(f, first, last):
    pages, _ = sow.doc(f)
    out = []
    for pn in range(first, last + 1):
        ws = pages[pn - 1]['words']
        if any(w[4].startswith('LESSON:') for w in ws) and not any(w[4] == 'TASK' for w in ws): break
        rows = [(ln[0][0], clean(' '.join(w[4] for w in ln))) for ln in W.lines(ws, 3)]
        rows = [(x, t) for x, t in rows if t and not FOOT.match(t)]
        if not rows: continue
        xs = sorted(round(x) for x, _ in rows)
        margin = max(set(xs), key=xs.count)          # the page's body-text left margin
        out += [(pn, t, x - margin) for x, t in rows]
    return out

def extract(f, first, last, year, school):
    lines = front_lines(f, first, last)
    tasks = {'pre': [], 'post': []}
    strategies = []
    cur, mode, in_strat = None, None, False
    for pn, t, dx in lines:
        m = TASK.match(t)
        if m:
            cur = {'no': int(m.group(2)), 'title': titlecase(m.group(3)), 'aim': '', 'materials': '', 'steps': [], 'notes': [], 'page': pn}
            tasks[m.group(1).lower()].append(cur); mode = 'title'; in_strat = False; continue
        m = STRAT.match(t)
        if m and (not strategies or int(m.group(1)) == strategies[-1]['no'] + 1 or int(m.group(1)) == 1):
            if int(m.group(1)) == 1 and strategies: strategies = []   # the contents page mentions them first
            cur = {'no': int(m.group(1)), 'title': clean(m.group(2)), 'body': '', 'points': [], 'page': pn}
            strategies.append(cur); in_strat = True; mode = 'stitle'; continue
        if cur is None: continue
        if in_strat:
            if SECTION.match(t) and not STEP.match(t[:3] + ' x') or re.match(r'^\d\.\s+Glossary', t): cur = None; in_strat = False; continue
            b = BUL.match(t)
            if b: cur['points'].append(b.group(1)); mode = 'point'
            elif mode == 'stitle' and not cur['body'] and len(cur['title']) < 60 and t[0].islower(): cur['title'] += ' ' + t
            elif mode == 'point' and dx > 8: cur['points'][-1] += ' ' + t      # indented under the bullet
            else: cur['body'] = (cur['body'] + ' ' + t).strip(); mode = 'body'
            continue
        if re.match(r'^\d{1,2}\.\s+(Differentiation|Glossary|Scheme|Suggested)', t): cur = None; continue
        m = re.match(r'^AIMS?\s*:\s*(.*)$', t, re.I)
        if m: cur['aim'] = m.group(1); mode = 'aim'; continue
        m = re.match(r'^MATERIALS?\s*:\s*(.*)$', t, re.I)
        if m: cur['materials'] = m.group(1); mode = 'materials'; continue
        m = STEP.match(t)
        if m and int(m.group(1)) == len(cur['steps']) + 1: cur['steps'].append(m.group(2)); mode = 'step'; continue
        if mode == 'title' and not cur['aim']: cur['title'] = (cur['title'] + ' ' + titlecase(t)).strip()
        elif mode == 'aim': cur['aim'] += ' ' + t
        elif mode == 'materials' and t[0].islower(): cur['materials'] += ' ' + t
        elif mode in ('materials', 'ustep'):
            # a few tasks list their steps without numbers: a capitalised line after a finished sentence starts a new step
            if mode == 'ustep' and not (t[0].isupper() and cur['steps'][-1][-1] in '.)!?'): cur['steps'][-1] += ' ' + t
            else: cur['steps'].append(t)
            mode = 'ustep'
        elif mode == 'step': cur['steps'][-1] += ' ' + t
        else: cur['notes'].append(t)
    for k in tasks:
        for t in tasks[k]:
            t['aim'] = clean(t['aim']); t['aim'] = t['aim'][:1].upper() + t['aim'][1:]
            t['materials'] = clean(t['materials']); t['steps'] = [clean(s) for s in t['steps']]
            if not t['notes']: del t['notes']
    for s in strategies:
        s['body'] = clean(s['body']); s['points'] = [clean(p) for p in s['points']]
    return {'year': year, 'school': school, 'pre': tasks['pre'], 'post': tasks['post'], 'strategies': strategies}

if __name__ == '__main__':
    os.makedirs('out/raw', exist_ok=True)
    for f, a, b, y, s in SOW:
        d = extract(f, a, b, y, s)
        with open(f'out/raw/support-y{y}-{s.lower()}.json', 'w') as fh: json.dump(d, fh, ensure_ascii=False, indent=1)
        print(f"Y{y} {s}: pre {[t['no'] for t in d['pre']]} post {[t['no'] for t in d['post']]} strategies {[x['no'] for x in d['strategies']]}",
              'nosteps', [(k, t['no']) for k in ('pre', 'post') for t in d[k] if not t['steps']])
