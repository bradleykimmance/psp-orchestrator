import { type Environment } from '../../environment.ts';
import { type StripePaymentIntentRequest } from './schemas.ts';

type FormValue = boolean | number | string | { [key: string]: FormValue };

const toFormEntries = (
  value: FormValue,
  prefix = '',
): Array<[key: string, value: string]> => {
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nested]) =>
      toFormEntries(nested, prefix === '' ? key : `${prefix}[${key}]`),
    );
  }

  return [[prefix, String(value)]];
};

export const stripePost = async (
  environment: Environment,
  path: string,
  body: StripePaymentIntentRequest,
): Promise<{ ok: boolean; raw: unknown }> => {
  // Stripe is form post, change encoding here from json to form
  const response = await fetch(`${environment.STRIPE_API_URL}${path}`, {
    body: new URLSearchParams(toFormEntries(body)).toString(),
    headers: {
      authorization: `Bearer ${environment.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
  const raw: unknown = await response.json();
  return { ok: response.ok, raw };
};
