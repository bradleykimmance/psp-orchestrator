// Worker bindings. *_KEY / *_ACCOUNT are secrets (wrangler secret put); the rest
// are non-secret vars from wrangler.jsonc.
export type Environment = {
  ADYEN_API_KEY: string;
  ADYEN_API_URL: string;
  ADYEN_MERCHANT_ACCOUNT: string;
  ALLOWED_ORIGIN: string;
  paymentsDB: D1Database;
  STRIPE_API_URL: string;
  STRIPE_SECRET_KEY: string;
};
