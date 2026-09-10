export {
  AuditLogger,
  AUDIT_SCHEMA_VERSION,
  type AuditLoggerOptions,
  type PhiGuardMode,
  type WriteFailureMode,
} from './audit-logger.js';

export {
  type AuditAction,
  type AuditOutcome,
  type PurposeOfUse,
  type AuditActor,
  type AuditActorNetwork,
  type AuditSource,
  type AuditEntity,
  type AuditEntityLifecycle,
  type AuditEventInput,
  type AuditRecord,
} from './types.js';

export {
  canonicalize,
  hashRecord,
  verifyChain,
  GENESIS_HASH,
  type ChainLink,
  type ChainVerification,
} from './hash-chain.js';

export { scanForPhi, type PhiScanResult } from './phi-guard.js';
export { AuditPhiError, AuditWriteError } from './errors.js';

export { type AuditSink, StdoutAuditSink, InMemoryAuditSink } from './sinks/index.js';

export { actorFromRequest, type AuditRequestLike, type ActorFromRequestOptions } from './http.js';
