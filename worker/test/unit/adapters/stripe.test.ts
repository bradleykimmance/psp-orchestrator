import { stripeAdapter } from '../../../src/adapters/stripe';
import { basicRequest, unitTestEnvironment } from '../../helpers.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jsonResponse = (body: unknown, status: number): Response =>
  Response.json(body, { status });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('stripeAdapter authorize', () => {
  it('is registered under the stripe id', () => {
    expect(stripeAdapter.id).toBe('stripe');
  });

  it('posts a form-encoded manual-capture intent to the configured base url', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          amount: 4_200,
          currency: 'gbp',
          id: 'pi_123',
          status: 'requires_capture',
        },
        200,
      ),
    );

    await stripeAdapter.authorize(basicRequest(), unitTestEnvironment);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.stripe.com/v1/payment_intents');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'content-type': 'application/x-www-form-urlencoded',
      'idempotency-key': '7f0d0f2e-9d3a-4b6c-8a1e-2c5f4d7b9e01',
    });

    const { body } = init ?? {};

    expect(typeof body).toBe('string');
    const parameters = new URLSearchParams(String(body));
    expect(Object.fromEntries(parameters)).toStrictEqual({
      amount: '4200',
      'automatic_payment_methods[allow_redirects]': 'never',
      'automatic_payment_methods[enabled]': 'true',
      capture_method: 'manual',
      confirm: 'true',
      currency: 'gbp',
      'payment_method_data[billing_details][name]': 'Brad Test',
      'payment_method_data[card][cvc]': '123',
      'payment_method_data[card][exp_month]': '12',
      'payment_method_data[card][exp_year]': '2027',
      'payment_method_data[card][number]': '4242424242424242',
      'payment_method_data[type]': 'card',
    });
  });

  it('maps requires_capture to an authorised canonical response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          amount: 4_200,
          currency: 'gbp',
          id: 'pi_ok',
          status: 'requires_capture',
        },
        200,
      ),
    );

    const result = await stripeAdapter.authorize(
      basicRequest(),
      unitTestEnvironment,
    );

    expect(result).toMatchObject({
      amount: 4_200,
      currency: 'gbp',
      pspReference: 'pi_ok',
      status: 'authorised',
    });
  });

  it('maps a card-error decline to refused and keeps the embedded reference', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'card_declined',
            decline_code: 'generic_decline',
            message: 'Your card was declined.',
            payment_intent: { id: 'pi_declined' },
            type: 'card_error',
          },
        },
        402,
      ),
    );

    const result = await stripeAdapter.authorize(
      basicRequest(),
      unitTestEnvironment,
    );

    expect(result).toMatchObject({
      errorCode: 'card_declined',
      errorMessage: 'Your card was declined.',
      status: 'refused',
    });
  });

  it('maps a non-card error to an error canonical response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { message: 'No such API key.', type: 'api_error' } },
        401,
      ),
    );

    const result = await stripeAdapter.authorize(
      basicRequest(),
      unitTestEnvironment,
    );

    expect(result).toMatchObject({
      errorMessage: 'No such API key.',
      status: 'error',
    });
  });
});
