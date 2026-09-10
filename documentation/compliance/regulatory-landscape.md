# Regulatory landscape

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

This document maps the U.S. federal laws, regulators, and rules that govern a
platform that ingests, stores, transforms, and exposes identifiable health data.
It is the index; the deep dives are in [`hipaa.md`](hipaa.md),
[`phi-handling.md`](phi-handling.md), [`data-retention.md`](data-retention.md),
and [`../architecture/interoperability.md`](../architecture/interoperability.md).

> Scope note: this covers U.S. federal law. State privacy and medical-record laws
> (some stricter than HIPAA and not preempted — see 45 CFR §§ 160.201–205), and
> non-U.S. law (UK/EU GDPR, PIPEDA, etc.), are out of scope here and would need
> their own analysis.

---

## 1. The regulators

| Agency                                                                                                      | Part of     | What it governs here                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OCR** — Office for Civil Rights                                                                           | HHS         | Enforces the HIPAA Privacy, Security, and Breach Notification Rules, and Section 1557 nondiscrimination. Conducts investigations, audits, imposes civil money penalties.                                                                                                            |
| **ASTP/ONC** — Assistant Secretary for Technology Policy / Office of the National Coordinator for Health IT | HHS         | Health IT Certification Program (45 CFR Part 170), USCDI, the information blocking regulations (45 CFR Part 171). ONC was reorganized and elevated to ASTP/ONC in 2024.                                                                                                             |
| **CMS** — Centers for Medicare & Medicaid Services                                                          | HHS         | Conditions of Participation for providers (42 CFR Part 482 et al.); interoperability and prior-authorization API requirements for CMS-regulated payers; Promoting Interoperability programs.                                                                                        |
| **OIG** — Office of Inspector General                                                                       | HHS         | Civil money penalties for information blocking by health IT developers, HIEs, and HINs (42 CFR Part 1003).                                                                                                                                                                          |
| **SAMHSA** — Substance Abuse and Mental Health Services Administration                                      | HHS         | 42 CFR Part 2 — confidentiality of substance use disorder (SUD) treatment records.                                                                                                                                                                                                  |
| **FTC** — Federal Trade Commission                                                                          | Independent | Health Breach Notification Rule (16 CFR Part 318) for health apps/PHR vendors **not** covered by HIPAA; Section 5 "unfair or deceptive" enforcement over privacy claims.                                                                                                            |
| **FDA** — Food and Drug Administration                                                                      | HHS         | Software as a Medical Device (SaMD) / Clinical Decision Support, if the platform makes device-like claims (21 CFR Part 820 / QMSR; § 3060 of the Cures Act). Likely out of scope for a data platform, in scope the moment it starts giving diagnostic or treatment recommendations. |

---

## 2. The statutes

| Statute                                                                                    | Citation                                                          | What it did                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **HIPAA** — Health Insurance Portability and Accountability Act of 1996                    | Pub. L. 104–191                                                   | Directed HHS to issue the Privacy, Security, and Transactions rules. Regulations at 45 CFR Parts 160, 162, 164.                                                          |
| **HITECH Act** — Health Information Technology for Economic and Clinical Health Act (2009) | Pub. L. 111–5, Div. A Title XIII & Div. B Title IV (part of ARRA) | Created the Breach Notification Rule, made business associates directly liable, strengthened enforcement and penalty tiers, funded EHR adoption, created ONC in statute. |
| **21st Century Cures Act** (2016)                                                          | Pub. L. 114–255, §§ 4001–4006                                     | Defined "interoperability," prohibited "information blocking," directed ONC to update certification and adopt APIs "without special effort," and set penalties.          |
| **Cybersecurity Act of 2015, § 405(d)**                                                    | Pub. L. 114–113, Div. N                                           | Directed HHS to produce voluntary healthcare cybersecurity practices → the 405(d) program / HICP.                                                                        |
| **Rehabilitation Act § 508**                                                               | 29 U.S.C. § 794d                                                  | Accessibility of federal and federally-funded electronic information (WCAG-based); relevant to patient-facing UIs.                                                       |
| **ADA** and **ACA § 1557**                                                                 | 42 U.S.C. § 12101 et seq.; 42 U.S.C. § 18116                      | Accessibility and nondiscrimination in health programs and activities.                                                                                                   |

---

## 3. The rules (regulations)

