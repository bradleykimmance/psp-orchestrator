import { type Environment } from './environment.ts';
import { instrumentForPan } from './testInstruments.ts';
import { z } from 'zod';

const PSPS = ['stripe', 'adyen'] as const;
const PspSchema = z.enum(PSPS);
export type Psp = z.infer<typeof PspSchema>;

const CardSchema = z.object({
  cvc: z.string().regex(/^\d{3,4}$/u, 'CVC must be 3-4 digits'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\d{2}$/u, 'Expiry must be MMYY'),
  number: z.string().regex(/^\d{12,19}$/u, 'Card number must be 12-19 digits'),
});

export const CanonicalRequestSchema = z
  .object({
    // Minor units (e.g. 4200 == GBP 42.00).
    amount: z.number().int().positive(),
    card: CardSchema,
    currency: z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/u, 'ISO 4217 currency code'),
    psp: PspSchema,
    reference: z.string().min(1).max(80),
  })
  // Edge lock-down: resolve the PAN to a canonical instrument here so adapters
  // never touch a raw card number
  .transform((request, context) => {
    const instrument = instrumentForPan(request.card.number);
    if (instrument === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Only sandbox test cards are accepted',
        path: ['card', 'number'],
      });
      return z.NEVER;
    }

    return { ...request, instrument };
  });
export type CanonicalRequest = z.infer<typeof CanonicalRequestSchema>;

export type CanonicalResponse = {
  pspReference: null | string;
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
