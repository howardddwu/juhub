import { describe, expect, it } from 'vitest';
import type { Expense, Trip } from './types';
import { computeShares } from './split';
import { baseAmountCents, computeBalances, computeStats, tripTotalCents } from './balance';
import { settle, settleOptimal } from './settle';
import { parseYuanToCents } from './money';

function expense(partial: Partial<Expense> & Pick<Expense, 'amountCents' | 'payerId' | 'participantIds'>): Expense {
  return { id: 'e', description: '', split: { type: 'equal' }, createdAt: 0, ...partial };
}

function trip(memberIds: string[], expenses: Expense[]): Trip {
  return {
    id: 't',
    name: 'test',
    members: memberIds.map((id) => ({ id, name: id })),
    expenses,
    currency: 'CNY',
    createdAt: 0,
  };
}

describe('computeShares', () => {
  it('均分：份额之和精确等于总额', () => {
    const shares = computeShares(expense({ amountCents: 10000, payerId: 'a', participantIds: ['a', 'b', 'c'] }));
    expect(Object.values(shares).reduce((x, y) => x + y, 0)).toBe(10000);
    expect(shares).toEqual({ a: 3334, b: 3333, c: 3333 });
  });

  it('均分取整是确定性的', () => {
    const e = expense({ amountCents: 101, payerId: 'a', participantIds: ['a', 'b', 'c'] });
    expect(computeShares(e)).toEqual(computeShares(e));
    expect(computeShares(e)).toEqual({ a: 34, b: 34, c: 33 });
  });

  it('加权：按份数分摊且和精确', () => {
    const shares = computeShares(
      expense({
        amountCents: 10000,
        payerId: 'a',
        participantIds: ['a', 'b'],
        split: { type: 'weighted', weights: { a: 2, b: 1 } },
      }),
    );
    expect(shares.a + shares.b).toBe(10000);
    expect(shares.a).toBe(6667);
  });

  it('指定金额：和不等于总额时报错', () => {
    expect(() =>
      computeShares(
        expense({
          amountCents: 100,
          payerId: 'a',
          participantIds: ['a', 'b'],
          split: { type: 'exact', amounts: { a: 50, b: 49 } },
        }),
      ),
    ).toThrow();
  });
});

describe('computeBalances', () => {
  it('余额之和恒为 0（随机账目）', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    for (let round = 0; round < 200; round++) {
      const expenses: Expense[] = Array.from({ length: 8 }, (_, i) => {
        const participants = ids.filter(() => Math.random() > 0.3);
        if (participants.length === 0) participants.push(ids[0]);
        return expense({
          id: `e${i}`,
          amountCents: 1 + Math.floor(Math.random() * 100000),
          payerId: ids[Math.floor(Math.random() * ids.length)],
          participantIds: participants,
        });
      });
      const balances = computeBalances(trip(ids, expenses));
      expect(Object.values(balances).reduce((x, y) => x + y, 0)).toBe(0);
    }
  });

  it('没参与的人余额为 0', () => {
    const balances = computeBalances(
      trip(['a', 'b', 'c'], [expense({ amountCents: 200, payerId: 'a', participantIds: ['a', 'b'] })]),
    );
    expect(balances.c).toBe(0);
    expect(balances.a).toBe(100);
    expect(balances.b).toBe(-100);
  });
});

describe('settle', () => {
  it('结算后所有人归零，转账数 ≤ n-1', () => {
    for (let round = 0; round < 200; round++) {
      const n = 2 + Math.floor(Math.random() * 8);
      const balances: Record<string, number> = {};
      let sum = 0;
      for (let i = 0; i < n - 1; i++) {
        const v = Math.floor(Math.random() * 20000) - 10000;
        balances[`m${i}`] = v;
        sum += v;
      }
      balances[`m${n - 1}`] = -sum;

      const transfers = settle(balances);
      expect(transfers.length).toBeLessThanOrEqual(n - 1);

      const after = { ...balances };
      for (const t of transfers) {
        expect(t.amountCents).toBeGreaterThan(0);
        after[t.from] += t.amountCents;
        after[t.to] -= t.amountCents;
      }
      for (const v of Object.values(after)) expect(v).toBe(0);
    }
  });

  it('已平的账无需转账', () => {
    expect(settle({ a: 0, b: 0 })).toEqual([]);
  });

  it('两人场景一笔转清', () => {
    expect(settle({ a: 500, b: -500 })).toEqual([{ from: 'b', to: 'a', amountCents: 500 }]);
  });
});

