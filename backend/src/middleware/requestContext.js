/**
 * REQUEST CONTEXT — a correlation ID on every request, in every log line, and
 * on every response body and header.
 *
 * An inbound `x-request-id` is honoured so a trace survives a proxy in front
 * of this service, but it is length-capped and character-filtered first: it is
 * attacker-controlled input that ends up in log files, and an unfiltered value
 * containing newlines lets someone forge log entries.
 */

import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';

const SAFE_ID = /^[A-Za-z0-9._-]{1,64}$/;

export function requestContext(req, res, next) {
  const inbound = req.get('x-request-id');
  const requestId = inbound && SAFE_ID.test(inbound) ? inbound : randomUUID();

  req.id = requestId;
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  quietReqLogger: true,
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  // Health checks fire every few seconds. Logging them buries real traffic.
  autoLogging: {
    ignore: (req) => req.url === '/health/live' || req.url === '/health/ready',
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
