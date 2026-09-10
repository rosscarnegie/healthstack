import { randomUUID } from 'node:crypto';

import { pinoHttp, type HttpLogger, type Options } from 'pino-http';
import type { Logger } from 'pino';

export interface HttpLoggerOptions {
  /** Base logger to derive per-request child loggers from. */
  logger: Logger;
  /** Request header carrying the per-request id (echoed back on the response). */
  requestIdHeader?: string;
  /** Request header carrying a cross-service correlation id. */
  correlationHeader?: string;
}

/**
 * Build an Express/Connect middleware that logs one line per completed request
 * and exposes a per-request child logger as `req.log`.
 *
 * - `4xx` logs at `warn`, `5xx` and thrown errors at `error`, redirects are
 *   dropped to `silent`, everything else `info`.
 * - Reuses an inbound request id / correlation id if present, otherwise mints a
 *   UUID, and always echoes the resolved id back on the response.
 */
export function createHttpLogger(opts: HttpLoggerOptions): HttpLogger {
  const requestIdHeader = opts.requestIdHeader ?? 'x-request-id';
  const correlationHeader = opts.correlationHeader ?? 'x-correlation-id';

  const options: Options = {
    logger: opts.logger,
    genReqId: (req, res) => {
      const raw = req.headers[requestIdHeader] ?? req.headers[correlationHeader];
      const inbound = Array.isArray(raw) ? raw[0] : raw;
      const id = inbound && inbound.length > 0 ? inbound : randomUUID();
      res.setHeader(requestIdHeader, id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      if (res.statusCode >= 300) return 'silent';
      return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  };

  return pinoHttp(options);
}
