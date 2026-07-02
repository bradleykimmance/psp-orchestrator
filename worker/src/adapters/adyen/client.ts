import { type Environment } from '../../environment.ts';
import { type AdyenPaymentRequest } from './schemas.ts';

export const adyenPost = async (
  environment: Environment,
  path: string,
  body: AdyenPaymentRequest,
): Promise<{ ok: boolean; raw: unknown }> => {
  const response = await fetch(`${environment.ADYEN_API_URL}${path}`, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-api-key': environment.ADYEN_API_KEY,
    },
    method: 'POST',
  });

  const text = await response.text();
  try {
    return { ok: response.ok, raw: JSON.parse(text) };
  } catch {
    return { ok: response.ok, raw: { rawBody: text } };
  }
};
