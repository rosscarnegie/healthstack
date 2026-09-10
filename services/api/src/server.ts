import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { audit } from './config/audit.js';
import app from './app.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, `${env.SERVICE_NAME} listening on port ${env.PORT}`);
});

/**
 * Graceful shutdown: stop accepting connections, drain in-flight requests, flush
 * the audit sinks, then exit.
 */
let shuttingDown = false;
const shutdown = (signal: NodeJS.Signals): void => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutdown signal received: closing HTTP server');

  server.close((err) => {
    void audit
      .flush()
      .catch((flushErr: unknown) => logger.error({ err: flushErr }, 'audit flush failed'))
      .finally(() => {
        if (err) {
          logger.error({ err }, 'error while closing HTTP server');
          process.exit(1);
        }
        logger.info('HTTP server closed');
        process.exit(0);
      });
  });

  // Failsafe: do not hang forever waiting on open connections.
  setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
