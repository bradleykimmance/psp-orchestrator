import { CanonicalRequestSchema } from '../../src/canonical.ts';
import { basicRequest } from '../helpers.ts';
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

  it('rejects a well-formed card that is not a sandbox test card', () => {
    const result = CanonicalRequestSchema.safeParse({
      ...basicRequest(),
      card: { ...basicRequest().card, number: '4111111111111111' },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Only sandbox test cards are accepted',
    );
  });

  it('resolves an accepted test card to its canonical instrument', () => {
    const result = CanonicalRequestSchema.safeParse(basicRequest());
    expect(result.success).toBe(true);
    expect(result.data?.instrument).toBe('visa-approved');
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
