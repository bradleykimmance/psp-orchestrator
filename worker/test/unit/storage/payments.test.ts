import { recordPaymentAttempt } from '../../../src/storage/payments.ts';
import { basicRequest } from '../../helpers.ts';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const paymentRow = (idempotencyKey: string) =>
  env.paymentsDB
    .prepare('SELECT * FROM payments WHERE idempotency_key = ?1')
    .bind(idempotencyKey)
    .first();

const paymentCount = async (idempotencyKey: string): Promise<unknown> => {
  const row = await env.paymentsDB
    .prepare(
      'SELECT count(*) AS total FROM payments WHERE idempotency_key = ?1',
    )
    .bind(idempotencyKey)
    .first();
  return row?.total;
};

describe('recordPaymentAttempt', () => {
  it('inserts a payment row with the canonical outcome', async () => {
    const request = basicRequest({ idempotencyKey: crypto.randomUUID() });

    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: 'pi_persist',
      status: 'authorised',
    });

    expect(await paymentRow(request.idempotencyKey)).toMatchObject({
      amount: 4_200,
      currency: 'GBP',
      idempotency_key: request.idempotencyKey,
      psp: 'stripe',
      psp_reference: 'pi_persist',
      reference: 'ORD-123',
      status: 'authorised',
      webhook_confirmed_at: null,
    });
  });

  it('updates the existing row instead of duplicating when a key is replayed', async () => {
    const request = basicRequest({ idempotencyKey: crypto.randomUUID() });

    // First attempt died with an unknown outcome; the retry authorised.
    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: null,
      status: 'error',
    });
    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: 'pi_retry',
      status: 'authorised',
    });

    expect(await paymentCount(request.idempotencyKey)).toBe(1);
    expect(await paymentRow(request.idempotencyKey)).toMatchObject({
      psp_reference: 'pi_retry',
      status: 'authorised',
    });
  });

  it('keeps the stored psp reference when a replay arrives without one', async () => {
    const request = basicRequest({ idempotencyKey: crypto.randomUUID() });

    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: 'pi_kept',
      status: 'authorised',
    });
    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: null,
      status: 'error',
    });

    expect(await paymentRow(request.idempotencyKey)).toMatchObject({
      psp_reference: 'pi_kept',
      status: 'error',
    });
  });

  it('never overwrites a webhook-confirmed row from the sync path', async () => {
    const request = basicRequest({ idempotencyKey: crypto.randomUUID() });

    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: 'pi_confirmed',
      status: 'authorised',
    });
    // Simulate the async truth arriving (the webhook route lands in PR 3).
    await env.paymentsDB
      .prepare(
        "UPDATE payments SET webhook_confirmed_at = datetime('now') WHERE idempotency_key = ?1",
      )
      .bind(request.idempotencyKey)
      .run();

    await recordPaymentAttempt(env.paymentsDB, request, {
      pspReference: null,
      status: 'error',
    });

    expect(await paymentRow(request.idempotencyKey)).toMatchObject({
      psp_reference: 'pi_confirmed',
      status: 'authorised',
    });
  });
});
