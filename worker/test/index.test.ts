import { type Environment } from '../src/environment.ts';
import worker from '../src/index.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
    name: 'Brad Test',
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
    // Both adapters now make real calls, so stub fetch to keep the route test
    // hermetic. Routing through Adyen exercises the registry -> adapter path.
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          merchantReference: 'ORD-123',
          pspReference: 'ADYEN_ROUTED',
          resultCode: 'Authorised',
        },
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await call(
      post({
        ...validBody,
        card: {
          cvc: '737',
          expiry: '0327',
          name: 'Brad Test',
          number: '5555555555554444',
        },
        psp: 'adyen',
      }),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({
      pspReference: 'ADYEN_ROUTED',
      status: 'authorised',
    });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
