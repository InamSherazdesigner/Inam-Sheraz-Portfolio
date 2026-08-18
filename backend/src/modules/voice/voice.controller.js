import { createVoiceSession, sendVoiceChat } from './voice.service.js';
import { ok } from '../../lib/response.js';

export async function postSession(req, res) {
  const session = await createVoiceSession({
    requestId: res.locals.requestId,
    ip: req.ip,
    origin: req.get('origin') ?? null,
    userAgent: req.get('user-agent') ?? null,
    log: req.log,
  });

  /**
   * Cache-Control is not a formality here. The response body contains a
   * bearer token; a shared proxy or a CDN caching it would hand one visitor's
   * session to the next caller. `no-store` on every layer, always.
   */
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  return ok(res, {
    provider: session.provider,
    transport: session.transport,
    signedUrl: session.signedUrl,
    agentId: session.agentId,
    expiresAt: session.expiresAt,
    expiresInSeconds: session.expiresInSeconds,
    ...(session.mock ? { mock: true } : {}),
  });
}

export async function postChat(req, res) {
  const { messages, message, userText } = req.body || {};
  const text = userText || message;

  const result = await sendVoiceChat({
    messages: messages || [],
    userText: text,
    ctx: {
      requestId: res.locals.requestId,
      ip: req.ip,
      log: req.log,
    },
  });

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return ok(res, result);
}
