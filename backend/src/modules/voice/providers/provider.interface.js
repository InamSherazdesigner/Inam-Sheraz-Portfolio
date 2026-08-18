/**
 * THE VOICE PROVIDER CONTRACT.
 *
 * Everything above this line — the controller, the route, the React widget —
 * is written against this shape and knows nothing about ElevenLabs. Swapping
 * provider is a config change plus one file in this folder, and touches no
 * frontend code at all.
 *
 * A provider must satisfy:
 *
 *   name: string
 *
 *   createSession({ requestId }) -> Promise<VoiceSession>
 *     Exchanges the server-held credential for a short-lived, single-purpose
 *     token the browser may hold. The credential itself never appears in the
 *     return value. A provider that cannot honour that is not usable here.
 *
 *   health() -> Promise<{ ok: boolean, detail?: string }>
 *     Cheap liveness check for /health/ready. Must not create a billable
 *     session.
 *
 * VoiceSession:
 *   {
 *     provider:    'elevenlabs' | 'mock',
 *     transport:   'websocket',
 *     signedUrl:   string,   // the only sensitive field; logged as [redacted]
 *     agentId:     string,   // not a secret — identifies which agent, not who
 *     expiresAt:   string,   // ISO 8601
 *     expiresInSeconds: number,
 *   }
 */

export const VOICE_TRANSPORT = Object.freeze({ WEBSOCKET: 'websocket' });
