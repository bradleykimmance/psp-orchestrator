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
      jsonResponse({ id: 'pi_123', status: 'requires_capture' }, 200),
    );

    await stripeAdapter.authorize(basicRequest(), unitTestEnvironment);

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.stripe.com/v1/payment_intents');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'content-type': 'application/x-www-form-urlencoded',
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
      // No raw PAN crosses the wire: the canonical instrument is mapped to a
      // Stripe test token, sidestepping the raw-card-data API restriction.
      payment_method: 'pm_card_visa',
    });
    expect(String(body)).not.toContain('4242424242424242');
  });

  it('maps each canonical instrument to its stripe test token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'pi_dec', status: 'requires_payment_method' }, 200),
    );

    await stripeAdapter.authorize(
      basicRequest({
        card: { cvc: '123', expiry: '1227', number: '4000000000000002' },
      }),
      unitTestEnvironment,
    );

    const parameters = new URLSearchParams(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    );
    expect(parameters.get('payment_method')).toBe('pm_card_chargeDeclined');
  });

  it('maps requires_capture to an authorised canonical response', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'pi_ok', status: 'requires_capture' }, 200),
    );

    const result = await stripeAdapter.authorize(
      basicRequest(),
      unitTestEnvironment,
    );

    expect(result).toMatchObject({
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
      pspReference: 'pi_declined',
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

    expect(result).toMatchObject({ pspReference: null, status: 'error' });
  });
});
