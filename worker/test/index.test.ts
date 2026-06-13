import { type Environment } from '../src/environment.ts';
import worker from '../src/index.ts';
import { describe, expect, it } from 'vitest';

const environment = {
  ADYEN_API_KEY: 'AQEv_test_key',
  ADYEN_API_URL: 'https://checkout-test.adyen.com/v71',
  ADYEN_MERCHANT_ACCOUNT: 'SandboxMerchantECOM',
  ALLOWED_ORIGIN: '*',
  STRIPE_API_URL: 'https://api.stripe.com/v1',
  STRIPE_SECRET_KEY: 'sk_test_123',
} satisfies Environment;

const validBody = {
  amount: 4_200,
  card: {
    cvc: '123',
    expiry: '1227',
    number: '4242424242424242',
  },
  currency: 'GBP',
  psp: 'stripe',
  reference: 'ORD-123',
};

const post = (body: unknown): Request =>
  new Request('https://worker.example/', {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

const call = (request: Request): Promise<Response> =>
  worker.fetch(request, environment);

describe('worker route', () => {
  it('answers CORS preflight', async () => {
    const response = await call(
      new Request('https://worker.example/', { method: 'OPTIONS' }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('rejects non-POST methods', async () => {
    const response = await call(
      new Request('https://worker.example/', { method: 'GET' }),
    );
    expect(response.status).toBe(405);
  });

  it('returns 422 on a request that fails canonical validation', async () => {
    const response = await call(post({ ...validBody, currency: 'gbp' }));
    expect(response.status).toBe(422);
  });

  it('routes a valid request through the chosen adapter and returns the canonical response', async () => {
    const response = await call(post(validBody));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({
      pspReference: 'stripe_stub_ORD-123',
      status: 'authorised',
    });
  });
});
