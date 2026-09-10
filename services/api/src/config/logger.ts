import { initLogger, type Logger } from '@healthstack/logger';
import { env } from './env.js';

/**
 * Process-wide root logger. Import {@link contextLogger} from
 * `@healthstack/logger` inside request handlers to get a logger pre-bound with
 * the request/correlation ids.
 */
export const logger: Logger = initLogger({
  service: env.SERVICE_NAME,
  environment: env.ENVIRONMENT,
  ...(env.APP_VERSION ? { version: env.APP_VERSION } : {}),
  ...(env.LOG_LEVEL ? { level: env.LOG_LEVEL } : {}),
});
