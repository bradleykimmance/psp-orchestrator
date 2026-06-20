import { authorize, PaymentError } from '../../src/lib/api.ts';
import { type CanonicalRequest } from '../../src/lib/canonical.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const request: CanonicalRequest = {
  amount: 4_200,
  card: { cvc: '123', expiry: '1227', number: '4242424242424242' },
  currency: 'GBP',
  psp: 'stripe',
  reference: 'ORD-123',
};

const jsonResponse = (body: unknown, status: number): Response =>
  Response.json(body, {
    headers: { 'content-type': 'application/json' },
    status,
  });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authorize', () => {
  it('returns the canonical response on success', async () => {
    const canonical = {
      amount: 4_200,
      currency: 'gbp',
      pspReference: 'pi_123',
      rawResponse: { id: 'pi_123' },
      status: 'authorised',
    };
    fetchMock.mockResolvedValue(jsonResponse(canonical, 200));

    await expect(authorize(request)).resolves.toStrictEqual(canonical);
  });

  it('surfaces the first validation message from a 422', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          {
            error: 'Validation failed',
            issues: [
              {
                code: 'custom',
                message: 'Only sandbox test cards are accepted',
                path: ['card', 'number'],
              },
            ],
          },
          422,
        ),
      ),
    );

    await expect(authorize(request)).rejects.toBeInstanceOf(PaymentError);
    await expect(authorize(request)).rejects.toThrow(
      'Only sandbox test cards are accepted',
    );
  });

  it('passes through a canonical error body returned with a 5xx', async () => {
    const canonicalError = {
      pspReference: null,
      rawResponse: { message: 'upstream exploded' },
      status: 'error',
    };
    fetchMock.mockResolvedValue(jsonResponse(canonicalError, 502));

    await expect(authorize(request)).resolves.toStrictEqual(canonicalError);
  });

  it('throws a generic rejection when a non-ok body has no validation issues', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Method not allowed' }, 405),
    );

    await expect(authorize(request)).rejects.toThrow(
      'Worker rejected the request (405).',
    );
  });

  it('throws when an ok response is not a canonical payload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ unexpected: true }, 200));

    await expect(authorize(request)).rejects.toThrow(
      'Worker returned an unexpected payload.',
    );
  });

  it('throws a reachability error when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(authorize(request)).rejects.toThrow(
      'Could not reach the payments Worker.',
    );
  });
});
