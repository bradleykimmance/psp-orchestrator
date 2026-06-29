import { type Psp, type PspAdapter } from '../canonical.ts';
import { adyenAdapter } from './adyen';
import { stripeAdapter } from './stripe';

// Registry: canonical `psp` value -> the adapter that speaks that PSP.
export const adapters: Record<Psp, PspAdapter> = {
  adyen: adyenAdapter,
  stripe: stripeAdapter,
};
