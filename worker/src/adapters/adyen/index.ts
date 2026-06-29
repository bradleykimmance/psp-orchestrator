import { type PspAdapter } from '../../canonical.ts';
import { adyenAuthorize } from './authorize.ts';

export const adyenAdapter: PspAdapter = {
  authorize: adyenAuthorize,
  id: 'adyen',
};
