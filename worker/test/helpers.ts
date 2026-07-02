import { type Environment } from '../src/environment.ts';
import { type CanonicalRequest } from 'shared/canonical';

export const basicRequest = (
  overrides?: Partial<CanonicalRequest>,
): CanonicalRequest => {
  const body = {
    amount: 4_200,
    card: {
      cvc: '123',
      expiry: '1227',
      name: 'Brad Test',
      number: '4242424242424242',
    },
    currency: 'GBP',
    psp: 'stripe' as const,
    reference: 'ORD-123',
  };

  return { ...body, ...overrides };
};

export const unitTestEnvironment = {
  ADYEN_API_KEY: 'Adyen_test_key',
  ADYEN_API_URL: 'https://checkout-test.adyen.com/v71',
  ADYEN_MERCHANT_ACCOUNT: 'SandboxMerchantECOM',
  ALLOWED_ORIGIN: '*',
  STRIPE_API_URL: 'https://api.stripe.com/v1',
  STRIPE_SECRET_KEY: 'sk_test_123',
} satisfies Environment;
