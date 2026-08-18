/**
 * ERRORS — one class, one shape, one place they are turned into responses.
 *
 * Two audiences are kept apart on purpose:
 *   `message`  goes to the visitor. Plain, calm, never blames them, never
 *              leaks how the system is built.
 *   `cause`    goes to the log. Stack, upstream status, provider payload.
 *
 * `code` is a stable machine-readable string. The frontend switches on it —
 * it must never have to parse prose.
 */

export const ErrorCode = Object.freeze({
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  ORIGIN_NOT_ALLOWED: 'ORIGIN_NOT_ALLOWED',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_REJECTED: 'UPSTREAM_REJECTED',
  VOICE_DISABLED: 'VOICE_DISABLED',
  GATE_DENIED: 'GATE_DENIED',
  INTERNAL: 'INTERNAL',
});

export class ApiError extends Error {
  /**
   * @param {number} status  HTTP status.
   * @param {string} code    One of ErrorCode. Stable across releases.
   * @param {string} message Safe to show a visitor.
   * @param {object} [opts]
   * @param {unknown} [opts.cause]    Original error, logged, never sent.
   * @param {object}  [opts.details]  Field-level detail, safe to send.
   * @param {number}  [opts.retryAfterSeconds]
   */
  constructor(status, code, message, opts = {}) {
    super(message, { cause: opts.cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = opts.details;
    this.retryAfterSeconds = opts.retryAfterSeconds;
    // Marks errors we raised deliberately, so the handler can tell them apart
    // from genuine crashes and decide how loudly to log.
    this.expected = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, details) {
    return new ApiError(400, ErrorCode.VALIDATION_FAILED, message, { details });
  }

  static notFound(message = 'Not found.') {
    return new ApiError(404, ErrorCode.NOT_FOUND, message);
  }

  static forbidden(code, message) {
    return new ApiError(403, code, message);
  }

  static tooManyRequests(message, retryAfterSeconds) {
    return new ApiError(429, ErrorCode.RATE_LIMITED, message, { retryAfterSeconds });
  }

  static upstream(message, cause) {
    return new ApiError(502, ErrorCode.UPSTREAM_UNAVAILABLE, message, { cause });
  }

  static internal(message = 'Something went wrong on our end.', cause) {
    return new ApiError(500, ErrorCode.INTERNAL, message, { cause });
  }
}
