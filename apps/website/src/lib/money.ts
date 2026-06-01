export type MoneyAmount = number | string | null | undefined;

export interface CurrencyInfo {
  code: string;
  symbol: string;
}

export function toMoneyNumber(value: MoneyAmount) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0;
}

export function formatMoney(value: MoneyAmount, currency: CurrencyInfo | string = 'SYP') {
  const amount = toMoneyNumber(value);
  if (typeof currency === 'string') {
    return `${amount.toLocaleString()} ${currency}`;
  }
  const { code, symbol } = currency;
  if (code === 'USD') {
    return `${symbol}${amount.toFixed(2)}`;
  }
  return `${amount.toLocaleString()} ${symbol}`;
}
