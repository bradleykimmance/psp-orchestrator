import { z } from 'zod';

export const StripePaymentIntentResponseSchema = z.object({
  amount: z.int(),
  currency: z.string(),
  id: z.string(),
  status: z.enum([
    'canceled',
    'processing',
    'requires_action',
    'requires_capture',
    'requires_confirmation',
    'requires_payment_method',
    'succeeded',
  ]),
});
export type StripePaymentIntentResponse = z.infer<
  typeof StripePaymentIntentResponseSchema
>;

export const StripePaymentIntentRequestSchema = z.object({
  amount: z.int(),
  automatic_payment_methods: z.object({
    allow_redirects: z.literal('never'),
    enabled: z.literal(true),
  }),
  capture_method: z.literal('manual'),
  confirm: z.literal('true'),
  currency: z.enum(['gbp', 'usd', 'eur']),
  // A Stripe test payment-method token (`pm_card_*`) instead of plain card number
  payment_method: z.string().startsWith('pm_'),
});
export type StripePaymentIntentRequest = z.infer<
  typeof StripePaymentIntentRequestSchema
>;

export const StripeErrorResponseEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    decline_code: z.string().optional(),
    message: z.string(),
    payment_intent: z.object({ id: z.string() }).optional(),
    type: z.string(),
  }),
});
