'use client';
import { CurrencyInfo, formatMoney, MoneyAmount } from '@/lib/money';

interface SizeOption {
  id: string;
  name: string;
  sizeValue: number | null;
  sizeUnit: string | null;
  prices: { amount: MoneyAmount; currencyCode: string }[];
}

interface CupSizeSelectorProps {
  options: SizeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  currency?: CurrencyInfo;
}

function CupSVG({ size, selected }: { size: 'S' | 'M' | 'L'; selected: boolean }) {
  const scale = size === 'S' ? 0.7 : size === 'M' ? 1 : 1.3;
  const color = selected ? 'var(--br-gold)' : 'var(--br-line)';
  const fill = selected ? 'rgba(201,150,26,0.15)' : 'transparent';
  return (
    <svg width={48 * scale} height={52 * scale} viewBox="0 0 48 52" fill="none" style={{ display: 'block', margin: '0 auto' }}>
      {/* Cup body */}
      <path d="M8 6 L10 42 Q12 48 24 48 Q36 48 38 42 L40 6 Z" stroke={color} strokeWidth="2" fill={fill} />
      {/* Handle */}
      <path d="M38 16 Q46 16 46 24 Q46 34 38 34" stroke={color} strokeWidth="2" fill="none" />
      {/* Steam */}
      {selected && (
        <>
          <path d="M18 2 Q20 -2 22 2" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
          <path d="M24 0 Q26 -4 28 0" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M30 2 Q32 -2 34 2" stroke={color} strokeWidth="1.5" fill="none" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

export default function CupSizeSelector({ options, selectedId, onSelect, currency }: CupSizeSelectorProps) {
  const getSize = (index: number) => index === 0 ? 'S' : index === 1 ? 'M' : 'L';
  const currencyCode = currency?.code || 'SYP';

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {options.map((option, index) => {
        const price = option.prices.find(p => p.currencyCode === currencyCode);
        const selected = option.id === selectedId;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            style={{
              flex: 1, minWidth: 100, padding: '16px 12px 12px',
              background: selected ? 'rgba(201,150,26,0.08)' : 'var(--br-porcelain)',
              border: `2px solid ${selected ? 'var(--br-gold)' : 'var(--br-line)'}`,
              borderRadius: 14, cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s',
              boxShadow: selected ? '0 4px 16px rgba(201,150,26,0.2)' : 'none',
            }}
          >
            <CupSVG size={getSize(index)} selected={selected} />
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8, color: selected ? 'var(--br-gold-dark)' : 'inherit' }}>
              {option.name}
            </div>
            {option.sizeValue && (
              <div style={{ fontSize: 12, color: 'var(--br-muted)', marginTop: 2 }}>
                {option.sizeValue}{option.sizeUnit || ''}
              </div>
            )}
            {price && (
              <div style={{
                fontSize: 15, fontWeight: 900, marginTop: 6,
                color: selected ? 'var(--br-gold-dark)' : 'var(--br-coffee)',
              }}>
                {formatMoney(price.amount, currency || price.currencyCode)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
