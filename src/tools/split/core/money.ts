export const CURRENCIES = [
  'CNY',
  'USD',
  'EUR',
  'JPY',
  'KRW',
  'THB',
  'HKD',
  'TWD',
  'SGD',
  'MYR',
  'VND',
  'GBP',
  'AUD',
] as const;

const SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  JPY: 'JP¥',
  KRW: '₩',
  THB: '฿',
  HKD: 'HK$',
  TWD: 'NT$',
  SGD: 'S$',
  MYR: 'RM',
  VND: '₫',
  GBP: '£',
  AUD: 'A$',
};

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? code;
}

/** 解析用户输入的金额为分。非法或非正数返回 null。 */
export function parseYuanToCents(input: string): number | null {
  const m = input.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const cents = parseInt(m[1], 10) * 100 + (m[2] ? parseInt(m[2].padEnd(2, '0'), 10) : 0);
  return cents > 0 && Number.isSafeInteger(cents) ? cents : null;
}

/** 解析"指定金额"分摊里的单人份额：空串视为 0，允许 0。非法返回 null。 */
export function parseShareToCents(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return 0;
  const m = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return null;
  const cents = parseInt(m[1], 10) * 100 + (m[2] ? parseInt(m[2].padEnd(2, '0'), 10) : 0);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatMoney(cents: number, currency = 'CNY'): string {
  const abs = Math.abs(cents);
  const text = (abs / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? '-' : ''}${currencySymbol(currency)}${text}`;
}

/** @deprecated 兼容旧调用，等价于 formatMoney(cents, 'CNY') */
export function formatCents(cents: number): string {
  return formatMoney(cents, 'CNY');
}
