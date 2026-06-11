import { describe, expect, it } from 'vitest';
import { makeGroups } from './grouping';

const names = ['甲', '乙', '丙', '丁', '戊', '己'];

describe('makeGroups', () => {
  it('人数均匀分布', () => {
    const groups = makeGroups({ names, groupCount: 3, together: [], apart: [] });
    expect(groups).toHaveLength(3);
    expect(groups!.every((g) => g.length === 2)).toBe(true);
    expect(groups!.flat().sort()).toEqual([...names].sort());
  });

  it('人数不整除时组间最多差 1 人', () => {
    const groups = makeGroups({ names: names.slice(0, 5), groupCount: 2, together: [], apart: [] })!;
    const sizes = groups.map((g) => g.length).sort();
    expect(sizes).toEqual([2, 3]);
  });

  it('必须同组的人总在一起', () => {
    for (let i = 0; i < 20; i++) {
      const groups = makeGroups({ names, groupCount: 3, together: [{ a: '甲', b: '乙' }], apart: [] })!;
      const g = groups.find((x) => x.includes('甲'))!;
      expect(g).toContain('乙');
    }
  });

  it('必须分开的人总在不同组', () => {
    for (let i = 0; i < 20; i++) {
      const groups = makeGroups({ names, groupCount: 2, together: [], apart: [{ a: '甲', b: '乙' }] })!;
      const gA = groups.findIndex((x) => x.includes('甲'));
      const gB = groups.findIndex((x) => x.includes('乙'));
      expect(gA).not.toBe(gB);
    }
  });

  it('同组与分开矛盾时返回 null', () => {
    const groups = makeGroups({
      names,
      groupCount: 3,
      together: [
        { a: '甲', b: '乙' },
        { a: '乙', b: '丙' },
      ],
      apart: [{ a: '甲', b: '丙' }],
    });
    expect(groups).toBeNull();
  });

  it('分开约束多到无法满足时返回 null（1 组装不下互斥的人）', () => {
    const groups = makeGroups({
      names: ['甲', '乙'],
      groupCount: 1,
      together: [],
      apart: [{ a: '甲', b: '乙' }],
    });
    expect(groups).toBeNull();
  });
});
