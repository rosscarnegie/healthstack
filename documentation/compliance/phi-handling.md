# PHI handling & de-identification

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

How the platform classifies health data, keeps PHI out of places it does not
belong, and — where it needs to — removes identifiers so data falls outside
HIPAA.

**Primary sources:** 45 CFR § 160.103 (definitions), § 164.502(b) &
§ 164.514(d) (minimum necessary), § 164.514(a)–(c) (de-identification),
§ 164.514(e) (limited data set); HHS OCR
[_Guidance Regarding Methods for De-identification of PHI_](https://www.hhs.gov/hipaa/for-professionals/privacy/special-topics/de-identification/)
(2012); 42 CFR Part 2 (SAMHSA).

---

## 1. Data classification

| Class                      | Definition                                                                                                                      | Rules                                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PHI / ePHI**             | Individually identifiable health information held/transmitted by a covered entity or business associate (§ 160.103).            | Full HIPAA Privacy + Security Rules. Encrypted at rest and in transit, access-controlled, audited, minimum-necessary.                                                    |
| **Part 2 record**          | Substance use disorder treatment records from a Part 2 program (42 CFR § 2.11).                                                 | HIPAA **plus** stricter consent and redisclosure rules (§ 4). Must be segregable and specially labelled.                                                                 |
| **Limited Data Set (LDS)** | PHI with 16 direct identifier categories removed but dates and geographic detail (down to city/ZIP) retained (§ 164.514(e)(2)). | Still PHI. Permitted for research, public health, operations **only under a Data Use Agreement** (§ 164.514(e)(4)).                                                      |
| **De-identified**          | Meets Safe Harbor (§ 164.514(b)(2)) or Expert Determination (§ 164.514(b)(1)).                                                  | **Not PHI.** Outside HIPAA — but re-identification is prohibited by the terms under which it was produced, and other law (state, contract, common rule) may still apply. |
| **Synthetic**              | Generated data (Synthea) with no real individual.                                                                               | Not PHI. Safe for fixtures, demos, tests, and this repo.                                                                                                                 |

The platform tags every stored artifact and every FHIR resource stream with its
class and its owning tenant. Class is **sticky**: a downstream store may narrow
(PHI → de-identified after a transformation) but never silently widen.

---

## 2. Minimum necessary — § 164.502(b), § 164.514(d)

When using or disclosing PHI, or requesting it from another entity, limit it to
the **minimum necessary** to accomplish the purpose. Exceptions: disclosures to
the individual, treatment, per a valid authorization, to HHS, or required by law.

How this shows up in the platform:

- **API scopes.** SMART on FHIR scopes (`patient/Observation.rs`, etc.) constrain
  what a token can read; the resource server enforces scope + role + tenant
  before returning anything. See
  [`../security/authentication-authorization.md`](../security/authentication-authorization.md).
- **Query shaping.** FHIR search is bounded (mandatory `_count` ceilings, no
  unbounded `Patient` export outside the Bulk Data pathway, compartment scoping).
- **Service-to-service.** Internal calls pass only identifiers and the fields the
  callee needs, not whole resources "just in case."
- **Telemetry.** Logs and metrics get identifiers and codes, never names, notes,
  or contact details — enforced by `@healthstack/logger` redaction and the
  `@healthstack/audit` PHI guard.

---

## 3. De-identification — § 164.514(a)–(c)

Two lawful methods. Health data is not "de-identified" just because a `name`
column was dropped.

### 3.1 Safe Harbor — § 164.514(b)(2)

Remove **all 18 identifier categories** of the individual _and_ of relatives,
employers, and household members, **and** have no actual knowledge that the
residual information could identify the individual.

| #   | Identifier (§ 164.514(b)(2)(i))                                                                                                                                                      | Platform handling                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| A   | Names                                                                                                                                                                                | Removed; never logged (`@healthstack/logger` redacts `firstName`, `lastName`, `givenName`, `familyName`, `patientName`).            |
| B   | Geographic subdivisions smaller than a state; ZIP: keep only the first 3 digits, and zero them if that 3-digit area has ≤ 20,000 people                                              | ZIP truncation transform; the OCR-published restricted 3-digit list is applied.                                                     |
| C   | All date elements (except year) directly related to an individual — birth date, admission, discharge, death; and all ages > 89 and dates indicative of such age (aggregate to "90+") | Dates shifted to year, or consistently offset per-patient for LDS; age 90+ bucketed.                                                |
| D   | Telephone numbers                                                                                                                                                                    | Removed / redacted.                                                                                                                 |
| E   | Fax numbers                                                                                                                                                                          | Removed.                                                                                                                            |
| F   | Email addresses                                                                                                                                                                      | Removed / redacted; the audit PHI guard pattern-matches emails and rejects the record.                                              |
| G   | Social Security numbers                                                                                                                                                              | Removed / redacted.                                                                                                                 |
| H   | Medical record numbers                                                                                                                                                               | Removed from de-identified output; in identified stores, MRN is treated as PHI (`mrn`, `medicalRecordNumber` are redacted in logs). |
| I   | Health plan beneficiary numbers                                                                                                                                                      | Removed / redacted (`beneficiaryId`, `memberId`).                                                                                   |
| J   | Account numbers                                                                                                                                                                      | Removed.                                                                                                                            |
| K   | Certificate / license numbers                                                                                                                                                        | Removed.                                                                                                                            |
| L   | Vehicle identifiers and serial numbers, incl. license plates                                                                                                                         | Removed.                                                                                                                            |
| M   | Device identifiers and serial numbers                                                                                                                                                | Removed (note: retained in identified data for safety/recall traceability).                                                         |
| N   | Web URLs                                                                                                                                                                             | Removed.                                                                                                                            |
| O   | IP addresses                                                                                                                                                                         | Removed from de-identified output; in the audit trail, source IP is retained as a security control on identified access.            |
| P   | Biometric identifiers (finger, retinal, voice prints)                                                                                                                                | Not stored.                                                                                                                         |
| Q   | Full-face photographs and comparable images                                                                                                                                          | Not stored in scope; images handled by document-processing service with their own controls.                                         |
| R   | Any other unique identifying number, characteristic, or code — except a re-identification code assigned per § 164.514(c)                                                             | Free-text and rare-value review; re-identification keys held only by the identified store, never exported.                          |

Safe Harbor output can still be a **re-identifiable** dataset if a code is
attached under § 164.514(c); the crosswalk and its key must not be disclosed and
the code must not derive from PHI (no "hash of the SSN").

### 3.2 Expert Determination — § 164.514(b)(1)

A person with appropriate statistical/scientific knowledge determines, and
**documents**, that the risk of re-identification is **very small** — alone or in
combination with other reasonably available information. This is the route when
Safe Harbor would destroy analytic value (e.g. rare diagnoses, needed
geographic/temporal precision). It requires an actual expert engagement and a
retained report; it is not something the code decides.

### 3.3 What "de-identified" does **not** buy you

- 42 CFR Part 2 data: Part 2's de-identification standard differs — check § 2.16.
- State law and the Common Rule (45 CFR Part 46) may still apply to research uses.
- Contractual and IRB restrictions travel with the data.
- Re-identification attempts may be independently unlawful and always breach the
  DUA / terms of release.

---

## 4. 42 CFR Part 2 — substance use disorder records

**Regulator:** SAMHSA. **Rule:** 42 CFR Part 2. **Alignment rule:** 89 FR 12472
(Feb 16, 2024), compliance date **Feb 16, 2026**.

Records of the identity, diagnosis, prognosis, or treatment of any patient
maintained in connection with a **federally assisted SUD program** get
protection **beyond HIPAA**:

- Use and disclosure generally require the patient's **written consent**, even
  for treatment (the 2024 rule permits a **single consent for all future TPO
  uses**, aligning with HIPAA, but consent is still the baseline).
- Disclosures carry a **redisclosure prohibition notice**; recipients are bound.
- Segregation: Part 2 data must be identifiable and separable so it can be
  withheld when a disclosure is not Part 2-authorized.
- The 2024 rule extends HIPAA's Breach Notification Rule to Part 2 records and
  aligns penalties.

**Platform stance:** treat any resource flagged as SUD-related (by source system,
by code, or by program) as a **Part 2 record** — a distinct data class with
consent-gated access, redisclosure tagging, and the ability to filter it out of
any disclosure that lacks Part 2 authorization. Do not commingle it into general
de-identified extracts without confirming § 2.16 is met.

---

## 5. Enforcement in code

| Guard                       | Where                                                                                  | What it does                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Log redaction               | [`@healthstack/logger` `DEFAULT_REDACT_PATHS`](../../packages/logger/src/redaction.ts) | Blanks Safe Harbor identifier field names and credentials in every log record, in every environment, before serialization.                                                           |
| Audit PHI tripwire          | [`@healthstack/audit` `scanForPhi`](../../packages/audit/src/phi-guard.ts)             | Rejects (dev/test/staging) or flags (production) audit records containing disallowed identifier field names or values that look like SSNs / emails. Audit records are metadata only. |
| Content-addressed raw store | raw ingestion layer                                                                    | Immutable, tenant-scoped buckets; keys are SHA-256 of canonical JSON, so identical payloads dedupe and history is preserved without mutation.                                        |
| Tenant scoping              | every layer                                                                            | See [`../security/tenant-isolation.md`](../security/tenant-isolation.md) (planned).                                                                                                  |

These are safety nets. The primary control is **not putting PHI where it does not
belong in the first place** — reviewers should treat any new log/metric/trace
field, error payload, or analytics extract as PHI until shown otherwise.

---

## 6. Open items

- ZIP-code restricted-population list needs to be bundled and version-pinned.
- Date-shifting strategy for LDS (consistent per-patient offset) not yet
  implemented.
- Expert Determination workflow (engagement, report retention) — process, not
  code — undocumented.
- Part 2 program detection rules need to be written down and tested.
