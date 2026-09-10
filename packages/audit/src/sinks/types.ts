import type { AuditRecord } from '../types.js';

/**
 * A destination for audit records. Implementations must be append-only and
 * should treat a resolved promise as a durability guarantee (the record is
 * safely persisted / handed off). Reject to signal the {@link AuditLogger} that
 * the write failed so it can fail closed.
 */
export interface AuditSink {
  readonly name: string;
  write(record: AuditRecord): Promise<void>;
  /** Flush any buffered records. Called on graceful shutdown. */
  flush?(): Promise<void>;
}
