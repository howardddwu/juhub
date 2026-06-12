export interface Range {
  low: number;
  high: number;
}

export type GuessResult =
  | { hit: true }
  | { hit: false; range: Range; dir: 'higher' | 'lower' };

/**
 * 数字炸弹一次猜测：命中即爆，否则收缩区间。
 * dir 是给玩家的提示方向 —— 'higher' = 雷比猜的大（往大猜），'lower' = 往小猜。
 */
export function applyGuess(range: Range, bomb: number, guess: number): GuessResult {
  if (guess === bomb) return { hit: true };
  if (guess < bomb) return { hit: false, range: { ...range, low: guess + 1 }, dir: 'higher' };
  return { hit: false, range: { ...range, high: guess - 1 }, dir: 'lower' };
}

/** 在 [low, high] 闭区间内随机一个雷 */
export function randomBomb(low: number, high: number, rng: () => number = Math.random): number {
  return low + Math.floor(rng() * (high - low + 1));
}
