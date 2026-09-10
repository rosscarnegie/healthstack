import { Router } from 'express';

import { contextLogger } from '@healthstack/logger';

export const router: Router = Router();

/** Liveness / readiness probe. Never touches PHI, never audited. */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.get('/', (_req, res) => {
  contextLogger().debug('root request');
  res.json({ service: 'healthstack-api' });
});
