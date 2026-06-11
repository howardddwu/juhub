import type { Expense } from './types';

/**
 * 计算一笔消费中每个参与人应摊的份额（分）。
 * amount 是要拆分的金额（默认 = 本笔金额；外币消费传换算后的主币种金额）。
 * 不变量：份额之和精确等于 amount。
 * 取整规则是确定性的：除不尽的零头按最大余数法分配，平局按参与人顺序。
 */
export function computeShares(expense: Expense, amount = expense.amountCents): Record<string, number> {
  const { amountCents, participantIds, split } = expense;
  if (participantIds.length === 0) throw new Error('expense has no participants');

  if (split.type === 'equal') {
    const n = participantIds.length;
    const base = Math.floor(amount / n);
    const rem = amount % n;
    const shares: Record<string, number> = {};
    participantIds.forEach((id, i) => {
      shares[id] = base + (i < rem ? 1 : 0);
    });
    return shares;
  }

  if (split.type === 'weighted') {
    return splitByWeights(
      amount,
      participantIds,
      participantIds.map((id) => split.weights[id] ?? 0),
    );
  }

  // exact：指定金额以"本笔币种"输入，必须与本笔总额吻合
  const sum = participantIds.reduce((a, id) => a + (split.amounts[id] ?? 0), 0);
  if (sum !== amountCents) throw new Error('exact split does not sum to total');
  if (amount === amountCents) {
    return Object.fromEntries(participantIds.map((id) => [id, split.amounts[id] ?? 0]));
  }
  // 外币：把指定金额当作权重，按比例拆分换算后的主币种金额
  return splitByWeights(
    amount,
    participantIds,
    participantIds.map((id) => split.amounts[id] ?? 0),
  );
}

/** 最大余数法：按权重取整拆分 amount，保证份额之和精确等于 amount。 */
function splitByWeights(amount: number, ids: string[], weights: number[]): Record<string, number> {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error('split has no positive weights');
  const raw = weights.map((w) => (amount * w) / total);
  const shares = raw.map(Math.floor);
  let rem = amount - shares.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ frac: v - Math.floor(v), i }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (rem === 0) break;
    shares[i] += 1;
    rem -= 1;
  }
  return Object.fromEntries(ids.map((id, i) => [id, shares[i]]));
}
