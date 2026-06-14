import { type PspAdapter } from '../canonical.ts';
import { stubAuthorisation } from './stub.ts';

// Adyen adapter. Stubbed until the real /payments call is wired in.
export const adyenAdapter: PspAdapter = {
  authorize: (request) => Promise.resolve(stubAuthorisation('adyen', request)),
  id: 'adyen',
};
