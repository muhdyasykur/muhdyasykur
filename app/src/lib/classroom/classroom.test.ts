import { describe, it, expect } from 'vitest';
import { seeded } from './random';
import { pick, type PickerState } from './picker';
import { makeGroups, groupCount, type Member } from './groups';

const ids = (n: number) => Array.from({ length: n }, (_, i) => 'p' + (i + 1));

describe('name picker', () => {
  it('picks everyone once before anyone twice, and skips absent pupils', () => {
    const rand = seeded(7);
    const present = ids(10).filter((id) => id !== 'p3');
    let st: PickerState = { picked: [] };
    const seen: string[] = [];
    for (let i = 0; i < 9; i++) { const r = pick(present, st, rand); seen.push(r.id!); st = r.state; }
    expect(new Set(seen).size).toBe(9);
    expect(seen).not.toContain('p3');
    const again = pick(present, st, rand);
    expect(again.roundDone).toBe(true);
  });
  it('returns nobody when nobody is present', () => expect(pick([], { picked: [] }).id).toBeNull());
});

describe('group maker', () => {
  const tiers = ['low', 'mod', 'high'] as const;
  const members: Member[] = ids(30).map((id, i) => ({ id, tier: tiers[i % 3] }));
  it('works out a sensible number of groups', () => {
    expect(groupCount(30, 5)).toBe(6);
    expect(groupCount(7, 4)).toBe(2);
    expect(groupCount(3, 4)).toBe(1);
  });
  it('mixed groups are even in size and in tier mix', () => {
    const r = makeGroups(members, 6, 'mixed', seeded(1));
    expect(r.groups.map((g) => g.length)).toEqual([5, 5, 5, 5, 5, 5]);
    for (const g of r.groups) for (const t of tiers) {
      const n = g.filter((id) => members.find((m) => m.id === id)!.tier === t).length;
      expect(n).toBeGreaterThanOrEqual(1);
    }
    expect(r.groups.flat().sort()).toEqual(members.map((m) => m.id).sort());
  });
  it('tier groups keep each level together', () => {
    const r = makeGroups(members, 3, 'tier', seeded(2));
    for (const g of r.groups) expect(new Set(g.map((id) => members.find((m) => m.id === id)!.tier)).size).toBe(1);
  });
  it('respects keep-apart and keep-together pairs', () => {
    const m = members.map((x) => ({ ...x }));
    m[0].keepApart = ['p4', 'p7']; m[3].keepApart = ['p1']; m[6].keepApart = ['p1'];
    m[1].keepTogether = ['p5']; m[4].keepTogether = ['p2'];
    for (let s = 1; s <= 20; s++) {
      const r = makeGroups(m, 6, 'mixed', seeded(s));
      const g = (id: string) => r.groups.findIndex((x) => x.includes(id));
      expect(r.broken).toEqual([]);
      expect(g('p1')).not.toBe(g('p4'));
      expect(g('p1')).not.toBe(g('p7'));
      expect(g('p2')).toBe(g('p5'));
    }
  });
  it('reports the pair it cannot honour', () => {
    const three: Member[] = [{ id: 'a', tier: 'mod', keepApart: ['b', 'c'] }, { id: 'b', tier: 'mod', keepApart: ['a', 'c'] }, { id: 'c', tier: 'mod', keepApart: ['a', 'b'] }];
    const r = makeGroups(three, 1, 'mixed', seeded(3));
    expect(r.broken.length).toBe(3);
  });
});
