/**
 * Audit record model.
 *
 * Shaped after FHIR `AuditEvent` and IHE ATNA (RFC 3881), trimmed to what a
 * healthcare data platform actually needs. The guiding rules:
 *
 * 1. An audit record answers *who did what to which record, when, from where,
 *    why, and with what result* — it is metadata, never clinical content.
 * 2. Records never contain PHI **values**. Use logical identifiers
 *    (`patientId`, `entities[].id`), never names, MRNs, dates of birth, etc.
 * 3. Records are append-only and hash-chained for tamper-evidence.
 */

/** FHIR AuditEvent action codes (C-R-U-D-E). */
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'execute';

/**
 * FHIR AuditEvent outcome, graded. `minor-failure` is a handled/expected denial
 * (bad credentials, forbidden); `serious`/`major` indicate the audited system
 * itself is degraded.
 */
export type AuditOutcome = 'success' | 'minor-failure' | 'serious-failure' | 'major-failure';

/**
 * HL7 PurposeOfUse — the lawful basis for touching PHI. Required on
 * `phi.access` category events for HIPAA "minimum necessary" reporting.
 */
export type PurposeOfUse =
  | 'treatment'
  | 'payment'
  | 'operations'
  | 'patient-request'
  | 'public-health'
  | 'research'
  | 'legal'
  | 'emergency'
  | 'system-administration';

export interface AuditActorNetwork {
  address: string;
  type: 'ip' | 'dns' | 'uri';
}

/** Who initiated the activity. */
export interface AuditActor {
  /** Stable identifier of the user or service. Never a name or email. */
  id: string;
  type: 'user' | 'service' | 'device' | 'system';
  /** Roles held at the time of the action, e.g. `["clinician"]`. */
  roles?: string[];
  /** True when this actor is the human who initiated the request. */
  requestor?: boolean;
  network?: AuditActorNetwork;
  sessionId?: string;
}

/** The system that observed and recorded the event. */
export interface AuditSource {
  service: string;
  environment: string;
  version?: string;
  hostname?: string;
  siteId?: string;
}

export type AuditEntityLifecycle =
  'access' | 'creation' | 'amendment' | 'de-identification' | 'export' | 'disclosure' | 'deletion';

/** What was acted on. */
export interface AuditEntity {
  /** Resource type, e.g. `"Patient"`, `"Observation"`, `"Report"`. */
  type: string;
  /** Logical id / reference. Never a PHI value. */
  id?: string;
  role?: string;
  /** Security labels, e.g. `["PHI"]`, `["restricted"]`, `["de-identified"]`. */
  securityLabels?: string[];
  lifecycle?: AuditEntityLifecycle;
  /** Parameterised, PHI-free description of a query. */
  query?: string;
  /** Non-PHI descriptors only: record counts, field names, format, etc. */
  detail?: Record<string, string | number | boolean>;
}

/** The caller-supplied part of an audit event. */
export interface AuditEventInput {
  /**
   * Coarse category used for routing and retention, e.g.
   * `"phi.access"`, `"authentication"`, `"authorization"`, `"data.export"`,
   * `"configuration"`, `"security"`.
   */
  category: string;
  /** Specific action within the category, e.g. `"patient.read"`, `"login"`. */
  subtype?: string;
  action: AuditAction;
  outcome: AuditOutcome;
  outcomeDescription?: string;
  actor: AuditActor;
  entities?: AuditEntity[];
  /** Tenant / covered-entity the activity belongs to. */
  tenantId?: string;
  /** Logical patient identifier when the activity concerns one patient. */
  patientId?: string;
  purposeOfUse?: PurposeOfUse;
  requestId?: string;
  correlationId?: string;
  /** Free-form, non-PHI annotations. */
  context?: Record<string, string | number | boolean>;
}

/** A persisted audit record: caller input plus recorder-set integrity fields. */
export interface AuditRecord extends AuditEventInput {
  /** Semver of this record schema. */
  schemaVersion: string;
  /** ISO-8601 UTC timestamp, set by the recorder (not the caller). */
  recordedAt: string;
  /** Monotonic per-process sequence number. */
  sequence: number;
  /** Hash of the previous record in this process's chain (tamper-evidence). */
  previousHash: string;
  /** SHA-256 of this record's canonical form (excluding `hash` itself). */
  hash: string;
  source: AuditSource;
  /** Marker for downstream routing: audit lines must land in the audit store. */
  logType: 'audit';
}
