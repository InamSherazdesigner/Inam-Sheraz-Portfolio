/**
 * VOICE SERVICE — the business logic, with no Express and no provider SDK in
 * sight. It takes a request context, returns a session, and records what
 * happened. Testable in isolation; that is the point of the layer.
 */

import { getVoiceProvider } from './providers/index.js';
import { VoiceSession } from './voiceSession.model.js';
import { CircuitBreaker } from '../../lib/resilience.js';
import { hashClient } from '../../lib/hash.js';
import { isDatabaseConnected } from '../../config/database.js';
import { logger } from '../../lib/logger.js';
import { ApiError } from '../../lib/ApiError.js';

/**
 * Module-level: the breaker's value is entirely in the state it accumulates
 * across requests. One per process, per upstream.
 */
const breaker = new CircuitBreaker({
  name: 'elevenlabs',
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  logger,
});

export const voiceBreakerSnapshot = () => breaker.snapshot();

/**
 * Mint a browser-safe session.
 *
 * @param {object} ctx
 * @param {string} ctx.requestId
 * @param {string} ctx.ip
 * @param {string|null} ctx.origin
 * @param {string|null} ctx.userAgent
 * @param {import('pino').Logger} ctx.log
 */
export async function createVoiceSession(ctx) {
  const provider = getVoiceProvider();
  const startedAt = Date.now();

  try {
    const session = await breaker.execute(() =>
      provider.createSession({ requestId: ctx.requestId })
    );

    await record({
      ctx,
      provider: session.provider,
      agentId: session.agentId,
      outcome: 'issued',
      latencyMs: Date.now() - startedAt,
      expiresAt: new Date(session.expiresAt),
    });

    ctx.log.info(
      {
        provider: session.provider,
        agentId: session.agentId,
        latencyMs: Date.now() - startedAt,
        // signedUrl is intentionally absent. The logger would redact it, but
        // the safest secret is the one never passed to the logger.
      },
      'voice session issued'
    );

    return session;
  } catch (error) {
    await record({
      ctx,
      provider: provider.name,
      agentId: 'unknown',
      outcome: 'failed',
      errorCode: error instanceof ApiError ? error.code : 'INTERNAL',
      latencyMs: Date.now() - startedAt,
    });
    throw error;
  }
}

/**
 * Handle conversational speech turn with Claude + ElevenLabs Voice TTS.
 */
export async function sendVoiceChat({ messages, userText, ctx }) {
  const provider = getVoiceProvider();
  if (typeof provider.chat !== 'function') {
    throw ApiError.badRequest('The active voice provider does not support chat endpoint.');
  }

  const result = await provider.chat({
    messages,
    userText,
    requestId: ctx.requestId,
  });

  return result;
}

/**
 * Audit write. Fire-and-report: a failure to write the ledger must never turn
 * a working voice session into a failed request for the visitor. The write is
 * bookkeeping; the session is the product.
 */
async function record({ ctx, provider, agentId, outcome, errorCode = null, latencyMs, expiresAt = null }) {
  if (!isDatabaseConnected()) return;

  try {
    await VoiceSession.create({
      requestId: ctx.requestId,
      provider,
      agentId,
      outcome,
      errorCode,
      latencyMs,
      clientHash: hashClient(ctx.ip),
      origin: ctx.origin ?? null,
      userAgent: ctx.userAgent?.slice(0, 300) ?? null,
      expiresAt,
    });
  } catch (error) {
    ctx.log.warn({ err: error }, 'could not write voice session audit row');
  }
}

/** Upstream liveness for /health/ready. Never mints a billable session. */
export async function voiceHealth() {
  const provider = getVoiceProvider();
  const snapshot = breaker.snapshot();

  // An open breaker already knows the answer. Asking again would defeat it.
  if (snapshot.state === 'open') {
    return { ok: false, provider: provider.name, breaker: snapshot, detail: 'circuit open' };
  }

  const result = await provider.health();
  return { ...result, provider: provider.name, breaker: snapshot };
}
