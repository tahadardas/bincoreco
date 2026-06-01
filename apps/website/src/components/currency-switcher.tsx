'use client';
import { useParams } from 'next/navigation';
import { useCurrency } from '@/lib/currency-context';

type CurrencySwitcherProps = {
  className?: string;
};

export default function CurrencySwitcher({ className = '' }: CurrencySwitcherProps) {
  const params = useParams();
  const locale = (params.locale as string) || 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const { selectedCurrency, currencies, setSelectedCurrency, loading } = useCurrency();

  const activeCurrencies = currencies.filter(c => c.isActive);

  if (loading || activeCurrencies.length === 0) return null;

  return (
    <select
      className={className || 'lang-switch'}
      dir={dir}
      value={selectedCurrency?.code || ''}
      onChange={e => {
        const currency = currencies.find(c => c.code === e.target.value);
        if (currency) setSelectedCurrency(currency);
      }}
    >
      {activeCurrencies.map(c => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );
}
