import sys, words
from sources import SRC
S = SRC + '/'
pages=words.load(S+sys.argv[1])
for pn in sys.argv[2:]:
    p=pages[int(pn)-1]; print(f'=== {sys.argv[1]} p{pn} {p["w"]:.0f}x{p["h"]:.0f} words={len(p["words"])}')
    for ln in words.lines(p['words']):
        print(f'{ln[0][1]:6.1f} | '+'  '.join(f'[{w[0]:.0f}]{w[4]}' for w in ln)[:330])
