import { type CanonicalRequest, type CanonicalResponse } from './canonical.ts';

const WORKER_URL =
  (import.meta.env.VITE_WORKER_URL as string | undefined) ??
  'http://localhost:8787';

export class PaymentError extends Error {
  readonly detail?: unknown;

  constructor(message: string, detail?: unknown) {
    super(message);
    this.name = 'PaymentError';
    this.detail = detail;
  }
}

const isCanonicalResponse = (value: unknown): value is CanonicalResponse =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  'rawResponse' in value;

// The Worker's 422 body is `{ error, issues: ZodIssue[] }`.
const firstValidationMessage = (body: unknown): string | undefined => {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('issues' in body) ||
    !Array.isArray(body.issues)
  ) {
    return undefined;
  }

  const [first] = body.issues;
  if (
    typeof first === 'object' &&
    first !== null &&
    'message' in first &&
    typeof first.message === 'string'
  ) {
    return first.message;
  }

  return undefined;
};

export const authorize = async (
  request: CanonicalRequest,
): Promise<CanonicalResponse> => {
  let response: Response;
  try {
    response = await fetch(WORKER_URL, {
      body: JSON.stringify(request),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });
  } catch (error) {
    throw new PaymentError('Could not reach the payments Worker.', error);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // 502s come back as a canonical error body; 4xx are genuine rejections.
    if (isCanonicalResponse(body)) {
      return body;
    }

    const validationMessage = firstValidationMessage(body);
    if (validationMessage !== undefined) {
      throw new PaymentError(validationMessage, body);
    }

    throw new PaymentError(
      `Worker rejected the request (${response.status}).`,
      body,
    );
  }

  if (!isCanonicalResponse(body)) {
    throw new PaymentError('Worker returned an unexpected payload.', body);
  }

  return body;
};
