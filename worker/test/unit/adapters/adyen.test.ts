import { adyenAdapter } from '../../../src/adapters/adyen.ts';
import { basicRequest, unitTestEnvironment } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';

describe('adyenAdapter (stub)', () => {
  it('is registered under the adyen id', () => {
    expect(adyenAdapter.id).toBe('adyen');
  });

  it('returns a fake authorised response carrying a stub reference', async () => {
    const result = await adyenAdapter.authorize(
      basicRequest({ psp: 'adyen' }),
      unitTestEnvironment,
    );
    expect(result.status).toBe('authorised');
    expect(result.pspReference).toBe('adyen_stub_ORD-123');
    expect(result.rawResponse).toMatchObject({
      psp: 'adyen',
      reference: 'ORD-123',
    });
  });
});
