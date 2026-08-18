/**
 * LOGGING — structured, correlated, and incapable of printing a secret.
 *
 * Every line is JSON with a `requestId` so one visitor's journey can be pulled
 * out of a day of traffic. The redaction list is not decoration: the voice
 * proxy handles an ElevenLabs key and hands back signed URLs, and neither may
 * ever reach a log aggregator.
 */

import pino from 'pino';
import { env, isProduction, isTest } from '../config/env.js';

/** Paths scrubbed to `[redacted]` before anything is written. */
const REDACT = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["xi-api-key"]',
  'res.headers["set-cookie"]',
  'apiKey',
  'password',
  'signedUrl',
  'signed_url',
  '*.apiKey',
  '*.password',
  '*.signedUrl',
];

export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  redact: { paths: REDACT, censor: '[redacted]' },
  base: { service: 'portfolio-api', env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Pretty output is a developer convenience only. Production emits raw JSON
  // so a log shipper can parse it.
  transport: isProduction || isTest ? undefined : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});

/** A child logger bound to one request. Handed to services via req.log. */
export const childLogger = (bindings) => logger.child(bindings);
