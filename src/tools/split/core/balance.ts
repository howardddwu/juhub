import type { Expense, Trip } from './types';
import { computeShares } from './split';

/** 本笔消费折算成账本主币种后的金额（分）。 */
export function baseAmountCents(expense: Expense, baseCurrency: string): number {
  if (!expense.currency || expense.currency === baseCurrency) return expense.amountCents;
  return Math.round(expense.amountCents * (expense.rateToBase ?? 1));
}

/** 账本总支出（主币种分），不含还款。 */
export function tripTotalCents(trip: Trip): number {
  return trip.expenses
    .filter((e) => e.kind !== 'repayment')
    .reduce((a, e) => a + baseAmountCents(e, trip.currency), 0);
}

/**
 * 计算每个成员的净余额（主币种分）。正数 = 应收，负数 = 应付。
 * 不变量：所有成员余额之和为 0。
 */
export function computeBalances(trip: Trip): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const m of trip.members) balances[m.id] = 0;
  for (const e of trip.expenses) {
    const amount = baseAmountCents(e, trip.currency);
    balances[e.payerId] = (balances[e.payerId] ?? 0) + amount;
    const shares = computeShares(e, amount);
    for (const [id, share] of Object.entries(shares)) {
      balances[id] = (balances[id] ?? 0) - share;
    }
  }
  return balances;
}

export interface MemberStats {
  /** 垫付总额（主币种分） */
  paidCents: number;
  /** 实际消费总额（主币种分） */
  shareCents: number;
}

/** 每人垫付/消费统计，不含还款。 */
export function computeStats(trip: Trip): Record<string, MemberStats> {
  const stats: Record<string, MemberStats> = {};
  for (const m of trip.members) stats[m.id] = { paidCents: 0, shareCents: 0 };
  for (const e of trip.expenses) {
    if (e.kind === 'repayment') continue;
    const amount = baseAmountCents(e, trip.currency);
    if (stats[e.payerId]) stats[e.payerId].paidCents += amount;
    const shares = computeShares(e, amount);
    for (const [id, share] of Object.entries(shares)) {
      if (stats[id]) stats[id].shareCents += share;
    }
  }
  return stats;
}
