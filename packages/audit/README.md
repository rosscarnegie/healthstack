# @healthstack/audit

Production-grade, tamper-evident audit logging for HealthStack.

Audit records are modeled around FHIR AuditEvent and IHE ATNA concepts. The goal is to maintain a reliable history of security-sensitive activity, particularly actions involving protected health information (PHI).

For any audited action, we should be able to determine:

- Who performed the action
- what they did,
- which resource was affected,
- when it happened,
- where the request came from,
- why the action was performed,
- whether it succeeded.

## Design rules

1. **Metadata only, never PHI.** Records carry logical identifiers
   (`patientId`, `entities[].id`), counts, outcomes — never names, MRNs, dates
   of birth, or clinical free-text. A `scanForPhi` tripwire enforces this
   (`enforce` mode in dev/test/staging, `warn` in production).
2. **Append-only + hash-chained.** Each record includes `previousHash` and a
   SHA-256 `hash` of its own canonical form. `verifyChain()` detects tampering
   or gaps. Sequence numbers are monotonic per process.
3. **Fail-closed by default.** If a sink write fails, `record()` rejects so the
   caller can abort — under HIPAA §164.312(b) you may not read a chart if you
   cannot log that you did. Set `onWriteFailure: 'fail-open'` only where that
   trade-off is acceptable.
4. **Routable.** Every line is tagged `logType: "audit"` so the platform's log
   pipeline can ship it to the immutable, 6-year-retention audit store.

## Usage

```ts
import { AuditLogger, actorFromRequest } from '@healthstack/audit';

const audit = new AuditLogger({
  service: 'healthstack-api',
  environment: 'production',
  version: '1.4.0',
});

// PHI read
await audit.record({
  category: 'phi.access',
  subtype: 'patient.read',
  action: 'read',
  outcome: 'success',
  actor: actorFromRequest(req),
  tenantId: 'blue-ridge-health-alliance',
  patientId: 'pat-000123',
  purposeOfUse: 'treatment',
  entities: [{ type: 'Patient', id: 'pat-000123', securityLabels: ['PHI'], lifecycle: 'access' }],
  requestId: req.id,
});
```

### Sinks

| sink                | use                                               |
| ------------------- | ------------------------------------------------- |
| `StdoutAuditSink`   | default — JSON line to stdout, `logType: "audit"` |
| `InMemoryAuditSink` | tests / assertions                                |

Implement `AuditSink` to add a database, Kafka topic, WORM bucket, etc. A
resolved `write()` promise is treated as a durability guarantee.

### Verifying the chain

```ts
import { verifyChain } from '@healthstack/audit';

const result = verifyChain(recordsInOrder);
if (!result.valid) {
  // result.brokenAt, result.reason
}
```
