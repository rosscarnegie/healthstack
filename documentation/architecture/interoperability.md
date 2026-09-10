# Interoperability & information blocking

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

Why the platform exposes standards-based APIs and does not withhold data: the
21st Century Cures Act made **information blocking** unlawful, ASTP/ONC's
**Health IT Certification Program** defines what a compliant API looks like, and
**CMS** requires specific FHIR APIs of the payers and providers it regulates.

**Primary sources:** 21st Century Cures Act, Pub. L. 114–255, §§ 4002–4004;
ONC Cures Act Final Rule, 85 FR 25642 (May 1, 2020); HTI-1 Final Rule, 89 FR 1192
(Jan 9, 2024); 45 CFR Parts 170 & 171; CMS-9115-F, 85 FR 25510 (May 1, 2020);
CMS-0057-F, 89 FR 8758 (Feb 8, 2024).
[healthit.gov/topic/information-blocking](https://www.healthit.gov/topic/information-blocking) ·
[cms.gov interoperability](https://www.cms.gov/priorities/key-initiatives/burden-reduction/interoperability)

---

## 1. Information blocking — 45 CFR Part 171

### Who it binds ("actors" — § 171.102)

1. **Health care providers**
2. **Health IT developers of certified health IT**
3. **Health information networks / health information exchanges (HIN/HIE)**

A platform that offers certified health IT modules, or that operates as a network
moving EHI between organizations, is an actor. Even if it is "only" a business
associate, its conduct can make a _provider_ client an information blocker.

### What it prohibits

A practice that is **likely to interfere with** the access, exchange, or use of
**electronic health information (EHI)**, where the actor knows (or, for
developers/HINs/HIEs, _should know_) it is likely to interfere — unless a
**regulatory exception** applies or another law requires it (§ 171.103).

**EHI** = electronic protected health information to the extent it is in a
**designated record set** (§ 171.102), regardless of whether the actor is a
HIPAA-covered entity. (Scope was limited to USCDI data elements until Oct 6,
2022; it is now the full EHI definition.)

### The eight exceptions (must be met precisely; the actor bears the burden)

**Not fulfilling requests:** Preventing Harm (§ 171.201), Privacy (§ 171.202),
Security (§ 171.203), Infeasibility (§ 171.204), Health IT Performance
(§ 171.205).

**Procedures for fulfilling requests:** Content and Manner (§ 171.301), Fees
(§ 171.302), Licensing (§ 171.303).

> A HIPAA "permitted but not required" disclosure is **not** an exception. If
> HIPAA lets you share and no exception applies, withholding can be information
> blocking. The Privacy exception only covers situations where a privacy law
> _prohibits_ the disclosure or a required precondition (e.g. consent) is unmet.

### Penalties / disincentives

| Actor                                         | Consequence                                                                                                                    | Citation                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Developers of certified health IT, HINs, HIEs | Civil money penalties up to **$1,000,000 per violation** (HHS OIG)                                                             | 42 CFR Part 1003; 88 FR 42820 (2023) |
| Health care providers                         | "Appropriate disincentives" through CMS programs (MIPS Promoting Interoperability score to 0, loss of ACO participation, etc.) | 89 FR 54662 (Jul 1, 2024)            |

Complaints go to ASTP/ONC's [Information Blocking Portal](https://inquiry.healthit.gov/).

### Platform stance

- Default to **disclosure** of EHI in a designated record set on a legitimate
  request; withholding requires a **documented** exception analysis, logged as an
  audit event (`category: "information-blocking.exception"`).
- No contractual, technical, or fee practices that would fail Content-and-Manner,
  Fees, or Licensing.
- Export capability for the **full EHI** a tenant holds (not just USCDI), per
  § 170.315(b)(10) EHI export where certified.

---

## 2. ASTP/ONC Health IT Certification Program — 45 CFR Part 170

Certification is voluntary in the abstract but effectively required to sell to
providers in CMS Promoting Interoperability programs. Relevant criteria for this
platform:

| Criterion                                                | § 170.315                                                 | What it requires                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Standardized API for patient and population services** | **(g)(10)**                                               | A **FHIR Release 4.0.1** API conforming to **US Core**, **SMART App Launch** (incl. standalone and EHR launch, refresh tokens, token introspection), and **FHIR Bulk Data Access** for population export. Tested with ONC **Inferno**.                                                                             |
| Consolidated CDA create/receive                          | (b)(1)                                                    | C-CDA document exchange (transitions of care).                                                                                                                                                                                                                                                                     |
| EHI export                                               | (b)(10)                                                   | Single-patient and patient-population export of the full EHI set.                                                                                                                                                                                                                                                  |
| Data segmentation for privacy (DS4P)                     | (b)(7)/(b)(8)                                             | Send/receive documents with sequestered (e.g. Part 2) content tagged.                                                                                                                                                                                                                                              |
| Audit criteria                                           | (d)(2), (d)(3), (d)(10)                                   | Auditable events, tamper-resistance of the log, audit reports, auditing actions on health information — see [`../security/audit-logging.md`](../security/audit-logging.md).                                                                                                                                        |
| **Decision Support Intervention (DSI)**                  | (b)(11)                                                   | Replaces the old CDS criterion (HTI-1). For **predictive** DSIs, the developer must supply **"source attributes"** — plain-language information about the intervention's data, development, validation, fairness, and ongoing monitoring — i.e. algorithm transparency. Also the **Insights Condition** reporting. |
| Standards version advancement / real-world testing       | Conditions & Maintenance of Certification (§ 170.402–406) | Ongoing obligations, incl. attestations and the assurances/communications conditions.                                                                                                                                                                                                                              |

**USCDI:** the data-element vocabulary the APIs must support. HTI-1 set
**USCDI v3** as the § 170.213 baseline (to be adopted for use by **Jan 1, 2026**).
ASTP/ONC publishes new versions annually (v4, v5, …); track the
[USCDI page](https://www.healthit.gov/isp/united-states-core-data-interoperability-uscdi)
and the Standards Version Advancement Process (SVAP) for which versions are
permitted.

---

## 3. CMS API requirements

### 3.1 Interoperability and Patient Access Final Rule — CMS-9115-F (85 FR 25510)

Binds CMS-regulated payers: Medicare Advantage, Medicaid & CHIP (FFS and managed
care), and QHP issuers on the federally-facilitated Exchanges.

| Requirement                                                                                           | Standard                                              | Since                     |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------- |
| **Patient Access API** — claims, encounters, clinical data (USCDI), formulary/preferred drug list     | FHIR R4 + US Core + SMART App Launch + OpenID Connect | Jul 1, 2021 (enforcement) |
| **Provider Directory API**                                                                            | FHIR R4 (public, no auth)                             | Jul 1, 2021               |
| **Payer-to-payer** data exchange at the patient's request                                             | (data content defined; API added by CMS-0057-F)       | phased                    |
| Provider **digital contact information** in NPPES                                                     | —                                                     | 2020                      |
| **Admission/Discharge/Transfer (ADT) event notifications** — Condition of Participation for hospitals | HL7 messaging                                         | May 1, 2021               |

### 3.2 Interoperability and Prior Authorization Final Rule — CMS-0057-F (89 FR 8758)

Binds MA, Medicaid/CHIP (FFS + managed care), and FFE QHP issuers.

| Requirement                                                                                                                                       | Standard                                                                                                             | Compliance             |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Prior Authorization API**                                                                                                                       | FHIR + HL7 **Da Vinci** CRD (coverage requirements), DTR (documentation templates & rules), PAS (prior auth support) | API by **Jan 1, 2027** |
| **Provider Access API** (payer → in-network providers)                                                                                            | FHIR R4 + US Core + Bulk Data                                                                                        | Jan 1, 2027            |
| **Payer-to-Payer API**                                                                                                                            | FHIR R4                                                                                                              | Jan 1, 2027            |
| **Patient Access API** extended to include prior-authorization information                                                                        | FHIR R4                                                                                                              | Jan 1, 2027            |
| Prior-auth **decision timeframes** — 72 hours expedited, 7 calendar days standard; specific **denial reason**; **public reporting** of PA metrics | —                                                                                                                    | 2026                   |

The platform's payer-facing connectors and FHIR façade target these IGs directly.

---

## 4. TEFCA

The **Trusted Exchange Framework and Common Agreement** (Cures Act § 4003;
operated by ASTP/ONC and the Recognized Coordinating Entity) is a voluntary
nationwide exchange layer built on **Qualified Health Information Networks
(QHINs)**. It is increasingly the way to satisfy broad query-based exchange
(treatment, individual access, public health, payment/operations). The platform's
HIE connector is designed so a QHIN can be one of its exchange partners without
architectural change.

---

## 5. How the platform maps

| Concern                         | Component                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical clinical model        | **FHIR R4**; source formats (HL7 v2, C-CDA, CSV) normalized on ingest — see [`../data/`](../data/) (planned).                          |
| US realm conformance            | **US Core** profiles; **USCDI** element coverage tracked per version.                                                                  |
| App authorization               | **SMART App Launch** / OAuth 2.0 — [`../security/authentication-authorization.md`](../security/authentication-authorization.md).       |
| Population export               | **FHIR Bulk Data Access** (`$export`), async job model.                                                                                |
| Provenance & lineage            | Immutable content-addressed raw store; `Provenance` resources; ingestion ledger — see [`../data/data-lineage.md`](../data/) (planned). |
| Terminology                     | LOINC / SNOMED CT / RxNorm / ICD-10 / CVX / UCUM via the terminology service (stub).                                                   |
| Prior auth / payer exchange     | Da Vinci IG implementations in the payer connector (planned).                                                                          |
| Information-blocking compliance | Disclosure-by-default; exception analysis is an audited decision.                                                                      |

---

## 6. Open items

- Which certification criteria (if any) to actually pursue — informs how strict
  Inferno conformance needs to be.
- USCDI version target and SVAP posture.
- Da Vinci CRD/DTR/PAS implementation.
- EHI export (full designated record set, not just USCDI).
- TEFCA / QHIN connection design.
