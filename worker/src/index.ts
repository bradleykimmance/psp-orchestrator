import { adapters } from './adapters';
import { type Environment } from './environment.ts';
import { logError, logInfo } from './log.ts';
import { CanonicalRequestSchema } from 'shared/canonical';

const corsHeaders = (environment: Environment): Record<string, string> => ({
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-origin': environment.ALLOWED_ORIGIN,
});

const json = (
  body: unknown,
  status: number,
  headers: Record<string, string>,
): Response => Response.json(body, { headers, status });

// Validate, pick the adapter, return its canonical response.
export default {
  fetch: async (
    request: Request,
    environment: Environment,
  ): Promise<Response> => {
    const cors = corsHeaders(environment);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors, status: 204 });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Request body must be valid JSON' }, 400, cors);
    }

    const parsed = CanonicalRequestSchema.safeParse(payload);
    if (!parsed.success) {
      logError('Invalid request payload', {
        issues: parsed.error.issues.length,
      });
      return json(
        { error: 'Validation failed', issues: parsed.error.issues },
        422,
        cors,
      );
    }

    const adapter = adapters[parsed.data.psp];
    try {
      const result = await adapter.authorize(parsed.data, environment);

      logInfo('Authorize result', {
        idempotencyKey: parsed.data.idempotencyKey,
        psp: parsed.data.psp,
        pspReference: result.pspReference ?? null,
        reference: parsed.data.reference,
        status: result.status,
      });

      return json(result, 200, cors);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logError('Authorize failed', {
        idempotencyKey: parsed.data.idempotencyKey,
        message,
        psp: parsed.data.psp,
        reference: parsed.data.reference,
      });

      return json(
        {
          pspReference: null,
          rawResponse: { message },
          status: 'error',
        },
        502,
        cors,
      );
    }
  },
} satisfies ExportedHandler<Environment>;
