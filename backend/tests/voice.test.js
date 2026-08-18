/**
 * VOICE SESSION — the security-critical path.
 *
 * The first test is the one that matters most and it is written as a
 * regression test for the whole point of this service: no credential in the
 * response, in any form, ever.
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { __setVoiceProvider, getVoiceProvider } from '../src/modules/voice/providers/index.js';
import { createMockProvider } from '../src/modules/voice/providers/mock.provider.js';

const ORIGIN = 'http://localhost:3000';
let app;

beforeAll(() => {
  app = createApp();
});

afterEach(() => {
  __setVoiceProvider(createMockProvider());
});

describe('POST /api/v1/voice/session', () => {
  it('never returns anything resembling an API key', async () => {
    const secret = 'mock_secret_test_token_123';

    __setVoiceProvider({
      name: 'elevenlabs',
      async createSession() {
        return {
          provider: 'elevenlabs',
          transport: 'websocket',
          signedUrl: 'wss://api.elevenlabs.io/v1/convai/conversation?token=abc123',
          agentId: 'agent_test',
          expiresAt: new Date(Date.now() + 45_000).toISOString(),
          expiresInSeconds: 45,
          // A provider that leaked the key into its own return value would
          // still not get it past the controller, which allowlists fields.
          apiKey: secret,
        };
      },
      async health() {
        return { ok: true };
      },
    });

    const res = await request(app).post('/api/v1/voice/session').set('Origin', ORIGIN);

    expect(res.status).toBe(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(secret);
    expect(raw).not.toContain('sk_');
    expect(raw).not.toMatch(/api[-_]?key/i);
    expect(res.body.data).not.toHaveProperty('apiKey');
  });

  it('returns a signed wss URL with an expiry', async () => {
    const res = await request(app).post('/api/v1/voice/session').set('Origin', ORIGIN);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.transport).toBe('websocket');
    expect(res.body.data.signedUrl).toMatch(/^wss:\/\//);
    expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(res.body.data.expiresInSeconds).toBeGreaterThan(0);
  });

  it('forbids caching — the body is a bearer token', async () => {
    const res = await request(app).post('/api/v1/voice/session').set('Origin', ORIGIN);
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('refuses a request with no Origin', async () => {
    const res = await request(app).post('/api/v1/voice/session');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('refuses a request from an unlisted Origin', async () => {
    const res = await request(app)
      .post('/api/v1/voice/session')
      .set('Origin', 'https://attacker.example');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
  });

  it('turns an upstream failure into a calm message and no stack', async () => {
    __setVoiceProvider({
      name: 'elevenlabs',
      async createSession() {
        const error = new Error('connect ETIMEDOUT 10.0.0.5:443 in /srv/app/node_modules/x');
        error.status = 503;
        throw error;
      },
      async health() {
        return { ok: false };
      },
    });

    const res = await request(app).post('/api/v1/voice/session').set('Origin', ORIGIN);

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.message).not.toMatch(/ETIMEDOUT|node_modules|10\.0\.0\.5/);
    expect(res.body.meta.requestId).toBeTruthy();
  });

  it('carries a request id on every response', async () => {
    const res = await request(app).post('/api/v1/voice/session').set('Origin', ORIGIN);
    expect(res.headers['x-request-id']).toBeTruthy();
    expect(res.body.meta.requestId).toBe(res.headers['x-request-id']);
  });

  it('honours an inbound request id but rejects a forged one', async () => {
    const clean = await request(app)
      .post('/api/v1/voice/session')
      .set('Origin', ORIGIN)
      .set('X-Request-Id', 'trace-abc-123');
    expect(clean.headers['x-request-id']).toBe('trace-abc-123');

    /**
     * The header ends up in log files, so anything outside a tight character
     * set is discarded and a fresh UUID used instead.
     *
     * A CRLF is not tested here: Node's own HTTP client refuses to send one,
     * so the transport blocks that variant before this code sees it. What IS
     * reachable is a value full of characters that are legal in a header and
     * still have no business in a log field or a dashboard query.
     */
    const dirty = await request(app)
      .post('/api/v1/voice/session')
      .set('Origin', ORIGIN)
      .set('X-Request-Id', 'forged id <script> injected');
    expect(dirty.headers['x-request-id']).not.toContain('injected');
    expect(dirty.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('voice provider selection', () => {
  it('resolves the mock provider under test config', () => {
    __setVoiceProvider(undefined);
    expect(getVoiceProvider().name).toBe('mock');
  });
});
