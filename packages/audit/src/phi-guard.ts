/**
 * Best-effort guard against PHI leaking into an audit record.
 *
 * Audit records are metadata: logical identifiers, counts, outcomes. They must
 * not carry names, contact details, dates of birth, SSNs, MRNs, free-text
 * clinical notes, etc. This scanner walks a candidate event and flags:
 *
 * - object keys whose name implies a PHI value
 * - string values that pattern-match an SSN or email address
 *
 * It is a tripwire, not a classifier — it will miss cleverly-named fields. Use
 * it in `enforce` mode in non-production environments so violations fail loudly
 * during development, and `warn` mode in production so a genuine incident is
 * recorded rather than dropped.
 */

const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  'name',
  'firstname',
  'lastname',
  'fullname',
  'givenname',
  'familyname',
  'middlename',
  'maidenname',
  'dob',
  'dateofbirth',
  'birthdate',
  'ssn',
  'socialsecuritynumber',
  'mrn',
  'medicalrecordnumber',
  'email',
  'emailaddress',
  'phone',
  'phonenumber',
  'telecom',
  'address',
  'streetaddress',
  'addressline',
  'city',
  'zip',
  'zipcode',
  'postalcode',
  'insuranceid',
  'memberid',
  'beneficiaryid',
  'password',
  'token',
  'authorization',
  'note',
  'notes',
  'freetext',
  'narrative',
]);

/** Keys that legitimately end in an id-ish word and should not be flagged. */
const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  'patientid',
  'tenantid',
  'requestid',
  'correlationid',
  'sessionid',
  'resourceid',
  'actorid',
  'id',
]);

const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;

export interface PhiScanResult {
  ok: boolean;
  violations: string[];
}

export function scanForPhi(value: unknown): PhiScanResult {
  const violations: string[] = [];
  walk(value, '', violations, 0);
  return { ok: violations.length === 0, violations };
}

function walk(value: unknown, path: string, out: string[], depth: number): void {
  if (depth > 12) return;

  if (typeof value === 'string') {
    if (SSN_RE.test(value)) out.push(`${path || '<root>'} looks like an SSN`);
    if (EMAIL_RE.test(value)) out.push(`${path || '<root>'} looks like an email address`);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, out, depth + 1));
    return;
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const normalized = key.toLowerCase().replace(/[_-]/g, '');
      const childPath = path ? `${path}.${key}` : key;
      if (FORBIDDEN_KEYS.has(normalized) && !ALLOWED_KEYS.has(normalized)) {
        out.push(`${childPath} is a disallowed PHI field name`);
      }
      walk(child, childPath, out, depth + 1);
    }
  }
}
