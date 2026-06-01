'use client';
import { createContext, useCallback, useContext, ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Currency {
  code: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  currencies: Currency[];
  loading: boolean;
}

const FALLBACK_CURRENCY: Currency = {
  code: 'SYP',
  name: 'Syrian Pound',
  nameAr: 'ليرة سورية',
  nameEn: 'Syrian Pound',
  symbol: 'ل.س',
  isDefault: true,
  isActive: true,
  sortOrder: 0,
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([FALLBACK_CURRENCY]);
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>(FALLBACK_CURRENCY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Currency[]>('/currencies')
      .then(items => {
        const activeItems = items.filter(item => item.isActive);
        setCurrencies(activeItems.length ? activeItems : [FALLBACK_CURRENCY]);
      })
      .catch(() => {
        setCurrencies([FALLBACK_CURRENCY]);
        setSelectedCurrencyState(FALLBACK_CURRENCY);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const savedCode = localStorage.getItem('br_currency');
    if (savedCode) {
      const found = currencies.find(currency => currency.code === savedCode);
      if (found) {
        setSelectedCurrencyState(found);
        return;
      }
    }

    const defaultCurrency = currencies.find(currency => currency.isDefault);
    setSelectedCurrencyState(defaultCurrency || currencies[0] || FALLBACK_CURRENCY);
  }, [currencies]);

  const setSelectedCurrency = useCallback((currency: Currency) => {
    setSelectedCurrencyState(currency);
    localStorage.setItem('br_currency', currency.code);
  }, []);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, currencies, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
}
