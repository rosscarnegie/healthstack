/** Thrown when the PHI guard rejects an event in `enforce` mode. */
export class AuditPhiError extends Error {
  readonly violations: string[];

  constructor(message: string, violations: string[]) {
    super(message);
    this.name = 'AuditPhiError';
    this.violations = violations;
  }
}

/** Thrown / reported when one or more sinks fail to persist a record. */
export class AuditWriteError extends Error {
  readonly causes: unknown[];

  constructor(message: string, causes: unknown[]) {
    super(message);
    this.name = 'AuditWriteError';
    this.causes = causes;
  }
}
