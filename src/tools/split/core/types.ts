export interface Member {
  id: string;
  name: string;
}

export type SplitMode =
  | { type: 'equal' }
  | { type: 'weighted'; weights: Record<string, number> }
  | { type: 'exact'; amounts: Record<string, number> };

export interface Expense {
  id: string;
  description: string;
  /** 金额一律以"分"为单位的整数存储，币种为 currency（缺省 = 账本币种） */
  amountCents: number;
  /** 本笔消费的币种；缺省等于账本币种 */
  currency?: string;
  /** 汇率：1 单位 currency = rateToBase 单位账本币种；缺省 1 */
  rateToBase?: number;
  /** 还款是成员间的直接转账，不计入消费统计；缺省 'expense' */
  kind?: 'expense' | 'repayment';
  payerId: string;
  participantIds: string[];
  split: SplitMode;
  createdAt: number;
}

export interface Trip {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  /** 账本主币种，所有结算以此币种计 */
  currency: string;
  createdAt: number;
}

export interface Transfer {
  from: string;
  to: string;
  amountCents: number;
}
