import { createHash } from 'node:crypto';

/** Seed value for the first record in a chain (`previousHash` of record #1). */
export const GENESIS_HASH = '0'.repeat(64);

/**
 * Deterministic JSON serialization: object keys sorted lexicographically at
 * every level, `undefined` values dropped, array order preserved.
 *
 * Two records with the same content always produce the same string (and thus
 * the same hash) regardless of property insertion order.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }
  return value;
}

/**
 * SHA-256 of a record's canonical form, excluding any existing `hash` field so
 * that hashing is idempotent and verifiable.
 */
export function hashRecord(record: Record<string, unknown>): string {
  const { hash: _omit, ...rest } = record;
  return createHash('sha256').update(canonicalize(rest)).digest('hex');
}

export interface ChainLink {
  hash: string;
  previousHash: string;
}

export interface ChainVerification {
  valid: boolean;
  /** Index of the first record that broke the chain, or `-1` if valid. */
  brokenAt: number;
  reason?: 'previous-hash-mismatch' | 'content-hash-mismatch';
}

/**
 * Verify an ordered slice of a hash chain. `expectedFirstPrevHash` defaults to
 * {@link GENESIS_HASH}; pass the prior record's `hash` when verifying a
 * mid-stream window.
 */
export function verifyChain(
  records: ReadonlyArray<ChainLink & Record<string, unknown>>,
  expectedFirstPrevHash: string = GENESIS_HASH,
): ChainVerification {
  let previous = expectedFirstPrevHash;

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i]!;
    if (record.previousHash !== previous) {
      return { valid: false, brokenAt: i, reason: 'previous-hash-mismatch' };
    }
    if (hashRecord(record) !== record.hash) {
      return { valid: false, brokenAt: i, reason: 'content-hash-mismatch' };
    }
    previous = record.hash;
  }

  return { valid: true, brokenAt: -1 };
}
