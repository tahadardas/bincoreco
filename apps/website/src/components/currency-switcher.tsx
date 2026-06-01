'use client';
import { useParams } from 'next/navigation';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getGuestSession } from '@/lib/guest-session';

type CurrencySwitcherProps = {
  className?: string;
};

export default function CurrencySwitcher({ className = '' }: CurrencySwitcherProps) {
  const params = useParams();
  const locale = (params.locale as string) || 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const { selectedCurrency, currencies, setSelectedCurrency, loading } = useCurrency();
  const { token } = useAuth();

  const activeCurrencies = currencies.filter(c => c.isActive);
  const confirmMessage = locale === 'ar'
    ? 'تغيير العملة سيعيد تسعير السلة. هل تريد المتابعة؟'
    : 'Changing currency will reprice your cart. Continue?';

  const handleCurrencyChange = async (code: string) => {
    const currency = currencies.find(c => c.code === code);
    if (!currency || currency.code === selectedCurrency.code) return;

    try {
      const cart = token
        ? await api.get<{ items?: unknown[] }>('/cart', token)
        : await api.get<{ items?: unknown[] }>(`/guest-cart?sessionId=${getGuestSession()}`);
      if ((cart.items || []).length > 0) {
        if (!window.confirm(confirmMessage)) return;
        if (token) {
          await api.delete('/cart', token);
        } else {
          await api.delete(`/guest-cart?sessionId=${getGuestSession()}`);
        }
        window.dispatchEvent(new Event('banco-cart-cleared'));
      }
    } catch {
      if (!window.confirm(confirmMessage)) return;
    }

    setSelectedCurrency(currency);
  };

  if (loading || activeCurrencies.length === 0) return null;

  return (
    <select
      className={className || 'lang-switch'}
      dir={dir}
      value={selectedCurrency.code}
      onChange={e => { void handleCurrencyChange(e.target.value); }}
    >
      {activeCurrencies.map(c => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
    </select>
  );
}
