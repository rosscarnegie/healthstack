/**
 * Default redaction paths applied to every log record.
 *
 * These are `fast-redact` path strings (the syntax pino's `redact` option uses).
 * A single leading wildcard (`*.field`) matches the field one level deep inside
 * any object, which covers the common case of nested request/response/context
 * payloads without walking the whole tree.
 *
 * The goal is defence-in-depth: application code should never put PHI or secrets
 * into a log in the first place, but if it does, these paths blank the value
 * before it leaves the process. The list is intentionally conservative about
 * healthcare identifiers (HIPAA Safe Harbor direct identifiers) as well as
 * credentials.
 *
 * Extend or replace this per-service via `createLogger({ redact: [...] })`.
 */
export const DEFAULT_REDACT_PATHS: readonly string[] = [
  // --- Credentials / secrets ---
  'password',
  '*.password',
  'newPassword',
  '*.newPassword',
  'currentPassword',
  '*.currentPassword',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'idToken',
  '*.idToken',
  'secret',
  '*.secret',
  'clientSecret',
  '*.clientSecret',
  'apiKey',
  '*.apiKey',
  'authorization',
  '*.authorization',
  'cookie',
  '*.cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',

  // --- Direct identifiers (HIPAA Safe Harbor) ---
  'ssn',
  '*.ssn',
  'socialSecurityNumber',
  '*.socialSecurityNumber',
  'mrn',
  '*.mrn',
  'medicalRecordNumber',
  '*.medicalRecordNumber',
  'dob',
  '*.dob',
  'dateOfBirth',
  '*.dateOfBirth',
  'birthDate',
  '*.birthDate',
  'firstName',
  '*.firstName',
  'lastName',
  '*.lastName',
  'givenName',
  '*.givenName',
  'familyName',
  '*.familyName',
  'patientName',
  '*.patientName',
  'email',
  '*.email',
  'phone',
  '*.phone',
  'phoneNumber',
  '*.phoneNumber',
  'address',
  '*.address',
  'streetAddress',
  '*.streetAddress',
  'postalCode',
  '*.postalCode',
  'insuranceId',
  '*.insuranceId',
  'memberId',
  '*.memberId',
  'beneficiaryId',
  '*.beneficiaryId',
] as const;

export const REDACTION_CENSOR = '[REDACTED]';
