import { AsyncLocalStorage } from 'node:async_hooks';

import type { Logger } from 'pino';

import { getLogger } from './logger.js';

/**
 * Fields that identify a unit of work (an HTTP request, a queue message, a job
 * run). Anything added here is bound onto a child logger and attached to every
 * log line emitted while that work is in flight.
 */
export interface LogContext {
  requestId?: string;
  correlationId?: string;
  tenantId?: string;
  actorId?: string;
  [key: string]: unknown;
}

interface Store {
  context: LogContext;
  logger: Logger;
}

const storage = new AsyncLocalStorage<Store>();

/**
 * Run `fn` with an ambient {@link LogContext}. Nested calls merge onto the
 * enclosing context. Use {@link contextLogger} inside `fn` (and anything it
 * awaits) to get a logger pre-bound with these fields.
 */
export function runWithContext<T>(context: LogContext, fn: () => T): T {
  const parent = storage.getStore();
  const merged: LogContext = { ...parent?.context, ...context };
  const logger = (parent?.logger ?? getLogger()).child(context);
  return storage.run({ context: merged, logger }, fn);
}

/** Merge additional fields into the current context's logger, if one is active. */
export function addContext(fields: LogContext): void {
  const store = storage.getStore();
  if (!store) return;
  Object.assign(store.context, fields);
  store.logger = store.logger.child(fields);
}

/** The current ambient context, or `undefined` outside {@link runWithContext}. */
export function getContext(): LogContext | undefined {
  return storage.getStore()?.context;
}

/**
 * The context-bound logger if inside {@link runWithContext}, otherwise the root
 * logger. Safe to call anywhere.
 */
export function contextLogger(): Logger {
  return storage.getStore()?.logger ?? getLogger();
}
