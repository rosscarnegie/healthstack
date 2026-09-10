import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.coerce.number().int().positive(),
  SERVICE_NAME: z.string().min(1).default('healthstack-api'),
  APP_VERSION: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).optional(),
  SITE_ID: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  CORS_URL: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
