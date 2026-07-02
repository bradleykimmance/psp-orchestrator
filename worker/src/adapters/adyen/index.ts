import { type PspAdapter } from '../types.ts';
import { adyenAuthorize } from './authorize.ts';

export const adyenAdapter: PspAdapter = {
  authorize: adyenAuthorize,
  id: 'adyen',
};
