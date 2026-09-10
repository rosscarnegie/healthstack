# Authentication & authorization

_Last reviewed: 2026-09-10. Not legal advice — see [`../README.md`](../README.md)._

**Requirements:** HIPAA § 164.312(d) (person or entity authentication, Required);
§ 164.312(a)(1) (access control — unique user ID, emergency access, automatic
logoff, encryption); § 164.308(a)(3)–(a)(4) (workforce security, information
access management); § 164.502(b) (minimum necessary). ONC § 170.315(g)(10)
mandates **SMART App Launch** for the certified FHIR API. The proposed Security
Rule NPRM (90 FR 898) would make **MFA** explicitly required.

---

## 1. Model

| Layer                                                    | Mechanism                                                                                                                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **End users** (clinicians, staff, patients)              | OpenID Connect (OIDC) against the identity provider (**Keycloak** — [`infrastructure/identity/keycloak`](../../infrastructure/identity/keycloak/)). Authorization Code + PKCE. **MFA required** for workforce; step-up for sensitive operations. |
| **Third-party apps** on behalf of a user or a population | **SMART App Launch** (OAuth 2.0): standalone launch and EHR launch, `patient/`, `user/`, and `system/` scopes, refresh tokens, token introspection (RFC 7662).                                                                                   |
| **Service-to-service (M2M)**                             | OAuth 2.0 client-credentials with per-service clients, **short-lived** access tokens, mTLS between services (SPIFFE-style workload identity — roadmap). No shared static API keys.                                                               |
| **Break-glass**                                          | A distinct, time-boxed elevated role that bypasses normal need-to-know, requires a reason string, and emits a high-severity `authorization` audit event (§ 164.312(a)(2)(ii)).                                                                   |

Tokens are **JWTs** validated on every request: signature (JWKS), `iss`, `aud`,
`exp`/`nbf`, and revocation/introspection for long-lived grants. Access-token
TTLs are minutes; refresh tokens are rotating and revocable.

---

## 2. Authorization: RBAC + ABAC + scopes

Access is the **intersection** of four checks — all must pass:

1. **Authentication** — valid, unexpired, correctly-audienced token.
2. **Scope** (SMART) — the token is authorized for this resource type + action
   (`patient/Observation.rs`, `system/*.read`, …).
3. **Role (RBAC)** — the actor's role permits the operation
   (`clinician`, `front-desk`, `billing`, `analyst`, `admin`, `patient`).
4. **Attributes (ABAC)** — contextual constraints:
   - **Tenant**: the resource's `tenantId` matches the token's tenant — enforced
     at the data layer, never only in the handler. See
     [`tenant-isolation.md`](tenant-isolation.md) (planned).
   - **Relationship**: for `patient/` scopes, the resource is in the patient's
     compartment; for `user/` scopes, a care-relationship or assignment exists.
   - **Purpose of use**: the request's declared purpose is permitted for the
     role, and it is recorded on the audit event.
   - **Data class**: Part 2 / restricted resources require the corresponding
     consent (see [`../compliance/phi-handling.md`](../compliance/phi-handling.md)).

**Minimum necessary** is enforced by making the _default_ deny, scopes narrow,
and query results filtered server-side to the fields the role/scope allows — not
by trusting the client to ask nicely.

Every allow **and every deny** is auditable. Denials are recorded from the API
error handler today
([`error-handler.ts`](../../services/api/src/middleware/error-handler.ts));
allow-path `phi.access` events are added at the resource layer.

---

## 3. Sessions & credentials

| Control                    | Citation                             | Approach                                                                                                                               |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Unique user identification | § 164.312(a)(2)(i)                   | One identity per human; no shared accounts; service accounts are per-service and attributable.                                         |
| Automatic logoff           | § 164.312(a)(2)(iii)                 | Idle session timeout at the IdP and short access-token TTLs; clients must re-auth / refresh.                                           |
| Emergency access           | § 164.312(a)(2)(ii)                  | Break-glass role (above).                                                                                                              |
| Password management        | § 164.308(a)(5)(ii)(D)               | Delegated to the IdP; NIST SP 800-63B posture (length over complexity, breached-password screening, no forced rotation without cause). |
| MFA                        | (proposed § 164.312) / best practice | Required for all workforce and admin access; WebAuthn preferred, TOTP fallback.                                                        |
| Account lifecycle          | § 164.308(a)(3)(ii)                  | Joiner/mover/leaver via the IdP; deprovisioning on termination is time-bound and audited.                                              |

---

## 4. Patient access

The patient-facing API (right of access, § 164.524; CMS Patient Access API) uses
patient-authenticated OAuth with `patient/` scopes bound to the authenticated
patient's compartment. It must be **usable** — an unreasonably burdensome access
process can itself be information blocking
(see [`../architecture/interoperability.md`](../architecture/interoperability.md)).

---

## 5. Open items

- Keycloak realm/client configuration as code.
- SMART App Launch conformance (Inferno `g(10)`).
- Workload identity / mTLS between services.
- Consent service for Part 2 and patient-directed sharing.
- Relationship/compartment evaluation engine.
- Break-glass flow + its heightened review path.
