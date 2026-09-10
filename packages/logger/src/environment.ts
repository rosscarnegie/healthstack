/**
 * The four runtime environments a HealthStack service can run in. Behaviour of
 * the logger (level, transport, redaction) is derived from this value.
 */
export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export const APP_ENVIRONMENTS: readonly AppEnvironment[] = [
  'development',
  'test',
  'staging',
  'production',
] as const;

/**
 * Resolve the current environment.
 *
 * Precedence: explicit argument -> `ENVIRONMENT` -> `NODE_ENV` -> `development`.
 * `ENVIRONMENT` is preferred because `NODE_ENV` is only ever `production` or
 * `development` in most tooling and cannot distinguish staging from production —
 * a distinction that matters for a healthcare deployment.
 */
export function resolveEnvironment(explicit?: string): AppEnvironment {
  const raw = (explicit ?? process.env['ENVIRONMENT'] ?? process.env['NODE_ENV'] ?? 'development')
    .trim()
    .toLowerCase();

  switch (raw) {
    case 'production':
    case 'prod':
      return 'production';
    case 'staging':
    case 'stage':
    case 'stg':
      return 'staging';
    case 'test':
    case 'testing':
      return 'test';
    case 'development':
    case 'dev':
    case 'local':
      return 'development';
    default:
      return 'development';
  }
}

/** True for deployed, PHI-bearing environments where logs must be locked down. */
export function isDeployedEnvironment(env: AppEnvironment): boolean {
  return env === 'staging' || env === 'production';
}
