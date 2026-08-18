/**
 * THE ONE ERROR HANDLER.
 *
 * Every failure in the service — thrown, rejected, or raised by a library —
 * arrives here and leaves as the same JSON envelope. There is no second place
 * that formats an error, which is the only way the frontend can rely on the
 * shape.
 *
 * The rule it enforces: an unexpected error's message is never sent to the
 * visitor. A stack trace or a driver message can name internal hosts, query
 * shapes and file paths. The visitor gets a calm sentence and a request ID;
 * the log gets everything.
 */

import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError, ErrorCode } from '../lib/ApiError.js';
import { fail } from '../lib/response.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}.`));
}

/**
 * Express identifies the error handler by arity alone — a four-argument
 * middleware is an error handler, a three-argument one is not. `_next` must
 * therefore stay in the signature even though nothing calls it; removing it
 * would silently turn this into ordinary middleware and every error would fall
 * through to Express's default HTML handler.
 */
export function errorHandler(error, req, res, _next) {
  const normalised = normalise(error);

  const log = req.log ?? console;
  const payload = {
    err: error,
    code: normalised.code,
    status: normalised.status,
    requestId: res.locals.requestId,
  };

  if (normalised.status >= 500) {
    log.error(payload, 'request failed');
  } else {
    // Expected refusals — a bad password, a rate limit, a validation miss.
    // Noise at error level here would bury the failures that matter.
    log.warn(payload, 'request rejected');
  }

  if (normalised.retryAfterSeconds) {
    res.setHeader('Retry-After', String(normalised.retryAfterSeconds));
  }

  return fail(res, {
    status: normalised.status,
    code: normalised.code,
    message: normalised.message,
    details: normalised.details,
    // The stack is a development aid and must never ship. Gated on NODE_ENV
    // rather than a flag someone could flip on by accident in production.
    ...(isProduction ? {} : { meta: { stack: error?.stack } }),
  });
}

function normalise(error) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }

  // A schema that was validated somewhere other than the validate middleware.
  if (error instanceof ZodError) {
    return {
      status: 400,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Some of that was not quite right.',
      details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      status: 400,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Some of that was not quite right.',
      details: Object.values(error.errors).map((e) => ({ field: e.path, message: e.message })),
    };
  }

  // Thrown by the JSON body parser on malformed input.
  if (error?.type === 'entity.parse.failed') {
    return {
      status: 400,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'That request body was not valid JSON.',
    };
  }
  if (error?.type === 'entity.too.large') {
    return {
      status: 413,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'That request was too large.',
    };
  }

  return {
    status: 500,
    code: ErrorCode.INTERNAL,
    message: 'Something went wrong on our end. The request ID below will find it in the logs.',
  };
}
