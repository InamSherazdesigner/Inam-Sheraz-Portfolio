/**
 * SECURITY HEADERS AND ORIGIN CONTROL.
 *
 * This service is an API, not a page server: it renders no HTML, so its CSP
 * can be the strictest one there is — `default-src 'none'`. The website's own
 * CSP is set separately in the frontend (next.config.mjs), where it has to
 * accommodate real markup.
 */

import cors from 'cors';
import helmet from 'helmet';
import { env } from '../config/env.js';
import { ApiError, ErrorCode } from '../lib/ApiError.js';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' },
  // 180 days. Only meaningful once the API is behind HTTPS, which it must be
  // in production — see docs/04-runbook.md.
  hsts: { maxAge: 15_552_000, includeSubDomains: true, preload: false },
  xFrameOptions: { action: 'deny' },
  // The default value leaks the framework. There is no reason to advertise it.
  hidePoweredBy: true,
});

/**
 * CORS is the first of two origin checks. It stops a browser on someone
 * else's site from reading our responses.
 *
 * It is NOT sufficient on its own for the voice endpoint — `Origin` is absent
 * or forged on any non-browser client, and that endpoint spends real money per
 * call. The second, stricter check lives in requireAllowedOrigin below.
 */
export const corsPolicy = cors({
  origin(origin, callback) {
    // Same-origin requests, curl and server-to-server calls send no Origin.
    // Health checks and monitoring depend on this being allowed.
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, ErrorCode.ORIGIN_NOT_ALLOWED, 'Origin not allowed.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'Retry-After'],
  credentials: false,
  maxAge: 86_400,
});

/**
 * The stricter check, applied only to endpoints that cost money or reveal a
 * credential-derived token. Here a *missing* Origin is refused rather than
 * waved through: every legitimate caller of these routes is a browser on the
 * portfolio, and browsers always send it on a cross-origin POST.
 *
 * This is a deterrent against casual scraping of the session endpoint, not a
 * proof of identity — a determined caller can set any header they like. The
 * rate limits behind it are what actually caps the bill. Stated plainly here
 * so nobody later mistakes it for authentication.
 */
export function requireAllowedOrigin(req, _res, next) {
  const origin = req.get('origin');
  if (origin && env.CORS_ORIGINS.includes(origin)) return next();

  return next(
    new ApiError(
      403,
      ErrorCode.ORIGIN_NOT_ALLOWED,
      'This endpoint may only be called from the portfolio itself.'
    )
  );
}
