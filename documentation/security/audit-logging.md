# Audit logging

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

The platform keeps a **structured, tamper-evident, append-only audit trail** of
security-relevant activity — above all, activity that touches PHI. This is a
direct HIPAA Security Rule requirement, an ONC certification requirement, and the
evidentiary backbone of any future breach investigation or disclosure accounting.

**Implementation:** [`@healthstack/audit`](../../packages/audit/) (records,
hash chain, sinks, PHI guard) and [`@healthstack/logger`](../../packages/logger/)
(operational logs, redaction). Wired into the API in
[`services/api/src/config/audit.ts`](../../services/api/src/config/audit.ts) and
[`services/api/src/middleware/error-handler.ts`](../../services/api/src/middleware/error-handler.ts).

---

## 1. Requirements

| Source                                                                           | Requirement                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HIPAA § 164.312(b)** — Audit controls (Required)                               | _"Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information."_                                                                                                                   |
| **HIPAA § 164.308(a)(1)(ii)(D)** — Information system activity review (Required) | _"Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports."_                                                                                                                                      |
| **HIPAA § 164.308(a)(5)(ii)(C)** — Log-in monitoring (Addressable)               | Monitoring log-in attempts and reporting discrepancies.                                                                                                                                                                                                                                               |
| **HIPAA § 164.312(c)(1)** — Integrity (Required)                                 | Protect ePHI (and, by extension, the audit records about it) from improper alteration or destruction.                                                                                                                                                                                                 |
| **HIPAA § 164.528** — Accounting of disclosures                                  | Individuals may request an accounting of certain disclosures for the **6 years** prior to the request.                                                                                                                                                                                                |
| **HIPAA § 164.316(b)**                                                           | Retain activity-review documentation for **6 years**.                                                                                                                                                                                                                                                 |
| **ONC § 170.315(d)(2)** — Auditable events and tamper-resistance                 | Record specified events (incl. additions, deletions, changes to user privileges, print, query for records, audit-log status changes); the log must be **tamper-resistant**; the ability to disable auditing must be restricted. Default: the audit log is **on and cannot be disabled** by end users. |
| **ONC § 170.315(d)(3)** — Audit report(s)                                        | Generate a human-readable audit report for a specific time period and sort by the recorded data elements.                                                                                                                                                                                             |
| **ONC § 170.315(d)(10)** — Auditing actions on health information                | Record actions related to health information (create, modify, access, delete) and whether the action succeeded.                                                                                                                                                                                       |
| **ASTM E2147**                                                                   | Content specification for audit and disclosure logs in health information systems — the basis for the ONC criteria, including logging of **disclosures**.                                                                                                                                             |
| **NIST SP 800-92**                                                               | _Guide to Computer Security Log Management_ — generation, transmission, storage, analysis, disposal.                                                                                                                                                                                                  |
| **NIST SP 800-66r2**                                                             | Maps the above into practical Security Rule implementation.                                                                                                                                                                                                                                           |

---

## 2. What gets recorded

Every record is a structured [`AuditRecord`](../../packages/audit/src/types.ts),
shaped after **FHIR `AuditEvent`** and **IHE ATNA** (RFC 3881). For any audited
action the trail answers:

| Question         | Field(s)                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **Who**          | `actor.id` (stable identifier — never a name), `actor.type`, `actor.roles`, `actor.requestor`       |
| **What**         | `category`, `subtype`, `action` (`create` / `read` / `update` / `delete` / `execute`)               |
| **Which record** | `entities[]` (`type`, `id`, `securityLabels`, `lifecycle`), `patientId`, `tenantId`                 |
| **When**         | `recordedAt` (ISO-8601 UTC, set by the recorder, not the caller)                                    |
| **Where from**   | `actor.network.address`, `source.service`, `source.hostname`, `source.environment`, `source.siteId` |
| **Why**          | `purposeOfUse` (treatment / payment / operations / research / …), `outcomeDescription`              |
| **Result**       | `outcome` (`success` / `minor-failure` / `serious-failure` / `major-failure`)                       |
| **Correlation**  | `requestId`, `correlationId` (join to operational logs and traces)                                  |
| **Integrity**    | `sequence`, `previousHash`, `hash`, `schemaVersion`                                                 |

### Event categories (minimum set)

- `authentication` — login, logout, token issue/refresh, MFA challenge, failure,
  lockout
- `authorization` — access granted/denied, scope/role evaluation, break-glass
  invocation
- `phi.access` — read/search/export of a resource carrying a `PHI` security label
- `phi.mutation` — create / amend / delete of PHI (with before/after **metadata**,
  never values)
