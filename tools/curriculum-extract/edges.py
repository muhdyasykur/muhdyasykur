"""Cache the table ruling lines of every page (vertical and horizontal edges) with pdfplumber.

Usage: python3 edges.py <dir containing `file` (a PDF)>   ->  <dir>/edges.pkl
"""
import pickle, sys, os
from multiprocessing import Pool
import pdfplumber

def work(args):
    path, lo, hi = args
    out = {}
    with pdfplumber.open(path) as pdf:
        for i in range(lo, hi):
            p = pdf.pages[i]
            v, h = [], []
            for e in p.edges:
                if e['orientation'] == 'v' and e['height'] > 10:
                    v.append((round(e['x0'], 1), round(e['top'], 1), round(e['bottom'], 1)))
                elif e['orientation'] == 'h' and e['width'] > 30:
                    h.append((round(e['top'], 1), round(e['x0'], 1), round(e['x1'], 1)))
            out[i] = {'v': v, 'h': h}
            p.flush_cache()
    return out

if __name__ == '__main__':
    d = sys.argv[1]
    path = os.path.join(d, 'file')
    with pdfplumber.open(path) as pdf:
        n = len(pdf.pages)
    step = 60
    jobs = [(path, lo, min(n, lo + step)) for lo in range(0, n, step)]
    res = {}
    with Pool(4) as pool:
        for part in pool.imap_unordered(work, jobs):
            res.update(part)
    with open(os.path.join(d, 'edges.pkl'), 'wb') as f:
        pickle.dump([res[i] for i in range(n)], f)
    print(d, n, 'pages done')
