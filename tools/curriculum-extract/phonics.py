"""Extract the Year 1 and Year 2 Scheme of Work for Phonics (same lesson layout as the main SoW)."""
import json, os
import sow
from sources import PHONICS

if __name__ == '__main__':
    os.makedirs('out/raw', exist_ok=True)
    for f, a, b, y in PHONICS:
        lessons, problems = sow.extract(f, a, b, y, 'ALL')
        with open(f'out/raw/phonics-y{y}.json', 'w') as fh: json.dump(lessons, fh, ensure_ascii=False, indent=1)
        print(f'Phonics Y{y}: {len(lessons)} lessons, problems {len(problems)}')
