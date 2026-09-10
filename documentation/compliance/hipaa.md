# HIPAA

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

**Statute:** Health Insurance Portability and Accountability Act of 1996,
Pub. L. 104–191.
**Regulations:** 45 CFR Parts 160, 162, and 164 ([eCFR Part 164](https://www.ecfr.gov/current/title-45/part-164)).
**Regulator:** HHS Office for Civil Rights (OCR) — [hhs.gov/hipaa](https://www.hhs.gov/hipaa).
**Major amendment:** HITECH Act (Pub. L. 111–5, 2009); HIPAA Omnibus Rule,
78 FR 5566 (Jan 25, 2013).

---

## 1. Does HIPAA apply, and in what role?

HIPAA regulates **covered entities** (health plans, health care clearinghouses,
and health care providers who transmit health information electronically in
connection with a covered transaction — 45 CFR § 160.103) and their **business
associates** (a person or entity that creates, receives, maintains, or transmits
PHI _on behalf of_ a covered entity — § 160.103).

For a platform like this one:

- If it processes identifiable health data **on behalf of** covered entities
  (the "tenants" — e.g. _Blue Ridge Health Alliance_), it is almost certainly a
  **business associate**, and its subcontractors are business associates too
  (§ 160.103, § 164.308(b), § 164.502(e)(1)(ii)).
- A **Business Associate Agreement (BAA)** is required before receiving PHI
  (§ 164.502(e), § 164.504(e)). HITECH made business associates **directly
  liable** for the Security Rule and for parts of the Privacy Rule
  (§ 164.104, § 164.306).
- A platform that only ever handles **de-identified** data (§ 164.514(a)–(c)) is
  outside HIPAA for that data — but the bar for de-identification is high; see
  [`phi-handling.md`](phi-handling.md).

**Protected Health Information (PHI)** = individually identifiable health
information held or transmitted by a covered entity or business associate, in any
form (§ 160.103). **Electronic PHI (ePHI)** is the subset in electronic media and
is what the Security Rule governs.

---

## 2. The Privacy Rule — 45 CFR Part 164, Subparts A & E

Governs **uses and disclosures** of PHI and gives individuals rights over their
information. A business associate may use/disclose PHI only as its BAA permits and
as the Rule allows.

Load-bearing provisions for platform design:

| Provision                        | Citation                                                                                                | Design impact                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Minimum necessary**            | § 164.502(b), § 164.514(d)                                                                              | Requests, queries, API scopes, and internal service-to-service calls must be limited to the minimum PHI needed for the purpose. Drives FHIR search scoping, role-based data filtering, column-level access.                        |
| **Permitted uses & disclosures** | § 164.502, § 164.506 (treatment, payment, operations), § 164.512 (required by law, public health, etc.) | The platform must distinguish and record the _purpose of use_ of an access — see `purposeOfUse` in [`packages/audit`](../../packages/audit/src/types.ts).                                                                          |
| **Right of access**              | § 164.524                                                                                               | Individuals can get a copy of PHI in a designated record set, in the form/format requested if readily producible, within 30 days. Feeds the "designated record set" concept and the patient-facing API.                            |
| **Right to amend**               | § 164.526                                                                                               | Amendments must be linkable to the original — the raw store is immutable and append-only; amendments are new versions with provenance.                                                                                             |
| **Accounting of disclosures**    | § 164.528                                                                                               | Individuals can request a list of certain disclosures over the prior 6 years. The audit trail must capture disclosures with enough structure to produce this — see [`../security/audit-logging.md`](../security/audit-logging.md). |
| **Notice of Privacy Practices**  | § 164.520                                                                                               | A covered-entity obligation; the platform supports it by tracking consents/authorizations.                                                                                                                                         |
| **Authorizations**               | § 164.508                                                                                               | Uses/disclosures not otherwise permitted require a valid authorization (most marketing, most research absent a waiver).                                                                                                            |

---

## 3. The Security Rule — 45 CFR Part 164, Subparts A & C (§§ 164.302–318)

Applies to **ePHI**. It is deliberately **technology-neutral and scalable**
(§ 164.306(b)): a regulated entity chooses controls reasonable and appropriate for
its size, complexity, and risk. Specifications are marked **"Required"** or
**"Addressable"** — _addressable does not mean optional_; it means implement it,
or document why an equivalent alternative (or no control) is reasonable and
appropriate (§ 164.306(d)).

> **Watch:** the NPRM at **90 FR 898 (Jan 6, 2025)** proposes to **eliminate the
> Required/Addressable distinction** (all specifications become required) and to
> mandate specific controls — MFA, encryption at rest and in transit, network
> segmentation, asset inventory + network map, 6-month vulnerability scans,
> 12-month penetration tests, annual compliance audits, and a 72-hour recovery
> objective for critical systems. Proposed, not final.

### 3.1 Risk analysis is the foundation

§ 164.308(a)(1)(ii)(A) requires an **accurate and thorough assessment** of risks
and vulnerabilities to ePHI, and § 164.308(a)(1)(ii)(B) requires risk
**management** to reduce them to a reasonable level. Everything else is downstream
of a real risk analysis. NIST SP 800-66 Rev. 2 and the HHS **Security Risk
Assessment (SRA) Tool** are the standard aids.

### 3.2 Safeguards, mapped to this codebase

**Administrative safeguards — § 164.308**

| Standard / spec                                                                                                             | Citation        | R/A          | Status here                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Security management process — risk analysis, risk management, sanction policy, information system activity review           | § 164.308(a)(1) | Required     | Activity review supported by the audit trail; formal risk analysis and sanction policy are org processes, not code. |
| Assigned security responsibility                                                                                            | § 164.308(a)(2) | Required     | Org process.                                                                                                        |
| Workforce security — authorization/supervision, clearance, termination                                                      | § 164.308(a)(3) | R + A        | Ties to identity-provider (Keycloak) lifecycle — planned.                                                           |
| Information access management — access authorization, establishment, modification                                           | § 164.308(a)(4) | R + A        | [`../security/authentication-authorization.md`](../security/authentication-authorization.md).                       |
| Security awareness & training — incl. log-in monitoring, password management                                                | § 164.308(a)(5) | Required + A | Log-in monitoring: auth events recorded in the audit trail.                                                         |
| Security incident procedures                                                                                                | § 164.308(a)(6) | Required     | Incident-response runbook — planned; feeds breach analysis (§ 4).                                                   |
| Contingency plan — data backup, disaster recovery, emergency-mode operation, testing, application/data criticality analysis | § 164.308(a)(7) | R + A        | [`../operations/`](../operations/) backup-recovery — planned.                                                       |
| Evaluation (periodic technical & non-technical)                                                                             | § 164.308(a)(8) | Required     | Org process.                                                                                                        |
| Business associate contracts                                                                                                | § 164.308(b)    | Required     | BAA + subcontractor flow-down (§ 2).                                                                                |

**Physical safeguards — § 164.310** — facility access controls, workstation
use/security, device and media controls (disposal, media re-use, accountability,
data backup & storage). Largely inherited from the cloud provider under a
shared-responsibility model; media sanitization for anything self-managed follows
NIST SP 800-88.

**Technical safeguards — § 164.312**

| Standard                            | Spec                                                       | Citation             | R/A          | Status here                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------- | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Access control**                  | Unique user identification                                 | § 164.312(a)(2)(i)   | Required     | Every actor has a stable id; carried through logging context and audit `actor.id`.                                                                |
|                                     | Emergency access procedure                                 | § 164.312(a)(2)(ii)  | Required     | "Break-glass" access — planned; must itself be audited with elevated scrutiny.                                                                    |
|                                     | Automatic logoff                                           | § 164.312(a)(2)(iii) | Addressable  | Session/token TTLs — [`../security/authentication-authorization.md`](../security/authentication-authorization.md).                                |
|                                     | Encryption & decryption (at rest)                          | § 164.312(a)(2)(iv)  | Addressable  | [`../security/secrets-encryption.md`](../security/secrets-encryption.md).                                                                         |
| **Audit controls**                  | Record and examine activity in systems with ePHI           | § 164.312(b)         | Required     | [`packages/audit`](../../packages/audit/) — hash-chained, tamper-evident records; [`../security/audit-logging.md`](../security/audit-logging.md). |
| **Integrity**                       | Authenticate ePHI (detect improper alteration/destruction) | § 164.312(c)         | Required + A | Content-addressed raw store (SHA-256 keys); audit hash chain; DB constraints & checksums.                                                         |
| **Person or entity authentication** | Verify identity before access                              | § 164.312(d)         | Required     | OAuth 2.0 / OpenID Connect / SMART; service identity for M2M.                                                                                     |
| **Transmission security**           | Integrity controls; encryption in transit                  | § 164.312(e)         | Required + A | TLS 1.2+ everywhere; mTLS between services — [`../security/secrets-encryption.md`](../security/secrets-encryption.md).                            |

### 3.3 Documentation — § 164.316

Policies and procedures must be **written** (§ 164.316(a)) and **retained for
6 years** from creation or last-effective date, whichever is later
(§ 164.316(b)(2)(i)); made available to those responsible (§ 164.316(b)(2)(ii));
and reviewed/updated as needed (§ 164.316(b)(2)(iii)). See
[`data-retention.md`](data-retention.md).

---

## 4. The Breach Notification Rule — 45 CFR §§ 164.400–414

A **breach** is an acquisition, access, use, or disclosure of PHI not permitted by
the Privacy Rule that **compromises the security or privacy** of the PHI
(§ 164.402). It is **presumed to be a breach** unless the entity demonstrates a
**low probability of compromise** through a risk assessment of at least four
factors: (1) nature and extent of the PHI, (2) the unauthorized person who used
it or to whom it was disclosed, (3) whether the PHI was actually acquired or
viewed, (4) the extent to which the risk has been mitigated (§ 164.402(2)).
Exceptions: certain good-faith internal access, inadvertent internal disclosures
between authorized persons, and cases where the recipient could not reasonably
have retained the information.

**Encryption safe harbor:** if the PHI was **encrypted** to the standard in HHS's
guidance (consistent with NIST) and the decryption key was not compromised, the
PHI is not "unsecured PHI" and breach notification is **not triggered**
(§ 164.402; HHS guidance under HITECH § 13402(h)(2)). This is the single
strongest practical argument for encrypting everything at rest and in transit.

**Timelines:**

| Who is notified                                                     | When                                                   | Citation     |
| ------------------------------------------------------------------- | ------------------------------------------------------ | ------------ |
| **Business associate → covered entity**                             | Without unreasonable delay, ≤ 60 days from discovery   | § 164.410    |
| Covered entity → **affected individuals**                           | Without unreasonable delay, ≤ 60 days                  | § 164.404    |
| Covered entity → **HHS Secretary**, ≥ 500 individuals               | Contemporaneously with individuals (≤ 60 days)         | § 164.408(b) |
| Covered entity → **HHS Secretary**, < 500 individuals               | Annually, ≤ 60 days after the end of the calendar year | § 164.408(c) |
| Covered entity → **prominent media**, ≥ 500 in a state/jurisdiction | Without unreasonable delay, ≤ 60 days                  | § 164.406    |

Breaches affecting 500+ are posted on the [OCR breach portal](https://ocrportal.hhs.gov/ocr/breach/).

**Platform implication:** the audit trail and access logs must be complete and
trustworthy enough to answer factor (3) — _was PHI actually acquired or viewed,
and whose?_ — quickly and defensibly. This is a primary design driver for
[`packages/audit`](../../packages/audit/).

---

## 5. Enforcement — 45 CFR Part 160, Subparts C–E

OCR investigates complaints and breach reports and may impose **civil money
penalties (CMPs)**, tiered by culpability (HITECH § 13410; § 160.404):

| Tier | Culpability                                                      |
| ---- | ---------------------------------------------------------------- |
| 1    | Did not know, and would not have known with reasonable diligence |
| 2    | Reasonable cause, not willful neglect                            |
| 3    | Willful neglect, corrected within 30 days                        |
| 4    | Willful neglect, not corrected                                   |

Per-violation dollar amounts and the annual per-provision cap are **adjusted for
inflation each year** (45 CFR Part 102). HHS's 2019 _Notification of Enforcement
Discretion_ (84 FR 18151) reduced the caps for the lower tiers pending
rulemaking — **look up the current penalty table before quoting numbers.** State
attorneys general may also bring HIPAA actions (HITECH § 13410(e)); criminal
violations (42 U.S.C. § 1320d-6) are prosecuted by DOJ.

Resolution agreements and corrective action plans on the
[OCR enforcement pages](https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/)
are the best source of "what OCR actually cares about" — recurring themes: no
risk analysis, no encryption, excessive access, missing BAAs, slow breach
response, and inadequate audit controls.

---

## 6. Interaction with other regimes

- **42 CFR Part 2** (SUD records) is **stricter** than HIPAA for covered records;
  the 2024 alignment rule (89 FR 12472) narrows but does not erase the gap. See
  [`phi-handling.md`](phi-handling.md).
- **State law** that is _more_ protective of privacy is generally **not
  preempted** (§§ 160.201–205). Design to the stricter of HIPAA or applicable
  state law.
- **FTC Health Breach Notification Rule** (16 CFR Part 318) can apply to the same
  organization for data outside HIPAA (e.g. a consumer wellness tier).
- **Cures Act information blocking** (45 CFR Part 171) can _require_ disclosure
  that HIPAA merely _permits_ — a HIPAA "may" is not a defense to an
  information-blocking claim. See
  [`../architecture/interoperability.md`](../architecture/interoperability.md).

---

## 7. What the code does about it

| Control                                                                                                             | Implementation                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit controls (§ 164.312(b)); activity review (§ 164.308(a)(1)(ii)(D)); log-in monitoring (§ 164.308(a)(5)(ii)(C)) | [`@healthstack/audit`](../../packages/audit/) — security-relevant actions recorded as structured, hash-chained `AuditRecord`s; auth failures recorded from the API error handler.                                         |
| Minimum necessary (§ 164.502(b)); no PHI in operational telemetry                                                   | [`@healthstack/logger`](../../packages/logger/) — default redaction of HIPAA Safe Harbor identifier fields and credentials before anything is written; the audit package rejects records that look like they contain PHI. |
| Integrity (§ 164.312(c))                                                                                            | Content-addressed raw object store (SHA-256 keys, immutable); audit hash chain with `verifyChain()`.                                                                                                                      |
| Unique user identification (§ 164.312(a)(2)(i))                                                                     | Request context carries `requestId` / `correlationId` / `actorId`; audit `actor` is a stable id, never a name.                                                                                                            |
| Transmission security (§ 164.312(e))                                                                                | TLS enforced at the edge and between services — see [`../security/secrets-encryption.md`](../security/secrets-encryption.md).                                                                                             |
| Breach-analysis readiness (§ 164.402)                                                                               | Audit records are structured to answer "who accessed which patient's data, when, from where, and did they actually read it."                                                                                              |

Still to build: formal risk-analysis artifact, incident-response runbook,
contingency plan & DR test evidence, sanction policy, BAA templates, break-glass
flow.
