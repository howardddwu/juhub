import { describe, expect, it } from 'vitest';
import { applyGuess, randomBomb } from './bombLogic';

describe('applyGuess', () => {
  const range = { low: 1, high: 100 };

  it('命中即爆', () => {
    expect(applyGuess(range, 42, 42)).toEqual({ hit: true });
  });

  it('猜小了：抬高下界，提示往大猜', () => {
    expect(applyGuess(range, 42, 30)).toEqual({ hit: false, range: { low: 31, high: 100 }, dir: 'higher' });
  });

  it('猜大了：压低上界，提示往小猜', () => {
    expect(applyGuess(range, 42, 50)).toEqual({ hit: false, range: { low: 1, high: 49 }, dir: 'lower' });
  });

  it('紧贴雷的两侧把区间夹到只剩雷', () => {
    let r = range;
    r = (applyGuess(r, 42, 41) as { range: typeof r }).range;
    r = (applyGuess(r, 42, 43) as { range: typeof r }).range;
    expect(r).toEqual({ low: 42, high: 42 });
  });
});

describe('randomBomb', () => {
  it('始终落在闭区间内', () => {
    expect(randomBomb(1, 100, () => 0)).toBe(1);
    expect(randomBomb(1, 100, () => 0.999999)).toBe(100);
    expect(randomBomb(5, 5, () => 0.5)).toBe(5);
  });
});
