import { type PspAdapter } from '../types.ts';
import { stripeAuthorize } from './authorize.ts';

export const stripeAdapter: PspAdapter = {
  authorize: stripeAuthorize,
  id: 'stripe',
};
