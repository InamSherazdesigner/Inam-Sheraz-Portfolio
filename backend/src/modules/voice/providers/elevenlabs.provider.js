/**
 * ELEVENLABS CONVERSATIONAL AI — the key-holding half of the feature.
 *
 * This is the only file in the entire repository that touches
 * ELEVENLABS_API_KEY, and it is server-only. The exchange is:
 *
 *   browser  ──POST /api/v1/voice/session──▶  this service
 *                                             (adds xi-api-key)
 *                                              │
 *                                              ▼
 *                                        ElevenLabs REST
 *                                              │
 *                              ◀── { signed_url } (expires ~60s)
 *   browser  ◀── { signedUrl, expiresAt } ─────┘
 *   browser  ──wss://…signed_url──▶  ElevenLabs   (audio only, no key)
 *
 * What the browser ends up holding is a URL that is single-purpose (one agent,
 * one conversation), short-lived (about a minute to *open* the socket), and
 * useless for anything else on the account. The key stays here. That is the
 * whole security property, and it is the reason this backend exists.
 */

import { env } from '../../../config/env.js';
import { ApiError, ErrorCode } from '../../../lib/ApiError.js';
import { fetchWithTimeout, withRetry } from '../../../lib/resilience.js';
import { VOICE_TRANSPORT } from './provider.interface.js';

const SIGNED_URL_PATH = '/v1/convai/conversation/get_signed_url';
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * ElevenLabs does not return an expiry with the signed URL. Their documented
 * validity is short — the URL must be used to open the socket within roughly a
 * minute. We publish a deliberately conservative 45s so the widget refreshes
 * before the URL dies rather than after, and a visitor never sees a socket
 * that fails to open.
 */
const ASSUMED_TTL_SECONDS = 45;

export function createElevenLabsProvider({ logger }) {
  const base = env.ELEVENLABS_API_BASE.replace(/\/+$/, '');
  const agentId = env.ELEVENLABS_AGENT_ID;

  async function call(path, { method = 'GET', query, timeout = REQUEST_TIMEOUT_MS } = {}) {
    const url = new URL(base + path);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);

    const response = await fetchWithTimeout(
      url,
      {
        method,
        headers: {
          // The credential. Present on exactly this hop and no other.
          'xi-api-key': env.ELEVENLABS_API_KEY,
          accept: 'application/json',
        },
      },
      timeout
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      // Attach the status so withRetry and the circuit breaker can tell a
      // 4xx (our fault, do not retry) from a 5xx (their fault, do retry).
      const error = new Error(`ElevenLabs ${method} ${path} -> ${response.status}`);
      error.status = response.status;
      error.body = body.slice(0, 500);
      throw error;
    }

    return response.json();
  }

  return {
    name: 'elevenlabs',

    async createSession({ requestId }) {
      const payload = await withRetry(
        () => call(SIGNED_URL_PATH, { query: { agent_id: agentId } }),
        {
          retries: 2,
          onRetry: ({ attempt, delay, error }) =>
            logger.warn(
              { requestId, attempt, delayMs: Math.round(delay), status: error?.status },
              'retrying elevenlabs signed-url request'
            ),
        }
      ).catch((error) => {
        throw translate(error);
      });

      const signedUrl = payload?.signed_url ?? payload?.signedUrl;
      if (typeof signedUrl !== 'string' || !signedUrl.startsWith('wss://')) {
        // A 200 with the wrong shape means their contract moved under us.
        // Failing loudly here beats handing the browser something unusable.
        throw ApiError.upstream(
          'The voice agent returned an unexpected response.',
          new Error('missing or malformed signed_url in ElevenLabs response')
        );
      }

      const expiresAt = new Date(Date.now() + ASSUMED_TTL_SECONDS * 1000);

      return {
        provider: 'elevenlabs',
        transport: VOICE_TRANSPORT.WEBSOCKET,
        signedUrl,
        agentId,
        expiresAt: expiresAt.toISOString(),
        expiresInSeconds: ASSUMED_TTL_SECONDS,
      };
    },

    /**
     * Liveness only. Deliberately does NOT mint a signed URL — a health check
     * that creates a billable artefact every thirty seconds is a bug with an
     * invoice attached.
     */
    async health() {
      try {
        await call('/v1/user/subscription', { timeout: 4_000 });
        return { ok: true };
      } catch (error) {
        return { ok: false, detail: error?.status ? `HTTP ${error.status}` : 'unreachable' };
      }
    },
  };
}

/** Upstream failure → an error the visitor can read and the log can act on. */
function translate(error) {
  if (error instanceof ApiError) return error;

  if (error?.name === 'AbortError') {
    return ApiError.upstream('The voice agent took too long to answer. Please try again.', error);
  }

  const status = error?.status;

  if (status === 401 || status === 403) {
    // Operator error, not visitor error. The visitor must not be told the key
    // is wrong — that is an internal fact — but the log says it plainly.
    return new ApiError(
      503,
      ErrorCode.VOICE_DISABLED,
      'The voice agent is not available right now.',
      { cause: error }
    );
  }
  if (status === 404) {
    return new ApiError(503, ErrorCode.VOICE_DISABLED, 'The voice agent is not available right now.', {
      cause: error,
    });
  }
  if (status === 429) {
    return ApiError.tooManyRequests(
      'The voice agent is busy right now. Please try again in a minute.',
      60
    );
  }

  return ApiError.upstream('The voice agent is temporarily unavailable.', error);
}
