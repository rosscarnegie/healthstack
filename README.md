![Project stage](https://img.shields.io/badge/project_status-brainstorming-yellow)
![Code license: MIT](https://img.shields.io/badge/code_license-MIT-green)
![Docs license: CC BY 4.0](https://img.shields.io/badge/docs_license-CC_BY_4.0-lightgrey)
![TypeScript](https://img.shields.io/badge/TypeScript-nodenext-3178c6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/node-%E2%89%A5%2022-339933?logo=nodedotjs&logoColor=white)

# 🩺 HealthStack

**Working notes on building a production-grade healthcare data platform.**

HealthStack is a personal engineering knowledge base and brainstorming outlet for what I’ve learned about building software that ingests, transforms, stores, and exposes clinical data the way a real healthcare product has to, including the regulatory, security, interoperability, and operational constraints that come with handling protected health information (PHI).

I’m building it because there is an enormous amount to understand at the intersection of healthcare and software engineering, and I’ve often found myself overwhelmed by just how broad that landscape is. HealthStack gives me a place to work through those problems, connect the pieces, and collect the lessons, patterns, questions, and ideas I pick up along the way.

Over the years, a lot of what I have learned has ended up buried in private repositories, internal documentation, or codebases I no longer control. I wanted a place of my own to preserve those lessons: the patterns that worked, the mistakes that did not, and the reasoning behind the architectural decisions.

The project will initially use an end-to-end TypeScript stack so I can explore the entire system in one language without the implementation becoming the focus of the exercise. I may eventually implement parts of the platform in Python and C# as well, particularly where those ecosystems make sense, but TypeScript is the starting point.

This is also deliberately a hands-on engineering exercise. I've found that relying heavily on AI-assisted coding can dull the skills that only stay sharp through actually writing, debugging, and reasoning through code yourself. For that reason, I'm building the implementation without AI assistance. I may use AI for documentation, editing, and organizing my notes, but the engineering itself is intentionally my own work - or at the very least - being done the traditional way.

The repository is public because I think engineering knowledge is more useful when it is shared. If any of it is useful to you, whether that's the code, architecture notes, implementation patterns, or compliance write-ups and their citations, you're welcome to use it. See [License](#license).

For now, I'm treating HealthStack as a personal project and am not accepting contributions. If it reaches a sufficiently mature state and others find it useful, I will open it to contributions in the future.

---

## ⚠️ Read This First

- **This is a learning project, not a certified product.** Nothing here has been
  through a HIPAA risk assessment, an ONC certification, a HITRUST assessment, or
  a security audit by anyone qualified to sign off on one.
- **No real PHI, ever.** All clinical data in this repo is synthetic, generated
  with [Synthea](https://github.com/synthetichealth/synthea). Do not put real
  patient data into this codebase.
- **The documentation is not legal or compliance advice.** It cites statutes and
  regulations so that engineering decisions can be traced back to a real
  requirement, but it is written by an engineer, not an attorney or a compliance
  officer. Verify every citation against the primary source before you rely on
  it — see [`documentation/compliance/regulatory-landscape.md`](documentation/compliance/regulatory-landscape.md)
  for how citations are handled and where the primary sources live.
- Citations are current **as of early 2026**. U.S. health IT rulemaking moves
  quickly (the HIPAA Security Rule, ONC/ASTP HTI rules, and CMS interoperability
  rules all had activity in 2024–2025). Always check the
  [eCFR](https://www.ecfr.gov) and [Federal Register](https://www.federalregister.gov).

---

## 💡 Why This Exists

Most tutorials stop at "here is a CRUD API." The hard, interesting parts of
healthcare software are everything _around_ the CRUD:

- keeping an immutable, tamper-evident audit trail of who touched which record
  and why, because the HIPAA Security Rule requires audit controls
  ([45 CFR § 164.312(b)](https://www.ecfr.gov/current/title-45/section-164.312));
- never letting PHI leak into a log line, an error payload, or a metrics label;
- isolating tenants (covered entities) from each other at every layer;
- normalizing messy source data (HL7 v2, C-CDA, proprietary CSV) into FHIR and
  then into a research model (OMOP CDM) without losing provenance;
- exposing a standards-based API (FHIR R4 + US Core + SMART) because the
  21st Century Cures Act makes information blocking unlawful;
- doing all of the above with a story for retention, backup, key management,
  breach notification, and incident response.

This repo works through those problems in code and writes down the reasoning.

---

## 🗺️ Repository Map

| Path                                                  | What it is                                                                                                                                                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📦 [`packages/`](packages/)                           | Shared, versioned TypeScript packages consumed by services.                                                                                                                                                                                                               |
| &nbsp;&nbsp;📝 [`packages/logger/`](packages/logger/) | `@healthstack/logger` — structured, environment-aware logging (pino) with PHI/secret redaction.                                                                                                                                                                           |
| &nbsp;&nbsp;🔐 [`packages/audit/`](packages/audit/)   | `@healthstack/audit` — tamper-evident, hash-chained healthcare audit trail (FHIR `AuditEvent` / IHE ATNA shaped).                                                                                                                                                         |
| ⚙️ [`services/`](services/)                           | Backend services. `api` is the live Express service; the rest (`ingestion`, `transformation`, `terminology`, `orchestration`, …) are stubs that describe the intended decomposition.                                                                                      |
| 🖥️ [`frontend/`](frontend/)                           | `web` and `mobile` clients (stubs).                                                                                                                                                                                                                                       |
| 🏗️ [`infrastructure/`](infrastructure/)               | Infrastructure-as-code and per-component notes: database, cache, identity (Keycloak), secrets, networking, messaging, observability, object storage, deployment (Terraform / Docker / Kubernetes), and external-system connectors (EHR, HIE, payer, pharmacy, LIS, PACS). |
| 🧪 [`synthetic-data/`](synthetic-data/)               | Synthea-based synthetic FHIR data generation (Docker).                                                                                                                                                                                                                    |
| 📚 [`documentation/`](documentation/)                 | The knowledge base — see below.                                                                                                                                                                                                                                           |
| 🧩 [`tsconfig.base.json`](tsconfig.base.json)         | Single shared TypeScript configuration; every package and service extends it.                                                                                                                                                                                             |

---

## What I'm Working On

| Area                                                                                                                                                                   | Status                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [CI/CD, linting, and commit guards](.github/workflows) — Adding automated linting, formatting, and commit validation to catch issues before they reach the repository. | ![In progress](https://img.shields.io/badge/status-in_progress-yellow) |
| [Data generation](synthetic-data) — generating initial FHIR data to support a multi-tenant environment with RBAC                                                       | ![In progress](https://img.shields.io/badge/status-in_progress-yellow) |
| [FHIR → object store pipeline](documentation/data/raw-data-storage.md) — setting up a FHIR-to-object-store (e.g. S3 / GCP storage bucket) pipeline                     | ![In progress](https://img.shields.io/badge/status-in_progress-yellow) |

---

## 📚 Documentation

The knowledge base lives in [`documentation/`](documentation/). Start with
[`documentation/README.md`](documentation/README.md) for the full index and the
citation convention.

| Area                                                                                                                                                    | Status                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Regulatory landscape](documentation/compliance/regulatory-landscape.md) — HHS/OCR, ASTP/ONC, CMS, SAMHSA, NIST; the laws and rules that apply          | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [HIPAA](documentation/compliance/hipaa.md) — Privacy, Security, Breach Notification, Enforcement; safeguards mapped to this codebase                    | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [PHI handling & de-identification](documentation/compliance/phi-handling.md) — minimum necessary, Safe Harbor, Expert Determination, 42 CFR Part 2      | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [Data retention](documentation/compliance/data-retention.md) — HIPAA documentation retention, CMS Conditions of Participation, state medical-record law | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [Interoperability](documentation/architecture/interoperability.md) — Cures Act, information blocking, ONC certification, USCDI, CMS APIs                | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [Audit logging](documentation/security/audit-logging.md) — § 164.312(b), ONC audit criteria, ASTM E2147, tamper-evidence                                | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [Authentication & authorization](documentation/security/authentication-authorization.md) — SMART on FHIR, OAuth 2.0, RBAC/ABAC                          | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| [Secrets & encryption](documentation/security/secrets-encryption.md) — encryption at rest / in transit, key management                                  | ![Drafted](https://img.shields.io/badge/status-drafted-blue)      |
| Tenant isolation, security architecture, data architecture, OMOP CDM, lineage, orchestration, backup/recovery, observability                            | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

---

## 🧰 Tech Stack

- 🟦 **Language / runtime:** TypeScript (nodenext, ES2023), Node.js ≥ 22
- 🗂️ **Monorepo:** npm workspaces + a single `tsconfig.base.json` — see the package
  READMEs
- 🌐 **API:** Express 5, Zod for env/schema validation
- 📝 **Logging:** pino via `@healthstack/logger`
- 🔗 **Audit:** `@healthstack/audit` (SHA-256 hash chain)
- 🔑 **Identity:** Keycloak (planned), SMART on FHIR / OAuth 2.0
- 🏥 **Data:** FHIR R4 as the canonical clinical model; OMOP CDM for analytics;
  S3-compatible object storage for immutable raw payloads
- 🧬 **Synthetic data:** Synthea

---

## 🚀 Getting Started

> [!WARNING]
> **HealthStack is under active development and is not currently ready for installation or deployment.**
>
> I'm still working through the architecture, implementation patterns, and overall project structure. Things may change substantially as I experiment and refine the platform. I don't recommend trying to build or deploy HealthStack yet.

The API listens on `PORT` (default `4000`) and exposes `GET /health`.
Configuration is validated at startup — see
[`services/api/.env.example`](services/api/.env.example).

Per-package usage is documented in
[`packages/logger/README.md`](packages/logger/README.md) and
[`packages/audit/README.md`](packages/audit/README.md).

### 🛠️ Development

```bash
npm run format       # Prettier — write
npm run format:check # Prettier — verify (CI)
npm run lint         # ESLint
npm run lint:fix     # ESLint — autofix
npm run typecheck    # tsc --noEmit across all workspaces
npm run check        # format:check + lint + typecheck
```

Style is enforced by Prettier (single quotes, 100-column width — see
[`.prettierrc.json`](.prettierrc.json)) and ESLint (flat config in
[`eslint.config.mjs`](eslint.config.mjs)). Node version is pinned in
[`.nvmrc`](.nvmrc). GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))
runs Prettier, ESLint, and the type check on every push to `main` and every
pull request.

---

## 🤝 Contributions

This project is as much a personal knowledge base as it is a practical exercise. I’ve found that relying heavily on AI-assisted coding has dulled some of my core development skills, so I’m using this project to deliberately sharpen them through hands-on implementation and problem-solving.

I may open the project to contributions once it reaches a more mature state and, of course, if others find it useful. For now, though, I’m keeping development solo and I'm not accepting contributions.
---

## ⚖️ License

- **Code** (everything under `packages/`, `services/`, `frontend/`,
  `infrastructure/`, `synthetic-data/`): [MIT](LICENSE).
- **Documentation** (everything under `documentation/`, and this README):
  [Creative Commons Attribution 4.0 International](LICENSE-DOCS) (CC BY 4.0).

You may use, adapt, and redistribute both, commercially or not, provided you keep
the attribution. Neither license grants any warranty, and — to be explicit —
using this material does not make a system HIPAA-compliant, certified, or safe.
