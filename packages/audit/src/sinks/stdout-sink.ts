import { createLogger, type Logger } from '@healthstack/logger';

import type { AuditRecord } from '../types.js';
import type { AuditSink } from './types.js';

/**
 * Writes each audit record as a single JSON line to stdout, tagged
 * `logType: "audit"` so the platform's log pipeline can route it to the
 * immutable, long-retention audit store (HIPAA requires 6 years).
 *
 * Notes:
 * - Always JSON, never pretty-printed, even in development — audit output must
 *   stay machine-parseable.
 * - The underlying logger is pinned to `info` and is **not** affected by
 *   `LOG_LEVEL`; audit records must never be silenced.
 */
export class StdoutAuditSink implements AuditSink {
  readonly name = 'stdout';

  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger =
      logger ??
      createLogger({
        service: 'audit',
        level: 'info',
        pretty: false,
        base: { logType: 'audit' },
      });
  }

  async write(record: AuditRecord): Promise<void> {
    this.logger.info(
      { audit: record },
      `audit ${record.category}${record.subtype ? `/${record.subtype}` : ''} ${record.action} ${record.outcome}`,
    );
  }
}
