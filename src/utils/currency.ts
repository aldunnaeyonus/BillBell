import { getLocales } from 'expo-localization';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CNY', symbol: 'CN¥', label: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', label: 'Mexican Peso' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won' },
  { code: 'RUB', symbol: '₽', label: 'Russian Ruble' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
];

export const DEFAULT_CURRENCY = 'USD';

// Helper: Get best guess currency from device settings
export function getDeviceCurrency() {
  const deviceCurrency = getLocales()[0]?.currencyCode;
  return SUPPORTED_CURRENCIES.find(c => c.code === deviceCurrency) 
    ? deviceCurrency 
    : DEFAULT_CURRENCY;
}

// Helper: Format amount (in cents) to string
export function formatCurrency(amountCents: number, currencyCode: string = 'USD') {
  const isZeroDecimal = ['JPY', 'KRW'].includes(currencyCode);
  const amount = isZeroDecimal ? Math.round(amountCents / 100) : amountCents / 100;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl fails
    return `${currencyCode} ${(amountCents / 100).toFixed(2)}`;
  }
}