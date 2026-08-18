/**
 * RATE LIMITS.
 *
 * Two of these are cost controls, not just abuse controls. Every voice session
 * bills per minute of conversation, so an unbounded session endpoint is an
 * unbounded invoice. The per-IP limit stops one visitor looping; the global
 * limit caps total spend in a window even if the per-IP limit is spread across
 * many addresses.
 *
 * Store note: this is an in-memory limiter, so counters are per process. That
 * is correct for the single-instance deployment described in the runbook. If
 * this is ever scaled horizontally, swap in a shared Redis store — the limit
 * silently becomes N times looser otherwise. Flagged in docs/04-runbook.md.
 */

import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ErrorCode } from '../lib/ApiError.js';
import { fail } from '../lib/response.js';

const handler = (message) => (req, res) => {
  const retryAfterSeconds = Math.ceil((res.getHeader('Retry-After') ?? 60) / 1) || 60;
  req.log?.warn({ ip: req.ip, path: req.path }, 'rate limit exceeded');
  return fail(res, {
    status: 429,
    code: ErrorCode.RATE_LIMITED,
    message,
    meta: { retryAfterSeconds },
  });
};

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Health probes must never be throttled — a throttled probe reads as an
  // outage and can trigger a pointless restart loop.
  skip: (req) => req.path.startsWith('/health'),
};

export const globalLimiter = rateLimit({
  ...base,
  windowMs: 60_000,
  max: 300,
  handler: handler('Too many requests. Please slow down.'),
});

export const voiceLimiter = rateLimit({
  ...base,
  windowMs: env.VOICE_RATE_LIMIT_WINDOW_MS,
  max: env.VOICE_RATE_LIMIT_MAX,
  handler: handler(
    'You have started several voice sessions already. Please wait a few minutes before starting another.'
  ),
});

/** One shared bucket for everyone. The ceiling on the bill. */
export const voiceGlobalLimiter = rateLimit({
  ...base,
  windowMs: env.VOICE_RATE_LIMIT_WINDOW_MS,
  max: env.VOICE_GLOBAL_LIMIT_MAX,
  keyGenerator: () => 'voice:all',
  handler: handler('The voice agent is busy right now. Please try again shortly.'),
});

export const contactLimiter = rateLimit({
  ...base,
  windowMs: env.CONTACT_RATE_LIMIT_WINDOW_MS,
  max: env.CONTACT_RATE_LIMIT_MAX,
  handler: handler('You have already sent a message recently. Please wait before sending another.'),
});

/**
 * Slows password guessing on the CAT gate. The gate is a deterrent by design
 * (ADR 0004) and this keeps it from being trivially brute-forced, without
 * pretending the result is security.
 */
export const gateLimiter = rateLimit({
  ...base,
  windowMs: env.GATE_RATE_LIMIT_WINDOW_MS,
  max: env.GATE_RATE_LIMIT_MAX,
  handler: handler('Too many attempts. Please wait, or just ask me for the set.'),
});
