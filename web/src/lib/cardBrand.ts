export type CardBrand = 'amex' | 'mastercard' | 'unknown' | 'visa';

// Detect the network from the leading digits. Enough for the sandbox PANs;
// real issuer ranges are wider, but the adapters never branch on this anyway.
export const cardBrand = (value: string): CardBrand => {
  const digits = value.replaceAll(/\D/gu, '');

  if (digits.startsWith('4')) {
    return 'visa';
  }

  if (/^(?:5[1-5]|2[2-7])/u.test(digits)) {
    return 'mastercard';
  }

  if (/^3[47]/u.test(digits)) {
    return 'amex';
  }

  return 'unknown';
};

export const BRAND_LABELS: Record<Exclude<CardBrand, 'unknown'>, string> = {
  amex: 'Amex',
  mastercard: 'Mastercard',
  visa: 'Visa',
};
