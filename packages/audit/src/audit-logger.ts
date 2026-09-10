import { hostname } from 'node:os';

import { GENESIS_HASH, hashRecord } from './hash-chain.js';
import { AuditPhiError, AuditWriteError } from './errors.js';
import { scanForPhi } from './phi-guard.js';
import { StdoutAuditSink } from './sinks/stdout-sink.js';
import type { AuditSink } from './sinks/types.js';
import type { AuditEventInput, AuditRecord, AuditSource } from './types.js';

export const AUDIT_SCHEMA_VERSION = '1.0.0';

/**
 * - `enforce`: reject events that trip the PHI guard (use in dev/test/staging).
 * - `warn`: record the event anyway but report the violation (use in production
 *   so a real access is never lost, but the incident is surfaced).
 * - `off`: skip scanning.
 */
export type PhiGuardMode = 'enforce' | 'warn' | 'off';

/**
 * - `fail-closed`: if any sink write fails, `record()` rejects so the caller can
 *   abort the operation. Required for PHI-access auditing under HIPAA
 *   §164.312(b) — you may not read a chart if you cannot log that you did.
 * - `fail-open`: `record()` resolves; failures are surfaced via `onError` only.
 */
export type WriteFailureMode = 'fail-closed' | 'fail-open';

export interface AuditLoggerOptions {
  /** Recording service name. */
  service: string;
  /** Deployment environment (`development` | `test` | `staging` | `production`). */
  environment: string;
  version?: string;
  siteId?: string;
  /** Destinations. Defaults to a single {@link StdoutAuditSink}. */
  sinks?: AuditSink[];
  /** Default `fail-closed`. */
  onWriteFailure?: WriteFailureMode;
  /** Default `enforce`. */
  phiGuard?: PhiGuardMode;
  /** Reports async problems (write failures, PHI warnings) out of band. */
  onError?: (error: Error, record?: AuditRecord) => void;
  /** Injectable clock for tests. */
  clock?: () => Date;
}

/**
 * Records healthcare audit events to one or more sinks, maintaining a
 * per-process hash chain so that tampering with (or gaps in) the audit stream
 * are detectable after the fact.
 */
export class AuditLogger {
  private readonly source: AuditSource;
  private readonly sinks: AuditSink[];
  private readonly onWriteFailure: WriteFailureMode;
  private readonly phiGuard: PhiGuardMode;
  private readonly onError: ((error: Error, record?: AuditRecord) => void) | undefined;
  private readonly clock: () => Date;

  private sequence = 0;
  private previousHash = GENESIS_HASH;

  constructor(options: AuditLoggerOptions) {
    this.source = {
      service: options.service,
      environment: options.environment,
      hostname: hostname(),
      ...(options.version === undefined ? {} : { version: options.version }),
      ...(options.siteId === undefined ? {} : { siteId: options.siteId }),
    };
    this.sinks =
      options.sinks && options.sinks.length > 0 ? options.sinks : [new StdoutAuditSink()];
    this.onWriteFailure = options.onWriteFailure ?? 'fail-closed';
    this.phiGuard = options.phiGuard ?? 'enforce';
    this.onError = options.onError;
    this.clock = options.clock ?? (() => new Date());
  }

  /**
   * Record an audit event. Resolves with the persisted record (including its
   * chain hash). Rejects if the PHI guard is in `enforce` mode and trips, or if
   * a sink write fails while `onWriteFailure` is `fail-closed`.
   */
  async record(input: AuditEventInput): Promise<AuditRecord> {
    if (this.phiGuard !== 'off') {
      const scan = scanForPhi(input);
      if (!scan.ok) {
        const message = `audit event "${input.category}" may contain PHI: ${scan.violations.join('; ')}`;
        if (this.phiGuard === 'enforce') {
          throw new AuditPhiError(message, scan.violations);
        }
        this.onError?.(new AuditPhiError(message, scan.violations));
      }
    }

    // Everything from here to `this.previousHash = hash` is synchronous, so the
    // chain is updated atomically even under concurrent callers.
    const sequence = (this.sequence += 1);
    const unsigned = {
      ...input,
      schemaVersion: AUDIT_SCHEMA_VERSION,
      recordedAt: this.clock().toISOString(),
      sequence,
      previousHash: this.previousHash,
      source: this.source,
      logType: 'audit' as const,
    };
    const hash = hashRecord(unsigned);
    this.previousHash = hash;

    const record: AuditRecord = { ...unsigned, hash };

    await this.deliver(record);
    return record;
  }

  /** Flush all sinks that support it. Call during graceful shutdown. */
  async flush(): Promise<void> {
    await Promise.allSettled(this.sinks.map((sink) => sink.flush?.()));
  }

  private async deliver(record: AuditRecord): Promise<void> {
    const results = await Promise.allSettled(this.sinks.map((sink) => sink.write(record)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    if (failures.length === 0) return;

    const error = new AuditWriteError(
      `audit write failed for ${failures.length}/${this.sinks.length} sink(s)`,
      failures.map((f) => f.reason),
    );
    this.onError?.(error, record);

    if (this.onWriteFailure === 'fail-closed') {
      throw error;
    }
  }
}
