'use client';
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
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
  selectedCurrency: Currency | null;
  setSelectedCurrency: (c: Currency) => void;
  currencies: Currency[];
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const FALLBACK_CURRENCY: Currency = {
  code: 'SYP',
  name: 'Syrian Pound',
  symbol: 'ل.س',
  isDefault: true,
  isActive: true,
  sortOrder: 0,
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Currency[]>('/currencies')
      .then(setCurrencies)
      .catch(() => setCurrencies([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currencies.length === 0) return;
    const savedCode = localStorage.getItem('br_currency');
    if (savedCode) {
      const found = currencies.find(c => c.code === savedCode);
      if (found) {
        setSelectedCurrencyState(found);
        return;
      }
    }
    const defaultCurrency = currencies.find(c => c.isDefault);
    setSelectedCurrencyState(defaultCurrency || currencies[0] || FALLBACK_CURRENCY);
  }, [currencies]);

  const setSelectedCurrency = useCallback((c: Currency) => {
    setSelectedCurrencyState(c);
    localStorage.setItem('br_currency', c.code);
  }, []);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, currencies, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
