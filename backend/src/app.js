/**
 * THE EXPRESS APP.
 *
 * Assembled here, listened to in server.js. Keeping the two apart is what lets
 * the test suite mount the whole application in-process with supertest and
 * never bind a port.
 *
 * Middleware order is load-bearing and reads top to bottom as a funnel:
 * identify → protect → parse → route → handle failure.
 */

import express from 'express';
import compression from 'compression';
import { requestContext, httpLogger } from './middleware/requestContext.js';
import { securityHeaders, corsPolicy } from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';
import { healthRouter } from './modules/health/health.routes.js';
import { openApiDocument } from './docs/openapi.js';
import { isProduction } from './config/env.js';

export function createApp() {
  const app = express();

  /**
   * Behind a reverse proxy (Nginx, Render, Fly, Railway) the socket address is
   * the proxy's. Trusting exactly one hop makes req.ip the real client, which
   * every rate limiter here depends on. Trusting *all* hops would let a caller
   * forge X-Forwarded-For and walk straight past the limits, so this is
   * deliberately `1` and not `true`.
   */
  app.set('trust proxy', isProduction ? 1 : false);
  app.disable('x-powered-by');
  app.disable('etag'); // no cacheable payloads here; tokens must not be ETagged

  // --- Identify ------------------------------------------------------------
  app.use(requestContext);
  app.use(httpLogger);

  // --- Protect -------------------------------------------------------------
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(globalLimiter);

  // --- Parse ---------------------------------------------------------------
  // 64kb is generous for a contact form and small enough that a body-flood
  // costs the attacker more than it costs us.
  app.use(express.json({ limit: '64kb' }));
  app.use(compression());

  // --- Route ---------------------------------------------------------------
  app.use('/health', healthRouter);
  app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
  app.use('/api/v1', apiRouter);

  // --- Handle failure ------------------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
