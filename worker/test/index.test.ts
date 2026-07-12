import worker from '../src/index.ts';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

const validBody = {
  amount: 4_200,
  card: {
    cvc: '123',
    expiry: '1227',
    name: 'Brad Test',
    number: '4242424242424242',
  },
  currency: 'GBP',
  idempotencyKey: '7f0d0f2e-9d3a-4b6c-8a1e-2c5f4d7b9e01',
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
  worker.fetch(request, env);

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

    const idempotencyKey = crypto.randomUUID();
    const response = await call(
      post({
        ...validBody,
        card: {
          cvc: '737',
          expiry: '0327',
          name: 'Brad Test',
          number: '5555555555554444',
        },
        idempotencyKey,
        psp: 'adyen',
      }),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({
      pspReference: 'ADYEN_ROUTED',
      status: 'authorised',
    });

    // The sync outcome is persisted, awaiting webhook confirmation.
    const row = await env.paymentsDB
      .prepare('SELECT * FROM payments WHERE idempotency_key = ?1')
      .bind(idempotencyKey)
      .first();
    expect(row).toMatchObject({
      amount: 4_200,
      psp: 'adyen',
      psp_reference: 'ADYEN_ROUTED',
      status: 'authorised',
      webhook_confirmed_at: null,
    });
  });

  it('stores one payment row when the same idempotency key is posted twice', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          merchantReference: 'ORD-123',
          pspReference: 'ADYEN_REPLAYED',
          resultCode: 'Authorised',
        },
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const idempotencyKey = crypto.randomUUID();
    const body = {
      ...validBody,
      card: {
        cvc: '737',
        expiry: '0327',
        name: 'Brad Test',
        number: '5555555555554444',
      },
      idempotencyKey,
      psp: 'adyen',
    };
    await call(post(body));
    await call(post(body));

    const row = await env.paymentsDB
      .prepare(
        'SELECT count(*) AS total FROM payments WHERE idempotency_key = ?1',
      )
      .bind(idempotencyKey)
      .first();
    expect(row?.total).toBe(1);
  });

  it('records an error row when the adapter throws, so a retry can heal it', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('socket hang up'));
    vi.stubGlobal('fetch', fetchMock);

    const idempotencyKey = crypto.randomUUID();
    const response = await call(post({ ...validBody, idempotencyKey }));
    expect(response.status).toBe(502);

    const row = await env.paymentsDB
      .prepare('SELECT * FROM payments WHERE idempotency_key = ?1')
      .bind(idempotencyKey)
      .first();
    expect(row).toMatchObject({ psp_reference: null, status: 'error' });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
