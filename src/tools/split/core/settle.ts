import type { Transfer } from './types';

/**
 * 贪心结算：欠最多的人转给应收最多的人，直到全部清零。
 * 产生最多 n-1 笔转账。要求余额之和为 0。
 */
export function settle(balances: Record<string, number>): Transfer[] {
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amt: -v }))
    .sort((a, b) => b.amt - a.amt || a.id.localeCompare(b.id));
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amt: v }))
    .sort((a, b) => b.amt - a.amt || a.id.localeCompare(b.id));

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    transfers.push({ from: debtors[i].id, to: creditors[j].id, amountCents: pay });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return transfers;
}

/**
 * 最优结算：转账笔数 = 人数 − 能划分出的"内部恰好清零"子集数 k。
 * 用状态压缩 DP 求最大 k（O(3^n)），人多时退化为贪心。
 * 每个零和子集内部再用贪心生成具体转账。
 */
export function settleOptimal(balances: Record<string, number>): Transfer[] {
  const entries = Object.entries(balances).filter(([, v]) => v !== 0);
  const n = entries.length;
  if (n === 0) return [];
  if (n > 14) return settle(balances); // 3^14 ≈ 478 万，再大就不值了

  const full = (1 << n) - 1;
  const sums = new Array<number>(1 << n).fill(0);
  for (let mask = 1; mask <= full; mask++) {
    const low = mask & -mask;
    const i = 31 - Math.clz32(low);
    sums[mask] = sums[mask ^ low] + entries[i][1];
  }

  // dp[mask]（仅零和 mask 有意义）：mask 能划分出的最多零和子集数
  // choice[mask]：取得最优值时切出的第一个子集（含最低位成员）
  const dp = new Array<number>(1 << n).fill(0);
  const choice = new Array<number>(1 << n).fill(0);
  for (let mask = 1; mask <= full; mask++) {
    if (sums[mask] !== 0) continue;
    const low = mask & -mask;
    dp[mask] = 1;
    choice[mask] = mask;
    // 枚举包含最低位成员的零和真子集
    for (let s = (mask - 1) & mask; s > 0; s = (s - 1) & mask) {
      if (!(s & low) || sums[s] !== 0) continue;
      const candidate = dp[s] + dp[mask ^ s];
      if (candidate > dp[mask]) {
        dp[mask] = candidate;
        choice[mask] = s;
      }
    }
  }

  // 还原各零和子集，子集内部贪心结清
  const transfers: Transfer[] = [];
  let rest = full;
  while (rest > 0) {
    const group = choice[rest];
    const groupBalances: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      if (group & (1 << i)) groupBalances[entries[i][0]] = entries[i][1];
    }
    transfers.push(...settle(groupBalances));
    rest ^= group;
  }
  return transfers;
}
