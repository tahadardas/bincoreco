export type MoneyAmount = number | string | null | undefined;

export function toMoneyNumber(value: MoneyAmount) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0;
}

export function formatMoney(value: MoneyAmount, currencyCode = 'SYP') {
  const amount = toMoneyNumber(value);
  return `${amount.toLocaleString()} ${currencyCode}`;
}
