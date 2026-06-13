// Currencies the UI offers. The Worker takes any ISO 4217 code; this is just the demo set.
export const CURRENCIES = ['GBP', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
};
