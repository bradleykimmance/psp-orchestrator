import { z } from 'zod';

export const AdyenPaymentRequestSchema = z.object({
  // (1 = Authorised, 2 = Refused, 12 = Not enough balance).
  additionalData: z
    .object({
      RequestedTestAcquirerResponseCode: z.string(),
    })
    .optional(),
  amount: z.object({
    currency: z.enum(['GBP', 'USD', 'EUR']),
    value: z.int(),
  }),
  merchantAccount: z.string(),
  paymentMethod: z.object({
    encryptedCardNumber: z.string(),
    encryptedExpiryMonth: z.string(),
    encryptedExpiryYear: z.string(),
    encryptedSecurityCode: z.string(),
    holderName: z.string(),
    type: z.literal('scheme'),
  }),
  reference: z.string(),
});
export type AdyenPaymentRequest = z.infer<typeof AdyenPaymentRequestSchema>;

export const AdyenErrorResponseEnvelopeSchema = z.object({
  errorCode: z.string().optional(),
  errorType: z.string().optional(),
  message: z.string().optional(),
  pspReference: z.string().optional(),
  status: z.int().optional(),
});

export const AdyenPaymentResponseSchema = z.object({
  merchantReference: z.string().optional(),
  pspReference: z.string().optional(),
  refusalReason: z.string().optional(),
  refusalReasonCode: z.string().optional(),
  resultCode: z.string(),
});
