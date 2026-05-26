export const designTokens = {
  colors: {
    black: '#0D0D0D',
    gold: '#C9961A',
    goldDark: '#9E7410',
    cream: '#F8F3E7',
    white: '#FFFFFF',
    coffee: '#4B2E1E',
    espresso: '#1F130E',
    muted: '#7A6A58',
    success: '#2E7D32',
    warning: '#B26A00',
    danger: '#B42318',
  },
  fonts: {
    arabic: '\'Noto Naskh Arabic\', serif',
    english: '\'Inter\', sans-serif',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export const defaultLocale = 'ar';
export const supportedLocales = ['ar', 'en'] as const;
export const defaultCurrency = 'SYP';
export const defaultPickupTimeMinutes = 15;
