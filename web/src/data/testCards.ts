import { type Psp } from 'shared/psps';

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
    worksWith: 'stripe',
  },
  {
    cvc: '123',
    expect: 'authorised',
    expiry: '1227',
    label: 'Mastercard - approved',
    number: '5555555555554444',
    worksWith: 'stripe',
  },
  {
    cvc: '1234',
    expect: 'authorised',
    expiry: '1227',
    label: 'Amex - approved',
    number: '378282246310005',
    worksWith: 'stripe',
  },
  {
    cvc: '737',
    expect: 'authorised',
    expiry: '0330',
    label: 'Visa - approved',
    number: '4111111111111111',
    worksWith: 'adyen',
  },
  {
    cvc: '737',
    expect: 'authorised',
    expiry: '0330',
    label: 'Mastercard - approved',
    number: '5555444433331111',
    worksWith: 'adyen',
  },
  {
    cvc: '7373',
    expect: 'authorised',
    expiry: '0330',
    label: 'Amex - approved',
    number: '370000000000002',
    worksWith: 'adyen',
  },
  {
    cvc: '737',
    expect: 'refused',
    expiry: '0330',
    label: 'Visa - declined',
    number: '4000000000000002',
    worksWith: 'both',
  },
];

export const DEFAULT_TEST_CARD = TEST_CARDS[0];
