import { hostname } from 'node:os';

import {
  pino,
  stdSerializers,
  stdTimeFunctions,
  type DestinationStream,
  type Level,
  type Logger,
  type LoggerOptions,
} from 'pino';

import { isDeployedEnvironment, resolveEnvironment, type AppEnvironment } from './environment.js';
import { DEFAULT_REDACT_PATHS, REDACTION_CENSOR } from './redaction.js';

export type LogLevel = Level | 'silent';

export interface CreateLoggerOptions {
  /** Service / package name. Emitted as `service` on every record. */
  service: string;
  /** Override the auto-detected environment. */
  environment?: AppEnvironment;
  /**
   * Override the level. Precedence:
   * explicit option -> `LOG_LEVEL` env var -> per-environment default.
   */
  level?: LogLevel;
  /** Deployed build/version identifier, emitted as `version`. */
  version?: string;
  /** Extra fields merged into every record's base. */
  base?: Record<string, unknown>;
  /** Replace the default redaction paths entirely. */
  redact?: readonly string[];
  /** Force pretty-printing on/off (defaults to on only in `development`). */
  pretty?: boolean;
  /** Write to a specific stream instead of stdout (tests, files, transports). */
  destination?: DestinationStream;
}

/**
 * Per-environment default level.
 *
 * - `development`: `debug`, developer wants to see everything.
 * - `test`: `silent`, keep test output clean. Override with `LOG_LEVEL` or the
 *   `level` option when debugging a test.
 * - `staging` / `production`: `info`. `debug` in a PHI environment risks leaking
 *   detail into log storage and is noisy at scale.
 */
const DEFAULT_LEVEL_BY_ENV: Record<AppEnvironment, LogLevel> = {
  development: 'debug',
  test: 'silent',
  staging: 'info',
  production: 'info',
};

const VALID_LEVELS = new Set<LogLevel>([
  'silent',
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

function resolveLevel(opts: CreateLoggerOptions, environment: AppEnvironment): LogLevel {
  if (opts.level) return opts.level;

  const fromEnv = process.env['LOG_LEVEL']?.trim().toLowerCase() as LogLevel | undefined;
  if (fromEnv && VALID_LEVELS.has(fromEnv)) return fromEnv;

  return DEFAULT_LEVEL_BY_ENV[environment];
}

/**
 * Create a structured pino logger configured for the current environment.
 *
 * All environments emit newline-delimited JSON with:
 * - ISO-8601 timestamps (`time`)
 * - textual levels (`level: "info"` rather than `30`)
 * - `message` as the message key (aligns with common log pipelines)
 * - `err` for serialized errors
 * - redaction of the paths in {@link DEFAULT_REDACT_PATHS}
 *
 * `development` additionally pipes through `pino-pretty` for human-readable output.
 */
export function createLogger(opts: CreateLoggerOptions): Logger {
  const environment = opts.environment ?? resolveEnvironment();
  const level = resolveLevel(opts, environment);
  const redactPaths = [...(opts.redact ?? DEFAULT_REDACT_PATHS)];

  const options: LoggerOptions = {
    level,
    base: {
      service: opts.service,
      env: environment,
      pid: process.pid,
      hostname: hostname(),
      ...(opts.version === undefined ? {} : { version: opts.version }),
      ...(opts.base ?? {}),
    },
    messageKey: 'message',
    errorKey: 'err',
    timestamp: stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: redactPaths,
      censor: REDACTION_CENSOR,
    },
    serializers: {
      err: stdSerializers.err,
      error: stdSerializers.err,
      req: stdSerializers.req,
      res: stdSerializers.res,
    },
  };

  if (opts.destination) {
    return pino(options, opts.destination);
  }

  const pretty = opts.pretty ?? environment === 'development';
  if (pretty && !isDeployedEnvironment(environment)) {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageKey: 'message',
        },
      },
    });
  }

  return pino(options);
}

let rootLogger: Logger | undefined;

/**
 * Create the process-wide root logger and remember it. Call once at startup;
 * everything else should use {@link getLogger} or a child logger.
 */
export function initLogger(opts: CreateLoggerOptions): Logger {
  rootLogger = createLogger(opts);
  return rootLogger;
}

/**
 * Return the root logger, lazily creating a minimal one if {@link initLogger}
 * was never called (e.g. in a library context or a test).
 */
export function getLogger(): Logger {
  if (!rootLogger) {
    rootLogger = createLogger({
      service: process.env['SERVICE_NAME']?.trim() || 'unknown-service',
    });
  }
  return rootLogger;
}

/** Reset the root logger. Intended for tests. */
export function resetLogger(): void {
  rootLogger = undefined;
}
