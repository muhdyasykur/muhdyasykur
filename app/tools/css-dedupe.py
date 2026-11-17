# Removes local <style> rules that only repeat a shared utility from base.css (exact same selector and declarations).
import re, glob, sys
SHARED = {
  '.small': 'font-size: var(--t-sm)', '.tight': 'gap: var(--s-2)', '.between': 'justify-content: space-between',
  '.back': 'justify-self: start', '.add': 'justify-self: start', '.auto': 'width: auto', '.pre': 'white-space: pre-line',
  '.chips': 'display: flex;flex-wrap: wrap;gap: var(--s-2)', '.ok': 'color: var(--ok)', '.err': 'color: var(--bad)', '.del': 'color: var(--bad)',
  '.ta': 'min-height: 80px;padding: var(--s-2) var(--s-3)',
}
norm = lambda body: ';'.join(sorted(x.strip().replace(': ', ':').replace(':', ': ') for x in body.split(';') if x.strip()))
total = 0
for f in glob.glob('src/**/*.svelte', recursive=True):
    s = open(f).read()
    m = re.search(r'<style>([\s\S]*?)</style>', s)
    if not m: continue
    css = m.group(1); out = css; n = 0
    for r in list(re.finditer(r'(^|\n|\}|;)(\s*)([^{}\n;]+?)\s*\{([^{}]*)\}', css)):
        sel = ' '.join(r.group(3).split())
        if sel in SHARED and norm(r.group(4)) == norm(SHARED[sel]):
            whole = r.group(0)[len(r.group(1)):]
            out = out.replace(whole, '', 1); n += 1
    if n:
        out = re.sub(r'\n\s*\n\s*\n', '\n\n', out)
        s = s.replace(css, out)
        if re.fullmatch(r'\s*', out): s = s.replace('<style>' + out + '</style>', '').rstrip() + '\n'
        open(f, 'w').write(s); total += n
print(total, 'duplicate rules removed')
