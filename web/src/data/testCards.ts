import { type Psp } from '../lib/canonical.ts';

// Public sandbox test cards from the Stripe/Adyen docs. Not real PANs.
export type TestCard = {
  cvc: string;
  expect: 'authorised' | 'refused';
  // MMYY, e.g. '1227'.
  expiry: string;
  label: string;
  number: string;
  // 'both' works on either sandbox.
  worksWith: 'both' | Psp;
};

export const TEST_CARDS: TestCard[] = [
  {
    cvc: '123',
    expect: 'authorised',
    expiry: '1227',
    label: 'Visa - approved',
    number: '4242424242424242',
    worksWith: 'both',
  },
  {
    cvc: '737',
    expect: 'authorised',
    expiry: '0330',
    label: 'Mastercard - approved',
    number: '5555555555554444',
    worksWith: 'both',
  },
  {
    cvc: '123',
    expect: 'refused',
    expiry: '1227',
    label: 'Visa - declined',
    number: '4000000000000002',
    worksWith: 'both',
  },
];

export const DEFAULT_TEST_CARD = TEST_CARDS[0];
