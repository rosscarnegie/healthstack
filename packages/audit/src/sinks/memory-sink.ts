import type { AuditRecord } from '../types.js';
import type { AuditSink } from './types.js';

/**
 * Keeps records in an in-process array. For tests and local assertions only —
 * never durable.
 */
export class InMemoryAuditSink implements AuditSink {
  readonly name = 'memory';

  readonly records: AuditRecord[] = [];

  async write(record: AuditRecord): Promise<void> {
    this.records.push(record);
  }

  clear(): void {
    this.records.length = 0;
  }
}
