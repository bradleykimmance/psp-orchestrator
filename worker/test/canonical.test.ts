import { CanonicalRequestSchema } from '../src/canonical.ts';
import { describe, expect, it } from 'vitest';

const valid = {
  amount: 4_200,
  card: {
    cvc: '123',
    expiry: '1227',
    number: '5555555555554444',
  },
  currency: 'GBP',
  psp: 'adyen',
  reference: 'ORD-123',
};

describe('CanonicalRequestSchema', () => {
  it('accepts a well-formed canonical request', () => {
    const result = CanonicalRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an unknown PSP', () => {
    const result = CanonicalRequestSchema.safeParse({
      ...valid,
      psp: 'paypal',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer / negative amounts (minor units only)', () => {
    expect(
      CanonicalRequestSchema.safeParse({ ...valid, amount: 42.5 }).success,
    ).toBe(false);
    expect(
      CanonicalRequestSchema.safeParse({ ...valid, amount: -1 }).success,
    ).toBe(false);
  });

  it('rejects a malformed card number', () => {
    const result = CanonicalRequestSchema.safeParse({
      ...valid,
      card: { ...valid.card, number: '4242-4242' },
    });
    expect(result.success).toBe(false);
  });

  it('requires a 3-letter uppercase currency', () => {
    expect(
      CanonicalRequestSchema.safeParse({ ...valid, currency: 'gbp' }).success,
    ).toBe(false);
    expect(
      CanonicalRequestSchema.safeParse({ ...valid, currency: 'POUND' }).success,
    ).toBe(false);
  });
});
