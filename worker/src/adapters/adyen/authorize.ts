import {
  type CanonicalRequest,
  type CanonicalResponse,
} from '../../canonical.ts';
import { type Environment } from '../../environment.ts';
import { adyenPost } from './client.ts';
import {
  AdyenErrorResponseEnvelopeSchema,
  type AdyenPaymentRequest,
  AdyenPaymentRequestSchema,
  AdyenPaymentResponseSchema,
} from './schemas.ts';

// 1 = Authorised, 2 = Refused, 12 = Not enough balance.
const testAcquirerResponseCodeByPan: Record<string, string> = {
  '4000000000000002': '2', // canonical generic decline -> Refused
  '4000000000009995': '12', // canonical insufficient funds -> Not enough balance
};

const statusByResultCode: Record<string, CanonicalResponse['status']> = {
  Authorised: 'authorised',
  Cancelled: 'error',
  Error: 'error',
  Pending: 'pending',
  Received: 'pending',
  RedirectShopper: 'pending',
  Refused: 'refused',
};

const authorizePayload = (
  request: CanonicalRequest,
  environment: Environment,
): AdyenPaymentRequest => {
  const acquirerCode = testAcquirerResponseCodeByPan[request.card.number];

  const payload = {
    ...(acquirerCode === undefined
      ? {}
      : {
          additionalData: { RequestedTestAcquirerResponseCode: acquirerCode },
        }),
    amount: {
      currency: request.currency.toUpperCase(),
      value: request.amount,
    },
    merchantAccount: environment.ADYEN_MERCHANT_ACCOUNT,
    paymentMethod: {
      // `test_` stands in for client-side-encrypted values in Adyen's sandbox,
      // so the raw canonical card never needs the (PCI-gated) raw-card API.
      encryptedCardNumber: `test_${request.card.number}`,
      encryptedExpiryMonth: `test_${request.card.expiry.slice(0, 2)}`,
      encryptedExpiryYear: `test_20${request.card.expiry.slice(2, 4)}`,
      encryptedSecurityCode: `test_${request.card.cvc}`,
      holderName: request.card.name,
      type: 'scheme',
    },
    reference: request.reference,
  };

  return AdyenPaymentRequestSchema.parse(payload);
};

export const adyenAuthorize = async (
  request: CanonicalRequest,
  environment: Environment,
): Promise<CanonicalResponse> => {
  const { ok, raw } = await adyenPost(
    environment,
    '/payments',
    authorizePayload(request, environment),
  );

  if (!ok) {
    const error = AdyenErrorResponseEnvelopeSchema.parse(raw);
    return {
      errorCode: error.errorCode,
      errorMessage: error.message,
      rawResponse: raw,
      status: 'error',
    };
  }

  const result = AdyenPaymentResponseSchema.parse(raw);
  return {
    amount: request.amount,
    currency: request.currency,
    errorCode: result.refusalReasonCode,
    errorMessage: result.refusalReason,
    pspReference: result.pspReference ?? null,
    rawResponse: raw,
    status: statusByResultCode[result.resultCode] ?? 'error',
  };
};
