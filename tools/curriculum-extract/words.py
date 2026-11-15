"""Load word boxes produced by `pdftotext -bbox-layout` into per-page lists.

Each page is {'w': width, 'h': height, 'words': [(x0, y0, x1, y1, text), ...]}.
The parsed result is cached next to the source as words.pkl.
"""
import html, os, pickle, re, sys

PAGE = re.compile(r'<page width="([\d.]+)" height="([\d.]+)">')
WORD = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')

def load(dirpath):
    cache = os.path.join(dirpath, 'words.pkl')
    src = os.path.join(dirpath, 'bbox.html')
    if os.path.exists(cache) and os.path.getmtime(cache) >= os.path.getmtime(src):
        with open(cache, 'rb') as f:
            return pickle.load(f)
    pages, cur = [], None
    with open(src, encoding='utf-8', errors='replace') as f:
        for line in f:
            m = PAGE.search(line)
            if m:
                cur = {'w': float(m.group(1)), 'h': float(m.group(2)), 'words': []}
                pages.append(cur)
                continue
            m = WORD.search(line)
            if m and cur is not None:
                cur['words'].append((float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4)), html.unescape(m.group(5))))
    with open(cache, 'wb') as f:
        pickle.dump(pages, f)
    return pages

def lines(words, tol=3.0):
    """Group words into visual lines (by vertical centre), each sorted left to right."""
    rows = []
    for w in sorted(words, key=lambda w: ((w[1] + w[3]) / 2, w[0])):
        yc = (w[1] + w[3]) / 2
        if rows and abs(rows[-1][0] - yc) <= tol:
            rows[-1][1].append(w)
            rows[-1][0] = (rows[-1][0] * (len(rows[-1][1]) - 1) + yc) / len(rows[-1][1])
        else:
            rows.append([yc, [w]])
    return [sorted(r[1], key=lambda w: w[0]) for r in rows]

def text(words, tol=3.0):
    return '\n'.join(' '.join(w[4] for w in ln) for ln in lines(words, tol))

if __name__ == '__main__':
    p = load(sys.argv[1])
    print(len(p), 'pages')
