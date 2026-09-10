import express, { type Express } from 'express';
import cors from 'cors';
import { createHttpLogger } from '@healthstack/logger';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestContext } from './middleware/request-context.js';
import { errorHandler, NotFoundError } from './middleware/error-handler.js';
import { router } from './router/index.js';

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception - exiting');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection');
});

const app: Express = express();

// Discourages a casual exploit
app.disable('x-powered-by');
app.set('trust proxy', true);

// Request-scoped correlation ids + logging context, then one log line per request.
app.use(requestContext);
app.use(createHttpLogger({ logger }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));

app.use(cors({ origin: env.CORS_URL ?? false, optionsSuccessStatus: 200 }));

// Routes
app.use('/', router);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

export default app;
