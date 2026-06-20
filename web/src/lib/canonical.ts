// Frontend mirror of the Worker's canonical contract (worker/src/canonical.ts).
// The Worker validates with zod.
export const PSPS = ['stripe', 'adyen'] as const;
export type CanonicalRequest = {
  amount: number;
  card: {
    cvc: string;
    // MMYY, e.g. '1227'.
    expiry: string;
    number: string;
  };
  currency: string;
  psp: Psp;
  reference: string;
};

export type CanonicalResponse = {
  amount?: number;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
  pspReference?: null | string;
  rawResponse: unknown;
  status: CanonicalStatus;
};

export type CanonicalStatus = 'authorised' | 'error' | 'pending' | 'refused';

export type Psp = (typeof PSPS)[number];

export const PSP_LABELS: Record<Psp, string> = {
  adyen: 'Adyen',
  stripe: 'Stripe',
};
