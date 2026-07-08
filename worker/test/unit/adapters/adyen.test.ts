import { adyenAdapter } from '../../../src/adapters/adyen';
import { basicRequest } from '../../helpers.ts';
import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jsonResponse = (body: unknown, status: number): Response =>
  Response.json(body, { status });

const fetchMock = vi.fn<typeof fetch>();

const declineRequest = () =>
  basicRequest({
    card: {
      cvc: '123',
      expiry: '1227',
      name: 'Brad Test',
      number: '4000000000000002',
    },
    psp: 'adyen',
  });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('adyenAdapter authorize', () => {
  it('is registered under the adyen id', () => {
    expect(adyenAdapter.id).toBe('adyen');
  });

  it('posts a JSON /payments call with x-api-key auth and test_-encrypted card fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          merchantReference: 'ORD-123',
          pspReference: 'ADYEN_REF_1',
          resultCode: 'Authorised',
        },
        200,
      ),
    );

    await adyenAdapter.authorize(basicRequest({ psp: 'adyen' }), env);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://checkout-test.adyen.com/v71/payments');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'content-type': 'application/json',
      'idempotency-key': '7f0d0f2e-9d3a-4b6c-8a1e-2c5f4d7b9e01',
      'x-api-key': 'Adyen_test_key',
    });

    const body: unknown = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      amount: { currency: 'GBP', value: 4_200 },
      merchantAccount: 'SandboxMerchantECOM',
      paymentMethod: {
        encryptedCardNumber: 'test_4242424242424242',
        encryptedExpiryMonth: 'test_12',
        encryptedExpiryYear: 'test_2027',
        encryptedSecurityCode: 'test_123',
        holderName: 'Brad Test',
        type: 'scheme',
      },
      reference: 'ORD-123',
    });
  });

  it('maps Authorised to an authorised canonical response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          merchantReference: 'ORD-123',
          pspReference: 'ADYEN_OK',
          resultCode: 'Authorised',
        },
        200,
      ),
    );

    const result = await adyenAdapter.authorize(
      basicRequest({ psp: 'adyen' }),
      env,
    );

    expect(result).toMatchObject({
      pspReference: 'ADYEN_OK',
      status: 'authorised',
    });
  });

  it('forces an acquirer-response code for the canonical decline card and maps Refused', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          merchantReference: 'ORD-123',
          pspReference: 'ADYEN_REFUSED',
          refusalReason: 'Refused',
          refusalReasonCode: '2',
          resultCode: 'Refused',
        },
        200,
      ),
    );

    const result = await adyenAdapter.authorize(declineRequest(), env);

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const body: unknown = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      additionalData: { RequestedTestAcquirerResponseCode: '2' },
    });

    expect(result).toMatchObject({
      errorCode: '2',
      errorMessage: 'Refused',
      pspReference: 'ADYEN_REFUSED',
      status: 'refused',
    });
  });

  it('maps an HTTP error envelope to an error canonical response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          errorCode: '010',
          errorType: 'security',
          message: 'Not allowed',
          status: 403,
        },
        403,
      ),
    );

    const result = await adyenAdapter.authorize(
      basicRequest({ psp: 'adyen' }),
      env,
    );

    expect(result).toMatchObject({
      errorCode: '010',
      errorMessage: 'Not allowed',
      status: 'error',
    });
  });
});
