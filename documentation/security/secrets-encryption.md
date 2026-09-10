# Secrets & encryption

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

**Requirements:** HIPAA § 164.312(a)(2)(iv) (encryption/decryption of ePHI at
rest, Addressable); § 164.312(e)(2)(ii) (encryption in transit, Addressable);
§ 164.312(e)(1) (transmission security, Required); § 164.312(c) (integrity);
§ 164.312(b) (the key-management and access decisions are themselves auditable).
The Breach Notification Rule's **encryption safe harbor** (§ 164.402; HHS
guidance under HITECH § 13402(h)(2)) means properly encrypted, key-uncompromised
PHI is _not_ "unsecured PHI" — losing it is not a reportable breach. The proposed
Security Rule NPRM (90 FR 898) would make encryption at rest and in transit
**explicitly required**.

> "Addressable" here is not a loophole. The reasonable-and-appropriate analysis
> for a platform holding multi-tenant PHI lands on **encrypt everything**, and
> the breach safe harbor makes that the only defensible choice.

**Standards:** NIST SP 800-111 (storage encryption), FIPS 140-3 validated
modules, NIST SP 800-52r2 (TLS), NIST SP 800-57 (key management), NIST SP 800-88
(media sanitization / crypto-shred).

---

## 1. Encryption in transit

| Path                                                              | Control                                                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Client → edge                                                     | **TLS 1.2 minimum, TLS 1.3 preferred**; HSTS; modern cipher suites only; OCSP stapling. No plaintext HTTP (redirect only). |
| Edge → service, service → service                                 | mTLS on the internal mesh (roadmap: workload identity); until then, TLS + network policy.                                  |
| Service → datastore (Postgres, object store, cache, broker)       | TLS required, certificate verification on.                                                                                 |
| Service → external systems (EHR, HIE, payer, LIS, PACS, pharmacy) | TLS; mutual auth where the partner supports it; per-partner trust store.                                                   |
| Backups / replication                                             | Encrypted channels; encrypted at destination.                                                                              |

FHIR and OAuth endpoints follow the [SMART](https://hl7.org/fhir/smart-app-launch/)
and US Core security requirements (TLS, no tokens in URLs, etc.).

---

## 2. Encryption at rest

| Store                            | Approach                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary database                 | Transparent full-disk/volume encryption (AES-256) **plus** application-layer envelope encryption for the most sensitive columns, so a stolen disk _or_ a stolen DB dump is useless without KMS access. |
| Raw object store (S3-compatible) | SSE with KMS-managed keys; **per-tenant key** so a tenant's data can be crypto-shredded independently; object-lock for immutability.                                                                   |
| Backups & snapshots              | Encrypted with keys **distinct** from the live store; restore requires explicit key access.                                                                                                            |
| Cache / queue (Redis, broker)    | Avoid persisting PHI; where unavoidable, encrypt and set aggressive TTLs.                                                                                                                              |
| Logs & audit store               | Encrypted at rest; audit store additionally write-once.                                                                                                                                                |
| Local dev                        | Synthetic data only — see [`../README.md`](../README.md). Dev still uses encryption to keep parity.                                                                                                    |

**Envelope encryption:** data encrypted with a data encryption key (DEK); the DEK
is encrypted by a key-encryption key (KEK) held in the KMS/HSM. Rotating the KEK
re-wraps DEKs cheaply; destroying a KEK (or a tenant DEK) is **crypto-shredding**
(NIST SP 800-88) and is the platform's answer to "delete this tenant from
immutable backups."

---

## 3. Key management (NIST SP 800-57)

| Property    | Target                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage     | KMS backed by **FIPS 140-3** HSM. Application services get _use_ of keys via API, never the key material.                                   |
| Separation  | Keys for live data ≠ backups ≠ audit store. Per-tenant DEKs for the raw store.                                                              |
| Rotation    | KEKs rotated on a schedule and on suspected compromise; DEKs rotated via re-wrap. TLS certs short-lived and automated (ACME / internal CA). |
| Access      | Least privilege; key administrators ≠ data administrators; every key use and policy change **audited** (§ 164.312(b)).                      |
| Recovery    | Documented, tested key-recovery procedure — losing a KEK is a data-loss event.                                                              |
| Break-glass | Emergency key access is a distinct, alarmed, multi-party procedure.                                                                         |

---

## 4. Application secrets

| Rule                                                 | Detail                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No secrets in source, images, or committed env files | `.env` is git-ignored; `.env.example` documents keys with empty values. CI secret-scanning on every push.                                                                                                              |
| Runtime injection                                    | Secrets delivered at deploy/runtime from a secrets manager (Vault / cloud secrets manager — [`infrastructure/secrets`](../../infrastructure/secrets/)), mounted or fetched, never baked in.                            |
| Short-lived over static                              | Prefer dynamic/leased credentials (DB, cloud) over long-lived ones.                                                                                                                                                    |
| Config validation                                    | The API validates all configuration at startup with Zod ([`services/api/src/config/env.ts`](../../services/api/src/config/env.ts)) and refuses to boot on missing/invalid values — fail fast, not at first PHI access. |
| Rotation                                             | Documented per secret; automated where the backing system supports leases.                                                                                                                                             |
| Logging                                              | Secret-valued fields (`password`, `token`, `authorization`, `secret`, `apiKey`, …) are in the logger's default redaction set and never appear in logs.                                                                 |

---

## 5. Integrity (§ 164.312(c))

- Raw payloads are **content-addressed** (object key = SHA-256 of canonical
  JSON) — any bit-flip changes the address, and storage is append-only.
- The audit trail is **hash-chained** — see [`audit-logging.md`](audit-logging.md).
- Database: constraints, foreign keys, and row-level checksums; backups verified
  by restore tests.
- Transport: TLS provides integrity in transit; message signing where a partner
  protocol supports it.

---

## 6. Open items

- KMS/HSM selection and Terraform.
- Per-tenant DEK scheme for the raw store + crypto-shred runbook.
- mTLS / workload identity between services.
- Column-level envelope encryption for the primary DB — which columns.
- Automated cert issuance/rotation.
- Secret-scanning + dependency-audit gates in CI.