describe('settleOptimal', () => {
  it('能找到贪心错过的零和小团体', () => {
    // {d,e} 内部清零，{a,b,c} 内部清零 → 最优 3 笔；贪心会跨团体转出 4 笔
    const balances = { a: 600, b: -400, c: -200, d: 500, e: -500 };
    expect(settle(balances).length).toBe(4);
    const transfers = settleOptimal(balances);
    expect(transfers.length).toBe(3);
    const after = { ...balances };
    for (const t of transfers) {
      after[t.from as keyof typeof after] += t.amountCents;
      after[t.to as keyof typeof after] -= t.amountCents;
    }
    for (const v of Object.values(after)) expect(v).toBe(0);
  });

  it('随机余额：不劣于贪心且结清所有人', () => {
    for (let round = 0; round < 100; round++) {
      const n = 2 + Math.floor(Math.random() * 9);
      const balances: Record<string, number> = {};
      let sum = 0;
      for (let i = 0; i < n - 1; i++) {
        const v = Math.floor(Math.random() * 2000) - 1000;
        balances[`m${i}`] = v;
        sum += v;
      }
      balances[`m${n - 1}`] = -sum;

      const optimal = settleOptimal(balances);
      expect(optimal.length).toBeLessThanOrEqual(settle(balances).length);
      const after = { ...balances };
      for (const t of optimal) {
        after[t.from] += t.amountCents;
        after[t.to] -= t.amountCents;
      }
      for (const v of Object.values(after)) expect(v).toBe(0);
    }
  });
});

describe('多币种', () => {
  it('外币按汇率折算主币种，余额和恒为 0', () => {
    const t = trip(
      ['a', 'b', 'c'],
      [
        expense({ amountCents: 10000, payerId: 'a', participantIds: ['a', 'b', 'c'], currency: 'USD', rateToBase: 7.23 }),
      ],
    );
    expect(baseAmountCents(t.expenses[0], 'CNY')).toBe(72300);
    const balances = computeBalances(t);
    expect(Object.values(balances).reduce((x, y) => x + y, 0)).toBe(0);
    expect(balances.a).toBe(72300 - 24100);
  });

  it('外币 + 指定金额：按比例拆分折算后的金额且和精确', () => {
    const e = expense({
      amountCents: 10000,
      payerId: 'a',
      participantIds: ['a', 'b'],
      currency: 'USD',
      rateToBase: 7.23,
      split: { type: 'exact', amounts: { a: 3000, b: 7000 } },
    });
    const shares = computeShares(e, baseAmountCents(e, 'CNY'));
    expect(shares.a + shares.b).toBe(72300);
    expect(shares.a).toBe(21690);
  });
});

describe('还款与统计', () => {
  it('还款冲账且不计入消费统计', () => {
    const t = trip(
      ['a', 'b'],
      [
        expense({ amountCents: 10000, payerId: 'a', participantIds: ['a', 'b'] }),
        expense({
          id: 'r1',
          amountCents: 5000,
          payerId: 'b',
          participantIds: ['a'],
          kind: 'repayment',
          split: { type: 'exact', amounts: { a: 5000 } },
        }),
      ],
    );
    const balances = computeBalances(t);
    expect(balances.a).toBe(0);
    expect(balances.b).toBe(0);
    expect(tripTotalCents(t)).toBe(10000); // 还款不算支出
    const stats = computeStats(t);
    expect(stats.b.paidCents).toBe(0); // 还款不算垫付
    expect(stats.b.shareCents).toBe(5000);
    expect(stats.a.paidCents).toBe(10000);
  });
});

describe('parseYuanToCents', () => {
  it('正确解析常见输入', () => {
    expect(parseYuanToCents('12')).toBe(1200);
    expect(parseYuanToCents('12.3')).toBe(1230);
    expect(parseYuanToCents('12.34')).toBe(1234);
    expect(parseYuanToCents('0.01')).toBe(1);
  });

  it('拒绝非法输入', () => {
    expect(parseYuanToCents('')).toBeNull();
    expect(parseYuanToCents('0')).toBeNull();
    expect(parseYuanToCents('-5')).toBeNull();
    expect(parseYuanToCents('1.234')).toBeNull();
    expect(parseYuanToCents('abc')).toBeNull();
  });
});
