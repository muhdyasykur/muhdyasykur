import { shuffle, type Rand } from './random';

export type Tier = 'low' | 'mod' | 'high';
export interface Member { id: string; tier: Tier; keepApart?: string[]; keepTogether?: string[] }
export interface GroupResult { groups: string[][]; broken: { a: string; b: string; kind: 'apart' | 'together' }[] }

/** How many groups for `n` pupils at about `size` each (never a group of 1). */
export function groupCount(n: number, size: number): number {
  if (n <= 0) return 0;
  let k = Math.max(1, Math.round(n / Math.max(2, size)));
  while (k > 1 && Math.floor(n / k) < 2) k--;
  return k;
}

function cost(groups: string[][], by: Map<string, Member>, mode: 'mixed' | 'tier') {
  const where = new Map<string, number>();
  groups.forEach((g, i) => g.forEach((id) => where.set(id, i)));
  const broken: GroupResult['broken'] = [];
  for (const m of by.values()) {
    for (const o of m.keepApart ?? []) if (m.id < o && where.has(o) && where.get(o) === where.get(m.id)) broken.push({ a: m.id, b: o, kind: 'apart' });
    for (const o of m.keepTogether ?? []) if (m.id < o && where.has(o) && where.get(o) !== where.get(m.id)) broken.push({ a: m.id, b: o, kind: 'together' });
  }
  // balance: in mixed mode every group should have a similar tier mix; sizes should differ by at most 1
  const sizes = groups.map((g) => g.length);
  let balance = (Math.max(...sizes) - Math.min(...sizes) > 1 ? 50 : 0);
  if (mode === 'mixed') {
    for (const t of ['low', 'mod', 'high'] as Tier[]) {
      const c = groups.map((g) => g.filter((id) => by.get(id)!.tier === t).length);
      balance += Math.max(...c) - Math.min(...c);
    }
  }
  return { score: broken.length * 1000 + balance, broken };
}

/**
 * Make `k` groups. "mixed" spreads Low/Moderate/High across groups; "tier" keeps each tier together
 * (for differentiated tasks). Keep-apart and keep-together pairs are respected whenever possible; when they
 * cannot all be met the closest arrangement is returned with the pairs that could not be honoured.
 */
export function makeGroups(members: Member[], k: number, mode: 'mixed' | 'tier', rand: Rand = Math.random, tries = 300): GroupResult {
  if (!members.length || k <= 0) return { groups: [], broken: [] };
  k = Math.min(k, members.length);
  const by = new Map(members.map((m) => [m.id, m]));
  const order: Tier[] = ['low', 'mod', 'high'];
  let best: { groups: string[][]; score: number; broken: GroupResult['broken'] } | null = null;
  for (let t = 0; t < tries; t++) {
    const groups: string[][] = Array.from({ length: k }, () => []);
    if (mode === 'mixed') {
      // deal each tier round-robin, starting where the last tier stopped, so sizes stay even
      let next = Math.floor(rand() * k);
      for (const tier of order) for (const m of shuffle(members.filter((x) => x.tier === tier), rand)) { groups[next % k].push(m.id); next++; }
    } else {
      const sorted = order.flatMap((tier) => shuffle(members.filter((x) => x.tier === tier), rand));
      const base = Math.floor(sorted.length / k), extra = sorted.length % k;
      let i = 0;
      for (let g = 0; g < k; g++) { const n = base + (g < extra ? 1 : 0); groups[g] = sorted.slice(i, i + n).map((m) => m.id); i += n; }
    }
    // repair pass: swap a pupil from a broken keep-apart pair with someone of the same tier elsewhere
    for (let pass = 0; pass < 3; pass++) {
      const { broken } = cost(groups, by, mode);
      if (!broken.length) break;
      for (const b of broken) {
        const gi = groups.findIndex((g) => g.includes(b.b));
        const target = b.kind === 'apart' ? b.b : b.b;
        const want = b.kind === 'together' ? groups.findIndex((g) => g.includes(b.a)) : -1;
        const candidates = groups.flatMap((g, j) => (j === gi || (want >= 0 && j !== want) ? [] : g.map((id) => ({ id, j })))).filter((c) => by.get(c.id)!.tier === by.get(target)!.tier || mode === 'mixed');
        const c = shuffle(candidates, rand)[0];
        if (!c) continue;
        const a = groups[gi].indexOf(target), z = groups[c.j].indexOf(c.id);
        groups[gi][a] = c.id; groups[c.j][z] = target;
      }
    }
    const sc = cost(groups, by, mode);
    if (!best || sc.score < best.score) best = { groups: groups.map((g) => [...g]), ...sc };
    if (best.score === 0 || (best.broken.length === 0 && mode === 'tier')) break;
  }
  return { groups: best!.groups, broken: best!.broken };
}
