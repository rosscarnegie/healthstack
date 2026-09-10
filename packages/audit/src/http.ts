import type { AuditActor } from './types.js';

/**
 * The subset of an incoming HTTP request this package needs. Structural, so
 * `@healthstack/audit` does not take a dependency on Express (an
 * `express.Request` satisfies it).
 */
export interface AuditRequestLike {
  ip?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  auth?: { sub?: string; roles?: string[] } | undefined;
}

export interface ActorFromRequestOptions {
  /** Override the resolved actor id (default: `req.auth.sub` or `"anonymous"`). */
  id?: string;
  type?: AuditActor['type'];
  roles?: string[];
}

function header(req: AuditRequestLike, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Build an {@link AuditActor} from an HTTP request: identity from the verified
 * auth context, source IP from `req.ip`, session from `x-session-id`.
 */
export function actorFromRequest(
  req: AuditRequestLike,
  options: ActorFromRequestOptions = {},
): AuditActor {
  const id = options.id ?? req.auth?.sub ?? 'anonymous';
  const roles = options.roles ?? req.auth?.roles;
  const address = req.ip;
  const sessionId = header(req, 'x-session-id');

  return {
    id,
    type: options.type ?? 'user',
    requestor: true,
    ...(roles && roles.length > 0 ? { roles } : {}),
    ...(address ? { network: { address, type: 'ip' as const } } : {}),
    ...(sessionId ? { sessionId } : {}),
  };
}
