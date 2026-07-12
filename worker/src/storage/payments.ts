import {
  type CanonicalRequest,
  type CanonicalResponse,
} from 'shared/canonical';

export const recordPaymentAttempt = async (
  database: D1Database,
  request: CanonicalRequest,
  response: Pick<CanonicalResponse, 'pspReference' | 'status'>,
): Promise<void> => {
  await database
    .prepare(
      `INSERT INTO payments (idempotency_key, psp, psp_reference, reference, amount, currency, status)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT (idempotency_key) DO UPDATE SET
         psp_reference = coalesce(excluded.psp_reference, payments.psp_reference),
         status = excluded.status,
         updated_at = datetime('now')
       WHERE payments.webhook_confirmed_at IS NULL`,
    )
    .bind(
      request.idempotencyKey,
      request.psp,
      response.pspReference ?? null,
      request.reference,
      request.amount,
      request.currency,
      response.status,
    )
    .run();
};
