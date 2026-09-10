# Data retention

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

Retention in healthcare is governed by **several overlapping regimes**, and they
answer different questions. Conflating them is the most common mistake.

| Question                                                                                                                               | Governed by                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| How long must I keep **HIPAA compliance documentation** (policies, risk analyses, BAAs, audit-log review records, breach assessments)? | HIPAA § 164.316(b)(2) — **6 years**                                                               |
| How long must I keep the **medical record** itself?                                                                                    | **State law** (primarily) and **CMS Conditions of Participation** for Medicare/Medicaid providers |
| How long must I keep **billing / claims** records?                                                                                     | CMS, the False Claims Act, payer contracts                                                        |
| How long must I keep **research** data?                                                                                                | The Common Rule, FDA, sponsor/IRB agreements, journal policies                                    |
| How long may I keep data under **data-minimization** principles?                                                                       | State privacy laws, GDPR (if applicable), the BAA, the purpose limitation                         |

The platform is (most likely) a **business associate**, so it retains data
**according to each tenant's instructions and its BAA**, not on its own
schedule — but it must be _capable_ of satisfying the strictest applicable
requirement and of deleting/returning data when the BAA ends.

---

## 1. HIPAA — documentation retention (§ 164.316(b)(2))

> A covered entity or business associate must **retain the documentation
> required by [the Security Rule] for 6 years from the date of its creation or
> the date when it last was in effect, whichever is later.**

Applies to Security Rule documentation: policies & procedures, the risk analysis,
risk-management decisions, sanction records, **information-system-activity-review
records**, contingency-plan tests, evaluations, and BAAs.

The Privacy Rule has a parallel 6-year requirement for its documentation
(§ 164.530(j)) — including **accounting-of-disclosures** records, which must
cover the **6 years prior to the request** (§ 164.528(a)).

**HIPAA does not set a medical-record retention period.** OCR guidance is
explicit on this — record retention is a matter of state law.

### Implication for audit logs

HIPAA requires audit _controls_ (§ 164.312(b)) but not a specific audit-log
retention period. However:

- Records of the **review** of system activity are § 164.316 documentation →
  **6 years**.
- To produce a § 164.528 accounting, disclosure records must be available for
  **6 years**.
- Breach investigations under § 164.402 can reach back years.

**Platform default: retain audit records for at least 6 years** in
write-once/immutable storage, longer where a tenant's BAA or state law requires.
See [`../security/audit-logging.md`](../security/audit-logging.md).

---

## 2. CMS Conditions of Participation — medical records

For hospitals participating in Medicare/Medicaid (42 CFR Part 482):

| Provider type                              | Citation                                                                      | Minimum retention                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Hospitals                                  | [42 CFR § 482.24(b)(1)](https://www.ecfr.gov/current/title-42/section-482.24) | **5 years** (or longer if state law requires)                         |
| Critical access hospitals                  | 42 CFR § 485.638(c)                                                           | **6 years** from last entry                                           |
| Psychiatric hospitals (additional records) | 42 CFR § 482.61                                                               | Per § 482.24                                                          |
| Long-term care facilities                  | 42 CFR § 483.70(i)(4)                                                         | **5 years**, or for a minor, until age of majority + the state period |
| Home health                                | 42 CFR § 484.110                                                              | **5 years** after discharge (per Medicare cost-reporting rules)       |

CMS also requires retention of **cost reports and supporting records** for
**5 years** after closure, and Medicare Advantage/Part D records for **10 years**
(42 CFR § 422.504(d), § 423.505(d)).

---

## 3. State medical-record law

There is no single number. Representative ranges (verify the current statute for
each state you operate in — this is illustrative, not authoritative):

- **Adults:** commonly **6–10 years** from the last encounter (e.g. many states
  use 6 or 7; some 10).
- **Minors:** typically the longer of the adult period **or** until the patient
  reaches the age of majority **plus** a number of years (often to age 21–28).
- **Specific record types:** X-rays/imaging, mammography (federal MQSA:
  generally 5 years, or 10 if no additional images at that facility), pathology
  slides, and immunization records often have their own periods.
- **Physicians vs. hospitals** may have different periods within the same state.

Design the platform to store a **per-tenant, per-record-type retention policy**
and to compute the effective retention as `max(all applicable minimums)` with an
explicit override for legal hold.

---

## 4. Other retention drivers

| Regime                                  | Typical period                                                         | Citation                      |
| --------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| False Claims Act (billing exposure)     | **6 years** (up to 10 with tolling)                                    | 31 U.S.C. §§ 3729–3731        |
| Common Rule (federally funded research) | **≥ 3 years** after study completion                                   | 45 CFR § 46.115(b)            |
| FDA clinical investigations             | **2 years** after approval / discontinuation                           | 21 CFR § 312.62(c), § 812.140 |
| OSHA employee medical/exposure records  | **duration of employment + 30 years**                                  | 29 CFR § 1910.1020            |
| 42 CFR Part 2 records                   | Per program policy + the 2024 rule's HIPAA-aligned documentation rules | 42 CFR Part 2                 |
| EU/UK GDPR (if applicable)              | No fixed period; "no longer than necessary" + storage-limitation       | GDPR Art. 5(1)(e)             |

---

## 5. Deletion, return, and legal hold

- **End of BAA.** § 164.504(e)(2)(ii)(J): at termination, the business associate
  must **return or destroy** all PHI if feasible, or if not feasible, extend the
  BAA's protections and limit further use. The platform must support a per-tenant
  **export + verified purge**.
- **Right to delete / data minimization.** State privacy laws and some contracts
  require deletion on request; reconcile against retention minimums and legal
  hold (retention generally wins for records within a mandated period).
- **Legal hold.** A litigation hold **suspends** all deletion for the covered
  scope, overriding retention schedules, until released. The platform needs a
  hold flag that blocks lifecycle deletion and is itself audited.
- **Crypto-shredding.** For encrypted stores, destroying the data-encryption key
  is an accepted destruction method (NIST SP 800-88) — useful where physical
  deletion from backups/immutable stores is impractical. Requires per-tenant or
  per-record key scoping — see [`../security/secrets-encryption.md`](../security/secrets-encryption.md).
- **Backups.** Retention and deletion must account for backup copies and
  immutable/WORM storage; document the maximum lag before a deletion propagates.

---

## 6. Platform implementation status

| Capability                                                     | Status                                         |
| -------------------------------------------------------------- | ---------------------------------------------- |
| Per-tenant, per-record-type retention policy model             | Planned                                        |
| Effective-retention computation (`max` of applicable minimums) | Planned                                        |
| Legal-hold flag (blocks deletion, audited)                     | Planned                                        |
| Audit-record retention ≥ 6 years, immutable                    | Design target; storage layer not yet built     |
| BAA-termination export + verified purge                        | Planned                                        |
| Crypto-shredding via per-tenant keys                           | Depends on KMS design — see secrets-encryption |
| Immutable raw store (append-only, content-addressed)           | Designed (see `.notes` / raw-data-storage)     |
