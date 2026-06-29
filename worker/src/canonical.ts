import { type Environment } from './environment.ts';
import { z } from 'zod';

const PSPS = ['stripe', 'adyen'] as const;
const PspSchema = z.enum(PSPS);
export type Psp = z.infer<typeof PspSchema>;

const CardSchema = z.object({
  cvc: z.string().regex(/^\d{3,4}$/u, 'CVC must be 3-4 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\d{2}$/u, 'Expiry must be MMYY'),
  name: z.string().min(1).max(50),
  number: z.string().regex(/^\d{12,19}$/u, 'Card number must be 12-19 digits'),
  schema: z.enum(['visa', 'mastercard', 'amex', 'discover']),
});

export const CanonicalRequestSchema = z.object({
  // Minor units (e.g. 4200 == GBP 42.00).
  amount: z.number().int().positive(),
  card: CardSchema,
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/u, 'ISO 4217 currency code'),
  psp: PspSchema,
  reference: z.string().min(1).max(80),
});
export type CanonicalRequest = z.infer<typeof CanonicalRequestSchema>;

export type CanonicalResponse = {
  amount?: number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
  pspReference?: null | string;
  rawResponse: unknown;
  status: CanonicalStatus;
};

export type PspAdapter = {
  readonly authorize: (
    request: CanonicalRequest,
    environment: Environment,
  ) => Promise<CanonicalResponse>;
  readonly id: Psp;
};

type CanonicalStatus = 'authorised' | 'error' | 'pending' | 'refused';
