import {
  type CanonicalRequest,
  type CanonicalResponse,
} from '../../canonical.ts';
import { type Environment } from '../../environment.ts';
import { stripePost } from './client.ts';
import {
  StripeErrorResponseEnvelopeSchema,
  type StripePaymentIntentRequest,
  StripePaymentIntentRequestSchema,
  type StripePaymentIntentResponse,
  StripePaymentIntentResponseSchema,
} from './schemas.ts';

// Stripe PaymentIntent status -> canonical status.
const statusMap: Record<
  StripePaymentIntentResponse['status'],
  CanonicalResponse['status']
> = {
  canceled: 'error',
  processing: 'pending',
  requires_action: 'pending',
  requires_capture: 'authorised', // authorize-only success lands here
  requires_confirmation: 'pending',
  requires_payment_method: 'refused',
  succeeded: 'authorised',
};

const toPaymentIntentBody = (
  request: CanonicalRequest,
): StripePaymentIntentRequest => {
  const payload = {
    amount: request.amount,
    automatic_payment_methods: {
      allow_redirects: 'never',
      enabled: true,
    },
    capture_method: 'manual',
    confirm: 'true',
    currency: request.currency.toLowerCase(),
    payment_method_data: {
      card: {
        cvc: request.card.cvc,
        exp_month: Number(request.card.expiry.slice(0, 2)),
        exp_year: 2_000 + Number(request.card.expiry.slice(2, 4)),
        number: request.card.number,
      },
      type: 'card',
    },
  };

  return StripePaymentIntentRequestSchema.parse(payload);
};

export const stripeAuthorize = async (
  request: CanonicalRequest,
  environment: Environment,
): Promise<CanonicalResponse> => {
  const { ok, raw } = await stripePost(
    environment,
    '/payment_intents',
    toPaymentIntentBody(request),
  );

  if (ok) {
    const intent = StripePaymentIntentResponseSchema.parse(raw);
    return {
      amount: intent.amount,
      currency: intent.currency,
      pspReference: intent.id,
      rawResponse: raw,
      status: statusMap[intent.status],
    };
  }

  const { error } = StripeErrorResponseEnvelopeSchema.parse(raw);
  return {
    errorCode: error.code,
    errorMessage: error.message,
    rawResponse: raw,
    status: error.type === 'card_error' ? 'refused' : 'error',
  };
};
