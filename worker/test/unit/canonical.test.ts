import { basicRequest } from '../helpers.ts';
import { CanonicalRequestSchema } from 'shared/canonical';
import { describe, expect, it } from 'vitest';

describe('CanonicalRequestSchema', () => {
  it('accepts a well-formed canonical request', () => {
    const result = CanonicalRequestSchema.safeParse(basicRequest());
    expect(result.success).toBe(true);
  });

  it('rejects an unknown PSP', () => {
    const result = CanonicalRequestSchema.safeParse(
      // @ts-expect-error purposeful different psp
      basicRequest({ psp: 'paypal' }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects non-integer / negative amounts (minor units only)', () => {
    expect(
      CanonicalRequestSchema.safeParse(basicRequest({ amount: 42.5 })).success,
    ).toBe(false);
    expect(
      CanonicalRequestSchema.safeParse(basicRequest({ amount: -1 })).success,
    ).toBe(false);
  });

  it('rejects a malformed card number', () => {
    const result = CanonicalRequestSchema.safeParse({
      ...basicRequest(),
      card: { ...basicRequest().card, number: '4242-4242' },
    });
    expect(result.success).toBe(false);
  });

  it('requires a UUID idempotency key', () => {
    expect(
      CanonicalRequestSchema.safeParse(
        basicRequest({ idempotencyKey: 'not-a-uuid' }),
      ).success,
    ).toBe(false);
    expect(
      CanonicalRequestSchema.safeParse({
        ...basicRequest(),
        idempotencyKey: undefined,
      }).success,
    ).toBe(false);
  });

  it('requires a 3-letter uppercase currency', () => {
    expect(
      CanonicalRequestSchema.safeParse(basicRequest({ currency: 'gbp' }))
        .success,
    ).toBe(false);
    expect(
      CanonicalRequestSchema.safeParse(basicRequest({ currency: 'POUND' }))
        .success,
    ).toBe(false);
  });
});