- `disclosure` — release of PHI outside the platform boundary (feeds § 164.528)
- `administration` — user/role/privilege changes, configuration changes
- `security` — audit subsystem status, integrity-check results, suspected tampering
- `information-blocking.exception` — a decision to withhold EHI and the exception relied on

### What is **never** in an audit record

PHI **values**: no names, MRNs, dates of birth, SSNs, addresses, contact details,
clinical notes, or free-text. Records carry logical identifiers and codes only.
The [`scanForPhi`](../../packages/audit/src/phi-guard.ts) tripwire enforces this —
`enforce` mode (reject) in dev/test/staging, `warn` mode (record + alert) in
production so a real access event is never lost.

---

## 3. Tamper-evidence

Each record includes `previousHash` (the SHA-256 `hash` of the prior record) and
its own `hash` over the record's canonical form. This forms a **hash chain**:
altering or deleting any record breaks every subsequent link.
[`verifyChain()`](../../packages/audit/src/hash-chain.ts) walks a slice and
reports the first break and why (`previous-hash-mismatch` vs
`content-hash-mismatch`). `sequence` is monotonic per process, so **gaps** are
detectable even if records are removed wholesale.

This is defence-in-depth on top of, not a replacement for:

- **Write-once / immutable storage** for the durable audit store (object-lock /
  WORM), with restricted delete permissions.
- **Ship off-box quickly** — the local process only holds records long enough to
  hand them to a sink; the system of record is external so a compromised service
  cannot rewrite history.
- **Separation of duties** — the audit store is administered separately from the
  services it audits.
- Roadmap: periodic **checkpoint signing** (sign the head hash on a schedule with
  a key the services do not hold) and cross-node chain reconciliation.

---

## 4. Delivery guarantees

`AuditLogger` writes to one or more [`AuditSink`s](../../packages/audit/src/sinks/).
A resolved `write()` is treated as a durability hand-off.

- **Fail-closed** (default in `staging` / `production`): if a sink write fails,
  `record()` rejects so the calling operation can be **aborted**. Under
  § 164.312(b), if you cannot log that a chart was read, you should not read the
  chart.
- **Fail-open** (`development` only): the operation proceeds; the failure is
  reported via `onError`.
- The default `StdoutAuditSink` emits one JSON line per record tagged
  `logType: "audit"` for the platform log pipeline to route to the durable store.
  It is pinned to `info` and is **not** silenced by `LOG_LEVEL`.

---

## 5. Retention

Default: **≥ 6 years**, immutable, longer where a tenant's BAA or applicable
state law requires. Rationale in [`../compliance/data-retention.md`](../compliance/data-retention.md):
activity-review records and the § 164.528 accounting window both reach 6 years,
and breach investigations can reach further. Audit records are **not** subject to
a "right to delete" — they are the compliance record.

---

## 6. Review

§ 164.308(a)(1)(ii)(D) requires **regular review**, not just collection. Target
process (org + tooling):

- Automated detection: failed-login bursts, after-hours access, access to a
  patient sharing the actor's surname/address ("self/family/VIP snooping"),
  bulk export volume anomalies, break-glass usage, audit integrity failures.
- Scheduled human review of the automated findings, with the review itself
  recorded (that record is § 164.316 documentation → 6 years).
- Audit reports (§ 170.315(d)(3)): per-patient access history, per-user activity,
  per-time-window, sortable by any recorded element.

---

## 7. Operational logs vs. audit records

|                          | Operational log (`@healthstack/logger`)       | Audit record (`@healthstack/audit`)          |
| ------------------------ | --------------------------------------------- | -------------------------------------------- |
| Purpose                  | Debugging, performance, ops                   | Compliance, forensics, disclosure accounting |
| Silenced by `LOG_LEVEL`? | Yes                                           | **No**                                       |
| Retention                | Short (days–weeks)                            | **≥ 6 years**, immutable                     |
| Contains identifiers?    | Codes/ids only; PHI-field redaction always on | Logical ids only; PHI guard enforced         |
| Integrity                | Best-effort                                   | Hash-chained, tamper-evident                 |
| Join key                 | `requestId` / `correlationId`                 | same                                         |

Both are needed; neither substitutes for the other.

---

## 8. Open items

- Durable immutable sink (object-lock store) — not yet built.
- Checkpoint signing of the chain head.
- Audit report generator (§ 170.315(d)(3)).
- Automated anomaly detection rules.
- `disclosure` event coverage for every external egress path.
- Per-tenant retention override wiring.
