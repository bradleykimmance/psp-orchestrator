import { adyenAdapter } from './adyen';
import { stripeAdapter } from './stripe';
import { type PspAdapter } from './types.ts';
import { type Psp } from 'shared/psps';

// Registry: canonical `psp` value -> the adapter that speaks that PSP.
export const adapters: Record<Psp, PspAdapter> = {
  adyen: adyenAdapter,
  stripe: stripeAdapter,
};
