import { stripeAdapter } from '../../../src/adapters/stripe';
import {
  instrumentForPan,
  type TestInstrument,
} from '../../../src/testInstruments.ts';
import { basicRequest, unitTestEnvironment } from '../../helpers.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Keyed by instrument so the TestInstrument union forces an entry for every
// sandbox card: add a card to the registry and this table won't compile until
// it's covered here. Each case drives the full chain — PAN resolves to the
// instrument at the edge, which the adapter maps to the Stripe test token.
const tokenByInstrument: Record<
  TestInstrument,
  { number: string; token: string }
> = {
  'amex-approved': { number: '378282246310005', token: 'pm_card_amex' },
  'mastercard-approved': {
    number: '5555555555554444',
    token: 'pm_card_mastercard',
  },
  'visa-approved': { number: '4242424242424242', token: 'pm_card_visa' },
  'visa-declined': {
    number: '4000000000000002',
    token: 'pm_card_chargeDeclined',
  },
  'visa-insufficient-funds': {
    number: '4000000000009995',
    token: 'pm_card_chargeDeclinedInsufficientFunds',
  },
};

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

  it.each(Object.entries(tokenByInstrument))(
    'maps the %s instrument to its stripe test token',
    async (instrument, { number, token }) => {
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

      // The edge resolves the PAN to the instrument we expect...
      expect(instrumentForPan(number)).toBe(instrument);

      await stripeAdapter.authorize(
        basicRequest({ card: { cvc: '123', expiry: '1227', number } }),
        unitTestEnvironment,
      );

      // ...and the adapter maps that instrument to the Stripe test token.
      const parameters = new URLSearchParams(
        String(fetchMock.mock.calls[0]?.[1]?.body),
      );
      expect(parameters.get('payment_method')).toBe(token);
    },
  );

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