Cited to the CFR (current text: [eCFR](https://www.ecfr.gov)) with the Federal
Register rulemaking that established or last significantly changed each.

### HIPAA — 45 CFR Parts 160 & 164

| Rule                                       | CFR                                              | Key rulemakings (FR)                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Privacy Rule**                           | 45 CFR Part 164, Subparts A & E (§§ 164.500–534) | 65 FR 82462 (Dec 28, 2000); 67 FR 53182 (Aug 14, 2002); Omnibus 78 FR 5566 (Jan 25, 2013). Reproductive-health-privacy amendments (2024) were **vacated in 2025** — verify current status. |
| **Security Rule**                          | 45 CFR Part 164, Subparts A & C (§§ 164.302–318) | 68 FR 8334 (Feb 20, 2003); Omnibus 78 FR 5566 (2013). **NPRM to modernize the Security Rule published Jan 6, 2025 (90 FR 898)** — proposed, not final; see [`hipaa.md`](hipaa.md).         |
| **Breach Notification Rule**               | 45 CFR §§ 164.400–414                            | 74 FR 42740 (Aug 24, 2009, interim final); 78 FR 5566 (2013, final).                                                                                                                       |
| **Enforcement Rule**                       | 45 CFR Part 160, Subparts C–E                    | 71 FR 8390 (Feb 16, 2006); HITECH tiers 78 FR 5566 (2013); penalty amounts inflation-adjusted annually (45 CFR Part 102).                                                                  |
| **Transactions & Code Sets / Identifiers** | 45 CFR Part 162                                  | Standardizes X12 claims transactions, NPI, etc. Mostly relevant to billing paths.                                                                                                          |

### ASTP/ONC — 45 CFR Parts 170 & 171

| Rule                                                                                              | CFR                       | Key rulemakings (FR)                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ONC Cures Act Final Rule** — certification, APIs, information blocking                          | 45 CFR Parts 170 & 171    | 85 FR 25642 (May 1, 2020). Information-blocking compliance began Apr 5, 2021; EHI scope expanded beyond USCDI on Oct 6, 2022.                                                                                                                                                 |
| **Information Blocking**                                                                          | 45 CFR Part 171           | Actor definitions (§ 171.102), the eight exceptions (Subparts B & C), EHI definition.                                                                                                                                                                                         |
| **HTI-1 Final Rule** — Certification Program Updates, Algorithm Transparency, Information Sharing | 45 CFR Parts 170 & 171    | 89 FR 1192 (Jan 9, 2024). USCDI v3 as the § 170.213 baseline (adopted for use by Jan 1, 2026); "Decision Support Intervention" (DSI) criterion § 170.315(b)(11) with predictive-model "source attributes"; Insights Condition; revised info-blocking definitions; EHI export. |
| **HTI-2 / HTI-3** — patient, provider, and payer APIs; TEFCA; further info-blocking updates       | 45 CFR Parts 170 & 171    | HTI-2 NPRM 89 FR 63498 (Aug 5, 2024); subsequently split and partially finalized/withdrawn. **Verify current status** in the Federal Register.                                                                                                                                |
| **Provider disincentives for information blocking**                                               | Enforced via CMS programs | 89 FR 54662 (Jul 1, 2024).                                                                                                                                                                                                                                                    |
| **Information-blocking CMPs** (developers, HIEs, HINs)                                            | 42 CFR Part 1003          | 88 FR 42820 (2023); up to **$1,000,000 per violation**.                                                                                                                                                                                                                       |

### CMS

| Rule                                                    | Identifier / CFR                                                      | Key rulemaking (FR)                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interoperability and Patient Access Final Rule**      | CMS-9115-F; 42 CFR Parts 422, 431, 438, 457; 45 CFR Part 156          | 85 FR 25510 (May 1, 2020). Patient Access API and Provider Directory API for CMS-regulated payers (FHIR R4 + US Core + USCDI); payer-to-payer exchange; provider digital contact information in NPPES; Condition of Participation for admission/discharge/transfer (ADT) event notifications (effective May 1, 2021). |
| **Interoperability and Prior Authorization Final Rule** | CMS-0057-F                                                            | 89 FR 8758 (Feb 8, 2024). Prior Authorization API (FHIR, incl. HL7 Da Vinci CRD/DTR/PAS), Provider Access API, Payer-to-Payer API, Patient Access API extended to prior-auth data. Decision-timeframe and denial-reason requirements phase in from 2026; API requirements largely effective Jan 1, 2027.              |
| **Conditions of Participation — medical records**       | 42 CFR § 482.24 (hospitals); § 482.61 (psychiatric); § 485.638 (CAHs) | Record content, authentication, and retention (generally ≥ 5 years; longer where state law requires). See [`data-retention.md`](data-retention.md).                                                                                                                                                                   |

### Other

| Rule                                                       | CFR             | Notes                                                                                                                                                                                           |
| ---------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **42 CFR Part 2** — Confidentiality of SUD Patient Records | 42 CFR Part 2   | Final rule aligning Part 2 more closely with HIPAA: 89 FR 12472 (Feb 16, 2024); compliance date Feb 16, 2026. Stricter consent rules for SUD records; see [`phi-handling.md`](phi-handling.md). |
| **FTC Health Breach Notification Rule**                    | 16 CFR Part 318 | Amended 89 FR 47028 (2024) to clearly cover health apps and connected devices not subject to HIPAA.                                                                                             |

---

## 4. Standards incorporated by reference

These are technical standards that regulation makes mandatory (chiefly via ONC
certification § 170.315 and the CMS API rules):

- **HL7 FHIR Release 4.0.1** — [hl7.org/fhir/R4](https://hl7.org/fhir/R4/)
- **US Core Implementation Guide** — profiles aligned to USCDI
- **USCDI** (US Core Data for Interoperability) — versioned; v3 is the HTI-1
  baseline, with later versions (v4, v5, …) published annually by ASTP/ONC
- **SMART App Launch IG** — OAuth 2.0 / OpenID Connect profile for health apps
- **FHIR Bulk Data Access IG** — population-level export
- **HL7 Da Vinci IGs** (CRD, DTR, PAS, PDex) — for the CMS prior-auth and
  payer-to-payer APIs
- **ASTM E2147** — audit and disclosure logs for health information systems
  (referenced by ONC audit-log certification criteria)
- **US realm code systems** — LOINC (labs/observations), SNOMED CT (problems),
  RxNorm (medications), ICD-10-CM/PCS, CPT/HCPCS, CVX (immunizations), UCUM
  (units)

Non-binding but load-bearing guidance:

- **NIST SP 800-66 Rev. 2** — _Implementing the HIPAA Security Rule_ (Feb 2024)
- **NIST SP 800-53 Rev. 5**, **NIST CSF 2.0**
- **NIST SP 800-92** — _Guide to Computer Security Log Management_
- **HHS 405(d) HICP** and the **Cybersecurity Performance Goals (CPGs)**
- **OWASP ASVS / API Security Top 10**

---

## 5. How this maps to the platform

| Requirement area                                                                           | Where addressed                                                                                            |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Audit controls (§ 164.312(b)); information system activity review (§ 164.308(a)(1)(ii)(D)) | [`../security/audit-logging.md`](../security/audit-logging.md); [`packages/audit/`](../../packages/audit/) |
| Access control (§ 164.312(a)); authentication (§ 164.312(d))                               | [`../security/authentication-authorization.md`](../security/authentication-authorization.md)               |
| Encryption at rest / in transit (§ 164.312(a)(2)(iv), (e)(2)(ii))                          | [`../security/secrets-encryption.md`](../security/secrets-encryption.md)                                   |
| Minimum necessary (§ 164.502(b), § 164.514(d)); de-identification (§ 164.514(a)–(c))       | [`phi-handling.md`](phi-handling.md); logger redaction in [`packages/logger/`](../../packages/logger/)     |
| Documentation retention (§ 164.316(b)); medical-record retention (state / CMS CoP)         | [`data-retention.md`](data-retention.md)                                                                   |
| Breach notification (§§ 164.400–414)                                                       | [`hipaa.md`](hipaa.md) → incident response (planned)                                                       |
| Information blocking (45 CFR Part 171); certified-API behavior (§ 170.315(g)(10))          | [`../architecture/interoperability.md`](../architecture/interoperability.md)                               |
| Business associate obligations (§ 164.502(e), § 164.504(e), § 164.308(b))                  | [`hipaa.md`](hipaa.md)                                                                                     |

---

## 6. Pending / moving pieces to watch

- **HIPAA Security Rule NPRM (90 FR 898, Jan 6, 2025)** — would remove the
  "addressable vs. required" distinction, and explicitly mandate MFA, encryption
  at rest and in transit, network segmentation, an asset inventory and network
  map, vulnerability scanning every 6 months, penetration testing every 12
  months, and annual compliance audits. Not final; track the docket.
- **ASTP/ONC HTI-2 successors** — patient/provider/payer FHIR API expansions and
  TEFCA codification.
- **CMS-0057-F phase-in** — prior-authorization API and timeframe requirements
  landing in 2026–2027.
- **42 CFR Part 2** — compliance date Feb 16, 2026 for the HIPAA-alignment rule.
- **State comprehensive privacy laws** — many now in force; several have health-
  data-specific provisions (e.g. Washington's My Health My Data Act).
