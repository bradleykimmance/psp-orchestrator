import { type PspAdapter } from '../canonical.ts';
import { stubAuthorisation } from './stub.ts';

// Stripe adapter. Stubbed until the real /payments call is wired in.
export const stripeAdapter: PspAdapter = {
  authorize: (request) => Promise.resolve(stubAuthorisation('stripe', request)),
  id: 'stripe',
};
