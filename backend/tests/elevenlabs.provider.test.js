/**
 * THE ELEVENLABS PROVIDER.
 *
 * This is the only file in the repository that touches the API key, so it is
 * the file that most needs a test. `fetch` is stubbed throughout: the suite
 * must never reach the network and must never be able to spend money.
 *
 * What is being proved:
 *   - the key travels in the request header, and only there;
 *   - it appears nowhere in the value handed back to the caller;
 *   - a malformed 200 is rejected rather than passed to the browser;
 *   - each upstream status becomes an error a visitor can read, with no
 *     internal detail in the message;
 *   - the health check does not mint a billable session.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElevenLabsProvider } from '../src/modules/voice/providers/elevenlabs.provider.js';

const KEY = process.env.ELEVENLABS_API_KEY;
const AGENT = process.env.ELEVENLABS_AGENT_ID;

const silentLogger = { warn: () => {}, info: () => {}, error: () => {} };

const provider = () => createElevenLabsProvider({ logger: silentLogger });

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createSession', () => {
  it('sends the key in the header and returns a session without it', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?token=xyz' })
    );

    const session = await provider().createSession({ requestId: 'req-1' });

    // The key went out in the header, exactly once, to exactly one host.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/v1/convai/conversation/get_signed_url');
    expect(String(url)).toContain(`agent_id=${AGENT}`);
    expect(options.headers['xi-api-key']).toBe(KEY);

    // And it is not in what comes back. This is the guarantee the whole
    // backend exists to provide.
    expect(JSON.stringify(session)).not.toContain(KEY);
    expect(session).not.toHaveProperty('apiKey');
    expect(session.signedUrl).toMatch(/^wss:\/\//);
    expect(session.provider).toBe('elevenlabs');
    expect(session.transport).toBe('websocket');
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects a 200 whose body is the wrong shape', async () => {
    // Their contract moving under us must fail here, not in the browser.
    fetchMock.mockResolvedValue(jsonResponse({ url: 'https://not-a-websocket.example' }));

    await expect(provider().createSession({ requestId: 'req-2' })).rejects.toMatchObject({
      status: 502,
    });
  });

  it('rejects a signed URL that is not a websocket', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ signed_url: 'https://api.elevenlabs.io/hijack' }));

    await expect(provider().createSession({ requestId: 'req-3' })).rejects.toMatchObject({
      status: 502,
    });
  });

  it('turns a bad credential into a service-unavailable, not a hint', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'invalid api key' }, 401));

    const error = await provider()
      .createSession({ requestId: 'req-4' })
      .catch((e) => e);

    expect(error.status).toBe(503);
    expect(error.code).toBe('VOICE_DISABLED');
    // A visitor must not learn that the operator's key is wrong.
    expect(error.message).not.toMatch(/key|credential|401|unauthor/i);
  });

  it('does not retry a 401 — the same bad key would only fail again', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 401));

    await provider()
      .createSession({ requestId: 'req-5' })
      .catch(() => {});

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 503 and succeeds on a later attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({ signed_url: 'wss://api.elevenlabs.io/ok' }));

    const session = await provider().createSession({ requestId: 'req-6' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(session.signedUrl).toBe('wss://api.elevenlabs.io/ok');
  });

  it('passes a 429 through as a rate limit with a Retry-After', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 429));

    const error = await provider()
      .createSession({ requestId: 'req-7' })
      .catch((e) => e);

    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('turns a timeout into a message that suggests trying again', async () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    fetchMock.mockRejectedValue(abort);

    const error = await provider()
      .createSession({ requestId: 'req-8' })
      .catch((e) => e);

    expect(error.status).toBe(502);
    expect(error.message).toMatch(/try again/i);
  });
});

describe('health', () => {
  it('checks liveness without creating a session', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ tier: 'creator' }));

    const result = await provider().health();

    expect(result.ok).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    // A health check that minted a signed URL every thirty seconds would be a
    // bug with an invoice attached.
    expect(String(url)).not.toContain('get_signed_url');
  });

  it('reports not-ok rather than throwing when the upstream is down', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    const result = await provider().health();

    expect(result.ok).toBe(false);
    expect(result.detail).toContain('500');
  });

  it('reports not-ok when the host is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ENOTFOUND'));

    const result = await provider().health();

    expect(result.ok).toBe(false);
    expect(result.detail).toBe('unreachable');
  });
});
