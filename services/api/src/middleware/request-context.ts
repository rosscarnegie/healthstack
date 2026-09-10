import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { runWithContext } from '@healthstack/logger';

/**
 * Establishes the per-request logging context for the rest of the pipeline:
 *
 * - reuses an inbound `x-correlation-id` (cross-service trace) or mints one
 * - mints a fresh `x-request-id` for this hop
 * - echoes both back on the response
 * - binds them into the AsyncLocalStorage context so `contextLogger()` and
 *   audit events pick them up automatically
 *
 * Must run before the HTTP logger and route handlers.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const inboundCorrelation = req.headers['x-correlation-id'];
  const correlationId =
    (Array.isArray(inboundCorrelation) ? inboundCorrelation[0] : inboundCorrelation) ??
    randomUUID();
  const requestId = randomUUID();

  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-correlation-id', correlationId);

  runWithContext({ requestId, correlationId }, () => {
    next();
  });
};
