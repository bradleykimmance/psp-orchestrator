import {
  type CanonicalRequest,
  type CanonicalResponse,
  type Psp,
} from '../canonical.ts';

// Stub: returns a fake auth response until real api calls setup
export const stubAuthorisation = (
  psp: Psp,
  request: CanonicalRequest,
): CanonicalResponse => ({
  pspReference: `${psp}_stub_${request.reference}`,
  rawResponse: {
    note: 'Stubbed response - no live PSP call yet',
    psp,
    reference: request.reference,
  },
  status: 'authorised',
});
