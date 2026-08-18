/**
 * MOCK VOICE PROVIDER — for local work and for the test suite.
 *
 * It returns a session-shaped object with an unroutable wss:// URL. That is
 * deliberate: the widget's whole state machine — requesting, connecting,
 * failing, retrying, expiring — can be exercised without an account, without a
 * key and without spending a cent, and the failure it produces is a real
 * connection failure rather than a stub.
 *
 * env.js refuses to boot with NODE_ENV=production and VOICE_PROVIDER=mock, so
 * this can never quietly become what a visitor is talking to.
 */

import { randomUUID } from 'node:crypto';
import { VOICE_TRANSPORT } from './provider.interface.js';

const TTL_SECONDS = 45;

export function createMockProvider() {
  return {
    name: 'mock',

    async createSession() {
      const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
      return {
        provider: 'mock',
        transport: VOICE_TRANSPORT.WEBSOCKET,
        // RFC 6761 reserves .invalid — guaranteed never to resolve.
        signedUrl: `wss://mock.invalid/convai/${randomUUID()}`,
        agentId: 'mock-agent',
        expiresAt: expiresAt.toISOString(),
        expiresInSeconds: TTL_SECONDS,
        mock: true,
      };
    },

    async health() {
      return { ok: true, detail: 'mock provider' };
    },
  };
}
