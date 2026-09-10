import { AuditLogger } from '@healthstack/audit';

import { env } from './env.js';
import { logger } from './logger.js';

const deployed = env.ENVIRONMENT === 'staging' || env.ENVIRONMENT === 'production';

/**
 * Process-wide audit logger.
 *
 * - Deployed environments (`staging`, `production`) fail **closed**: if the
 *   audit record cannot be written, the operation that triggered it should be
 *   aborted rather than proceed unlogged.
 * - `production` runs the PHI guard in `warn` mode (never drop a real access
 *   event); everywhere else it runs in `enforce` mode so leaks fail tests.
 * - Uses the default {@link import('@healthstack/audit').StdoutAuditSink}: audit
 *   lines are emitted as JSON tagged `logType: "audit"` for the log pipeline to
 *   route to the immutable audit store.
 */
export const audit = new AuditLogger({
  service: env.SERVICE_NAME,
  environment: env.ENVIRONMENT,
  ...(env.APP_VERSION ? { version: env.APP_VERSION } : {}),
  ...(env.SITE_ID ? { siteId: env.SITE_ID } : {}),
  onWriteFailure: deployed ? 'fail-closed' : 'fail-open',
  phiGuard: env.ENVIRONMENT === 'production' ? 'warn' : 'enforce',
  onError: (error, record) => {
    logger.error({ err: error, auditSequence: record?.sequence }, 'audit subsystem error');
  },
});
