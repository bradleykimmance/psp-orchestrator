import { type PspAdapter } from '../../canonical.ts';
import { stripeAuthorize } from './authorize.ts';

export const stripeAdapter: PspAdapter = {
  authorize: stripeAuthorize,
  id: 'stripe',
};
