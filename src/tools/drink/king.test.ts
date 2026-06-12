import { describe, expect, it } from 'vitest';
import { dealNumbers, pickKingRound, sampleDistinct, KING_COMMANDS } from './kingLogic';

describe('dealNumbers', () => {
  it('返回 1..n 的一个排列', () => {
    const nums = dealNumbers(6);
    expect([...nums].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('sampleDistinct', () => {
  it('取到 k 个互不相同、落在 1..n 的号码', () => {
    for (let i = 0; i < 30; i++) {
      const picked = sampleDistinct(5, 2);
      expect(picked).toHaveLength(2);
      expect(picked[0]).not.toBe(picked[1]);
      expect(picked.every((x) => x >= 1 && x <= 5)).toBe(true);
    }
  });
});

describe('pickKingRound', () => {
  it('国王号码落在 1..n，指令文案非空', () => {
    for (let i = 0; i < 50; i++) {
      const { king, text } = pickKingRound(5, KING_COMMANDS.zh);
      expect(king).toBeGreaterThanOrEqual(1);
      expect(king).toBeLessThanOrEqual(5);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('人数不足时不会选到需要更多号码的指令（n=1 只用单号指令）', () => {
    for (let i = 0; i < 30; i++) {
      const { text } = pickKingRound(1, KING_COMMANDS.zh);
      // 单人时所有引用都只能是 1 号，不应崩溃或出现 undefined
      expect(text).not.toContain('undefined');
      expect(text).toContain('1 号');
    }
  });
});
