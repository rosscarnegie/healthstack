# HealthStack documentation

This is the knowledge base for the project: the reasoning, the constraints, and
the regulatory basis behind the code. Where an engineering decision is driven by
a law or regulation, the relevant document cites it so the decision can be traced
back to its source.

> **Not legal advice.** These documents are written by an engineer to inform
> engineering work. They are a research aid, not a compliance opinion. Verify
> every citation against the primary source, and involve qualified privacy /
> security counsel and a compliance function before operating a real system.

---

## How this is organized

| Directory                        | Contents                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [`compliance/`](compliance/)     | The regulatory landscape and how specific rules apply: HIPAA, PHI handling and de-identification, data retention.                        |
| [`security/`](security/)         | Security controls: audit logging, authentication & authorization, secrets & encryption, tenant isolation, overall security architecture. |
| [`architecture/`](architecture/) | System, data, integration, and deployment architecture — including interoperability (FHIR / USCDI / Cures Act / CMS APIs).               |
| [`data/`](data/)                 | The data layers: raw storage, FHIR, terminology, transformation, lineage, OMOP CDM.                                                      |
| [`operations/`](operations/)     | Running the system: local development, observability, orchestration, error handling & retries, backup & recovery.                        |
| [`adr/`](adr/)                   | Architecture Decision Records — point-in-time decisions with context and consequences.                                                   |

## Document status

| Document                                                                               | Status  |
| -------------------------------------------------------------------------------------- | ------- |
| [`compliance/regulatory-landscape.md`](compliance/regulatory-landscape.md)             | Drafted |
| [`compliance/hipaa.md`](compliance/hipaa.md)                                           | Drafted |
| [`compliance/phi-handling.md`](compliance/phi-handling.md)                             | Drafted |
| [`compliance/data-retention.md`](compliance/data-retention.md)                         | Drafted |
| [`architecture/interoperability.md`](architecture/interoperability.md)                 | Drafted |
| [`security/audit-logging.md`](security/audit-logging.md)                               | Drafted |
| [`security/authentication-authorization.md`](security/authentication-authorization.md) | Drafted |
| [`security/secrets-encryption.md`](security/secrets-encryption.md)                     | Drafted |
| `security/tenant-isolation.md`, `security/security-architecture.md`                    | Planned |
| `architecture/*` (system, data, integration, deployment)                               | Planned |
| `data/*`, `operations/*`                                                               | Planned |

---

## Citation convention

- **Statutes** are cited by popular name, public law number, and U.S. Code
  location where relevant — e.g. _HIPAA, Pub. L. 104–191; HITECH Act, Pub. L.
  111–5, Div. A Title XIII & Div. B Title IV_.
- **Regulations** are cited to the Code of Federal Regulations (CFR) and linked
  to the [eCFR](https://www.ecfr.gov), which is the continuously-updated official
  version — e.g. [45 CFR § 164.312(b)](https://www.ecfr.gov/current/title-45/section-164.312).
- **Rulemakings** are cited to the Federal Register (volume FR page, date) so the
  preamble — which contains the agency's interpretation — can be found. FR
  citations point to a specific published rule and do **not** reflect later
  amendments; the eCFR does.
- **Sub-regulatory guidance** (agency FAQs, NIST publications, implementation
  guides) is cited by title and publisher and is clearly marked as guidance, not
  binding law.
- Every document has a **"Last reviewed"** date. Treat anything older than the
  most recent rulemaking activity in that area as suspect.

---

## Primary sources

Bookmark these. Secondary summaries (including these documents) go stale.

### Law and regulation

| Source                                              | Use                                                             |
| --------------------------------------------------- | --------------------------------------------------------------- |
| [eCFR](https://www.ecfr.gov)                        | Current, authoritative text of the CFR (Titles 45, 42, 21, 16). |
| [Federal Register](https://www.federalregister.gov) | Proposed and final rules, with preambles.                       |
| [Congress.gov](https://www.congress.gov)            | Statutory text and public law numbers.                          |

### HHS — Department of Health and Human Services

| Source                                                                                                                 | Use                                                                              |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [HHS Office for Civil Rights (OCR) — HIPAA](https://www.hhs.gov/hipaa)                                                 | HIPAA Privacy, Security, and Breach Notification Rules; guidance; enforcement.   |
| [OCR Breach Portal](https://ocrportal.hhs.gov/ocr/breach/)                                                             | Public list of breaches affecting 500+ individuals ("the Wall of Shame").        |
| [HHS 405(d) Program](https://405d.hhs.gov)                                                                             | Health Industry Cybersecurity Practices (HICP); Cybersecurity Performance Goals. |
| [SAMHSA — 42 CFR Part 2](https://www.samhsa.gov/about-us/who-we-are/laws-regulations/confidentiality-regulations-faqs) | Confidentiality of substance use disorder records.                               |

### ASTP/ONC — Assistant Secretary for Technology Policy / Office of the National Coordinator for Health IT

In 2024, ONC was elevated and reorganized as **ASTP/ONC**. It still operates
healthit.gov and runs the Health IT Certification Program.

| Source                                                                               | Use                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| [HealthIT.gov](https://www.healthit.gov)                                             | Certification Program, USCDI, information blocking, HTI rules. |
| [USCDI](https://www.healthit.gov/isp/united-states-core-data-interoperability-uscdi) | The versioned data element standard referenced by regulation.  |
| [Information Blocking](https://www.healthit.gov/topic/information-blocking)          | Actor definitions, the eight exceptions, EHI scope.            |
| [Certified Health IT Product List (CHPL)](https://chpl.healthit.gov)                 | Which products are certified to which criteria.                |
| [Inferno](https://inferno.healthit.gov)                                              | ONC's FHIR API conformance test suite (§ 170.315(g)(10)).      |

### CMS — Centers for Medicare & Medicaid Services

| Source                                                                                                                       | Use                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [CMS Interoperability](https://www.cms.gov/priorities/key-initiatives/burden-reduction/interoperability)                     | Patient Access API, Prior Authorization API, Provider Access, Payer-to-Payer.                         |
| [CMS Conditions of Participation](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G)                             | 42 CFR Parts 482 (hospitals), 485, etc. — including medical-record and ADT-notification requirements. |
| [Promoting Interoperability Programs](https://www.cms.gov/medicare/regulations-guidance/promoting-interoperability-programs) | The successor to Meaningful Use.                                                                      |

### Standards bodies

| Source                                                                                                             | Use                                          |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| [HL7 FHIR R4](https://hl7.org/fhir/R4/)                                                                            | The canonical clinical data model used here. |
| [US Core Implementation Guide](https://hl7.org/fhir/us/core/)                                                      | The US realm profiles aligned to USCDI.      |
| [SMART App Launch](https://hl7.org/fhir/smart-app-launch/)                                                         | OAuth 2.0 profile for health apps.           |
| [FHIR Bulk Data Access](https://hl7.org/fhir/uv/bulkdata/)                                                         | Population-level export ("Flat FHIR").       |
| [NIST SP 800-66r2](https://csrc.nist.gov/pubs/sp/800/66/r2/final)                                                  | Implementing the HIPAA Security Rule.        |
| [NIST SP 800-53r5](https://csrc.nist.gov/pubs/sp/800/53/r5/final) / [CSF 2.0](https://www.nist.gov/cyberframework) | Control catalogue and framework.             |
| [OMOP CDM](https://ohdsi.github.io/CommonDataModel/)                                                               | The analytics data model (OHDSI).            |

---

_Last reviewed: 2026-09-10._
