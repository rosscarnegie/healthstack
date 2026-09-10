import type { Response, ErrorRequestHandler } from 'express';
import { contextLogger } from '@healthstack/logger';
import { actorFromRequest } from '@healthstack/audit';
import { env } from '../config/env.js';
import { audit } from '../config/audit.js';
import {
  AuthFailureResponse,
  AccessTokenErrorResponse,
  InternalErrorResponse,
  NotFoundResponse,
  BadRequestResponse,
  ForbiddenResponse,
} from './ApiResponse.js';

export enum ErrorType {
  ACCESS_TOKEN = 'AccessTokenError',
  BAD_REQUEST = 'BadRequestError',
  BAD_TOKEN = 'BadTokenError',
  FORBIDDEN = 'ForbiddenError',
  INTERNAL = 'InternalError',
  NO_DATA = 'NoDataError',
  NO_ENTRY = 'NoEntryError',
  NOT_FOUND = 'NotFoundError',
  TOKEN_EXPIRED = 'TokenExpiredError',
  UNAUTHORIZED = 'AuthFailureError',
}

export abstract class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public override message: string = 'error',
  ) {
    super(type);
  }

  public static handle(err: ApiError, res: Response): Response {
    switch (err.type) {
      case ErrorType.ACCESS_TOKEN:
        return new AccessTokenErrorResponse(err.message).send(res);
      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);
      case ErrorType.BAD_TOKEN:
      case ErrorType.TOKEN_EXPIRED:
      case ErrorType.UNAUTHORIZED:
        return new AuthFailureResponse(err.message).send(res);
      case ErrorType.FORBIDDEN:
        return new ForbiddenResponse(err.message).send(res);
      case ErrorType.INTERNAL:
        return new InternalErrorResponse(err.message).send(res);
      case ErrorType.NO_DATA:
      case ErrorType.NO_ENTRY:
      case ErrorType.NOT_FOUND:
        return new NotFoundResponse(err.message).send(res);

      default: {
        let message = err.message;
        // Do not send failure message in production as it may send sensitive data
        if (env.ENVIRONMENT === 'production') message = 'An error occured';
        return new InternalErrorResponse(message).send(res);
      }
    }
  }
}

export class AuthFailureError extends ApiError {
  constructor(message = 'Invalid Credentials') {
    super(ErrorType.UNAUTHORIZED, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal error') {
    super(ErrorType.INTERNAL, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied') {
    super(ErrorType.FORBIDDEN, message);
  }
}

export class NoEntryError extends ApiError {
  constructor(message = "Entry don't exists") {
    super(ErrorType.NO_ENTRY, message);
  }
}

export class BadTokenError extends ApiError {
  constructor(message = 'Token is not valid') {
    super(ErrorType.BAD_TOKEN, message);
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message = 'Token is expired') {
    super(ErrorType.TOKEN_EXPIRED, message);
  }
}

export class NoDataError extends ApiError {
  constructor(message = 'No data available') {
    super(ErrorType.NO_DATA, message);
  }
}

export class AccessTokenError extends ApiError {
  constructor(message = 'Invalid access token') {
    super(ErrorType.ACCESS_TOKEN, message);
  }
}

/** Error types that represent an authn/authz denial and are themselves auditable. */
const AUTH_ERROR_TYPES: ReadonlySet<ErrorType> = new Set([
  ErrorType.UNAUTHORIZED,
  ErrorType.FORBIDDEN,
  ErrorType.ACCESS_TOKEN,
  ErrorType.BAD_TOKEN,
  ErrorType.TOKEN_EXPIRED,
]);

function recordAuthFailure(err: ApiError, req: Parameters<ErrorRequestHandler>[1]): void {
  const log = contextLogger();
  void audit
    .record({
      category: 'authorization',
      subtype: err.type,
      action: 'execute',
      outcome: 'minor-failure',
      outcomeDescription: err.message,
      actor: actorFromRequest(req),
      entities: [{ type: 'http-route', id: `${req.method} ${req.path}` }],
    })
    .catch((auditErr: unknown) => {
      log.error({ err: auditErr }, 'failed to record authorization audit event');
    });
}

// Middleware Error Handler
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const log = contextLogger();

  if (err instanceof ApiError) {
    ApiError.handle(err, res);

    if (AUTH_ERROR_TYPES.has(err.type)) {
      log.warn({ err, url: req.originalUrl, method: req.method }, `auth failure: ${err.message}`);
      recordAuthFailure(err, req);
    }

    if (err.type === ErrorType.INTERNAL) {
      log.error(
        { err, url: req.originalUrl, method: req.method, ip: req.ip },
        `500 - ${err.message}`,
      );
    }
    return;
  }

  log.error(
    { err, url: req.originalUrl, method: req.method, ip: req.ip },
    `unhandled error: ${err instanceof Error ? err.message : String(err)}`,
  );

  if (env.ENVIRONMENT === 'development') {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return;
  }

  ApiError.handle(new InternalError(), res);
};
