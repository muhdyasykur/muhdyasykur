# Merges "index|Malay" lines (from a file) into src/lib/i18n/ms-ui.json, using tools/i18n-todo.json for the English.
# Checks that each translation only uses placeholders that exist in the English.
import json, re, sys
todo = json.load(open('tools/i18n-todo.json'))
ui = json.load(open('src/lib/i18n/ms-ui.json'))
vars_ = lambda s: set(re.findall(r'\{(\w+)\}', re.sub(r'\{\{|\}\}', '', s)))
bad = []; n = 0
for line in open(sys.argv[1], encoding='utf-8').read().split('\n'):
    if not line.strip() or '|' not in line: continue
    i, ms = line.split('|', 1)
    en = todo[int(i)]
    ms = ms.replace('\\n', '\n')
    if not vars_(ms) <= vars_(en): bad.append((i, en, ms)); continue
    ui[en] = ms; n += 1
json.dump(dict(sorted(ui.items())), open('src/lib/i18n/ms-ui.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(n, 'added;', len(ui), 'total;', len(bad), 'rejected')
for b in bad: print('  REJECT', b)
